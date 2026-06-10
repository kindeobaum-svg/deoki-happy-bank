"""Application service layer for missions, rollover, and role-scoped reads."""

from __future__ import annotations

import sqlite3
import threading
from datetime import date, datetime
from functools import wraps
from pathlib import Path
from typing import Any, Callable, TypeVar

from . import auth
from .database import connect, initialize, seed_demo_data


BANK_REWARD_PER_COMPLETED_MISSION = 1000
GROWTH_STAGES = (
    (0, "씨앗"),
    (5000, "새싹"),
    (15000, "튼튼한 나무"),
    (30000, "행복 열매"),
)


def _row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {key: row[key] for key in row.keys()}


T = TypeVar("T")


def _synchronized(method: Callable[..., T]) -> Callable[..., T]:
    @wraps(method)
    def wrapper(self: "HappyBankService", *args: Any, **kwargs: Any) -> T:
        with self._lock:
            return method(self, *args, **kwargs)

    return wrapper


class HappyBankService:
    """Coordinates Happy Bank mission data and permissions."""

    def __init__(self, database_path: str | Path = "happy_bank.sqlite3") -> None:
        self.database_path = database_path
        self._lock = threading.RLock()
        self.connection = connect(database_path)
        initialize(self.connection)

    @_synchronized
    def close(self) -> None:
        self.connection.close()

    @_synchronized
    def seed_demo_data(self) -> None:
        seed_demo_data(self.connection)

    @_synchronized
    def current_user(self, user_id: int) -> dict[str, Any]:
        return _row_to_dict(auth.get_user(self.connection, user_id))

    @_synchronized
    def list_classes(self, user_id: int) -> list[dict[str, Any]]:
        predicate, params = auth.class_scope_sql(self.connection, user_id)
        rows = self.connection.execute(
            f"""
            SELECT classes.id, classes.name
            FROM classes
            WHERE {predicate}
            ORDER BY classes.name
            """,
            params,
        ).fetchall()
        return [_row_to_dict(row) for row in rows]

    @_synchronized
    def list_children(
        self,
        user_id: int,
        class_id: int | None = None,
    ) -> list[dict[str, Any]]:
        predicate, params = auth.child_scope_sql(self.connection, user_id)
        query_params: list[object] = [*params]
        class_filter = ""
        if class_id is not None:
            class_filter = "AND children.class_id = ?"
            query_params.append(class_id)

        rows = self.connection.execute(
            f"""
            SELECT
                children.id,
                children.name,
                children.class_id,
                classes.name AS class_name
            FROM children
            JOIN classes ON classes.id = children.class_id
            WHERE {predicate}
            {class_filter}
            ORDER BY classes.name, children.name
            """,
            query_params,
        ).fetchall()
        return [_row_to_dict(row) for row in rows]

    @_synchronized
    def list_missions(
        self,
        user_id: int,
        due_date: date | str | None = None,
    ) -> list[dict[str, Any]]:
        predicate, params = auth.child_scope_sql(self.connection, user_id)
        query_params: list[object] = [*params]
        date_filter = ""
        if due_date is not None:
            date_filter = "AND mission_instances.due_date = ?"
            query_params.append(_date_to_string(due_date))

        rows = self.connection.execute(
            f"""
            SELECT
                mission_instances.id,
                mission_instances.template_id,
                mission_instances.child_id,
                children.name AS child_name,
                children.class_id,
                classes.name AS class_name,
                mission_instances.title,
                mission_instances.description,
                mission_instances.due_date,
                mission_instances.status,
                mission_instances.completed_at
            FROM mission_instances
            JOIN children ON children.id = mission_instances.child_id
            JOIN classes ON classes.id = children.class_id
            WHERE {predicate}
            {date_filter}
            ORDER BY mission_instances.due_date, classes.name, children.name, mission_instances.title
            """,
            query_params,
        ).fetchall()
        return [_row_to_dict(row) for row in rows]

    @_synchronized
    def dashboard_summary(
        self,
        user_id: int,
        target_date: date | str | None = None,
    ) -> dict[str, Any]:
        target_date = target_date or date.today()
        return {
            "mission": self.mission_summary(user_id, target_date),
            "bank": self.bank_summary(user_id),
            "growth": self.growth_summary(user_id),
            "child": self.child_summary(user_id),
        }

    @_synchronized
    def mission_summary(
        self,
        user_id: int,
        target_date: date | str | None = None,
    ) -> dict[str, Any]:
        target_date = target_date or date.today()
        missions = self.list_missions(user_id, target_date)
        completed = sum(1 for mission in missions if mission["status"] == "completed")
        pending = sum(1 for mission in missions if mission["status"] == "pending")
        return {
            "date": _date_to_string(target_date),
            "total": len(missions),
            "completed": completed,
            "pending": pending,
            "label": f"완료 {completed}개 · 남은 미션 {pending}개",
        }

    @_synchronized
    def bank_summary(self, user_id: int) -> dict[str, Any]:
        total_saved = self._completed_mission_count(user_id) * BANK_REWARD_PER_COMPLETED_MISSION
        total_spent = 0
        return {
            "current_balance": total_saved - total_spent,
            "total_saved": total_saved,
            "total_spent": total_spent,
            "reward_per_mission": BANK_REWARD_PER_COMPLETED_MISSION,
        }

    @_synchronized
    def growth_summary(self, user_id: int) -> dict[str, Any]:
        bank = self.bank_summary(user_id)
        stage = _growth_stage(bank["total_saved"])
        return {
            "current_stage": stage,
            "total_saved": bank["total_saved"],
            "next_goal": _next_growth_goal(bank["total_saved"]),
        }

    @_synchronized
    def child_summary(self, user_id: int) -> dict[str, Any]:
        children = self.list_children(user_id)
        if not children:
            return {
                "children_count": 0,
                "name": "등록된 아이 없음",
                "class_name": "-",
                "recent_activity": "최근 활동이 없습니다.",
            }

        primary_child = children[0]
        recent_activity = self.connection.execute(
            """
            SELECT title, status, due_date
            FROM mission_instances
            WHERE child_id = ?
            ORDER BY due_date DESC, id DESC
            LIMIT 1
            """,
            (primary_child["id"],),
        ).fetchone()

        if recent_activity is None:
            activity_text = "아직 기록된 활동이 없습니다."
        else:
            state = "완료" if recent_activity["status"] == "completed" else "진행중"
            activity_text = f"{recent_activity['title']} · {state}"

        return {
            "children_count": len(children),
            "id": primary_child["id"],
            "name": primary_child["name"],
            "class_name": primary_child["class_name"],
            "recent_activity": activity_text,
        }

    @_synchronized
    def complete_mission(
        self,
        user_id: int,
        mission_id: int,
        completed_at: datetime | None = None,
    ) -> dict[str, Any]:
        mission = self.connection.execute(
            """
            SELECT id, child_id
            FROM mission_instances
            WHERE id = ?
            """,
            (mission_id,),
        ).fetchone()
        if mission is None:
            raise ValueError(f"Unknown mission_id: {mission_id}")

        auth.require_child_access(self.connection, user_id, mission["child_id"])
        completed_at = completed_at or datetime.now()
        self.connection.execute(
            """
            UPDATE mission_instances
            SET status = 'completed', completed_at = ?
            WHERE id = ?
            """,
            (completed_at.isoformat(timespec="seconds"), mission_id),
        )
        self.connection.commit()
        return _row_to_dict(
            self.connection.execute(
                "SELECT * FROM mission_instances WHERE id = ?",
                (mission_id,),
            ).fetchone()
        )

    @_synchronized
    def create_daily_missions(self, target_date: date | str) -> int:
        """Create one pending mission per active recurring template and child.

        Completed missions are intentionally not mutated. The next day starts
        with new pending mission instances, so yesterday's completion state does
        not leak into the current day.
        """

        due_date = _date_to_string(target_date)
        templates = self.connection.execute(
            """
            SELECT id, title, description, class_id, child_id
            FROM mission_templates
            WHERE is_recurring = 1 AND active = 1
            ORDER BY id
            """
        ).fetchall()

        created = 0
        for template in templates:
            children = self._children_for_template(template)
            for child in children:
                cursor = self.connection.execute(
                    """
                    INSERT OR IGNORE INTO mission_instances
                        (template_id, child_id, title, description, due_date, status)
                    VALUES (?, ?, ?, ?, ?, 'pending')
                    """,
                    (
                        template["id"],
                        child["id"],
                        template["title"],
                        template["description"],
                        due_date,
                    ),
                )
                created += cursor.rowcount

        self.connection.commit()
        return created

    @_synchronized
    def run_daily_rollover(
        self,
        now: datetime | None = None,
        force: bool = False,
    ) -> dict[str, Any]:
        """Run the 2 AM daily task once per date.

        The scheduler calls this at 02:00. Manual callers may pass ``force`` to
        backfill or re-run generation safely; mission inserts remain idempotent.
        """

        now = now or datetime.now()
        run_date = now.date().isoformat()

        already_ran = self.connection.execute(
            "SELECT id FROM rollover_runs WHERE run_date = ?",
            (run_date,),
        ).fetchone()
        if already_ran and not force:
            return {"run_date": run_date, "created": 0, "skipped": True}

        created = self.create_daily_missions(now.date())
        if already_ran is None:
            self.connection.execute(
                """
                INSERT INTO rollover_runs (run_date, executed_at)
                VALUES (?, ?)
                """,
                (run_date, now.isoformat(timespec="seconds")),
            )
            self.connection.commit()

        return {"run_date": run_date, "created": created, "skipped": False}

    def _children_for_template(self, template: sqlite3.Row) -> list[sqlite3.Row]:
        if template["child_id"] is not None:
            return self.connection.execute(
                "SELECT id FROM children WHERE id = ?",
                (template["child_id"],),
            ).fetchall()

        if template["class_id"] is not None:
            return self.connection.execute(
                "SELECT id FROM children WHERE class_id = ? ORDER BY id",
                (template["class_id"],),
            ).fetchall()

        return self.connection.execute("SELECT id FROM children ORDER BY id").fetchall()

    def _completed_mission_count(self, user_id: int) -> int:
        predicate, params = auth.child_scope_sql(self.connection, user_id)
        row = self.connection.execute(
            f"""
            SELECT COUNT(*) AS count
            FROM mission_instances
            JOIN children ON children.id = mission_instances.child_id
            WHERE mission_instances.status = 'completed'
            AND {predicate}
            """,
            params,
        ).fetchone()
        return int(row["count"])


def _date_to_string(value: date | str) -> str:
    if isinstance(value, str):
        date.fromisoformat(value)
        return value
    return value.isoformat()


def _growth_stage(total_saved: int) -> str:
    stage = GROWTH_STAGES[0][1]
    for required_saved, stage_name in GROWTH_STAGES:
        if total_saved >= required_saved:
            stage = stage_name
    return stage


def _next_growth_goal(total_saved: int) -> dict[str, Any] | None:
    for required_saved, stage_name in GROWTH_STAGES:
        if total_saved < required_saved:
            return {
                "stage": stage_name,
                "required_saved": required_saved,
                "remaining": required_saved - total_saved,
            }
    return None
