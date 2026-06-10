"""SQLite setup for the Happy Bank app."""

from __future__ import annotations

import sqlite3
from pathlib import Path


ROLES = ("principal", "teacher", "parent")


def connect(database_path: str | Path) -> sqlite3.Connection:
    """Create a SQLite connection with row dictionaries and FK checks enabled."""

    connection = sqlite3.connect(str(database_path), check_same_thread=False)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('principal', 'teacher', 'parent'))
);

CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS children (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS teacher_classes (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, class_id)
);

CREATE TABLE IF NOT EXISTS parent_children (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, child_id)
);

CREATE TABLE IF NOT EXISTS mission_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
    child_id INTEGER REFERENCES children(id) ON DELETE CASCADE,
    is_recurring INTEGER NOT NULL DEFAULT 1 CHECK (is_recurring IN (0, 1)),
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (class_id IS NULL OR child_id IS NULL)
);

CREATE TABLE IF NOT EXISTS mission_instances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL REFERENCES mission_templates(id) ON DELETE CASCADE,
    child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    completed_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (template_id, child_id, due_date)
);

CREATE TABLE IF NOT EXISTS rollover_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_date TEXT NOT NULL UNIQUE,
    executed_at TEXT NOT NULL
);
"""


def initialize(connection: sqlite3.Connection) -> None:
    """Create database tables."""

    connection.executescript(SCHEMA)
    connection.commit()


def seed_demo_data(connection: sqlite3.Connection) -> None:
    """Insert a small dataset when the database is empty."""

    existing = connection.execute("SELECT COUNT(*) AS count FROM users").fetchone()
    if existing["count"]:
        return

    connection.executescript(
        """
        INSERT INTO users (id, name, role) VALUES
            (1, '원장님', 'principal'),
            (2, '햇살반 선생님', 'teacher'),
            (3, '나무반 선생님', 'teacher'),
            (4, '민준 보호자', 'parent'),
            (5, '서연 보호자', 'parent');

        INSERT INTO classes (id, name) VALUES
            (1, '햇살반'),
            (2, '나무반');

        INSERT INTO children (id, name, class_id) VALUES
            (1, '김민준', 1),
            (2, '이서연', 1),
            (3, '박도윤', 2);

        INSERT INTO teacher_classes (user_id, class_id) VALUES
            (2, 1),
            (3, 2);

        INSERT INTO parent_children (user_id, child_id) VALUES
            (4, 1),
            (5, 2);

        INSERT INTO mission_templates
            (id, title, description, class_id, child_id, is_recurring, active, created_by)
        VALUES
            (1, '친구에게 먼저 인사하기', '등원 후 친구에게 밝게 인사해요.', NULL, NULL, 1, 1, 1),
            (2, '행복 저금 스티커 붙이기', '오늘의 행복 행동을 통장에 기록해요.', NULL, NULL, 1, 1, 1),
            (3, '햇살반 책 정리 돕기', '햇살반 책꽂이를 함께 정리해요.', 1, NULL, 1, 1, 2);
        """
    )
    connection.commit()
