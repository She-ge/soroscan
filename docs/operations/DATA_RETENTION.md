# Data Retention and Event Archival Policy

This document explains how SoroScan retains, archives, and restores contract events.
It covers the global default policy, per-contract overrides, the automated S3 batch
archival process, and how to restore archived events back into PostgreSQL.

---

## Table of Contents

1. [Overview](#overview)
2. [Retention Policy Model](#retention-policy-model)
3. [Configuring Retention](#configuring-retention)
   - [Global Default (Environment Variable)](#global-default-environment-variable)
   - [Global Default (Database Policy)](#global-default-database-policy)
   - [Per-Contract Override](#per-contract-override)
4. [Automated S3 Batch Archival](#automated-s3-batch-archival)
   - [How It Works](#how-it-works)
   - [S3 Object Layout](#s3-object-layout)
   - [Batch Size and Limits](#batch-size-and-limits)
   - [Required AWS Configuration](#required-aws-configuration)
5. [Pruning Without Archival](#pruning-without-archival)
6. [Restore Endpoint](#restore-endpoint)
   - [Authentication](#authentication)
   - [Request](#request)
   - [Response](#response)
   - [Idempotency](#idempotency)
   - [Audit Log](#audit-log)
7. [Archival Audit Log](#archival-audit-log)
8. [Monitoring](#monitoring)
9. [Frequently Asked Questions](#frequently-asked-questions)

---

## Overview

SoroScan stores every indexed `ContractEvent` in PostgreSQL. For long-running
deployments, this table grows continuously. The retention system:

1. Identifies events older than a configured threshold.
2. Serialises them to gzip-compressed JSON and uploads to S3 (cold storage).
3. Deletes the source rows from PostgreSQL.
4. Records every action in an `ArchivalAuditLog`.

Events can be restored from S3 at any time via the REST API.

---

## Retention Policy Model

Retention is controlled by `DataRetentionPolicy` records in the database.

| Field            | Type     | Default                    | Description |
|------------------|----------|----------------------------|-------------|
| `contract`       | FK / null | `null`                    | `null` = global default; set to a `TrackedContract` for a per-contract override |
| `retention_days` | integer  | `365`                      | Events older than this many days are eligible for archival |
| `archive_enabled`| boolean  | `True`                     | When `False`, events are deleted without uploading to S3 |
| `s3_bucket`      | string   | —                          | Target S3 bucket name |
| `s3_prefix`      | string   | `soroscan/archives/`       | Key prefix inside the bucket |

---

## Configuring Retention

### Global Default (Environment Variable)

For simple deployments, set `EVENT_RETENTION_DAYS` in the environment. The
`prune_events` management command reads this value directly.

```bash
# .env or docker-compose environment
EVENT_RETENTION_DAYS=90   # default: 30
```

Run the prune command manually:

```bash
# Dry run — shows count without deleting
python manage.py prune_events --dry-run

# Delete events older than 90 days
python manage.py prune_events --retention-days 90
```

> **Note:** `prune_events` deletes rows without archiving to S3. Use it only
> when you do not need cold-storage recovery. For archival, use the
> `DataRetentionPolicy` model described below.

### Global Default (Database Policy)

Create a `DataRetentionPolicy` with `contract=null` via the Django admin or a
data migration:

```python
from soroscan.ingest.models import DataRetentionPolicy

DataRetentionPolicy.objects.create(
    contract=None,            # applies to all contracts without their own policy
    retention_days=365,
    archive_enabled=True,
    s3_bucket="my-soroscan-archives",
    s3_prefix="soroscan/archives/",
)
```

Via the Django admin panel: **Ingest → Data Retention Policies → Add**.

### Per-Contract Override

Create a `DataRetentionPolicy` linked to a specific `TrackedContract`:

```python
from soroscan.ingest.models import DataRetentionPolicy, TrackedContract

contract = TrackedContract.objects.get(contract_id="CABC...XYZ")

DataRetentionPolicy.objects.create(
    contract=contract,
    retention_days=730,       # keep this contract's events for 2 years
    archive_enabled=True,
    s3_bucket="my-soroscan-archives",
    s3_prefix="soroscan/archives/",
)
```

**Policy resolution order:**

1. If a `DataRetentionPolicy` exists for the specific contract → use it.
2. Otherwise fall back to the global policy (`contract=null`).
3. If no database policy exists at all, `prune_events` uses `EVENT_RETENTION_DAYS`.

---

## Automated S3 Batch Archival

### How It Works

The `archive_old_events` Celery task runs **daily** via Celery Beat (schedule:
`86400` seconds). For each `DataRetentionPolicy` where `archive_enabled=True`:

1. Compute the cutoff: `now() - retention_days`.
2. Select up to **10 000 events** ordered by `timestamp` that predate the cutoff
   (scoped to the policy's contract, or all contracts for the global policy).
3. Serialise the rows to JSON and compress with gzip.
4. Upload the compressed object to S3.
5. Create an `ArchivedEventBatch` record pointing to the S3 key.
6. Delete the archived rows from PostgreSQL.
7. Repeat steps 2–6 until no events remain before the cutoff.

Each iteration is processed in a tight loop so that a single task run drains the
full backlog, even if many batches are required.

### S3 Object Layout

```
s3://<bucket>/<prefix>/<contract_slug>/batch_<policy_id>_<batch_index>_<unix_ts>.json.gz
```

Example:

```
s3://my-soroscan-archives/soroscan/archives/CABC123DEF45/batch_1_0_1700000000.json.gz
s3://my-soroscan-archives/soroscan/archives/global/batch_2_1_1700086400.json.gz
```

- `contract_slug` — first 12 characters of the contract ID, or `global` for the
  global policy.
- The object is uploaded with `ContentEncoding: gzip` and `ContentType: application/json`.

**Batch JSON schema** (one array of event objects):

```json
[
  {
    "id": 12345,
    "contract__contract_id": "CABC...XYZ",
    "event_type": "transfer",
    "payload": { "amount": 100 },
    "payload_hash": "abc123...",
    "ledger": 50000,
    "event_index": 0,
    "timestamp": "2024-01-15T12:00:00+00:00",
    "tx_hash": "def456..."
  }
]
```

### Batch Size and Limits

| Parameter | Value |
|-----------|-------|
| Events per batch | 10 000 |
| Maximum compressed object size | 100 MB |
| Objects larger than 100 MB | Logged as a warning; uploaded as-is (splitting not yet supported) |

### Required AWS Configuration

Set the following environment variables:

```bash
AWS_ACCESS_KEY_ID=<your-key-id>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_S3_REGION_NAME=us-east-1          # default: us-east-1
AWS_S3_ENDPOINT_URL=                  # leave empty for AWS; set for MinIO/Localstack
```

The IAM policy attached to the key must allow:

```json
{
  "Effect": "Allow",
  "Action": ["s3:PutObject", "s3:GetObject"],
  "Resource": "arn:aws:s3:::my-soroscan-archives/*"
}
```

---

## Pruning Without Archival

Set `archive_enabled=False` on a `DataRetentionPolicy` to delete events without
uploading to S3. This is appropriate for high-churn test contracts or environments
where cold storage is not required.

```python
policy = DataRetentionPolicy.objects.get(contract=contract)
policy.archive_enabled = False
policy.save()
```

You can also run `prune_events` directly for one-off cleanup:

```bash
python manage.py prune_events --retention-days 7 --dry-run
python manage.py prune_events --retention-days 7
```

---

## Restore Endpoint

Retrieves an archived batch from S3 and re-imports the events into PostgreSQL
using `get_or_create` (safe to call multiple times).

### Authentication

Requires a valid session or JWT bearer token. The endpoint is rate-limited to
prevent abuse.

```
Authorization: Bearer <access_token>
```

### Request

```
POST /api/events/restore-archive/
Content-Type: application/json
```

Body:

```json
{
  "batch_id": 42
}
```

Alternatively, pass `batch_id` as a query parameter:

```
POST /api/events/restore-archive/?batch_id=42
```

`batch_id` is the integer primary key of an `ArchivedEventBatch` record. Find
batch IDs via the Django admin (**Ingest → Archived Event Batches**) or by
querying the database:

```sql
SELECT id, s3_key, event_count, min_timestamp, max_timestamp, status
FROM ingest_archivedeventbatch
ORDER BY archived_at DESC;
```

### Response

**200 OK — successful restore:**

```json
{
  "status": "restored",
  "restored_count": 9987,
  "batch_id": 42
}
```

**200 OK — batch was already restored (idempotent):**

```json
{
  "detail": "Batch already restored.",
  "batch_id": 42
}
```

**400 Bad Request — missing parameter:**

```json
{
  "detail": "batch_id is required."
}
```

**404 Not Found — batch does not exist:**

```json
{
  "detail": "Not found."
}
```

**429 Too Many Requests — rate limit exceeded.**

**500 Internal Server Error — S3 retrieval failed:**

```json
{
  "detail": "S3 retrieval failed: <error message>"
}
```

### Idempotency

The restore uses `get_or_create` on `(contract, ledger, event_index)`. Calling
the endpoint on an already-restored batch returns HTTP 200 immediately without
re-downloading from S3. Rows that already exist in PostgreSQL are skipped
(counted as already present, not re-inserted).

### Audit Log

Every restore creates an `ArchivalAuditLog` entry:

| Field | Value |
|-------|-------|
| `action` | `restore` |
| `batch` | FK to the restored `ArchivedEventBatch` |
| `policy` | FK to the owning `DataRetentionPolicy` |
| `event_count` | Number of rows actually re-inserted |
| `detail` | `"Restored by user <user_id>"` |
| `performed_by` | FK to the authenticated `User` |

---

## Archival Audit Log

Every archive and restore action is recorded in `ArchivalAuditLog`. Rows are
created automatically — no manual intervention is needed.

Query recent activity:

```sql
SELECT a.action, a.event_count, a.detail, a.created_at,
       b.s3_key, u.username
FROM ingest_archivalauditlog a
LEFT JOIN ingest_archivedeventbatch b ON a.batch_id = b.id
LEFT JOIN auth_user u ON a.performed_by_id = u.id
ORDER BY a.created_at DESC
LIMIT 50;
```

---

## Monitoring

The `archive_old_events` task emits the following Prometheus counter:

| Metric | Labels | Description |
|--------|--------|-------------|
| `archive_events_total` | `outcome=archived` | Events successfully written to S3 |
| `archive_events_total` | `outcome=deleted` | Rows deleted from PostgreSQL |
| `archive_events_total` | `outcome=error` | Batches that failed with an exception |

Task duration is recorded in `task_duration_seconds{task_name="archive_old_events"}`.

Check task health in Celery:

```bash
celery -A soroscan inspect active
celery -A soroscan inspect scheduled
```

---

## Frequently Asked Questions

**Q: Can I restore only part of a batch?**  
A: No. Restore operates at the batch level. To restore a subset, restore the
full batch and then delete the unwanted rows manually.

**Q: What happens if the S3 upload fails mid-archival?**  
A: The task logs an error and records a failure entry in `ArchivalAuditLog`.
PostgreSQL rows are **not** deleted when the upload fails. The next daily run
will retry the same events.

**Q: How do I verify that all events for a contract have been archived?**  
A: Cross-reference `ArchivedEventBatch.event_count` totals against
`ContractEvent.objects.filter(contract=contract).count()` before the archival
cutoff. The `DataQualityMetrics` reconciliation endpoint can also be used once
Backend #100 is deployed.

**Q: Does archival affect real-time indexing?**  
A: No. The `archive_old_events` task only touches events older than the
retention cutoff and runs once per day. Live ingestion is unaffected.

**Q: Can I use MinIO or another S3-compatible store?**  
A: Yes. Set `AWS_S3_ENDPOINT_URL` to your MinIO endpoint (e.g.
`http://localhost:9000`). Credentials and bucket configuration remain the same.

**Q: How is the `EVENT_RETENTION_DAYS` environment variable related to `DataRetentionPolicy`?**  
A: `EVENT_RETENTION_DAYS` is read only by the `prune_events` management command
(manual pruning, no S3 upload). The `archive_old_events` Celery task reads
`retention_days` exclusively from `DataRetentionPolicy` database records.
Both mechanisms are independent.
