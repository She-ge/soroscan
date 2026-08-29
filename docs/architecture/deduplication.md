# Event Deduplication and Conflict Resolution Guide

SoroScan is designed to ensure strict event delivery consistency. Because the ingest workers stream events from decentralized networks, the ingestion pipeline must handle potential duplicate event submissions and blockchain ledger reorganizations (re-orgs).

This document outlines the deduplication architecture, database-level constraints, re-org mitigation strategies, and event audit logging mechanisms.

---

## 1. Database-Level Unique Constraints

The primary barrier against duplicate events is a composite database-level unique constraint on the `ContractEvent` model:

* **Composite Constraint**: `unique_contract_ledger_event_index`
* **Target Columns**: `(contract_id, ledger, event_index)`

### Rationale
In the Soroban smart contract event model:
1. A **contract** is identified by its unique contract ID address.
2. A **ledger** sequence represents the atomic block height on the Stellar network.
3. An **event_index** is a sequential 0-based offset identifying the event position within that specific ledger's execution output.

Because no single contract can emit more than one event at the exact same index location in a single block ledger, the triple `(contract_id, ledger, event_index)` is guaranteed to uniquely identify a single transaction event. If the database receives an ingestion payload matching an existing triple, a conflict is detected.

---

## 2. Handling Re-orgs and Duplicate Ledgers

Stellar / Soroban nodes can occasionally undergo temporary network forks or block reorganizations (re-orgs). During a re-org, blocks (ledgers) at a certain sequence number may be discarded and replaced with a new canonical sequence.

When this occurs, SoroScan's event ingestion loop re-reads the replaced ledgers. It handles these conflicts using Django's database upsert pattern (`update_or_create`):

### The Upsert Flow

```python
result = ContractEvent.objects.update_or_create(
    contract=contract,
    ledger=ledger,
    event_index=event_index,
    defaults={
        "tx_hash": tx_hash,
        "event_type": event_type,
        "payload": payload,
        "timestamp": timestamp,
        "raw_xdr": raw_xdr,
        "signature_status": signature_status,
    },
)
```

1. **Conflict Check**: The DB checks if a row matching `(contract_id, ledger, event_index)` exists.
2. **On Conflict Update (Upsert)**:
   * If a row **already exists**, it is overwritten with the fresh properties (updated `tx_hash`, `payload`, `raw_xdr`, and `signature_status`).
   * The database record remains unique, old or stale fork transactions are wiped out, and the in-memory cache for the event's decoded ABI payload is invalidated (`invalidate_decoded_payload_cache`).
3. **On Insert**:
   * If the row **does not exist**, a new event is inserted and the event counter cache is incremented.

*Note: This architecture ensures that even during rapid back-to-back ingestion restarts or blockchain ledger updates, SoroScan maintains an eventually consistent state without duplicate event delivery.*

---

## 3. Deduplication Logging & Auditing

To track how effectively SoroScan's pipelines filter out duplicates, the system runs an audit trail using the `EventDeduplicationLog` model.

### Ingest Audit Trail Schema
Every deduplication check generates a log entry:
* **`contract`**: FK to `TrackedContract`.
* **`ledger`** / **`event_index`**: The target block and index verified.
* **`tx_hash`**: Transaction hash associated with the attempt.
* **`duplicate_detected`**: Boolean flag indicating if the event was already stored or bypassed.
* **`reason`**: Descriptive text outlining why the duplicate state occurred.
* **`created_at`**: Ingestion UTC timestamp.

### 90-Day Retention Policy (TTL Cleanup)
To prevent the audit logs from consuming excessive database space, SoroScan implements a 90-day time-to-live (TTL) on `EventDeduplicationLog` entries.

An automated Celery task cleans up stale logs:
* **Task Name**: `cleanup_old_dedup_logs`
* **Trigger**: Scheduled daily via Celery Beat.
* **Logic**:
  ```python
  from django.utils import timezone
  from datetime import timedelta
  from .models import EventDeduplicationLog

  cutoff = timezone.now() - timedelta(days=90)
  EventDeduplicationLog.objects.filter(created_at__lt=cutoff).delete()
  ```
