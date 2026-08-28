"""Tests for DATABASE_STATEMENT_TIMEOUT setting (issue #1007)."""
import os
from unittest import mock

import pytest
from django.db import connection
from django.db.utils import OperationalError


class TestDatabaseStatementTimeoutSetting:
    """Verify that the DATABASE_STATEMENT_TIMEOUT env-var controls the
    PostgreSQL ``statement_timeout`` server parameter."""

    def test_setting_applied_as_postgres_option(self):
        """When ENGINE is PostgreSQL, the OPTIONS dict must contain
        ``-c statement_timeout=<ms>`` in the ``options`` key."""
        from importlib import reload

        fake_env = {
            "DATABASE_URL": "postgresql://user:pass@localhost/testdb",
            "SECRET_KEY": "test",
            "DATABASE_STATEMENT_TIMEOUT": "3000",
        }
        with mock.patch.dict(os.environ, fake_env, clear=False):
            import soroscan.settings as settings

            reload(settings)
            try:
                opts = settings.DATABASES["default"]["OPTIONS"]
                assert "options" in opts, "OPTIONS['options'] not set"
                assert "-c statement_timeout=3000" in opts["options"]
            finally:
                # Restore original settings by reloading with defaults
                if "DATABASE_STATEMENT_TIMEOUT" in os.environ:
                    del os.environ["DATABASE_STATEMENT_TIMEOUT"]
                reload(settings)

    def test_default_timeout_value(self):
        """DATABASE_STATEMENT_TIMEOUT defaults to 5000 ms when unset."""
        from importlib import reload

        clean_env = {
            "DATABASE_URL": "postgresql://user:pass@localhost/testdb",
            "SECRET_KEY": "test",
        }
        with mock.patch.dict(os.environ, clean_env, clear=False):
            # Remove it if present
            os.environ.pop("DATABASE_STATEMENT_TIMEOUT", None)
            import soroscan.settings as settings

            reload(settings)
            try:
                assert settings.DATABASE_STATEMENT_TIMEOUT == 5000
                opts = settings.DATABASES["default"]["OPTIONS"]
                assert "-c statement_timeout=5000" in opts["options"]
            finally:
                if "DATABASE_STATEMENT_TIMEOUT" in os.environ:
                    del os.environ["DATABASE_STATEMENT_TIMEOUT"]
                reload(settings)

    def test_setting_accessible_on_settings_module(self):
        """DATABASE_STATEMENT_TIMEOUT is always defined on the settings module."""
        from django.conf import settings

        assert hasattr(settings, "DATABASE_STATEMENT_TIMEOUT")
        assert isinstance(settings.DATABASE_STATEMENT_TIMEOUT, int)
        assert settings.DATABASE_STATEMENT_TIMEOUT > 0


class TestDatabaseStatementTimeoutBehavior:
    """Verify that exceeding the PostgreSQL statement timeout raises
    OperationalError (the Django wrapper around psycopg2.QueryCanceledError)."""

    def test_timeout_raises_on_long_query(self):
        """A query that sleeps longer than statement_timeout must raise
        OperationalError on a real PostgreSQL connection.

        This test is skipped when the default database is not PostgreSQL
        (e.g. SQLite in CI unit tests)."""
        engine = connection.settings_dict.get("ENGINE", "")
        if engine != "django.db.backends.postgresql":
            pytest.skip("Requires a PostgreSQL backend")

        try:
            # Set a very short timeout (1 ms) for this test
            connection.ensure_connection()
            with connection.cursor() as cursor:
                cursor.execute(
                    "SET statement_timeout = 1"
                )
            with pytest.raises(OperationalError):
                with connection.cursor() as cursor:
                    cursor.execute("SELECT pg_sleep(5)")
        finally:
            # Restore the original timeout
            with connection.cursor() as cursor:
                cursor.execute("RESET statement_timeout")
