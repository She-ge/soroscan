"""
Ledger re-org detection and rollback for event ingestion.

Issue #1216 — feat(ingest): implement ledger re-org detection and rollback handler
"""

from __future__ import annotations

import logging
from dataclasses import dataclass

from django.db import transaction
from stellar_sdk.soroban_server import SorobanServer

from soroscan.circuit_breaker import execute_with_circuit_breaker
from soroscan.ingest import metrics as ingest_metrics
from soroscan.ingest.models import ContractEvent, IndexerState, WebhookDeliveryLog

logger = logging.getLogger(__name__)

LEDGER_SEQUENCE_KEY = "last_ledger_sequence"
LEDGER_HASH_KEY = "last_ledger_hash"

STATUS_CONFIRMED = "CONFIRMED"
STATUS_PENDING_REORG = "PENDING_REORG"
STATUS_ORPHANED = "ORPHANED"

STATUS_CHOICES = [
    (STATUS_CONFIRMED, "Confirmed"),
    (STATUS_PENDING_REORG, "Pending Re-org"),
    (STATUS_ORPHANED, "Orphaned"),
]


@dataclass(frozen=True)
class LedgerHead:
    sequence: int
    hash: str


def _get_indexer_state(key: str) -> str | None:
    try:
        return IndexerState.objects.get(key=key).value
    except IndexerState.DoesNotExist:
        return None


def _set_indexer_state(key: str, value: str) -> None:
    IndexerState.objects.update_or_create(key=key, defaults={"value": value})


def fetch_ledger_head(server: SorobanServer) -> LedgerHead:
    """Return the current ledger head from Soroban RPC."""
    response = execute_with_circuit_breaker("horizon", server.get_latest_ledger)
    ledger_hash = getattr(response, "hash", getattr(response, "id", ""))
    return LedgerHead(sequence=int(response.sequence), hash=str(ledger_hash))


def detect_reorg(head: LedgerHead) -> int | None:
    """
    Compare the current ledger head against stored indexer state.

    Returns the ledger sequence from which events should be rolled back,
    or ``None`` when no re-org is detected.
    """
    prev_seq_str = _get_indexer_state(LEDGER_SEQUENCE_KEY)
    prev_hash = _get_indexer_state(LEDGER_HASH_KEY)

    if prev_seq_str is None or prev_hash is None:
        return None

    prev_seq = int(prev_seq_str)

    if head.sequence < prev_seq:
        logger.warning(
            "Ledger re-org detected: sequence decreased from %s to %s",
            prev_seq,
            head.sequence,
            extra={"ledger_sequence": head.sequence},
        )
        ingest_metrics.reorg_detected_total.inc()
        ingest_metrics.last_reorg_ledger.set(head.sequence + 1)
        return head.sequence + 1

    if head.sequence == prev_seq and head.hash != prev_hash:
        logger.warning(
            "Ledger re-org detected: hash changed at sequence %s",
            prev_seq,
            extra={"ledger_sequence": prev_seq},
        )
        ingest_metrics.reorg_detected_total.inc()
        ingest_metrics.last_reorg_ledger.set(prev_seq)
        return prev_seq

    return None


def persist_ledger_head(head: LedgerHead) -> None:
    """Store the latest observed ledger sequence and hash."""
    _set_indexer_state(LEDGER_SEQUENCE_KEY, str(head.sequence))
    _set_indexer_state(LEDGER_HASH_KEY, head.hash)


def rollback_ledger_reorg(from_ledger: int) -> dict[str, int]:
    """
    Mark orphaned events and retract pending webhook dispatches.

    Events at ``from_ledger`` and above are marked ``ORPHANED``. Pending
    webhook delivery logs for those events are marked failed so Celery retries
    do not deliver stale chain data.
    """
    with transaction.atomic():
        orphaned_count = ContractEvent.objects.filter(
            ledger__gte=from_ledger,
            status__in=[STATUS_CONFIRMED, STATUS_PENDING_REORG],
        ).update(status=STATUS_ORPHANED)

        retracted_count = WebhookDeliveryLog.objects.filter(
            event__ledger__gte=from_ledger,
            status=WebhookDeliveryLog.STATUS_PENDING,
        ).update(
            status=WebhookDeliveryLog.STATUS_FAILED,
            success=False,
            error="Retracted due to ledger re-org rollback",
        )

    logger.info(
        "Re-org rollback from ledger %s: orphaned %s events, retracted %s webhooks",
        from_ledger,
        orphaned_count,
        retracted_count,
        extra={"ledger_sequence": from_ledger},
    )
    if orphaned_count:
        ingest_metrics.reorg_rolled_back_events_total.inc(orphaned_count)
    ingest_metrics.last_reorg_ledger.set(from_ledger)
    return {
        "orphaned_events": orphaned_count,
        "retracted_webhooks": retracted_count,
        "from_ledger": from_ledger,
    }


def check_and_handle_reorg(server: SorobanServer) -> dict[str, int] | None:
    """
    Detect a ledger re-org and run rollback when needed.

    Always refreshes the stored ledger head after the check.
    """
    head = fetch_ledger_head(server)
    fork_ledger = detect_reorg(head)

    result: dict[str, int] | None = None
    if fork_ledger is not None:
        result = rollback_ledger_reorg(fork_ledger)

    persist_ledger_head(head)
    return result


def is_event_deliverable(event: ContractEvent) -> bool:
    """Return False when an event must not trigger webhooks or streaming."""
    return event.status != STATUS_ORPHANED
