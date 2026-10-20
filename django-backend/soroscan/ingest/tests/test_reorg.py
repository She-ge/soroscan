"""Tests for ledger re-org detection and rollback — issue #1216."""

from __future__ import annotations

from dataclasses import dataclass

import pytest

from soroscan.ingest.models import ContractEvent, IndexerState, WebhookDeliveryLog
from soroscan.ingest.reorg import (
    LEDGER_HASH_KEY,
    LEDGER_SEQUENCE_KEY,
    STATUS_CONFIRMED,
    STATUS_ORPHANED,
    STATUS_PENDING_REORG,
    LedgerHead,
    check_and_handle_reorg,
    detect_reorg,
    is_event_deliverable,
    persist_ledger_head,
    rollback_ledger_reorg,
)
from soroscan.ingest.tests.factories import (
    ContractEventFactory,
    WebhookDeliveryLogFactory,
)


@dataclass
class FakeLatestLedger:
    sequence: int
    hash: str


class FakeSorobanServer:
    def __init__(self, head: LedgerHead):
        self._head = head

    def get_latest_ledger(self):
        return FakeLatestLedger(sequence=self._head.sequence, hash=self._head.hash)


@pytest.mark.django_db
def test_detect_reorg_returns_none_without_prior_state():
    head = LedgerHead(sequence=100, hash="hash100")
    assert detect_reorg(head) is None


@pytest.mark.django_db
def test_detect_reorg_on_sequence_decrease():
    IndexerState.objects.create(key=LEDGER_SEQUENCE_KEY, value="120")
    IndexerState.objects.create(key=LEDGER_HASH_KEY, value="hash120")

    fork = detect_reorg(LedgerHead(sequence=115, hash="hash115"))
    assert fork == 116


@pytest.mark.django_db
def test_detect_reorg_on_hash_change_at_same_sequence():
    IndexerState.objects.create(key=LEDGER_SEQUENCE_KEY, value="120")
    IndexerState.objects.create(key=LEDGER_HASH_KEY, value="old_hash")

    fork = detect_reorg(LedgerHead(sequence=120, hash="new_hash"))
    assert fork == 120


@pytest.mark.django_db
def test_detect_reorg_returns_none_on_normal_advance():
    IndexerState.objects.create(key=LEDGER_SEQUENCE_KEY, value="120")
    IndexerState.objects.create(key=LEDGER_HASH_KEY, value="hash120")

    assert detect_reorg(LedgerHead(sequence=121, hash="hash121")) is None


@pytest.mark.django_db
def test_rollback_marks_events_orphaned_and_retracts_pending_webhooks():
    event_confirmed = ContractEventFactory(ledger=200, status=STATUS_CONFIRMED)
    event_pending = ContractEventFactory(ledger=201, status=STATUS_PENDING_REORG)
    event_safe = ContractEventFactory(ledger=199, status=STATUS_CONFIRMED)

    pending_log = WebhookDeliveryLogFactory(
        event=event_confirmed,
        status=WebhookDeliveryLog.STATUS_PENDING,
        success=False,
    )
    success_log = WebhookDeliveryLogFactory(
        event=event_pending,
        status=WebhookDeliveryLog.STATUS_SUCCESS,
        success=True,
    )

    result = rollback_ledger_reorg(from_ledger=200)

    assert result["orphaned_events"] == 2
    assert result["retracted_webhooks"] == 1

    event_confirmed.refresh_from_db()
    event_pending.refresh_from_db()
    event_safe.refresh_from_db()
    pending_log.refresh_from_db()
    success_log.refresh_from_db()

    assert event_confirmed.status == STATUS_ORPHANED
    assert event_pending.status == STATUS_ORPHANED
    assert event_safe.status == STATUS_CONFIRMED
    assert pending_log.status == WebhookDeliveryLog.STATUS_FAILED
    assert "re-org" in pending_log.error.lower()
    assert success_log.status == WebhookDeliveryLog.STATUS_SUCCESS


@pytest.mark.django_db
def test_check_and_handle_reorg_persists_head(mocker):
    server = FakeSorobanServer(LedgerHead(sequence=50, hash="abc"))
    mocker.patch(
        "soroscan.ingest.reorg.fetch_ledger_head",
        return_value=LedgerHead(sequence=50, hash="abc"),
    )

    assert check_and_handle_reorg(server) is None

    assert IndexerState.objects.get(key=LEDGER_SEQUENCE_KEY).value == "50"
    assert IndexerState.objects.get(key=LEDGER_HASH_KEY).value == "abc"


@pytest.mark.django_db
def test_check_and_handle_reorg_runs_rollback(mocker):
    IndexerState.objects.create(key=LEDGER_SEQUENCE_KEY, value="100")
    IndexerState.objects.create(key=LEDGER_HASH_KEY, value="hash100")
    ContractEventFactory(ledger=100, status=STATUS_CONFIRMED)

    server = FakeSorobanServer(LedgerHead(sequence=95, hash="hash95"))
    mocker.patch(
        "soroscan.ingest.reorg.fetch_ledger_head",
        return_value=LedgerHead(sequence=95, hash="hash95"),
    )

    result = check_and_handle_reorg(server)

    assert result is not None
    assert result["orphaned_events"] == 1
    assert ContractEvent.objects.filter(status=STATUS_ORPHANED).count() == 1


@pytest.mark.django_db
def test_persist_ledger_head():
    persist_ledger_head(LedgerHead(sequence=42, hash="deadbeef"))
    assert IndexerState.objects.get(key=LEDGER_SEQUENCE_KEY).value == "42"
    assert IndexerState.objects.get(key=LEDGER_HASH_KEY).value == "deadbeef"


def test_is_event_deliverable():
    confirmed = ContractEvent(status=STATUS_CONFIRMED)
    orphaned = ContractEvent(status=STATUS_ORPHANED)
    assert is_event_deliverable(confirmed) is True
    assert is_event_deliverable(orphaned) is False


def _counter_value(counter) -> float:
    return counter._value.get()


@pytest.mark.django_db
def test_detect_reorg_increments_detected_metric():
    from soroscan.ingest import metrics as ingest_metrics

    IndexerState.objects.create(key=LEDGER_SEQUENCE_KEY, value="120")
    IndexerState.objects.create(key=LEDGER_HASH_KEY, value="hash120")

    before = _counter_value(ingest_metrics.reorg_detected_total)
    fork = detect_reorg(LedgerHead(sequence=115, hash="hash115"))

    assert fork == 116
    assert _counter_value(ingest_metrics.reorg_detected_total) == before + 1
    assert ingest_metrics.last_reorg_ledger._value.get() == 116


@pytest.mark.django_db
def test_rollback_exports_rolled_back_count_and_last_ledger():
    from soroscan.ingest import metrics as ingest_metrics

    ContractEventFactory(ledger=300, status=STATUS_CONFIRMED)
    ContractEventFactory(ledger=301, status=STATUS_CONFIRMED)

    before = _counter_value(ingest_metrics.reorg_rolled_back_events_total)
    result = rollback_ledger_reorg(from_ledger=300)

    assert result["orphaned_events"] == 2
    assert _counter_value(ingest_metrics.reorg_rolled_back_events_total) == before + 2
    assert ingest_metrics.last_reorg_ledger._value.get() == 300
