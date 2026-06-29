---
slug: /deployment/backups

title: Backups & Disaster Recovery
description: Backup strategies for PostgreSQL and Redis, retention policies, and restore procedures.
sidebar_label: Backups & DR
hide_title: false
---

This page describes recommended backup and disaster recovery procedures for SoroScan.

## RTO / RPO targets
- Example target: RTO = 1 hour, RPO = 15 minutes (adjust to your needs).

## PostgreSQL backups
- Use managed snapshots (RDS automated backups) OR
- Use `pg_basebackup` / `pg_dump` + WAL shipping for self-hosted DBs.

### Automated backup example (CronJob)
- Run daily `pg_dump` or take automatic RDS snapshots.
- Retain last 30 daily snapshots and weekly monthly snapshots.

### Restore procedure (high level)
1. Provision replacement DB instance.
2. Restore latest snapshot or replay WALs to target time.
3. Update application `DATABASE_URL` secret to point to restored DB.
4. Run migrations if needed (carefully): `python manage.py migrate --plan` then `migrate`.

## Redis persistence
- For Redis (ElastiCache) use replication + snapshots.
- For self-hosted Redis, enable RDB/AOF persistence and periodic snapshots.

## Backup storage
- Store backups in a durable object store (S3 or S3-compatible) with lifecycle rules.
- Encrypt backups at rest and in transit.

## Testing restores
- Regularly (monthly) test restores to staging environment and validate data integrity.
- Keep documented runbooks for restores with exact commands and required secrets.

## Webhook delivery rebuild
- If you must reprocess events after restore, consider replaying event records using the internal `ingest.record` endpoint or task to rebuild derived state.

## Disaster playbook summary
- If primary DB fails, promote read replica or restore snapshot to a new instance.
- If data corruption suspected, isolate and restore to a point-in-time prior to corruption.
- Validate event integrity and reconcile with on-chain data if needed.
