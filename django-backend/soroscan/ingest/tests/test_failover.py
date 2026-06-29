"""Automated failover tests for dependency health and recovery.

Simulates database, Redis, Soroban RPC, and Celery worker failures and verifies
that readiness/worker probes degrade gracefully and recover when dependencies
return.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
import requests
from celery.exceptions import TimeoutError as CeleryTimeoutError
from django.core.cache import cache
from django.db import connection
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def mock_soroban_rpc_healthy():
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.raise_for_status = MagicMock()
    mock_response.json.return_value = {"result": {"status": "healthy"}}
    with patch("soroscan.health.requests.post", return_value=mock_response):
        yield


def assert_readiness_healthy(response):
    assert response.status_code == status.HTTP_200_OK
    assert response.data["status"] == "healthy"
    assert response.data["components"]["database"] == "healthy"
    assert response.data["components"]["redis"] == "healthy"
    assert response.data["components"]["soroban_rpc"] == "healthy"


def assert_readiness_degraded(response, component: str):
    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    assert response.data["status"] == "degraded"
    assert component in response.data["components"]
    assert "degraded" in response.data["components"][component]


@pytest.mark.django_db
class TestDatabaseConnectionFailover:
    def test_readiness_degrades_on_database_failure(
        self, api_client, mock_soroban_rpc_healthy, monkeypatch
    ):
        readiness_url = reverse("readiness")
        assert_readiness_healthy(api_client.get(readiness_url))

        monkeypatch.setattr(
            connection,
            "cursor",
            lambda: (_ for _ in ()).throw(Exception("DB connection refused")),
        )

        degraded = api_client.get(readiness_url)
        assert_readiness_degraded(degraded, "database")
        assert api_client.get(reverse("health")).status_code == status.HTTP_200_OK

    def test_readiness_recovers_after_database_restored(
        self, api_client, mock_soroban_rpc_healthy, monkeypatch
    ):
        readiness_url = reverse("readiness")
        original_cursor = connection.cursor

        monkeypatch.setattr(
            connection,
            "cursor",
            lambda: (_ for _ in ()).throw(Exception("DB connection refused")),
        )
        assert_readiness_degraded(api_client.get(readiness_url), "database")

        monkeypatch.setattr(connection, "cursor", original_cursor)
        assert_readiness_healthy(api_client.get(readiness_url))


@pytest.mark.django_db
class TestRedisConnectionFailover:
    def test_readiness_degrades_on_redis_failure(
        self, api_client, mock_soroban_rpc_healthy, monkeypatch
    ):
        readiness_url = reverse("readiness")
        assert_readiness_healthy(api_client.get(readiness_url))

        monkeypatch.setattr(
            cache,
            "set",
            lambda *args, **kwargs: (_ for _ in ()).throw(Exception("Redis down")),
        )

        degraded = api_client.get(readiness_url)
        assert_readiness_degraded(degraded, "redis")
        assert api_client.get(reverse("health")).status_code == status.HTTP_200_OK

    def test_readiness_recovers_after_redis_restored(
        self, api_client, mock_soroban_rpc_healthy, monkeypatch
    ):
        readiness_url = reverse("readiness")
        original_set = cache.set

        monkeypatch.setattr(
            cache,
            "set",
            lambda *args, **kwargs: (_ for _ in ()).throw(Exception("Redis down")),
        )
        assert_readiness_degraded(api_client.get(readiness_url), "redis")

        monkeypatch.setattr(cache, "set", original_set)
        assert_readiness_healthy(api_client.get(readiness_url))


@pytest.mark.django_db
class TestRpcTimeoutFailover:
    def test_readiness_degrades_on_rpc_timeout(
        self, api_client, mock_soroban_rpc_healthy, monkeypatch
    ):
        readiness_url = reverse("readiness")
        assert_readiness_healthy(api_client.get(readiness_url))

        with patch(
            "soroscan.health.requests.post",
            side_effect=requests.exceptions.Timeout("RPC timed out"),
        ):
            degraded = api_client.get(readiness_url)

        assert_readiness_degraded(degraded, "soroban_rpc")
        assert api_client.get(reverse("health")).status_code == status.HTTP_200_OK

    def test_readiness_recovers_after_rpc_timeout_cleared(
        self, api_client, mock_soroban_rpc_healthy
    ):
        readiness_url = reverse("readiness")

        with patch(
            "soroscan.health.requests.post",
            side_effect=requests.exceptions.Timeout("RPC timed out"),
        ):
            assert_readiness_degraded(api_client.get(readiness_url), "soroban_rpc")

        assert_readiness_healthy(api_client.get(readiness_url))


@pytest.mark.django_db
class TestMultipleWorkerFailover:
    def test_worker_health_degrades_when_no_workers_respond(
        self, api_client, monkeypatch
    ):
        class EmptyInspect:
            def ping(self):
                return {}

        monkeypatch.setattr(
            "soroscan.health.app.control.inspect",
            lambda timeout=None: EmptyInspect(),
        )

        response = api_client.get(reverse("worker-health"))
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        assert response.data["status"] == "unhealthy"
        assert "no worker responded" in response.data["error"]

    def test_worker_health_degrades_on_ping_timeout(self, api_client, monkeypatch):
        def raise_timeout(timeout=None):
            raise CeleryTimeoutError("worker ping timeout")

        monkeypatch.setattr("soroscan.health.app.control.inspect", raise_timeout)

        response = api_client.get(reverse("worker-health"))
        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        assert response.data["status"] == "unhealthy"
        assert "worker ping timeout" in response.data["error"]

    def test_worker_health_recovers_when_workers_respond(
        self, api_client, monkeypatch
    ):
        worker_status = {
            "worker1@host-a": {"ok": "pong"},
            "worker2@host-b": {"ok": "pong"},
        }

        class EmptyInspect:
            def ping(self):
                return {}

        class HealthyInspect:
            def ping(self):
                return worker_status

        monkeypatch.setattr(
            "soroscan.health.app.control.inspect",
            lambda timeout=None: EmptyInspect(),
        )
        degraded = api_client.get(reverse("worker-health"))
        assert degraded.status_code == status.HTTP_503_SERVICE_UNAVAILABLE

        monkeypatch.setattr(
            "soroscan.health.app.control.inspect",
            lambda timeout=None: HealthyInspect(),
        )
        recovered = api_client.get(reverse("worker-health"))
        assert recovered.status_code == status.HTTP_200_OK
        assert recovered.data["status"] == "healthy"
        assert recovered.data["workers"] == worker_status

    def test_partial_worker_failure_still_reports_healthy(
        self, api_client, monkeypatch
    ):
        class PartialInspect:
            def ping(self):
                return {"worker1@host-a": {"ok": "pong"}}

        monkeypatch.setattr(
            "soroscan.health.app.control.inspect",
            lambda timeout=None: PartialInspect(),
        )

        response = api_client.get(reverse("worker-health"))
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "healthy"


@pytest.mark.django_db
class TestCombinedFailoverRecovery:
    def test_readiness_recovers_after_multiple_dependency_failures(
        self, api_client, mock_soroban_rpc_healthy, monkeypatch
    ):
        readiness_url = reverse("readiness")
        original_cursor = connection.cursor
        original_cache_set = cache.set

        monkeypatch.setattr(
            connection,
            "cursor",
            lambda: (_ for _ in ()).throw(Exception("DB down")),
        )
        monkeypatch.setattr(
            cache,
            "set",
            lambda *args, **kwargs: (_ for _ in ()).throw(Exception("Redis down")),
        )
        assert_readiness_degraded(api_client.get(readiness_url), "database")
        assert "degraded" in api_client.get(readiness_url).data["components"]["redis"]

        monkeypatch.setattr(connection, "cursor", original_cursor)
        monkeypatch.setattr(cache, "set", original_cache_set)
        assert_readiness_healthy(api_client.get(readiness_url))
