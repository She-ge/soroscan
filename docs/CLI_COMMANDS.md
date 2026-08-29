---
slug: /cli-commands
title: SoroScan CLI Management Commands Reference
description: Reference guide for all custom Django management commands in the SoroScan backend, including syntax, arguments, examples, and automated cron scheduling.
sidebar_label: CLI Management Commands
hide_title: false
---

# SoroScan CLI Management Commands

This guide documents every custom `manage.py` command shipped with the SoroScan Django backend. All commands are run from the `django-backend/` directory:

```bash
python manage.py <command> [options]
```

When running inside Docker Compose:

```bash
docker-compose exec web python manage.py <command> [options]
```

The Django default command line options (`--settings`, `--pythonpath`, `--verbosity`, `--no-color`, `--force-color`, `--skip-checks`, `--traceback`) apply to every command unless overridden.

## Table of Contents

- [Ingestion & Events](#ingestion--events)
- [Data Integrity & Maintenance](#data-integrity--maintenance)
- [Export & Import](#export--import)
- [Contract Management](#contract-management)
- [Webhooks](#webhooks)
- [Migrations](#migrations)
- [Administration & Development](#administration--development)
- [Automated Cron Execution](#automated-cron-execution)

---

## Ingestion & Events

### `ingest_events`

Ingests the latest events for a tracked contract from the Soroban RPC endpoint and persists them to the database.

**Syntax**

```bash
python manage.py ingest_events --contract <CONTRACT_ID> [--dry-run]
```

**Arguments**

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--contract` | Yes | — | Target tracked contract ID (must exist in `TrackedContract`) |
| `--dry-run` | No | `false` | Fetches and validates events but does not persist anything |

**Example**

```bash
python manage.py ingest_events --contract CAAAAABYDB3U7SUXHNQN7QW4UCNT3MUGIFPVVLPVXJ5FMVXI77GAYEICZ
```

**Expected output**

```
Fetching events for CAAAAABYDB3U7SUXHNQN7QW4UCNT3MUGIFPVVLPVXJ5FMVXI77GAYEICZ...
Fetched 42 events.
Successfully processed 42 events.
```

With `--dry-run` the command prints a validation summary of the first 5 events and persists nothing:

```
Fetching events for CAAAAABYDB3U7SUXHNQN7QW4UCNT3MUGIFPVVLPVXJ5FMVXI77GAYEICZ...
Fetched 42 events.
[DRY RUN] Summary of fetched events:
Total events found: 42
Sample events:
 - Event #1: type='swap', ledger=2438120, status=VALID
 - Event #2: type='transfer', ledger=2438121, status=VALID
 ...
[DRY RUN] No data persisted.
```

The command errors out if the contract is not tracked (`TrackedContract with ID ... does not exist.`) or the RPC request fails (`Failed to fetch events: ...`).

---

### `reprocess_events`

Reprocesses historical events (decode, validation, signature verification) for a tracked contract, resumable via checkpoints.

**Syntax**

```bash
python manage.py reprocess_events --contract-id <CONTRACT_ID> \
    [--dry-run] [--batch-size N] [--checkpoint-id N] [--rollback-on-error]
```

**Arguments**

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--contract-id` | Yes | — | Target tracked contract ID |
| `--dry-run` | No | `false` | Run without committing changes |
| `--batch-size` | No | `500` | Batch size for processing; must be `> 0` |
| `--checkpoint-id` | No | `0` | Resume from events with `id > checkpoint-id`; must be `>= 0` |
| `--rollback-on-error` | No | `false` | Roll back the current batch and abort on the first processing error |

**Example**

```bash
python manage.py reprocess_events --contract-id CAAAAABYDB3U7SUXHNQN7QW4UCNT3MUGIFPVVLPVXJ5FMVXI77GAYEICZ \
  --batch-size 250 --checkpoint-id 10000 --dry-run
```

**Expected output**

```
reprocess_events completed: contract=CAAAAABY... processed=1500/1500 updated=180 failed=0 progress=100.0% checkpoint=24999 dry_run=True rolled_back=False
```

Validation errors are reported as `CommandError` for invalid `--batch-size` or `--checkpoint-id` values.

---

### `replay_events`

Replays existing `ContractEvent` records through webhook delivery for debugging and retesting. Live mode dispatches webhooks synchronously via Celery.

**Syntax**

```bash
python manage.py replay_events --contract <CONTRACT_ID> \
    [--event-type <TYPE>] [--from-ledger N] [--to-ledger N] \
    [--from-date <ISO>] [--to-date <ISO>] [--limit N] [--dry-run] \
    [--webhook-id N] [--output-json <PATH>]
```

**Arguments**

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--contract` | Yes | — | Contract ID to replay events for (must be tracked) |
| `--event-type` | No | All types | Filter by event type |
| `--from-ledger` | No | — | Include events from this ledger (inclusive) |
| `--to-ledger` | No | — | Include events up to this ledger (inclusive) |
| `--from-date` | No | — | Include events from this date (ISO format) |
| `--to-date` | No | — | Include events up to this date (ISO format) |
| `--limit` | No | `100` | Max events to replay; `0` means all matching events |
| `--dry-run` | No | `false` | Preview the replay plan without dispatching webhooks |
| `--webhook-id` | No | All active webhooks | Replay only to a specific webhook subscription ID |
| `--output-json` | No | — | Write the delivery report to a JSON file instead of stdout |

**Example**

```bash
python manage.py replay_events --contract CAAAAABYDB3U7SUXHNQN7QW4UCNT3MUGIFPVVLPVXJ5FMVXI77GAYEICZ --event-type swap --limit 10 --dry-run
```

**Expected output** (dry-run)

```
Found 805 matching events, replaying 10...
  [DRY-RUN] Would dispatch event 42 (swap) to webhook 1 -> https://hooks.acme.io
  [DRY-RUN] Would dispatch event 43 (swap) to webhook 1 -> https://hooks.acme.io

=== Replay Summary ===
Mode:             DRY RUN
Events processed: 10
Webhook dispatches: 10
Successes:        0
Failures:         0
Skipped:          0
```

In live mode the summary reports `Successes`/`Failures` and prints the last 10 delivery entries, or writes the full report to the file given by `--output-json`. The command fails if the contract is not found, `--webhook-id` does not exist or belongs to a different contract, or a `--from-date`/`--to-date` value is not a valid ISO datetime.

---

## Data Integrity & Maintenance

### `check_integrity`

Scans the `ContractEvent` table for gaps in ledger sequence numbers to detect events missed during indexing.

**Syntax**

```bash
python manage.py check_integrity [--contract <CONTRACT_ID>] [--event-type <TYPE>] [--verbose]
```

**Arguments**

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--contract` | No | All contracts | Numeric contract ID to check (PK); checks all contracts if omitted |
| `--event-type` | No | All types | Filter events by event type before checking gaps |
| `--verbose` | No | `false` | Show detailed information about all found gaps |

**Example**

```bash
python manage.py check_integrity --contract 12 --verbose
```

**Expected output**

```
Ledger Integrity Check Report
============================================================
Contract ID: 12
Ledger Range: 2,438,100 to 2,438,900
Total Ledgers Spanned: 801
Total Events: 801
Unique Ledgers with Events: 801

✓ No gaps found - ledger sequence is continuous!

```

When gaps exist, `--verbose` prints one error line per gap; otherwise gap ranges are printed together followed by a coverage percentage:

```
✗ Found 2 gap(s) in ledger sequence:
  Gap: Ledger 2,438,150 - 2,438,160 (11 missing)
  Gap: Ledger 2,438,500 (1 missing)

Total Missing Ledgers: 12
Coverage: 98.50%
```

If the table is empty the command prints `No events found in ContractEvent table`.

---

### `prune_events`

Deletes `ContractEvent` rows older than the configured retention period (data-retention housekeeping).

**Syntax**

```bash
python manage.py prune_events [--retention-days N] [--dry-run]
```

**Arguments**

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--retention-days` | No | `EVENT_RETENTION_DAYS` setting (default `30`) | Number of days of events to retain |
| `--dry-run` | No | `false` | Show what would be deleted without deleting |

**Example**

```bash
python manage.py prune_events --retention-days 7 --dry-run
```

**Expected output**

```
DRY RUN: Would delete 152,304 events older than 7 days (before 2026-08-20 12:00:00)
```

Without dry-run the command reports either the deleted count or `No events found older than retention period`.

---

## Export & Import

### `export_events`

Streams `ContractEvent` rows to Parquet, CSV, JSON, or Avro without loading all events into memory.

**Syntax**

```bash
python manage.py export_events [--contract <CONTRACT_ID> | --contract-id <CONTRACT_ID>] \
    --format <parquet|csv|json|avro> --output <PATH> \
    [--start-ledger N] [--end-ledger N] [--start-date <ISO>] [--end-date <ISO>] [--batch-size N]
```

**Arguments**

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--contract` / `--contract-id` | Yes (one of) | — | Contract ID/address to export |
| `--format` | No | `json` | Output format: `parquet`, `csv`, `json`, or `avro` |
| `--output` | Yes | — | Output file path; use `-` for stdout (CSV/JSON only) |
| `--start-ledger` | No | — | Export events from this ledger (inclusive) |
| `--end-ledger` | No | — | Export events up to this ledger (inclusive) |
| `--start-date` | No | — | Export events from this timestamp/date (inclusive; ISO-8601) |
| `--end-date` | No | — | Export events up to this timestamp/date (inclusive; ISO-8601) |
| `--batch-size` | No | `500` | Internal streaming batch size |

**Examples**

```bash
python manage.py export_events --contract CAAAAABYDB3U7SUXHNQN7QW4UCNT3MUGIFPVVLPVXJ5FMVXI77GAYEICZ --format csv --output events.csv
python manage.py export_events --contract-id CAAAAABYDB3U7SUXHNQN7QW4UCNT3MUGIFPVVLPVXJ5FMVXI77GAYEICZ --format json --start-ledger 1000000 --end-ledger 2000000 --output events.json
python manage.py export_events --contract-id CAAAAABYDB3U7SUXHNQN7QW4UCNT3MUGIFPVVLPVXJ5FMVXI77GAYEICZ --format csv --output - | head
```

**Expected output**

```
Exporting 804 events from contract CAAAAABY... as csv -> events.csv
Exported 804 events to events.csv
```

Notes and validation errors:

- Either `--contract` or `--contract-id` is required; both map to the same option.
- Parquet and Avro cannot be written to stdout (`-`); a file path is required.
- `--start-ledger` must be `<= --end-ledger` and `--start-date` must be `<= --end-date`, or a `CommandError` is raised.
- Dates may be ISO-8601 dates (`2026-01-01`) or datetimes (`2026-01-01T00:00:00`).

---

### `import_events`

Imports `ContractEvent` rows from Parquet, CSV, JSON, or Avro files with per-row schema validation and idempotent upserts (re-importing the same file is safe).

**Syntax**

```bash
python manage.py import_events --file <PATH> [--format <parquet|csv|json|avro>] [--dry-run] [--fail-fast]
```

**Arguments**

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--file` | Yes | — | Input file path |
| `--format` | No | Auto-detected from extension | Input format: `parquet`, `csv`, `json`, or `avro` |
| `--dry-run` | No | `false` | Validate rows without writing to the database |
| `--fail-fast` | No | `false` | Abort on the first validation error |

**Example**

```bash
python manage.py import_events --file events.parquet --format parquet --dry-run
```

**Expected output**

```
[DRY RUN] Importing PARQUET from events.parquet
[DRY RUN] imported=804 skipped_duplicates=0 errors=0
```

If format cannot be detected from the file extension and `--format` is omitted, the command fails with `Cannot detect format from file extension. Use --format to specify it.`

---

### `backup_contracts`

Exports all `TrackedContract` records to a versioned JSON backup file (pairs with `restore_contracts`).

**Syntax**

```bash
python manage.py backup_contracts --output <PATH>
```

**Arguments**

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--output` | Yes | — | Output file path; use `-` for stdout |

**Example**

```bash
python manage.py backup_contracts --output /backups/contracts-2026-08-27.json
```

**Expected output**

```
Exporting 5 contracts to /backups/contracts-2026-08-27.json
Exported 5 contracts to /backups/contracts-2026-08-27.json
```

The backup file writes a JSON object with `version: 1`, a UTC `timestamp`, and a `contracts` array containing each contract's `contract_id`, `alias`, `settings`, `abi`, and `metadata`.

---

### `restore_contracts`

Imports `TrackedContract` records from a JSON backup file produced by `backup_contracts`.

**Syntax**

```bash
python manage.py restore_contracts --input <PATH> [--dry-run] [--force]
```

**Arguments**

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--input` | Yes | — | Input file path; use `-` for stdin |
| `--dry-run` | No | `false` | Show what would be imported without making changes |
| `--force` | No | `false` | Update existing contracts instead of skipping them |

**Example**

```bash
python manage.py restore_contracts --input /backups/contracts-2026-08-27.json --dry-run
```

**Expected output**

```
Processing 5 contracts from /backups/contracts-2026-08-27.json

=== DRY RUN COMPLETE ===
Would create: 3
Would update: 0
Would skip:   2
```

Notes:

- The input file must be a JSON object with `version: 1`; otherwise the command fails with `Unsupported backup version: ...`.
- Each contract requires a `contract_id` and an `alias` field.
- Without `--force`, existing contracts are skipped; with `--force` they are updated in place.

---

### `export_contracts`

Exports all tracked contracts (address and name only) to a JSON file.

**Syntax**

```bash
python manage.py export_contracts --output <PATH> [--pretty]
```

**Arguments**

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--output` | Yes | — | Output file path; use `-` for stdout |
| `--pretty` | No | `false` | Pretty-print the JSON output |

**Example**

```bash
python manage.py export_contracts --output contracts.json --pretty
```

**Expected output**

```
Exported 5 contract(s) to contracts.json
```

The output JSON is `{"contracts": [{"contract_id": "...", "name": "..."}]}` ordered by `contract_id`.

---

### `import_contracts`

Imports tracked contracts from a JSON address/name mapping file.

**Syntax**

```bash
python manage.py import_contracts --file <PATH> [--owner <USERNAME|EMAIL|ID>]
```

**Arguments**

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--file` / `--input` | Yes | — | Input JSON file path |
| `--owner` | No | `soroscan-import` service user | Username, email, or id of the owner for newly imported contracts |

**Example**

```bash
python manage.py import_contracts --file contracts.json --owner admin
```

**Expected output**

```
Imported contracts: created=3 skipped_existing=2
```

Accepted input formats: a JSON object with a `contracts` list, a flat `{address: name}` mapping object, or a list of `{contract_id, name}` objects (aliased fields `address` and `name` supported).

---

### `bulk_import_metadata`

Bulk-imports contract metadata (name, description, tags, links) from CSV or JSON files.

**Syntax**

```bash
python manage.py bulk_import_metadata --input <PATH> \
    [--format <csv|json>] [--dry-run] [--on-error <rollback|skip>] \
    [--encoding <ENC>] [--report <PATH>]
```

**Arguments**

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--input` | Yes | — | Input file path; use `-` for stdin |
| `--format` | No | Auto-detected from extension | Input format: `csv` or `json` |
| `--dry-run` | No | `false` | Validate all rows without modifying the database |
| `--on-error` | No | `rollback` | Behavior on validation error: `rollback` the entire batch or `skip` the row |
| `--encoding` | No | `utf-8` | File encoding |
| `--report` | No | — | Write the import report to this JSON file |

**Example**

```bash
python manage.py bulk_import_metadata --input contracts.csv --format csv --dry-run
```

**Expected output**

```
=== Import Report ===
Mode:                         dry-run
Total rows:                   15
Created:                      12
Updated:                      3
Skipped (no contract):        0
Skipped (on error):           0
Errors:                       0
```

Supported fields: `contract_id` (required), `name`, `description`, `tags` (comma-separated in CSV, JSON array in JSON), `documentation_url`, `github_repo`, `team_email`. CSV input must include a `contract_id` column. When reading from stdin (`-`), `--format` is required.

---

## Contract Management

### `seed_database`

Populates the development database with realistic test data from fixture files or built-in scenarios.

**Syntax**

```bash
python manage.py seed_database [--fixture <PATH>] [--scenario <default|minimal|webhook>] [--clear]
```

**Arguments**

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--fixture` | No | `fixtures/development.json` | Path to a JSON fixture file |
| `--scenario` | No | `default` | Predefined scenario: `default` (full dataset), `minimal` (one user, one org, three contracts, no events), `webhook` (contracts with webhook subscriptions and delivery logs) |
| `--clear` | No | `false` | Remove all seeded data before seeding |

**Example**

```bash
python manage.py seed_database --scenario minimal --clear
```

**Expected output**

```
Clearing seeded data...
Cleared seeded data.
Seeding database...
Database seeded successfully.
```

`--clear` removes users with `is_staff=False` whose email ends in `@example.com` along with all data owned by them.

---

### `list_webhooks`

Lists webhook subscriptions with ID, target URL, status, and matched event count.

**Syntax**

```bash
python manage.py list_webhooks [--active-only]
```

**Arguments**

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--active-only` | No | `false` | Only show active (non-suspended) webhooks |

**Example**

```bash
python manage.py list_webhooks --active-only
```

**Expected output**

```
ID  URL                      Status  Event Count
1   https://hooks.acme.io     active  804
2   https://hooks2.acme.io    active  0
```

---

## Migrations

### `migrate`

Thin wrapper around Django's built-in `migrate` that logs the start, completion, and duration of each migration to the `soroscan.migrate` logger. All Django `migrate` options apply.

**Syntax**

```bash
python manage.py migrate [app_label] [migration_name] [django migrate options...]
```

**Example**

```bash
python manage.py migrate
```

**Expected output** (log lines from the custom wrapper)

```
Starting migration ingest.0012_add_contract_event ... [timestamp=2026-08-27T12:00:00+00:00]
Finished migration ingest.0012_add_contract_event. [timestamp=2026-08-27T12:00:01+00:00, duration=0.82s]
```

---

### `migration_status`

Outputs a clear list of applied and pending migrations with native multi-database support.

**Syntax**

```bash
python manage.py migration_status [--database <ALIAS>]
```

**Arguments**

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--database` | No | `default` | Database alias to check migration status for |

**Example**

```bash
python manage.py migration_status --database default
```

**Expected output**

```
Checking migration status for database: default

App: auth
  [X] 0001_initial (Applied)
  ...
App: ingest
  [X] 0001_initial (Applied)
  [ ] 0012_add_contract_event (Pending)

Migration status check complete.
```

Applied-but-not-on-disk migrations are flagged as `Ghost Migrations (applied but not on disk)`.

---

### `validate_migrations`

Validates that the full migration graph can be applied cleanly against a fresh temporary database.

**Syntax**

```bash
python manage.py validate_migrations [--database <ALIAS>] [--keepdb]
```

**Arguments**

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--database` | No | `default` | Database alias to validate against |
| `--keepdb` | No | `false` | Keep the temporary database after validation for debugging |

**Example**

```bash
python manage.py validate_migrations
```

**Expected output**

```
Creating temporary database for migration validation...
Temporary database created: test_<dbname>
Migration plan: 34 migration(s) to apply.
Applying all migrations to the temporary database...
Migration validation succeeded: all migrations applied cleanly.
Destroying temporary database...
```

`--verbosity 2` additionally lists each migration in the plan. The command fails with a `CommandError` if migration conflicts, an inconsistent history, or an application error are detected.

---

## Administration & Development

### `reset_admin_password`

Resets a user's password, prompting interactively unless `--password` is supplied.

**Syntax**

```bash
python manage.py reset_admin_password [--username <USERNAME>] [--password <PASSWORD>]
```

**Arguments**

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--username` | No | `admin` | Username to reset the password for |
| `--password` | No | Prompted interactively | New password; required when running non-interactively |

**Example**

```bash
python manage.py reset_admin_password --username admin --password 'NewPass123!'
```

**Expected output**

```
✓ Password successfully updated for user 'admin'
```

If the user does not exist, the command prints the error and lists the available usernames. When run without a terminal and without `--password`, it fails with `Password must be provided via --password when running non-interactively`.

---

### `generate_api_docs`

Generates API documentation from view docstrings, URL patterns, and DRF metadata. Output is Markdown by default or structured JSON.

**Syntax**

```bash
python manage.py generate_api_docs [--output <PATH>] [--format <markdown|json>] \
    [--include-examples | --no-examples] [--stdout]
```

**Arguments**

| Option | Required | Default | Description |
|--------|----------|---------|-------------|
| `--output` | No | `docs/api_reference.md` | Path to write the generated docs |
| `--format` | No | `markdown` | Output format: `markdown` or `json` |
| `--include-examples` | No | `true` | Include canned curl/JSON examples in Markdown output |
| `--no-examples` | No | — | Suppress the examples section |
| `--stdout` | No | `false` | Print to stdout instead of writing a file |

**Example**

```bash
python manage.py generate_api_docs --output docs/api_reference.md
```

**Expected output**

```
🔍  Collecting API endpoints …
    Found 24 endpoint(s).
📝  Rendering documentation …
✅  API docs written to docs/api_reference.md (24 endpoints)
```

---

## Automated Cron Execution

The ingest and maintenance commands are intended to be scheduled. Keepalive-style cron examples below assume `django-backend/` is the working directory and `WEB` is the container name when running under `docker-compose`.

### Standard cron (`/etc/cron.d/soroscan`)

```cron
# Prune events older than the retention period — daily at 03:30 AM UTC
30 3 * * * root cd /opt/soroscan/django-backend && python manage.py prune_events --retention-days 30 >> /var/log/soroscan/prune_events.log 2>&1

# LEDGER GAP AUDIT — weekly on Sunday 04:00 AM UTC
0 4 * * 0 root cd /opt/soroscan/django-backend && python manage.py check_integrity >> /var/log/soroscan/check_integrity.log 2>&1

# CONTRACT DATA BACKUPS — daily at 02:00 AM UTC
0 2 * * * root cd /opt/soroscan/django-backend && python manage.py backup_contracts --output /var/backups/soroscan/contracts-$(date +\%F).json >> /var/log/soroscan/backup_contracts.log 2>&1

# API DOCUMENTATION REGENERATION — weekly on Monday 01:00 AM UTC
0 1 * * 1 root cd /opt/soroscan/django-backend && python manage.py generate_api_docs >> /var/log/soroscan/generate_api_docs.log 2>&1
```

Note: in a cron file the `%` sign must be escaped as `\%` (as shown above for the backup filename date stamp).

### Systemd timer equivalent (`soroscan-prune.service`, `soroscan-prune.timer`)

```systemd
# /etc/systemd/system/soroscan-prune.service
[Unit]
Description=Prune expired SoroScan contract events

[Service]
Type=oneshot
WorkingDirectory=/opt/soroscan/django-backend
ExecStart=/usr/bin/python manage.py prune_events --retention-days 30
StandardOutput=append:/var/log/soroscan/prune_events.log
StandardError=append:/var/log/soroscan/prune_events.log
```

```systemd
# /etc/systemd/system/soroscan-prune.timer
[Unit]
Description=Run SoroScan event pruning daily

[Timer]
OnCalendar=*-*-* 03:30:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable with `systemctl enable --now soroscan-prune.timer`.

### Kubernetes CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: soroscan-prune-events
  namespace: soroscan
spec:
  schedule: "30 3 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: prune
              image: soroscan/backend:latest
              command: ["python", "manage.py", "prune_events", "--retention-days", "30"]
```

### Docker Compose one-off

```bash
docker-compose exec web python manage.py prune_events --dry-run
```

### Idempotency and safe scheduling

- `export_events`, `backup_contracts`, `export_contracts`, `generate_api_docs`, `check_integrity`, and `migration_status` are read-only and safe to run on any schedule.
- `ingest_events`, `import_events`, `import_contracts`, `bulk_import_metadata`, and `restore_contracts` are idempotent upserts; overlapping runs will not duplicate rows.
- `prune_events` deletes data — always review it with `--dry-run` in production before scheduling.
- `reprocess_events` uses `--checkpoint-id` for resumability, so an interrupted run can be resumed rather than restarted.
- For event ingestion at scale, prefer Celery beat scheduled tasks (see `CELERY_BEAT_SCHEDULE` in `soroscan/settings.py`) over cron; cron is recommended for exports, backups, pruning, and integrity audits.