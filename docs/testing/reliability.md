# Reliability testing

This is the index for SoroScan's isolated reliability suites. Destructive
tests must never target production.

| Suite | Location | CI workflow | Default safety |
|-------|----------|-------------|----------------|
| Failover | `tests/failover/`, `django-backend/soroscan/ingest/tests/test_failover.py` | `failover-tests.yml` | `SOROSCAN_FAILOVER_RUN=1` plus non-production URL |
| Migrations | `django-backend/soroscan/ingest/tests/test_migration_rollbacks.py` | `django-tests.yml` job `migration-rollbacks` | Isolated Django test database only |
| Load | `load-tests/k6/` | `load-tests.yml` | Blocks `api.soroscan.io` unless `ALLOW_PRODUCTION_LOAD=true` |
| Chaos | `tests/chaos/` | `chaos-tests.yml` | `SOROSCAN_CHAOS_RUN=1`, non-production env, namespace allow-list |

Shared helpers live in `testing/reliability/` (safety guards, bounded waits,
health probes, Docker/Compose injectors).

See:

- [Failover](failover.md)
- [Migrations](migrations.md)
- [Load testing](../load-testing.md) and `load-tests/README.md`
- [Chaos engineering](chaos-engineering.md)
