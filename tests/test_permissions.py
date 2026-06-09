from __future__ import annotations

import tempfile
import unittest
from datetime import datetime

from happy_bank.auth import AuthorizationError
from happy_bank.service import HappyBankService


class PermissionTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.service = HappyBankService(f"{self.temp_dir.name}/test.sqlite3")
        self.service.seed_demo_data()
        self.service.run_daily_rollover(datetime(2026, 6, 9, 2, 0, 0))

    def tearDown(self) -> None:
        self.service.close()
        self.temp_dir.cleanup()

    def test_principal_can_view_all_classes_and_children(self) -> None:
        classes = self.service.list_classes(user_id=1)
        children = self.service.list_children(user_id=1)

        self.assertEqual({item["name"] for item in classes}, {"나무반", "햇살반"})
        self.assertEqual({item["name"] for item in children}, {"김민준", "박도윤", "이서연"})

    def test_teacher_can_only_view_assigned_class(self) -> None:
        children = self.service.list_children(user_id=2)
        missions = self.service.list_missions(user_id=2, due_date="2026-06-09")

        self.assertEqual({item["class_name"] for item in children}, {"햇살반"})
        self.assertEqual({item["child_name"] for item in missions}, {"김민준", "이서연"})

    def test_parent_can_only_view_linked_children(self) -> None:
        children = self.service.list_children(user_id=4)
        missions = self.service.list_missions(user_id=4, due_date="2026-06-09")

        self.assertEqual([item["name"] for item in children], ["김민준"])
        self.assertEqual({item["child_name"] for item in missions}, {"김민준"})

    def test_teacher_cannot_complete_other_class_mission(self) -> None:
        other_class_mission = [
            mission
            for mission in self.service.list_missions(user_id=1, due_date="2026-06-09")
            if mission["class_name"] == "나무반"
        ][0]

        with self.assertRaises(AuthorizationError):
            self.service.complete_mission(
                user_id=2,
                mission_id=other_class_mission["id"],
            )


if __name__ == "__main__":
    unittest.main()
