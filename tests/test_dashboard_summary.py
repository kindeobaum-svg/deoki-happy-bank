from __future__ import annotations

import tempfile
import unittest
from datetime import datetime

from happy_bank.service import HappyBankService


class DashboardSummaryTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.service = HappyBankService(f"{self.temp_dir.name}/test.sqlite3")
        self.service.seed_demo_data()
        self.service.run_daily_rollover(datetime(2026, 6, 9, 2, 0, 0))

    def tearDown(self) -> None:
        self.service.close()
        self.temp_dir.cleanup()

    def test_dashboard_contains_short_card_summaries(self) -> None:
        mission = self.service.list_missions(user_id=1, due_date="2026-06-09")[0]
        self.service.complete_mission(
            user_id=1,
            mission_id=mission["id"],
            completed_at=datetime(2026, 6, 9, 9, 0, 0),
        )

        summary = self.service.dashboard_summary(user_id=1, target_date="2026-06-09")

        self.assertEqual(summary["mission"]["total"], 8)
        self.assertEqual(summary["mission"]["completed"], 1)
        self.assertEqual(summary["mission"]["pending"], 7)
        self.assertEqual(summary["bank"]["current_balance"], 1000)
        self.assertEqual(summary["bank"]["total_saved"], 1000)
        self.assertEqual(summary["bank"]["total_spent"], 0)
        self.assertEqual(summary["growth"]["current_stage"], "씨앗")
        self.assertIn("name", summary["child"])


if __name__ == "__main__":
    unittest.main()
