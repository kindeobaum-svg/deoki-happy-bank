"""Role-based access rules for Happy Bank."""

from __future__ import annotations

import sqlite3
from collections.abc import Iterable


class AuthorizationError(PermissionError):
    """Raised when a user tries to access data outside their role scope."""


def get_user(connection: sqlite3.Connection, user_id: int) -> sqlite3.Row:
    user = connection.execute(
        "SELECT id, name, role FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()
    if user is None:
        raise AuthorizationError(f"Unknown user_id: {user_id}")
    return user


def require_role(
    connection: sqlite3.Connection,
    user_id: int,
    allowed_roles: Iterable[str],
) -> sqlite3.Row:
    user = get_user(connection, user_id)
    if user["role"] not in set(allowed_roles):
        raise AuthorizationError("This action is not allowed for the current role.")
    return user


def class_scope_sql(connection: sqlite3.Connection, user_id: int) -> tuple[str, list[object]]:
    """Return a SQL predicate limiting classes visible to a user."""

    user = get_user(connection, user_id)
    if user["role"] == "principal":
        return "1 = 1", []
    if user["role"] == "teacher":
        return (
            "classes.id IN (SELECT class_id FROM teacher_classes WHERE user_id = ?)",
            [user_id],
        )
    return (
        """
        classes.id IN (
            SELECT children.class_id
            FROM parent_children
            JOIN children ON children.id = parent_children.child_id
            WHERE parent_children.user_id = ?
        )
        """,
        [user_id],
    )


def child_scope_sql(connection: sqlite3.Connection, user_id: int) -> tuple[str, list[object]]:
    """Return a SQL predicate limiting children visible to a user."""

    user = get_user(connection, user_id)
    if user["role"] == "principal":
        return "1 = 1", []
    if user["role"] == "teacher":
        return (
            "children.class_id IN (SELECT class_id FROM teacher_classes WHERE user_id = ?)",
            [user_id],
        )
    return (
        "children.id IN (SELECT child_id FROM parent_children WHERE user_id = ?)",
        [user_id],
    )


def can_access_child(connection: sqlite3.Connection, user_id: int, child_id: int) -> bool:
    predicate, params = child_scope_sql(connection, user_id)
    row = connection.execute(
        f"SELECT 1 FROM children WHERE id = ? AND {predicate}",
        [child_id, *params],
    ).fetchone()
    return row is not None


def require_child_access(
    connection: sqlite3.Connection,
    user_id: int,
    child_id: int,
) -> None:
    if not can_access_child(connection, user_id, child_id):
        raise AuthorizationError("The child is outside the current user's role scope.")
