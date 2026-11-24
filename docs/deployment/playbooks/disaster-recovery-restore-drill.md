# Playbook: Disaster Recovery and Restore Drill

**Scenario:** Primary database loss, data corruption, or a scheduled restore
drill  
**Severity:** critical (incident) / planned (drill)  
**SLO impact:** API availability, event completeness, and contract registry
integrity

Use this runbook when you need to rebuild SoroScan from backups, or when you are
validating that the backups can actually be restored. The commands assume the
repository root as the working directory unless a step says otherwise.

## Scope and recovery targets

This runbook covers:

- PostgreSQL event and application data.
- The `TrackedContract` registry exported by `backup_contracts`.
- Event batches archived to S3 by the data-retention pipeline.
- The Kubernetes backup CronJob and restore scripts that ship with the repo.

Redis is a cache and Celery broker, not a source of truth. Rebuild it empty and
let the application repopulate caches; replay queued webhook deliveries if
needed.

| Data set | Backup mechanism | Cadence | Default retention | RPO target | RTO target |
|----------|------------------|---------|-------------------|------------|------------|
| PostgreSQL | `pg_dump` CronJob (`k8s/backup-cronjob.yaml`) | Daily at 02:00 UTC | 30 days | 24 hours | 60 minutes |
| PostgreSQL PITR | WAL archiving (`scripts/backup/wal_archive.sh`) | Continuous | Same as S3 lifecycle | 15 minutes | 60 minutes |
| Contract registry | `python manage.py backup_contracts` | Daily (recommended cron) | 30 days | 24 hours | 30 minutes |
| Archived events | `archive_old_events` task to S3 | Daily | S3 lifecycle policy | 24 hours | 60 minutes |
| Kubernetes config | Git + cluster backups | On change | Per platform policy | Last commit | 30 minutes |

Adjust these targets to your own compliance requirements. The important part is
that the restore drill measures the actual RTO/RPO instead of assuming them.

## Backup inventory and locations

### PostgreSQL dumps

- Bucket: `S3_BUCKET` (default `soroscan-backups`).
- Prefix: `S3_PREFIX` (default `pg-backups`).
- Object name: `pg-backups/<timestamp>.dump.gz`, for example
  `pg-backups/20250115T020000Z.dump.gz`.
- Uploaded by `scripts/backup/pg_backup.sh`, scheduled by the
  `soroscan-pg-backup` CronJob.
- Encrypted in transit and at rest according to the bucket policy.
- Retention is controlled by `BACKUP_RETENTION_DAYS` on the backup ConfigMap.

### WAL archive (point-in-time recovery)

- Prefix: `S3_WAL_PREFIX` (default `wal-archive`).
- Uploaded continuously by PostgreSQL through
  `scripts/backup/wal_archive.sh`.
- Used with `scripts/backup/wal_restore.sh` to replay WAL up to a target time.

### Contract registry archives

- Created on demand or by cron with `backup_contracts`:

  ```bash
  cd django-backend
  python manage.py backup_contracts --output /var/backups/soroscan/contracts-$(date -u +%F).json
  ```

- The JSON document contains `version`, `timestamp`, and a `contracts` array.
- Restore with `restore_contracts`; this is the fastest way to rebuild contract
  metadata independently of a database snapshot.
- The recommended cron entry is documented in
  [`docs/CLI_COMMANDS.md`](https://github.com/SoroScan/soroscan/blob/main/docs/CLI_COMMANDS.md).

### Archived events

- Stored at `s3://<bucket>/<s3_prefix>/<contract_slug>/batch_*.json.gz`.
- Produced by the `archive_old_events` Celery task and tracked in
  `ArchivedEventBatch`.
- Restore a batch with `POST /api/events/restore-archive/` after the database is
  back online. See [`DATA_RETENTION.md`](../../operations/DATA_RETENTION.md).

### Verification tooling

`scripts/backup/test_backup.py` verifies that the latest dump downloads,
passes `pg_restore --list`, and optionally restores into a target database.

```bash
python scripts/backup/test_backup.py verify-only
python scripts/backup/test_backup.py full-test --restore-db-url "$STAGING_DATABASE_URL"
```

## Before you start

1. Declare an incident and notify on-call, the data owner, and API consumers.
1. Stop writes to the affected environment. Scale the backend and Celery
   workers to zero so no new events, webhooks, or registry updates arrive
   during the restore.
1. Confirm the target environment. Never restore a production dump over
   staging or vice versa without explicit approval.
1. Record the incident start time, chosen backup key, and target recovery time
   (for PITR) in the incident channel.
1. Confirm access to the S3 bucket, the database host, and the Kubernetes
   namespace. Required tools: `aws`, `psql`, `pg_restore`, `kubectl`, and the
   Python environment for `manage.py`.

```bash
kubectl -n soroscan scale deployment --all --replicas=0
kubectl -n soroscan scale deployment soroscan-beat --replicas=0
```

## Restore procedure: PostgreSQL

### Option A: restore the latest daily dump

This replaces the target database, so use it only for a dedicated recovery
instance or after confirming the old volume will not be reused.

```bash
export DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<database>"
export S3_BUCKET="soroscan-backups"
export S3_PREFIX="pg-backups"
export AWS_DEFAULT_REGION="us-east-1"

# Pick a specific backup or omit the key to use the latest object.
aws s3 ls "s3://${S3_BUCKET}/${S3_PREFIX}/"
bash scripts/backup/pg_restore.sh "${S3_PREFIX}/20250115T020000Z.dump.gz"
```

The script terminates existing connections, drops and recreates the target
database, then runs `pg_restore` with `--jobs=${RESTORE_JOBS}`. Set
`RESTORE_JOBS=1` if the database is small or the host is under load.

### Option B: point-in-time recovery (PITR)

Use PITR when the failure time is known and WAL archiving was healthy.

1. Restore the most recent base backup before the target time using Option A.
1. Configure recovery on the PostgreSQL instance:

   ```conf
   restore_command = '/scripts/wal_restore.sh %f %p'
   recovery_target_time = '2025-01-15 14:30:00 UTC'
   recovery_target_action = 'promote'
   ```

1. Create the recovery signal and start PostgreSQL:

   ```bash
   touch "$PGDATA/recovery.signal"
   pg_ctl start
   ```

1. Watch the PostgreSQL log until replay reaches the target and the instance
   promotes.

If WAL replay fails, stop and restore the base backup again. Do not keep
retrying against a partially recovered data directory.

### Option C: managed database snapshot or replica

For RDS, Cloud SQL, or an equivalent managed service:

1. Restore the automated snapshot or promote a read replica in the provider
   console.
1. Point `DATABASE_URL` at the new endpoint. Update the `soroscan-secrets`
   Secret (or ExternalSecret) rather than committing credentials.
1. Continue with the post-restore verification below.

### Bring the application back

```bash
cd django-backend
python manage.py migrate --plan
python manage.py migrate --noinput
python manage.py migration_status
cd ..

kubectl -n soroscan scale deployment soroscan-beat --replicas=1
kubectl -n soroscan scale deployment --all --replicas=1
kubectl -n soroscan rollout status deployment/soroscan-backend
```

Scale workers gradually if the database connection pool is still warming up.

## Restore procedure: contract registry

Use this when the database restored but contract metadata is missing or stale,
or as an independent recovery path for the registry.

```bash
cd django-backend
python manage.py restore_contracts --input /var/backups/soroscan/contracts-2025-01-15.json --dry-run
```

Review the dry-run counts:

- `Would create` should match the contracts expected in the backup.
- `Would update` should normally be `0` on an empty database.
- Any `Errors` must be fixed before applying.

Then apply the restore:

```bash
python manage.py restore_contracts --input /var/backups/soroscan/contracts-2025-01-15.json --force
```

`--force` updates existing contracts; omit it to skip duplicates. Restoring is
idempotent for unchanged records, so a second run should report only skips.

## Restore procedure: archived events

Only restore archived batches after the database and contract registry are
healthy. Archived events are old by definition, and re-importing them before
the base data is stable makes parity checks harder.

1. Find the batches to restore:

   ```sql
   SELECT id, s3_key, event_count, min_timestamp, max_timestamp, status
   FROM ingest_archivedeventbatch
   ORDER BY archived_at DESC;
   ```

1. Restore each batch through the API (requires an authenticated token):

   ```bash
   curl -X POST "https://<host>/api/events/restore-archive/?batch_id=42" \
     -H "Authorization: Bearer ${TOKEN}"
   ```

1. Repeat until all batches needed for the recovery window report `restored`
   or `already restored`.

## Post-restore verification

Run every check and paste the output into the incident record. A restore is not
complete until these pass.

### 1. Database connectivity and schema

```bash
psql "$DATABASE_URL" -c "SELECT current_database(), version();"
cd django-backend
python manage.py showmigrations --plan | tail -n 20
python manage.py check
```

### 2. Row counts and time ranges

Compare against the values recorded immediately before the incident, or against
the latest pre-incident metrics:

```sql
SELECT COUNT(*) AS contracts FROM ingest_trackedcontract;
SELECT COUNT(*) AS events FROM ingest_contractevent;
SELECT MIN(timestamp) AS oldest, MAX(timestamp) AS newest FROM ingest_contractevent;
SELECT COUNT(*) AS archived_batches FROM ingest_archivedeventbatch;
```

The contract count should match the `backup_contracts` JSON. If the event count
is lower than expected, confirm whether events were intentionally pruned or not
yet restored from archive.

### 3. Ledger integrity

```bash
cd django-backend
python manage.py check_integrity
```

Investigate any reported gaps. A gap may be legitimate if ingestion was paused,
but it must be explained and reconciled before closing the incident.

### 4. Application health and ingestion

```bash
curl -fsS "https://<host>/health/"
curl -fsS "https://<host>/ready/"
curl -fsS "https://<host>/api/events/?page_size=1"

kubectl -n soroscan get pods
kubectl -n soroscan logs deployment/soroscan-backend --tail=100
```

Confirm that the ingestion loop advances `last_indexed_ledger` and that Celery
queue depth returns to normal. Verify a real event arrives end-to-end before
re-enabling webhook subscriptions that were suspended during the incident.

### 5. Backup integrity and parity

```bash
python scripts/backup/test_backup.py verify-only

BACKUP_COUNT=$(python - <<'PY'
import json

with open("/var/backups/soroscan/contracts-2025-01-15.json", encoding="utf-8") as f:
    print(len(json.load(f)["contracts"]))
PY
)
DB_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM ingest_trackedcontract;")

echo "contracts in backup: ${BACKUP_COUNT}"
echo "contracts in database: ${DB_COUNT}"
test "${BACKUP_COUNT}" -eq "${DB_COUNT}" \
  && echo "registry parity: ok" \
  || echo "registry parity: MISMATCH"
```

If a restored row count differs, identify the missing IDs before declaring
success. Do not "fix" parity by deleting rows from the restored database.

## Restore drill checklist

Run a drill at least **quarterly**, and after any change to backup tooling,
retention, database engine version, or the Kubernetes manifests. A lighter
verification-only check should run **monthly**. Never run a destructive restore
drill against production.

- [ ] Notify stakeholders and schedule a maintenance window for staging.
- [ ] Confirm the latest daily dump exists and is less than 24 hours old.
- [ ] Confirm WAL objects exist for the same window (if PITR is in scope).
- [ ] Confirm the latest `backup_contracts` JSON exists and parses.
- [ ] Run `python scripts/backup/test_backup.py full-test` against an isolated
      drill database.
- [ ] Restore the contract registry with `restore_contracts --dry-run`, then
      apply it and check the counts.
- [ ] Restore at least one archived event batch via the API.
- [ ] Run `check_integrity` and compare ledger ranges with the source data.
- [ ] Boot the backend, workers, and beat against the drill database and confirm
      health, readiness, and steady ingestion.
- [ ] Measure actual RTO and RPO; record them in the drill log.
- [ ] Delete the drill database and temporary credentials.
- [ ] File follow-up issues for any failed step or documented workaround.

### Drill log template

| Field | Value |
|-------|-------|
| Drill date | |
| Backup key restored | |
| Backup age at restore | |
| Contract registry file | |
| Archived batches restored | |
| Actual RTO | |
| Actual RPO | |
| Verification result | pass / fail |
| Follow-up issues | |

## Rollback and escalation

- If the restored database is corrupt or parity checks fail, **do not** keep
  patching it in place. Restore the previous known-good backup into a fresh
  database and repeat verification.
- If the backup itself is missing or fails `pg_restore --list`, escalate to the
  storage owner and move to the next older backup.
- If WAL replay cannot reach the target, restore the base dump only and
  document the reduced recovery point.
- If contract data cannot be reconciled, keep the API in read-only maintenance
  mode until the registry is rebuilt.
- After recovery, replay webhook deliveries only after confirming event
  ordering and deduplication to avoid duplicate subscriber notifications.

## Related documentation

- [Backups & Disaster Recovery](../backups.md)
- [Backup tooling README](https://github.com/SoroScan/soroscan/blob/main/scripts/backup/README.md)
- [Data retention and event archival](../../operations/DATA_RETENTION.md)
- [Incident response playbooks](./README.md)
- [Runbooks & incident procedures](../runbooks.md)
