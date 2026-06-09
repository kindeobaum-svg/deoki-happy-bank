"""Daily mission scheduler."""

from __future__ import annotations

import threading
import time
from datetime import datetime, time as clock_time, timedelta
from zoneinfo import ZoneInfo

from .service import HappyBankService


class DailyMissionScheduler:
    """Runs recurring mission rollover every day at 02:00 local time."""

    def __init__(
        self,
        service: HappyBankService,
        timezone: str = "Asia/Seoul",
        rollover_time: clock_time = clock_time(hour=2),
    ) -> None:
        self.service = service
        self.timezone = ZoneInfo(timezone)
        self.rollover_time = rollover_time
        self._stop_event = threading.Event()
        self._thread: threading.Thread | None = None

    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return

        self._stop_event.clear()
        self._thread = threading.Thread(
            target=self._run,
            name="happy-bank-daily-mission-scheduler",
            daemon=True,
        )
        self._thread.start()

    def stop(self) -> None:
        self._stop_event.set()
        if self._thread:
            self._thread.join(timeout=5)

    def run_startup_backfill(self) -> dict[str, object] | None:
        now = datetime.now(self.timezone)
        if now.time() < self.rollover_time:
            return None
        return self.service.run_daily_rollover(now=now.replace(tzinfo=None))

    def seconds_until_next_run(self, now: datetime | None = None) -> float:
        now = now or datetime.now(self.timezone)
        if now.tzinfo is None:
            now = now.replace(tzinfo=self.timezone)

        next_run = datetime.combine(
            now.date(),
            self.rollover_time,
            tzinfo=self.timezone,
        )
        if now >= next_run:
            next_run += timedelta(days=1)
        return max(0.0, (next_run - now).total_seconds())

    def _run(self) -> None:
        self.run_startup_backfill()
        while not self._stop_event.is_set():
            wait_seconds = self.seconds_until_next_run()
            if self._stop_event.wait(wait_seconds):
                break
            run_at = datetime.now(self.timezone).replace(tzinfo=None)
            self.service.run_daily_rollover(now=run_at)
            time.sleep(1)
