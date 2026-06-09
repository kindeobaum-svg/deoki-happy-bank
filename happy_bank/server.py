"""Small JSON HTTP API for the Happy Bank app."""

from __future__ import annotations

import argparse
import json
from datetime import date, datetime
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import parse_qs, urlparse

from .auth import AuthorizationError, require_role
from .scheduler import DailyMissionScheduler
from .service import HappyBankService


class HappyBankHandler(BaseHTTPRequestHandler):
    service: HappyBankService

    def do_GET(self) -> None:
        try:
            parsed = urlparse(self.path)
            query = parse_qs(parsed.query)
            if parsed.path == "/health":
                self._send_json({"ok": True})
                return

            user_id = _required_int(query, "user_id")
            if parsed.path == "/api/me":
                self._send_json(self.service.current_user(user_id))
                return
            if parsed.path == "/api/classes":
                self._send_json({"classes": self.service.list_classes(user_id)})
                return
            if parsed.path == "/api/children":
                class_id = _optional_int(query, "class_id")
                self._send_json(
                    {"children": self.service.list_children(user_id, class_id=class_id)}
                )
                return
            if parsed.path == "/api/missions":
                due_date = query.get("date", [None])[0]
                self._send_json(
                    {"missions": self.service.list_missions(user_id, due_date=due_date)}
                )
                return

            self._send_error(HTTPStatus.NOT_FOUND, "Unknown endpoint")
        except (AuthorizationError, ValueError) as error:
            self._send_error(HTTPStatus.FORBIDDEN, str(error))

    def do_POST(self) -> None:
        try:
            parsed = urlparse(self.path)
            query = parse_qs(parsed.query)
            body = self._read_body()
            user_id = int(body.get("user_id") or _required_int(query, "user_id"))

            if parsed.path.startswith("/api/missions/") and parsed.path.endswith("/complete"):
                mission_id = int(parsed.path.split("/")[3])
                completed = self.service.complete_mission(user_id=user_id, mission_id=mission_id)
                self._send_json({"mission": completed})
                return

            if parsed.path == "/api/admin/rollover":
                require_role(self.service.connection, user_id, {"principal"})
                requested_date = body.get("date") or query.get("date", [None])[0]
                run_at = _rollover_datetime(requested_date)
                result = self.service.run_daily_rollover(now=run_at, force=True)
                self._send_json(result)
                return

            self._send_error(HTTPStatus.NOT_FOUND, "Unknown endpoint")
        except (AuthorizationError, ValueError) as error:
            self._send_error(HTTPStatus.FORBIDDEN, str(error))

    def log_message(self, format: str, *args: Any) -> None:
        return

    def _read_body(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length == 0:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def _send_json(self, data: dict[str, Any], status: HTTPStatus = HTTPStatus.OK) -> None:
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def _send_error(self, status: HTTPStatus, message: str) -> None:
        self._send_json({"error": message}, status=status)


def run_server(
    host: str,
    port: int,
    database_path: str,
    seed_demo: bool,
    enable_scheduler: bool,
) -> None:
    service = HappyBankService(database_path)
    if seed_demo:
        service.seed_demo_data()

    scheduler: DailyMissionScheduler | None = None
    if enable_scheduler:
        scheduler = DailyMissionScheduler(service)
        scheduler.start()

    HappyBankHandler.service = service
    server = ThreadingHTTPServer((host, port), HappyBankHandler)
    try:
        print(f"Happy Bank API listening on http://{host}:{port}")
        server.serve_forever()
    finally:
        if scheduler:
            scheduler.stop()
        service.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the Happy Bank API")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8000, type=int)
    parser.add_argument("--database", default="happy_bank.sqlite3")
    parser.add_argument("--no-seed", action="store_true")
    parser.add_argument("--no-scheduler", action="store_true")
    args = parser.parse_args()

    run_server(
        host=args.host,
        port=args.port,
        database_path=args.database,
        seed_demo=not args.no_seed,
        enable_scheduler=not args.no_scheduler,
    )


def _required_int(query: dict[str, list[str]], key: str) -> int:
    values = query.get(key)
    if not values:
        raise ValueError(f"Missing required query parameter: {key}")
    return int(values[0])


def _optional_int(query: dict[str, list[str]], key: str) -> int | None:
    values = query.get(key)
    if not values or values[0] == "":
        return None
    return int(values[0])


def _rollover_datetime(value: str | None) -> datetime:
    if not value:
        return datetime.now().replace(hour=2, minute=0, second=0, microsecond=0)
    return datetime.combine(date.fromisoformat(value), datetime.min.time()).replace(hour=2)


if __name__ == "__main__":
    main()
