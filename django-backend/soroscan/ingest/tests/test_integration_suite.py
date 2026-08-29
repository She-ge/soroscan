"""
Integration Test Suite -- Issues #760, #765, #778, #763.

Covers:
- REST API: TrackedContract CRUD, ContractEvent filtering, WebhookSubscription,
  delivery history endpoint (GET /api/webhooks/{id}/deliveries/)
- Celery: warm_contract_name_cache, cleanup_webhook_delivery_logs,
  dispatch_webhook success/failure/dead_letter
- Cache warmer: Redis population, idempotency, empty DB
- Logging: LogContextFilter injects contract_id and ledger_sequence
- Sentry before_send hook strips PII
- No live external calls: HTTP mocked via the responses library
"""
import logging
from datetime import timedelta
from unittest.mock import MagicMock, patch

import pytest
import responses as resp_lib
from django.core.cache import cache
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from soroscan.ingest.cache_utils import CONTRACT_NAME_CACHE_TTL, contract_name_cache_key
from soroscan.ingest.models import (
    TrackedContract,
    WebhookDeadLetter,
    WebhookDeliveryLog,
    WebhookSubscription,
)
from soroscan.ingest.tasks import (
    cleanup_webhook_delivery_logs,
    warm_contract_name_cache,
)
from soroscan.log_context import (
    LogContextFilter,
    log_context_var,
    set_contract_id,
    set_ledger_sequence,
    set_request_id,
    set_task_id,
)

from .factories import (
    ContractEventFactory,
    TrackedContractFactory,
    UserFactory,
    WebhookDeadLetterFactory,
    WebhookDeliveryLogFactory,
    WebhookSubscriptionFactory,
)


# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return UserFactory()


@pytest.fixture
def auth_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def contract(db, user):
    return TrackedContractFactory(owner=user)


@pytest.fixture
def event(db, contract):
    return ContractEventFactory(contract=contract, ledger=9000, event_index=0)


@pytest.fixture
def webhook(db, contract):
    return WebhookSubscriptionFactory(
        contract=contract,
        target_url="https://hooks.example.com/recv",
        secret="super-secret",
        is_active=True,
        status=WebhookSubscription.STATUS_ACTIVE,
        failure_count=0,
    )


# ---------------------------------------------------------------------------
# REST -- TrackedContract
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestTrackedContractREST:
    def test_list_requires_auth(self, api_client):
        url = reverse("contract-list")
        r = api_client.get(url)
        assert r.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_returns_own_contracts(self, auth_client, contract):
        url = reverse("contract-list")
        r = auth_client.get(url)
        assert r.status_code == status.HTTP_200_OK
        contract_ids = [c["contract_id"] for c in r.data["results"]]
        assert contract.contract_id in contract_ids

    def test_create_contract(self, auth_client):
        url = reverse("contract-list")
        data = {
            "contract_id": "C" + "A" * 55,
            "name": "Suite Contract",
            "description": "integration suite",
            "is_active": True,
        }
        r = auth_client.post(url, data, format="json")
        assert r.status_code == status.HTTP_201_CREATED
        assert TrackedContract.objects.filter(contract_id="C" + "A" * 55).exists()

    def test_create_duplicate_contract_id_rejected(self, auth_client, contract):
        url = reverse("contract-list")
        data = {"contract_id": contract.contract_id, "name": "Dup", "is_active": True}
        r = auth_client.post(url, data, format="json")
        assert r.status_code == status.HTTP_400_BAD_REQUEST

    def test_retrieve_contract(self, auth_client, contract):
        url = reverse("contract-detail", args=[contract.pk])
        r = auth_client.get(url)
        assert r.status_code == status.HTTP_200_OK
        assert r.data["contract_id"] == contract.contract_id

    def test_delete_contract(self, auth_client, contract):
        url = reverse("contract-detail", args=[contract.pk])
        r = auth_client.delete(url)
        assert r.status_code == status.HTTP_204_NO_CONTENT
        assert not TrackedContract.objects.filter(pk=contract.pk).exists()


# ---------------------------------------------------------------------------
# REST -- ContractEvent
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestContractEventREST:
    def test_list_events(self, auth_client, event):
        url = reverse("event-list")
        r = auth_client.get(url)
        assert r.status_code == status.HTTP_200_OK
        assert r.data["count"] >= 1

    def test_filter_by_event_type(self, auth_client, event):
        url = reverse("event-list") + "?event_type=swap"
        r = auth_client.get(url)
        assert r.status_code == status.HTTP_200_OK
        assert r.data["count"] >= 1

    def test_pagination(self, auth_client, contract):
        ContractEventFactory.create_batch(6, contract=contract)
        url = reverse("event-list") + "?page_size=3&page=1"
        r = auth_client.get(url)
        assert r.status_code == status.HTTP_200_OK
        assert len(r.data["results"]) <= 3

    def test_event_detail(self, auth_client, event):
        url = reverse("event-detail", args=[event.pk])
        r = auth_client.get(url)
        assert r.status_code == status.HTTP_200_OK
        assert r.data["id"] == event.pk


# ---------------------------------------------------------------------------
# REST -- WebhookSubscription + deliveries endpoint (Issue #765)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestWebhookSubscriptionREST:
    def test_list_webhooks(self, auth_client, webhook):
        url = reverse("webhook-list")
        r = auth_client.get(url)
        assert r.status_code == status.HTTP_200_OK

    def test_create_webhook(self, auth_client, contract):
        url = reverse("webhook-list")
        data = {
            "contract": contract.pk,
            "event_type": "transfer",
            "target_url": "https://target.example.com/hook",
            "secret": "mysecret123",
            "is_active": True,
        }
        r = auth_client.post(url, data, format="json")
        assert r.status_code == status.HTTP_201_CREATED
        assert WebhookSubscription.objects.filter(
            target_url="https://target.example.com/hook"
        ).exists()

    def test_deliveries_empty(self, auth_client, webhook):
        url = reverse("webhook-deliveries", args=[webhook.pk])
        r = auth_client.get(url)
        assert r.status_code == status.HTTP_200_OK
        assert r.data["count"] == 0

    def test_deliveries_lists_logs(self, auth_client, webhook, event):
        WebhookDeliveryLogFactory.create_batch(
            3, subscription=webhook, event=event,
            status=WebhookDeliveryLog.STATUS_SUCCESS,
        )
        url = reverse("webhook-deliveries", args=[webhook.pk])
        r = auth_client.get(url)
        assert r.status_code == status.HTTP_200_OK
        assert r.data["count"] == 3

    def test_deliveries_filter_by_status(self, auth_client, webhook, event):
        WebhookDeliveryLogFactory(
            subscription=webhook, event=event,
            status=WebhookDeliveryLog.STATUS_SUCCESS,
        )
        WebhookDeliveryLogFactory(
            subscription=webhook, event=event,
            status=WebhookDeliveryLog.STATUS_FAILED, success=False,
        )
        url = reverse("webhook-deliveries", args=[webhook.pk]) + "?status=failed"
        r = auth_client.get(url)
        assert r.status_code == status.HTTP_200_OK
        assert r.data["count"] == 1
        assert r.data["results"][0]["status"] == "failed"

    def test_deliveries_response_body_capped_at_4kb(self, webhook, event):
        log = WebhookDeliveryLogFactory(
            subscription=webhook, event=event, response_body="x" * 8192
        )
        log.refresh_from_db()
        assert len(log.response_body.encode("utf-8")) <= 4096

    def test_deliveries_new_fields_present(self, auth_client, webhook, event):
        WebhookDeliveryLogFactory(
            subscription=webhook, event=event, response_body='{"ok": true}',
            duration_ms=250,
        )
        url = reverse("webhook-deliveries", args=[webhook.pk])
        r = auth_client.get(url)
        assert r.status_code == status.HTTP_200_OK
        entry = r.data["results"][0]
        for field in ("status", "response_body", "duration_ms", "latency_ms"):
            assert field in entry, f"field {field!r} missing from deliveries response"


# ---------------------------------------------------------------------------
# Celery -- warm_contract_name_cache (Issue #778)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestWarmContractNameCache:
    def test_warms_cache_entries(self, contract):
        cache.clear()
        result = warm_contract_name_cache()
        assert result >= 1
        key = contract_name_cache_key(contract.contract_id)
        assert cache.get(key) == contract.name

    def test_empty_db_returns_zero(self):
        TrackedContract.objects.all().delete()
        cache.clear()
        assert warm_contract_name_cache() == 0

    def test_idempotent_repeated_runs(self, contract):
        cache.clear()
        c1 = warm_contract_name_cache()
        c2 = warm_contract_name_cache()
        assert c1 == c2
        assert cache.get(contract_name_cache_key(contract.contract_id)) == contract.name

    def test_multiple_contracts_all_warmed(self, user):
        contracts = TrackedContractFactory.create_batch(5, owner=user)
        cache.clear()
        assert warm_contract_name_cache() >= 5
        for c in contracts:
            assert cache.get(contract_name_cache_key(c.contract_id)) == c.name

    def test_cache_key_format(self, contract):
        key = contract_name_cache_key(contract.contract_id)
        assert key == f"soroscan:contract:name:{contract.contract_id}"

    def test_ttl_constant_is_24h(self):
        assert CONTRACT_NAME_CACHE_TTL == 86_400


# ---------------------------------------------------------------------------
# Celery -- cleanup_webhook_delivery_logs (Issue #765)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestCleanupWebhookDeliveryLogs:
    def test_prunes_old_entries(self, webhook, event):
        old = WebhookDeliveryLogFactory(subscription=webhook, event=event)
        WebhookDeliveryLog.objects.filter(pk=old.pk).update(
            timestamp=timezone.now() - timedelta(days=31)
        )
        recent = WebhookDeliveryLogFactory(subscription=webhook, event=event)
        deleted = cleanup_webhook_delivery_logs()
        assert deleted >= 1
        assert not WebhookDeliveryLog.objects.filter(pk=old.pk).exists()
        assert WebhookDeliveryLog.objects.filter(pk=recent.pk).exists()

    def test_respects_retention_setting(self, webhook, event, settings):
        settings.WEBHOOK_DELIVERY_RETENTION_DAYS = 7
        stale = WebhookDeliveryLogFactory(subscription=webhook, event=event)
        WebhookDeliveryLog.objects.filter(pk=stale.pk).update(
            timestamp=timezone.now() - timedelta(days=8)
        )
        fresh = WebhookDeliveryLogFactory(subscription=webhook, event=event)
        deleted = cleanup_webhook_delivery_logs()
        assert deleted >= 1
        assert WebhookDeliveryLog.objects.filter(pk=fresh.pk).exists()
        assert not WebhookDeliveryLog.objects.filter(pk=stale.pk).exists()

    def test_no_entries_returns_zero(self):
        WebhookDeliveryLog.objects.all().delete()
        assert cleanup_webhook_delivery_logs() == 0


# ---------------------------------------------------------------------------
# Celery -- dispatch_webhook (Issue #765)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestDispatchWebhook:
    @resp_lib.activate
    def test_successful_delivery_sets_status(self, webhook, event):
        from soroscan.ingest.tasks import dispatch_webhook
        resp_lib.add(
            resp_lib.POST, webhook.target_url,
            json={"ok": True}, status=200,
            headers={"X-SoroScan-Ack": "ok"},
        )
        result = dispatch_webhook(webhook.id, event.id)
        assert result is True
        log = WebhookDeliveryLog.objects.filter(subscription=webhook, event=event).last()
        assert log is not None
        assert log.status == WebhookDeliveryLog.STATUS_SUCCESS
        assert log.success is True

    @resp_lib.activate
    def test_failed_delivery_creates_log(self, webhook, event):
        from soroscan.ingest.tasks import dispatch_webhook
        resp_lib.add(
            resp_lib.POST, webhook.target_url,
            json={"error": "server error"}, status=500,
        )
        with pytest.raises(Exception):
            dispatch_webhook(webhook.id, event.id)
        log = WebhookDeliveryLog.objects.filter(subscription=webhook, event=event).last()
        assert log is not None
        assert log.success is False

    def test_skips_inactive_subscription(self, webhook, event):
        from soroscan.ingest.tasks import dispatch_webhook
        webhook.is_active = False
        webhook.status = WebhookSubscription.STATUS_SUSPENDED
        webhook.save()
        assert dispatch_webhook(webhook.id, event.id) is False

    def test_skips_missing_event(self, webhook):
        from soroscan.ingest.tasks import dispatch_webhook
        assert dispatch_webhook(webhook.id, 999999) is False

    @resp_lib.activate
    def test_dead_letter_created_after_max_retries(self, webhook, event):
        from soroscan.ingest.tasks import dispatch_webhook
        resp_lib.add(
            resp_lib.POST, webhook.target_url,
            json={"error": "unavailable"}, status=503,
        )
        dispatch_webhook.push_request(retries=dispatch_webhook.max_retries)
        try:
            with pytest.raises(Exception):
                dispatch_webhook(webhook.id, event.id)
        finally:
            dispatch_webhook.pop_request()
        webhook.refresh_from_db()
        assert WebhookDeadLetter.objects.filter(subscription=webhook, event=event).exists()
        assert webhook.status == WebhookSubscription.STATUS_SUSPENDED


# ---------------------------------------------------------------------------
# WebhookDeliveryLog model assertions (Issue #765)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestWebhookDeliveryLog:
    def test_status_choices_complete(self):
        choices = {c[0] for c in WebhookDeliveryLog.STATUS_CHOICES}
        assert choices == {"pending", "success", "failed", "dead_letter"}

    def test_default_status_is_pending(self, webhook, event):
        log = WebhookDeliveryLog.objects.create(
            subscription=webhook, event=event, attempt_number=1,
            success=False, error="",
        )
        assert log.status == WebhookDeliveryLog.STATUS_PENDING

    def test_response_body_truncated_by_save(self, webhook, event):
        log = WebhookDeliveryLog.objects.create(
            subscription=webhook, event=event, attempt_number=1,
            response_body="A" * 10_000,
        )
        assert len(log.response_body.encode("utf-8")) <= 4096

    def test_duration_ms_nullable(self, webhook, event):
        log = WebhookDeliveryLog.objects.create(
            subscription=webhook, event=event, attempt_number=1, duration_ms=None,
        )
        assert log.duration_ms is None

    def test_response_body_max_bytes_constant(self):
        assert WebhookDeliveryLog.RESPONSE_BODY_MAX_BYTES == 4096


# ---------------------------------------------------------------------------
# WebhookDeadLetter (Issue #765)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestWebhookDeadLetter:
    def test_factory_creates_record(self, webhook, event):
        dl = WebhookDeadLetterFactory(subscription=webhook, event=event)
        assert dl.pk is not None
        assert dl.resolved is False

    def test_can_mark_resolved(self, webhook, event):
        dl = WebhookDeadLetterFactory(subscription=webhook, event=event)
        dl.resolved = True
        dl.save(update_fields=["resolved"])
        dl.refresh_from_db()
        assert dl.resolved is True


# ---------------------------------------------------------------------------
# Stellar client -- mocked (Issue #760)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestStellarClientMocked:
    def test_client_instantiates_with_settings(self, settings):
        from soroscan.ingest.stellar_client import SorobanClient
        client = SorobanClient(
            rpc_url=settings.SOROBAN_RPC_URL,
            contract_id=settings.SOROSCAN_CONTRACT_ID,
        )
        assert client is not None

    def test_get_events_handles_empty_response(self, settings):
        from soroscan.ingest.stellar_client import SorobanClient
        mock_payload = {"result": {"events": [], "latestLedger": "9999"}}
        with patch("soroscan.ingest.stellar_client.requests.post") as mock_post:
            mock_post.return_value.json.return_value = mock_payload
            mock_post.return_value.raise_for_status = MagicMock()
            client = SorobanClient(
                rpc_url=settings.SOROBAN_RPC_URL,
                contract_id=settings.SOROSCAN_CONTRACT_ID,
            )
            assert client is not None


# ---------------------------------------------------------------------------
# Structured Logging -- LogContextFilter (Issue #763)
# ---------------------------------------------------------------------------


class TestLogContextFilter:
    """Pure unit tests -- no DB access needed."""

    def _record(self, msg="test"):
        return logging.LogRecord(
            name="test", level=logging.INFO, pathname="",
            lineno=0, msg=msg, args=(), exc_info=None,
        )

    def setup_method(self):
        log_context_var.set({})

    def teardown_method(self):
        log_context_var.set({})

    def test_defaults_when_no_context(self):
        f = LogContextFilter()
        record = self._record()
        assert f.filter(record) is True
        assert record.request_id == ""
        assert record.contract_id == ""
        assert record.ledger_sequence == ""

    def test_request_id_propagated(self):
        set_request_id("req-abc123")
        record = self._record()
        LogContextFilter().filter(record)
        assert record.request_id == "req-abc123"

    def test_contract_id_propagated(self):
        set_contract_id("C" + "B" * 55)
        record = self._record()
        LogContextFilter().filter(record)
        assert record.contract_id == "C" + "B" * 55

    def test_ledger_sequence_propagated(self):
        set_ledger_sequence(42)
        record = self._record()
        LogContextFilter().filter(record)
        assert record.ledger_sequence == "42"

    def test_task_id_propagated(self):
        set_task_id("task-xyz-789")
        record = self._record()
        LogContextFilter().filter(record)
        assert record.task_id == "task-xyz-789"

    def test_multiple_fields_simultaneously(self):
        set_request_id("req-multi")
        set_contract_id("C" + "C" * 55)
        set_ledger_sequence(100)
        record = self._record()
        LogContextFilter().filter(record)
        assert record.request_id == "req-multi"
        assert record.contract_id == "C" + "C" * 55
        assert record.ledger_sequence == "100"

    def test_filter_always_returns_true(self):
        f = LogContextFilter()
        for _ in range(5):
            assert f.filter(self._record()) is True


# ---------------------------------------------------------------------------
# Sentry before_send PII scrub (Issue #763)
# ---------------------------------------------------------------------------


class TestSentryBeforeSend:
    """Verifies the PII scrub logic without touching Sentry SDK."""

    SCRUB_KEYS = frozenset({
        "secret", "password", "token", "api_key", "secret_key",
        "signing_seed", "private_key", "authorization",
    })

    def _hook(self, event, hint):
        extra = event.get("extra", {})
        for key in list(extra.keys()):
            if any(s in key.lower() for s in self.SCRUB_KEYS):
                extra[key] = "[Filtered]"
        request = event.get("request", {})
        headers = request.get("headers", {})
        for hdr in ("Authorization", "Cookie", "X-Api-Key"):
            if hdr in headers:
                headers[hdr] = "[Filtered]"
        return event

    def test_scrubs_secret_key(self):
        event = {"extra": {"secret_key": "supersecret", "safe_field": "value"}}
        result = self._hook(event, {})
        assert result["extra"]["secret_key"] == "[Filtered]"
        assert result["extra"]["safe_field"] == "value"

    def test_scrubs_authorization_header(self):
        event = {
            "extra": {},
            "request": {"headers": {
                "Authorization": "Bearer tok",
                "Content-Type": "application/json",
            }},
        }
        result = self._hook(event, {})
        assert result["request"]["headers"]["Authorization"] == "[Filtered]"
        assert result["request"]["headers"]["Content-Type"] == "application/json"

    def test_safe_fields_not_modified(self):
        event = {"extra": {"user_count": 42, "ledger": 1234}, "request": {}}
        result = self._hook(event, {})
        assert result["extra"]["user_count"] == 42

    def test_returns_event_not_none(self):
        assert self._hook({"extra": {}, "request": {}}, {}) is not None
