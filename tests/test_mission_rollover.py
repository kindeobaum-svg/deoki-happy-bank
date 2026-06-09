from __future__ import annotations

import tempfile
import unittest
from datetime import datetime

from happy_bank.service import HappyBankService


class MissionRolloverTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.service = HappyBankService(f"{self.temp_dir.name}/test.sqlite3")
        self.service.seed_demo_data()

    def tearDown(self) -> None:
        self.service.close()
        self.temp_dir.cleanup()

    def test_recurring_missions_are_created_once_per_day(self) -> None:
        first_run = self.service.run_daily_rollover(
            datetime(2026, 6, 9, 2, 0, 0),
        )
        second_run = self.service.run_daily_rollover(
            datetime(2026, 6, 9, 2, 5, 0),
        )

        self.assertEqual(first_run["created"], 8)
        self.assertFalse(first_run["skipped"])
        self.assertEqual(second_run["created"], 0)
        self.assertTrue(second_run["skipped"])
        self.assertEqual(len(self.service.list_missions(1, "2026-06-09")), 8)

    def test_completed_recurring_mission_resets_on_next_day(self) -> None:
        self.service.run_daily_rollover(datetime(2026, 6, 9, 2, 0, 0))
        day_one_mission = self.service.list_missions(1, "2026-06-09")[0]

        completed = self.service.complete_mission(
            user_id=1,
            mission_id=day_one_mission["id"],
            completed_at=datetime(2026, 6, 9, 9, 30, 0),
        )
        self.assertEqual(completed["status"], "completed")

        self.service.run_daily_rollover(datetime(2026, 6, 10, 2, 0, 0))
        day_two_missions = self.service.list_missions(1, "2026-06-10")
        matching_next_day = [
            mission
            for mission in day_two_missions
            if mission["template_id"] == day_one_mission["template_id"]
            and mission["child_id"] == day_one_mission["child_id"]
        ]

        self.assertEqual(len(matching_next_day), 1)
        self.assertEqual(matching_next_day[0]["status"], "pending")
        self.assertIsNone(matching_next_day[0]["completed_at"])

        day_one_again = [
            mission
            for mission in self.service.list_missions(1, "2026-06-09")
            if mission["id"] == day_one_mission["id"]
        ][0]
        self.assertEqual(day_one_again["status"], "completed")


if __name__ == "__main__":
    unittest.main()
