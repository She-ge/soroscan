"""
Graceful shutdown coordination for Django web processes and Celery workers.

On SIGTERM/SIGINT:
- Stop accepting new HTTP requests (via middleware)
- Wait for in-flight requests to complete (up to SHUTDOWN_TIMEOUT_SECONDS)
- Close database connections cleanly
- Log the shutdown reason
"""
from __future__ import annotations

import logging
import signal
import sys
import threading
import time
from typing import Optional

from django.conf import settings
from django.db import connections

logger = logging.getLogger(__name__)

DEFAULT_SHUTDOWN_TIMEOUT_SECONDS = 30

_lock = threading.Lock()
_in_flight_condition = threading.Condition(_lock)
_shutting_down = False
_shutdown_reason: Optional[str] = None
_in_flight_requests = 0
_handlers_installed = False


def is_shutting_down() -> bool:
    return _shutting_down


def in_flight_request_count() -> int:
    with _lock:
        return _in_flight_requests


def begin_shutdown(reason: str) -> None:
    global _shutting_down, _shutdown_reason
    with _lock:
        if _shutting_down:
            logger.info(
                "Graceful shutdown already in progress (reason=%s)",
                _shutdown_reason,
            )
            return
        _shutting_down = True
        _shutdown_reason = reason
    logger.info("Shutdown initiated: reason=%s", reason)


def try_begin_request() -> bool:
    global _in_flight_requests
    with _in_flight_condition:
        if _shutting_down:
            return False
        _in_flight_requests += 1
        return True


def end_request() -> None:
    global _in_flight_requests
    with _in_flight_condition:
        _in_flight_requests = max(0, _in_flight_requests - 1)
        if _in_flight_requests == 0:
            _in_flight_condition.notify_all()


def _shutdown_timeout_seconds() -> float:
    return float(
        getattr(settings, "SHUTDOWN_TIMEOUT_SECONDS", DEFAULT_SHUTDOWN_TIMEOUT_SECONDS)
    )


def wait_for_in_flight_requests(timeout: float) -> bool:
    deadline = time.monotonic() + timeout
    with _in_flight_condition:
        while _in_flight_requests > 0:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                logger.warning(
                    "Graceful shutdown timeout (%ss) expired with %d in-flight request(s)",
                    timeout,
                    _in_flight_requests,
                )
                return False
            _in_flight_condition.wait(timeout=remaining)
    return True


def close_database_connections() -> None:
    logger.info("Closing database connections")
    connections.close_all()


def perform_graceful_shutdown(reason: str, *, exit_process: bool = False) -> None:
    with _lock:
        if _shutting_down:
            logger.info(
                "Graceful shutdown already in progress (reason=%s)",
                _shutdown_reason,
            )
            if exit_process:
                sys.exit(0)
            return

    begin_shutdown(reason)
    timeout = _shutdown_timeout_seconds()
    logger.info(
        "Performing graceful shutdown: reason=%s timeout=%ss in_flight=%d",
        reason,
        timeout,
        in_flight_request_count(),
    )

    if wait_for_in_flight_requests(timeout):
        logger.info("All in-flight requests completed during graceful shutdown")

    close_database_connections()
    logger.info("Graceful shutdown complete: reason=%s", reason)

    if exit_process:
        sys.exit(0)


def _handle_shutdown_signal(signum: int, frame) -> None:
    try:
        sig_name = signal.Signals(signum).name
    except (ValueError, AttributeError):
        sig_name = str(signum)
    perform_graceful_shutdown(f"signal:{sig_name}", exit_process=True)


def register_shutdown_handlers() -> None:
    global _handlers_installed
    if _handlers_installed:
        return
    _handlers_installed = True

    for sig in (signal.SIGTERM, signal.SIGINT):
        try:
            signal.signal(sig, _handle_shutdown_signal)
        except (ValueError, OSError) as exc:
            logger.warning("Could not register shutdown handler for %s: %s", sig, exc)

    logger.debug("Graceful shutdown handlers installed")


def on_celery_worker_shutting_down(
    *,
    sig=None,
    how=None,
    exitcode=None,
    **kwargs,
) -> None:
    reason = f"celery_worker_shutting_down:sig={sig} how={how} exitcode={exitcode}"
    begin_shutdown(reason)
    timeout = _shutdown_timeout_seconds()
    logger.info("Celery worker shutting down: %s (timeout=%ss)", reason, timeout)
    wait_for_in_flight_requests(timeout)


def on_celery_worker_shutdown(**kwargs) -> None:
    logger.info("Celery worker shutdown complete")
    close_database_connections()


def reset_shutdown_state() -> None:
    global _shutting_down, _shutdown_reason, _in_flight_requests, _handlers_installed
    with _in_flight_condition:
        _shutting_down = False
        _shutdown_reason = None
        _in_flight_requests = 0
        _handlers_installed = False
