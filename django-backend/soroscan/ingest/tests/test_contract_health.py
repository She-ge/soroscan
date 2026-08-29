"""
Integration tests for contract health checks.

Covers:
  - check_contract_health task logic (healthy / degraded / failed / ABI spike)
  - Status transition triggering send_health_alert
  - GET /api/ingest/contracts/{id}/health/ endpoint
  - GET /api/analytics/contracts/health/ admin overview endpoint
"""

from datetime import timedelta
from unittest.mock import patch

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from soroscan.ingest.models import ContractHealthCheck, ContractEvent
from soroscan.ingest.tasks import check_contract_health, send_health_alert

from .factories import (
    ContractEventFactory,
    TrackedContractFactory,
    UserFactory,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user():
    return UserFactory()


@pytest.fixture
def staff_user():
    u = UserFactory()
    u.is_staff = True
    u.save()
    return u


@pytest.fixture
def contract(user):
    return TrackedContractFactory(owner=user, is_active=True, is_paused=False)


@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def staff_client(api_client, staff_user):
    api_client.force_authenticate(user=staff_user)
    return api_client


# ---------------------------------------------------------------------------
# Helper — build a fresh event N minutes ago
# ---------------------------------------------------------------------------

def _event_at(contract, minutes_ago: int, decoding_status: str = "success"):
    ts = timezone.now() - timedelta(minutes=minutes_ago)
    return ContractEventFactory(
        contract=contract,
        timestamp=ts,
        decoding_status=decoding_status,
    )


# ---------------------------------------------------------------------------
# Task: check_contract_health
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestCheckContractHealthTask:

    def test_healthy_contract_creates_healthy_record(self, contract):
        """A contract with a recent event → status=healthy."""
        _event_at(contract, minutes_ago=5)

        result = check_contract_health.apply().get()

        health = ContractHealthCheck.objects.get(contract=contract)
        assert health.status == ContractHealthCheck.Status.HEALTHY
        assert health.error_message == ""
        assert health.consecutive_failures == 0
        assert result["healthy"] >= 1

    def test_degraded_when_no_events_for_over_30_minutes(self, contract):
        """No event for >30 min → degraded (using default threshold)."""
        _event_at(contract, minutes_ago=45)

        with patch("soroscan.ingest.tasks.send_health_alert") as mock_alert:
            mock_alert.delay = mock_alert  # collapse .delay() for test
            result = check_contract_health.apply().get()

        health = ContractHealthCheck.objects.get(contract=contract)
        assert health.status == ContractHealthCheck.Status.DEGRADED
        assert health.minutes_since_last_event >= 45
        assert result["degraded"] >= 1

    def test_failed_when_no_events_for_over_2_hours(self, contract):
        """No event for >120 min → failed."""
        _event_at(contract, minutes_ago=130)

        result = check_contract_health.apply().get()

        health = ContractHealthCheck.objects.get(contract=contract)
        assert health.status == ContractHealthCheck.Status.FAILED
        assert health.minutes_since_last_event >= 130
        assert result["failed"] >= 1

    def test_degraded_on_abi_decode_error_spike(self, contract):
        """Recent event but many ABI decode failures → degraded."""
        # Fresh event so staleness is fine
        _event_at(contract, minutes_ago=2)
        # 6 decode failures in the last hour (threshold default = 5)
        for _ in range(6):
            _event_at(contract, minutes_ago=10, decoding_status="failed")

        check_contract_health.apply().get()

        health = ContractHealthCheck.objects.get(contract=contract)
        assert health.status == ContractHealthCheck.Status.DEGRADED
        assert health.abi_decode_errors_1h >= 5

    def test_no_events_ever_eventually_fails(self, contract):
        """
        A brand-new contract with no events at all.
        Minutes-since is calculated from contract.created_at.
        Patch created_at to be 3 hours ago so it crosses the failed threshold.
        """
        from django.utils import timezone as tz
        past = tz.now() - timedelta(hours=3)

        # Patch created_at on the in-memory instance used during the task
        with patch.object(
            type(contract), "created_at", new_callable=lambda: property(lambda self: past)
        ):
            pass  # can't easily patch ORM datetime; instead save directly

        # Manually set created_at by updating in DB
        type(contract).objects.filter(pk=contract.pk).update(created_at=past)
        contract.refresh_from_db()

        check_contract_health.apply().get()

        health = ContractHealthCheck.objects.get(contract=contract)
        assert health.status == ContractHealthCheck.Status.FAILED

    def test_paused_contract_is_skipped(self, user):
        """Paused contracts must not be checked."""
        paused = TrackedContractFactory(owner=user, is_active=True, is_paused=True)

        check_contract_health.apply().get()

        assert not ContractHealthCheck.objects.filter(contract=paused).exists()

    def test_inactive_contract_is_skipped(self, user):
        """Inactive contracts must not be checked."""
        inactive = TrackedContractFactory(owner=user, is_active=False, is_paused=False)

        check_contract_health.apply().get()

        assert not ContractHealthCheck.objects.filter(contract=inactive).exists()

    def test_status_transition_triggers_alert(self, contract):
        """
        When status worsens (healthy → degraded), send_health_alert.delay must be called.
        """
        # Pre-create a healthy record
        ContractHealthCheck.objects.create(
            contract=contract,
            status=ContractHealthCheck.Status.HEALTHY,
            minutes_since_last_event=5,
        )
        # Now make the contract stale
        _event_at(contract, minutes_ago=50)

        # Override the event timestamp to be stale: delete fresh event, add old one
        ContractEvent.objects.filter(contract=contract).delete()
        _event_at(contract, minutes_ago=50)

        with patch("soroscan.ingest.tasks.send_health_alert") as mock_task:
            mock_task.delay = mock_task
            check_contract_health.apply().get()
            mock_task.assert_called()

    def test_no_alert_when_status_stays_healthy(self, contract):
        """No alert when status doesn't change (already healthy, still healthy)."""
        ContractHealthCheck.objects.create(
            contract=contract,
            status=ContractHealthCheck.Status.HEALTHY,
            minutes_since_last_event=2,
        )
        _event_at(contract, minutes_ago=2)

        with patch("soroscan.ingest.tasks.send_health_alert") as mock_task:
            mock_task.delay = mock_task
            check_contract_health.apply().get()
            mock_task.assert_not_called()

    def test_consecutive_failures_increments(self, contract):
        """consecutive_failures increments with each non-healthy check."""
        ContractHealthCheck.objects.create(
            contract=contract,
            status=ContractHealthCheck.Status.DEGRADED,
            minutes_since_last_event=45,
            consecutive_failures=2,
        )
        _event_at(contract, minutes_ago=50)

        check_contract_health.apply().get()

        health = ContractHealthCheck.objects.get(contract=contract)
        assert health.consecutive_failures == 3

    def test_consecutive_failures_resets_on_healthy(self, contract):
        """consecutive_failures resets to 0 when contract becomes healthy again."""
        ContractHealthCheck.objects.create(
            contract=contract,
            status=ContractHealthCheck.Status.DEGRADED,
            minutes_since_last_event=45,
            consecutive_failures=5,
        )
        _event_at(contract, minutes_ago=3)

        check_contract_health.apply().get()

        health = ContractHealthCheck.objects.get(contract=contract)
        assert health.status == ContractHealthCheck.Status.HEALTHY
        assert health.consecutive_failures == 0

    def test_exception_in_one_contract_does_not_halt_others(self, user):
        """A crash processing one contract must not prevent others from being checked."""
        good_contract = TrackedContractFactory(owner=user, is_active=True, is_paused=False)
        bad_contract = TrackedContractFactory(owner=user, is_active=True, is_paused=False)
        _event_at(good_contract, minutes_ago=5)

        original_check = __import__(
            "soroscan.ingest.tasks", fromlist=["_check_single_contract_health"]
        )._check_single_contract_health

        def patched_check(*, contract, **kwargs):
            if contract.pk == bad_contract.pk:
                raise RuntimeError("Simulated RPC timeout")
            return original_check(contract=contract, **kwargs)

        with patch(
            "soroscan.ingest.tasks._check_single_contract_health",
            side_effect=patched_check,
        ):
            result = check_contract_health.apply().get()

        # good_contract was processed
        assert ContractHealthCheck.objects.filter(contract=good_contract).exists()
        # bad_contract failure was recorded in summary, not raised
        assert len(result["errors"]) == 1
        assert result["errors"][0]["contract_id"] == bad_contract.contract_id

    def test_summary_counts_are_accurate(self, user):
        """Summary dict must accurately reflect checked/healthy/degraded/failed counts."""
        h = TrackedContractFactory(owner=user, is_active=True, is_paused=False)
        d = TrackedContractFactory(owner=user, is_active=True, is_paused=False)
        f = TrackedContractFactory(owner=user, is_active=True, is_paused=False)

        _event_at(h, minutes_ago=5)
        _event_at(d, minutes_ago=45)
        _event_at(f, minutes_ago=130)

        result = check_contract_health.apply().get()

        assert result["checked"] == 3
        assert result["healthy"] == 1
        assert result["degraded"] == 1
        assert result["failed"] == 1


# ---------------------------------------------------------------------------
# Task: send_health_alert
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestSendHealthAlertTask:

    def test_creates_notification_for_contract_owner(self, contract):
        with patch(
            "soroscan.ingest.services.notifications.create_and_push",
            wraps=lambda **kw: None,
        ) as mock_push:
            result = send_health_alert.apply(
                args=[contract.contract_id, "degraded", "No events for 45 minutes"]
            ).get()

        assert result == "sent"
        mock_push.assert_called_once()
        call_kwargs = mock_push.call_args.kwargs
        assert call_kwargs["user"] == contract.owner
        assert "degraded" in call_kwargs["title"].lower() or "degraded" in call_kwargs["message"].lower()

    def test_skips_gone_contract(self):
        result = send_health_alert.apply(
            args=["CNONEXISTENT" + "A" * 44, "failed", "gone"]
        ).get()
        assert result == "skipped:contract_gone"


# ---------------------------------------------------------------------------
# View: GET /api/ingest/contracts/{id}/health/
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestContractHealthEndpoint:

    def test_returns_healthy_when_no_check_record(self, api_client, contract):
        """No ContractHealthCheck record → defaults to healthy with no error."""
        url = reverse("contract-health", kwargs={"contract_id": contract.contract_id})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "healthy"
        assert response.data["contract_id"] == contract.contract_id
        assert response.data["error_message"] == ""

    def test_returns_health_record_when_present(self, api_client, contract):
        """When a ContractHealthCheck record exists, return its values."""
        last_event = timezone.now() - timedelta(minutes=45)
        ContractHealthCheck.objects.create(
            contract=contract,
            status=ContractHealthCheck.Status.DEGRADED,
            last_event_time=last_event,
            minutes_since_last_event=45,
            abi_decode_errors_1h=0,
            error_message="No events for 45 minutes",
            consecutive_failures=2,
        )

        url = reverse("contract-health", kwargs={"contract_id": contract.contract_id})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "degraded"
        assert response.data["minutes_since_last_event"] == 45
        assert response.data["error_message"] == "No events for 45 minutes"
        assert response.data["consecutive_failures"] == 2

    def test_returns_failed_status(self, api_client, contract):
        ContractHealthCheck.objects.create(
            contract=contract,
            status=ContractHealthCheck.Status.FAILED,
            minutes_since_last_event=130,
            error_message="No events for 130 minutes (threshold: 120 min).",
        )

        url = reverse("contract-health", kwargs={"contract_id": contract.contract_id})
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "failed"

    def test_404_for_unknown_contract(self, api_client):
        url = reverse(
            "contract-health",
            kwargs={"contract_id": "C" + "A" * 55},
        )
        response = api_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_endpoint_is_public(self, contract):
        """Health endpoint must be accessible without authentication."""
        client = APIClient()  # no auth
        url = reverse("contract-health", kwargs={"contract_id": contract.contract_id})
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK

    def test_response_fields_present(self, api_client, contract):
        """All documented fields must be present in the response."""
        url = reverse("contract-health", kwargs={"contract_id": contract.contract_id})
        response = api_client.get(url)

        required_fields = {
            "contract_id",
            "status",
            "last_event_time",
            "minutes_since_last_event",
            "abi_decode_errors_1h",
            "consecutive_failures",
            "error_message",
            "checked_at",
        }
        assert required_fields.issubset(set(response.data.keys()))


# ---------------------------------------------------------------------------
# View: GET /api/analytics/contracts/health/ (staff only)
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAllContractsHealthEndpoint:

    def test_requires_authentication(self, api_client, contract):
        url = reverse("all-contracts-health")
        response = api_client.get(url)
        assert response.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )

    def test_requires_staff(self, authenticated_client, contract):
        """Non-staff authenticated users should get 403."""
        url = reverse("all-contracts-health")
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_staff_sees_all_health_records(self, staff_client, user, staff_user):
        c1 = TrackedContractFactory(owner=user)
        c2 = TrackedContractFactory(owner=user)

        ContractHealthCheck.objects.create(
            contract=c1, status="healthy", minutes_since_last_event=5
        )
        ContractHealthCheck.objects.create(
            contract=c2,
            status="degraded",
            minutes_since_last_event=40,
            error_message="No events for 40 min",
        )

        url = reverse("all-contracts-health")
        response = staff_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["total"] == 2
        assert response.data["healthy"] == 1
        assert response.data["degraded"] == 1
        assert response.data["failed"] == 0
        assert len(response.data["contracts"]) == 2

    def test_summary_counts_match_detail_list(self, staff_client, user):
        for st in ["healthy", "healthy", "degraded", "failed"]:
            c = TrackedContractFactory(owner=user)
            ContractHealthCheck.objects.create(contract=c, status=st, minutes_since_last_event=10)

        url = reverse("all-contracts-health")
        response = staff_client.get(url)

        assert response.data["healthy"] == 2
        assert response.data["degraded"] == 1
        assert response.data["failed"] == 1
        assert response.data["total"] == 4

    def test_empty_when_no_health_records(self, staff_client):
        url = reverse("all-contracts-health")
        response = staff_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["total"] == 0
        assert response.data["contracts"] == []
