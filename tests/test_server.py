from __future__ import annotations

import json
import tempfile
import threading
import unittest
from datetime import datetime
from http.server import ThreadingHTTPServer
from urllib.request import urlopen

from happy_bank.server import HappyBankHandler
from happy_bank.service import HappyBankService


class ServerTest(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        self.service = HappyBankService(f"{self.temp_dir.name}/test.sqlite3")
        self.service.seed_demo_data()
        self.service.run_daily_rollover(datetime(2026, 6, 9, 2, 0, 0))

        HappyBankHandler.service = self.service
        self.server = ThreadingHTTPServer(("127.0.0.1", 0), HappyBankHandler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.base_url = f"http://127.0.0.1:{self.server.server_port}"

    def tearDown(self) -> None:
        self.server.shutdown()
        self.server.server_close()
        self.service.close()
        self.temp_dir.cleanup()

    def test_serves_mobile_dashboard_home(self) -> None:
        with urlopen(f"{self.base_url}/", timeout=5) as response:
            html = response.read().decode("utf-8")

        self.assertIn("덕이킨더바움 행복부자 통장", html)
        self.assertIn("#mission", html)
        self.assertIn("#bank", html)
        self.assertIn("#growth", html)
        self.assertIn("#child", html)

    def test_dashboard_api_works_from_request_thread(self) -> None:
        with urlopen(
            f"{self.base_url}/api/dashboard?user_id=1&date=2026-06-09",
            timeout=5,
        ) as response:
            payload = json.loads(response.read().decode("utf-8"))

        self.assertEqual(payload["mission"]["total"], 8)
        self.assertIn("current_balance", payload["bank"])
        self.assertIn("current_stage", payload["growth"])
        self.assertIn("recent_activity", payload["child"])


if __name__ == "__main__":
    unittest.main()
