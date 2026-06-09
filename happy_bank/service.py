"""Application service layer for missions, rollover, and role-scoped reads."""

from __future__ import annotations

import sqlite3
from datetime import date, datetime
from pathlib import Path
from typing import Any

from . import auth
from .database import connect, initialize, seed_demo_data


def _row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {key: row[key] for key in row.keys()}


class HappyBankService:
    """Coordinates Happy Bank mission data and permissions."""

    def __init__(self, database_path: str | Path = "happy_bank.sqlite3") -> None:
        self.database_path = database_path
        self.connection = connect(database_path)
        initialize(self.connection)

    def close(self) -> None:
        self.connection.close()

    def seed_demo_data(self) -> None:
        seed_demo_data(self.connection)

    def current_user(self, user_id: int) -> dict[str, Any]:
        return _row_to_dict(auth.get_user(self.connection, user_id))

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


def _date_to_string(value: date | str) -> str:
    if isinstance(value, str):
        date.fromisoformat(value)
        return value
    return value.isoformat()
