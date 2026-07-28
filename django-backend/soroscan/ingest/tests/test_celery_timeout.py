"""
Tests for Celery task timeout monitoring.
"""

import logging
from unittest.mock import MagicMock, patch

from django.test import override_settings

from soroscan.ingest.tasks import (
    _log_timeout_warning,
    _start_timeout_monitor,
    _stop_timeout_monitor,
    _task_timeout_timers,
)


def test_timeout_monitor_lifecycle():
    """Ensure timer starts at 80% and cancels on completion."""
    task_mock = MagicMock()
    task_mock.name = "test.slow_task"
    task_mock.soft_time_limit = 100
    task_mock.time_limit = None
    task_mock.request.soft_time_limit = None
    task_mock.request.time_limit = None

    with patch("soroscan.ingest.tasks.threading.Timer") as mock_timer_class:
        mock_timer_instance = MagicMock()
        mock_timer_class.return_value = mock_timer_instance

        # Simulate task start
        _start_timeout_monitor(task_id="task-123", task=task_mock)

        # Timer should be set for 80 seconds (80% of 100s) with 20s remaining
        mock_timer_class.assert_called_once_with(
            80.0, _log_timeout_warning, args=("test.slow_task", 20.0)
        )
        mock_timer_instance.start.assert_called_once()
        assert "task-123" in _task_timeout_timers

        # Simulate task finish
        _stop_timeout_monitor(task_id="task-123", task=task_mock)

        mock_timer_instance.cancel.assert_called_once()
        assert "task-123" not in _task_timeout_timers


@override_settings(CELERY_TASK_SOFT_TIME_LIMIT=None, CELERY_TASK_TIME_LIMIT=None)
def test_timeout_monitor_no_timeout():
    """Ensure no timer is created if task has no timeout."""
    task_mock = MagicMock()
    task_mock.name = "test.fast_task"
    task_mock.soft_time_limit = None
    task_mock.time_limit = None
    task_mock.request.soft_time_limit = None
    task_mock.request.time_limit = None

    with patch("soroscan.ingest.tasks.threading.Timer") as mock_timer_class:
        _start_timeout_monitor(task_id="task-456", task=task_mock)
        mock_timer_class.assert_not_called()
        assert "task-456" not in _task_timeout_timers


def test_log_timeout_warning(caplog):
    """Verify the warning log contains task name and remaining time."""
    with caplog.at_level(logging.WARNING):
        _log_timeout_warning("test.slow_task", 15.5)

    assert "Task test.slow_task is approaching timeout" in caplog.text
    assert "15.5 seconds remaining" in caplog.text


@override_settings(CELERY_TASK_SOFT_TIME_LIMIT=100)
def test_timeout_monitor_falls_back_to_settings():
    """When a task has no explicit timeout, use CELERY_TASK_SOFT_TIME_LIMIT."""
    task_mock = MagicMock()
    task_mock.name = "test.no_limit_task"
    task_mock.soft_time_limit = None
    task_mock.time_limit = None
    task_mock.request.soft_time_limit = None
    task_mock.request.time_limit = None

    with patch("soroscan.ingest.tasks.threading.Timer") as mock_timer_class:
        mock_timer_instance = MagicMock()
        mock_timer_class.return_value = mock_timer_instance

        _start_timeout_monitor(task_id="task-789", task=task_mock)

        # Should use the settings fallback (100s), warning at 80s with 20s remaining
        mock_timer_class.assert_called_once_with(
            80.0, _log_timeout_warning, args=("test.no_limit_task", 20.0)
        )
        mock_timer_instance.start.assert_called_once()
        assert "task-789" in _task_timeout_timers

        _stop_timeout_monitor(task_id="task-789", task=task_mock)
        assert "task-789" not in _task_timeout_timers


@override_settings(CELERY_TASK_SOFT_TIME_LIMIT=None, CELERY_TASK_TIME_LIMIT=None)
def test_timeout_monitor_no_timeout_even_with_settings():
    """No timer when both task and settings have no timeout."""
    task_mock = MagicMock()
    task_mock.name = "test.no_timeout_anywhere"
    task_mock.soft_time_limit = None
    task_mock.time_limit = None
    task_mock.request.soft_time_limit = None
    task_mock.request.time_limit = None

    with patch("soroscan.ingest.tasks.threading.Timer") as mock_timer_class:
        _start_timeout_monitor(task_id="task-000", task=task_mock)
        mock_timer_class.assert_not_called()
        assert "task-000" not in _task_timeout_timers


def test_timeout_monitor_request_timeout_takes_priority():
    """Request-level soft_time_limit takes priority over task-level."""
    task_mock = MagicMock()
    task_mock.name = "test.request_limit"
    task_mock.soft_time_limit = 200
    task_mock.time_limit = None
    task_mock.request.soft_time_limit = 50
    task_mock.request.time_limit = None

    with patch("soroscan.ingest.tasks.threading.Timer") as mock_timer_class:
        mock_timer_instance = MagicMock()
        mock_timer_class.return_value = mock_timer_instance

        _start_timeout_monitor(task_id="task-req", task=task_mock)

        # Should use request-level (50s), warning at 40s with 10s remaining
        mock_timer_class.assert_called_once_with(
            40.0, _log_timeout_warning, args=("test.request_limit", 10.0)
        )
        mock_timer_instance.start.assert_called_once()

        _stop_timeout_monitor(task_id="task-req", task=task_mock)
