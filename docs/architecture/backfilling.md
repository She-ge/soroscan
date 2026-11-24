# Historical Ledger Event Backfilling

SoroScan continuously monitors contracts for new events, but gaps can appear in the indexed history — for example when
the ingestion worker is restarted, a node is temporarily unreachable, or a contract is registered after some events have
already been emitted. The backfill system exists to detect and close those gaps without duplicating already-indexed
data.

---

## How It Works

### Normal ingestion vs. backfilling

The regular ingestion path (`ingest_latest_events`) advances a cursor stored in `IndexerState` forward in real time. It
only fetches events at or after `last_indexed_ledger` for each contract. When the cursor skips ledgers (e.g. the worker
was offline), a gap forms in the `ContractEvent` table.

The backfill system is a separate concern that:

1. **Detects gaps** — `reconcile_event_completeness` scans every active contract and compares observed ledger numbers
   against the expected contiguous range. Any missing ledger numbers are recorded as gaps.
1. **Schedules repairs** — For each gap (up to 10 per contract per reconciliation cycle), it enqueues a
   `backfill_contract_events` Celery task for the missing ledger range.
1. **Fills in the data** — `backfill_contract_events` fetches historical events from the Soroban RPC node in batches and
   upserts them into the database.

### Gap detection logic

`_calculate_completeness` determines completeness for a contract:

```
expected_ledgers = max_ledger - min_ledger + 1
completeness%    = (observed_distinct_ledgers / expected_ledgers) × 100
```

It also walks the sorted ledger list and records every discontinuity as a gap object:

```json
{ "from_ledger": 1204501, "to_ledger": 1204650 }
```

This completeness summary is persisted to `IndexerState` under the key `completeness:<contract_id>`.

A warning is logged when completeness drops below **99.9%**.

### Batch processing

`backfill_contract_events` processes the requested ledger range in chunks of **200 ledgers**
(`BATCH_LEDGER_SIZE = 200`). After each batch:

- `contract.last_indexed_ledger` is advanced to `batch_end` and saved.
- Prometheus counters (`backfill_ledgers_processed_total`, `backfill_batch_duration_seconds`) are updated.

Each event in the batch goes through `_upsert_contract_event`, which creates or updates the `ContractEvent` row,
respects the per-contract `max_events_per_minute` rate limit, and triggers ABI decoding and signature verification.

---

## Running a Backfill

### Automatic (recommended)

The `reconcile_event_completeness` task runs on a Celery Beat schedule and triggers backfill tasks automatically. No
manual intervention is needed under normal operating conditions.

To manually trigger reconciliation across all active contracts:

```python
from soroscan.ingest.tasks import reconcile_event_completeness
reconcile_event_completeness.delay()
```

### Via Celery task (programmatic)

To backfill a specific contract over a specific ledger range:

```python
from soroscan.ingest.tasks import backfill_contract_events

backfill_contract_events.delay(
    contract_id="CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
    from_ledger=1200000,
    to_ledger=1205000,
)
```

The task validates that `from_ledger` and `to_ledger` are both positive and that `from_ledger <= to_ledger`. An invalid
range raises `ValueError` immediately.

If `contract.last_indexed_ledger` is set and is greater than `from_ledger`, the task automatically advances
`next_ledger` to avoid re-fetching already-indexed ledgers:

```python
next_ledger = max(from_ledger, contract.last_indexed_ledger + 1)
```

### Via management command (manual ingestion)

For a quick manual ingest from the current cursor position (not a ranged backfill), use the `ingest_events` management
command:

```bash
# Dry run — fetch and validate, do not persist
python manage.py ingest_events --contract CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA --dry-run

# Live run — fetch and persist
python manage.py ingest_events --contract CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA
```

### Reprocessing already-indexed events

If you need to re-run decoding, validation, or signature verification on events that are already in the database (e.g.
after uploading a new ABI), use `reprocess_events`:

```bash
# Dry run — show what would change
python manage.py reprocess_events \
    --contract-id CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA \
    --dry-run

# Apply changes in batches of 500 (default)
python manage.py reprocess_events \
    --contract-id CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA \
    --batch-size 500

# Resume from a specific event ID (useful after a partial failure)
python manage.py reprocess_events \
    --contract-id CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA \
    --checkpoint-id 42800

# Abort and roll back the current batch on the first error
python manage.py reprocess_events \
    --contract-id CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA \
    --rollback-on-error
```

`reprocess_events` output includes:

```
reprocess_events completed: contract=C... processed=12500/12500 updated=843 failed=0 progress=100.0% checkpoint=99999 dry_run=False rolled_back=False
```

---

## Ledger Range Parameters

| Parameter     | Description                       | Constraints             |
| ------------- | --------------------------------- | ----------------------- |
| `from_ledger` | First ledger to fetch (inclusive) | Must be > 0             |
| `to_ledger`   | Last ledger to fetch (inclusive)  | Must be ≥ `from_ledger` |

The effective start ledger is `max(from_ledger, contract.last_indexed_ledger + 1)` to avoid redundant work.

**Choosing ranges:**

- A range of 5,000 ledgers (~7 hours of Stellar mainnet history at ~5s/ledger) processes in approximately 25 batches
  of 200.
- Prefer smaller ranges for targeted repairs. Large ranges (>50,000 ledgers) should be split across multiple task
  invocations to stay within the `soft_time_limit` of 300 seconds.

---

## Monitoring Progress

### Celery task result

`backfill_contract_events` returns a summary dict on success:

```json
{
  "contract_id": "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
  "from_ledger": 1200000,
  "to_ledger": 1205000,
  "last_indexed_ledger": 1205000,
  "processed_events": 312,
  "created_events": 308,
  "updated_events": 4
}
```

### IndexerState

After each reconciliation cycle, completeness data is written to `IndexerState`:

```python
from soroscan.ingest.models import IndexerState

state = IndexerState.objects.get(key="completeness:<contract_pk>")
import json
summary = json.loads(state.value)
# {
#   "contract_id": "C...",
#   "completeness_percentage": 99.9872,
#   "observed_ledgers": 48210,
#   "expected_ledgers": 48216,
#   "missing_ledgers": 6,
#   "gaps": [{"from_ledger": 1204501, "to_ledger": 1204506}]
# }
```

### Prometheus metrics

| Metric                                                        | Type      | Description                                  |
| ------------------------------------------------------------- | --------- | -------------------------------------------- |
| `backfill_ledgers_processed_total`                            | Counter   | Ledgers processed, labelled by `contract_id` |
| `backfill_batch_duration_seconds`                             | Histogram | Time per 200-ledger batch                    |
| `ledger_gaps_total`                                           | Counter   | Gaps detected per reconciliation run         |
| `missing_events_total`                                        | Counter   | Missing ledger count at detection time       |
| `task_duration_seconds{task_name="backfill_contract_events"}` | Histogram | End-to-end task duration                     |

---

## Rate Limiting and Performance

### Per-contract ingest rate

Each `TrackedContract` can have a `max_events_per_minute` cap. During backfill, events pass through `check_ingest_rate`
which uses a 60-second Redis counter keyed by `ingest_rate:<contract_id>:<minute_bucket>`. If the limit is exceeded, the
event is skipped for that minute and a `Throttled` exception is raised.

To avoid triggering this limit during a large backfill, either:

- Temporarily increase (or remove) the `max_events_per_minute` on the contract, or
- Use a slower backfill pace by processing smaller ledger ranges with delays between tasks.

### Celery queue

Backfill tasks run in the dedicated `backfill` queue. Keep this queue separate from the live ingestion queue so that
historical repairs do not starve real-time event processing:

```bash
# Start a worker dedicated to backfill
celery -A soroscan worker -Q backfill --loglevel=info --concurrency=2

# Start a worker for live ingestion
celery -A soroscan worker -Q default,celery --loglevel=info
```

### Retry behavior

`backfill_contract_events` retries up to **3 times** with a **60-second delay** between attempts (`max_retries=3`,
`default_retry_delay=60`). The `soft_time_limit` is **300 seconds** per task. If a single range cannot complete within
that window, split it into smaller sub-ranges.

### Duplicate prevention

`_upsert_contract_event` uses an upsert (get-or-create keyed on `contract + ledger + event_index + tx_hash`) so
re-running a backfill over an already-covered range is safe and idempotent.
