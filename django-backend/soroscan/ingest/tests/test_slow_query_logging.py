"""Tests for slow query logging middleware (issue #875)."""
from unittest.mock import patch, MagicMock

from django.test import TestCase, RequestFactory, override_settings
from django.db import connection
from django.http import HttpResponse

from soroscan.middleware import SlowQueryMiddleware


class SlowQueryLoggingTests(TestCase):
    """Verify SlowQueryMiddleware logs queries exceeding the threshold."""

    def setUp(self):
        self.factory = RequestFactory()

    def test_threshold_defaults_to_100ms(self):
        mw = SlowQueryMiddleware(lambda r: HttpResponse("OK"))
        self.assertEqual(mw.threshold_ms, 100)

    @override_settings(LOGGING_SLOW_QUERIES_THRESHOLD_MS=250)
    def test_threshold_is_configurable(self):
        mw = SlowQueryMiddleware(lambda r: HttpResponse("OK"))
        self.assertEqual(mw.threshold_ms, 250)

    @patch("soroscan.middleware.slow_query_logger")
    def test_slow_query_logs_sql_and_duration(self, mock_logger):
        """Query exceeding threshold produces a log with SQL and duration_ms."""
        def get_response(req):
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1 FROM sqlite_master WHERE name = %s", ["target"])
            return HttpResponse("OK")

        mw = SlowQueryMiddleware(get_response)
        mw.threshold_ms = -1  # Always trigger

        request = self.factory.get("/test/")
        mw(request)

        mock_logger.warning.assert_called()
        args, kwargs = mock_logger.warning.call_args
        extra = kwargs.get("extra", {})
        self.assertIn("SELECT 1 FROM sqlite_master", extra.get("sql", ""))
        self.assertIn("target", extra.get("params", ""))
        self.assertIsInstance(extra.get("duration_ms"), float)

    @patch("soroscan.middleware.slow_query_logger")
    def test_fast_query_not_logged(self, mock_logger):
        """Query under threshold must not produce a log entry."""
        def get_response(req):
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            return HttpResponse("OK")

        mw = SlowQueryMiddleware(get_response)
        mw.threshold_ms = 999999  # Never trigger

        request = self.factory.get("/test/")
        mw(request)

        mock_logger.warning.assert_not_called()
