import json
import signal
import threading
import time
from unittest.mock import patch

import pytest
from django.http import HttpResponse
from django.test import RequestFactory, override_settings

from soroscan.middleware import GracefulShutdownMiddleware
from soroscan.shutdown import (
    begin_shutdown,
    close_database_connections,
    end_request,
    in_flight_request_count,
    is_shutting_down,
    on_celery_worker_shutdown,
    on_celery_worker_shutting_down,
    perform_graceful_shutdown,
    register_shutdown_handlers,
    reset_shutdown_state,
    try_begin_request,
    wait_for_in_flight_requests,
)


@pytest.fixture(autouse=True)
def _clean_shutdown_state():
    reset_shutdown_state()
    yield
    reset_shutdown_state()


@pytest.fixture
def rf():
    return RequestFactory()


def test_try_begin_request_tracks_in_flight():
    assert try_begin_request() is True
    assert in_flight_request_count() == 1
    end_request()
    assert in_flight_request_count() == 0


def test_try_begin_request_rejects_when_shutting_down():
    begin_shutdown("test shutdown")
    assert try_begin_request() is False
    assert in_flight_request_count() == 0


def test_wait_for_in_flight_requests_completes():
    try_begin_request()

    def finish_request():
        time.sleep(0.05)
        end_request()

    thread = threading.Thread(target=finish_request)
    thread.start()
    assert wait_for_in_flight_requests(timeout=2) is True
    thread.join()


def test_wait_for_in_flight_requests_times_out():
    try_begin_request()
    assert wait_for_in_flight_requests(timeout=0.05) is False
    end_request()


@override_settings(SHUTDOWN_TIMEOUT_SECONDS=30)
def test_perform_graceful_shutdown_waits_and_closes_db():
    try_begin_request()
    closed = threading.Event()

    def finish_request():
        time.sleep(0.05)
        end_request()

    thread = threading.Thread(target=finish_request)
    thread.start()

    with patch("soroscan.shutdown.close_database_connections", side_effect=lambda: closed.set()):
        with patch("soroscan.shutdown.sys.exit") as mock_exit:
            perform_graceful_shutdown("SIGTERM test", exit_process=True)

    thread.join()
    assert closed.is_set()
    assert is_shutting_down()
    mock_exit.assert_called_once_with(0)


@override_settings(SHUTDOWN_TIMEOUT_SECONDS=0.05)
def test_perform_graceful_shutdown_logs_timeout():
    try_begin_request()

    with patch("soroscan.shutdown.close_database_connections"):
        with patch("soroscan.shutdown.sys.exit"):
            with patch("soroscan.shutdown.logger") as mock_logger:
                perform_graceful_shutdown("SIGTERM test", exit_process=True)

    assert mock_logger.warning.called
    end_request()


def test_perform_graceful_shutdown_is_idempotent():
    with patch("soroscan.shutdown.close_database_connections") as mock_close:
        with patch("soroscan.shutdown.sys.exit"):
            perform_graceful_shutdown("first", exit_process=False)
            perform_graceful_shutdown("second", exit_process=False)

    mock_close.assert_called_once()


def test_register_shutdown_handlers_installs_sigterm():
    register_shutdown_handlers()
    handler = signal.getsignal(signal.SIGTERM)
    assert handler is not None
    assert handler.__name__ == "_handle_shutdown_signal"


def test_middleware_allows_requests_when_healthy(rf):
    request = rf.get("/api/health/")
    middleware = GracefulShutdownMiddleware(lambda req: HttpResponse("OK", status=200))
    response = middleware(request)
    assert response.status_code == 200


def test_middleware_rejects_requests_during_shutdown(rf):
    begin_shutdown("SIGTERM")
    request = rf.get("/api/health/")
    middleware = GracefulShutdownMiddleware(lambda req: HttpResponse("OK", status=200))
    response = middleware(request)
    assert response.status_code == 503
    data = json.loads(response.content)
    assert data["error"] == "Server is shutting down"


def test_middleware_tracks_in_flight_during_request(rf):
    in_flight_during_request = None

    def slow_response(req):
        nonlocal in_flight_during_request
        in_flight_during_request = in_flight_request_count()
        return HttpResponse("OK", status=200)

    request = rf.get("/api/events/")
    middleware = GracefulShutdownMiddleware(slow_response)
    middleware(request)

    assert in_flight_during_request == 1
    assert in_flight_request_count() == 0


def test_close_database_connections():
    with patch("soroscan.shutdown.connections") as mock_connections:
        close_database_connections()
    mock_connections.close_all.assert_called_once()


def test_celery_worker_shutting_down_sets_state():
    on_celery_worker_shutting_down(sig="SIGTERM", how="warm", exitcode=0)
    assert is_shutting_down()


def test_celery_worker_shutdown_closes_db():
    with patch("soroscan.shutdown.close_database_connections") as mock_close:
        on_celery_worker_shutdown()
    mock_close.assert_called_once()
