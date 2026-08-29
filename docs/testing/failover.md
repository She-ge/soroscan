# Failover testing

**Destructive.** Live probes inject dependency failures. Never point
`BASE_URL` at production.

SoroScan verifies recovery from database, Redis, Soroban RPC, and Celery
worker failures at the same surfaces `soroscan.health` uses.

## What is tested

| Failure | Django simulation | Live injection |
|---------|-------------------|----------------|
| PostgreSQL unavailable | patch `connection.cursor` | `docker pause` of a postgres container |
| Redis unavailable | patch `cache.set` | `docker pause` of a redis container |
| RPC timeout | `requests.Timeout` on `getHealth` | not injected against public RPC; recovery probe only |
| Multiple workers down | empty/timeout Celery inspect | `docker compose stop worker-default` when Compose is running |

Assertions follow existing application behavior:

- Readiness returns 503 and `degraded` when DB/Redis/RPC fail; liveness stays 200.
- Worker health returns 503 when no worker pings; a single remaining worker is still `healthy`.
- Re-ingesting the same `(contract, ledger, event_index)` raises `IntegrityError` (the uniqueness guarantee used after worker recovery). The suite does **not** claim at-least-once Celery redelivery beyond that constraint.

## Run locally

```bash
# Shared safety helpers
PYTHONPATH=. python -m pytest -q testing/tests

# Scenario validation (dry-run)
cd tests/failover
python -m pip install pytest PyYAML
PYTHONPATH=../.. python -m pytest -q
PYTHONPATH=../.. python run_failover.py

# Django simulations (fast, no Docker)
cd django-backend
python -m pytest soroscan/ingest/tests/test_failover.py -v
```

## Live recovery (staging / local Compose only)

```bash
export SOROSCAN_FAILOVER_RUN=1
export SOROSCAN_ENVIRONMENT=local
export BASE_URL=http://127.0.0.1:8000
PYTHONPATH=. python tests/failover/run_failover.py --execute
```

Compose injector variant (uses services from `docker-compose.yml`):

```bash
# scenarios.yaml injector.kind=compose, target=db|redis|worker-default
```

## Environment variables

| Variable | Purpose |
|----------|---------|
| `SOROSCAN_FAILOVER_RUN` | Must be `1` to execute live probes |
| `BASE_URL` | API origin for probes |
| `SOROSCAN_ENVIRONMENT` | `production`/`prod` is rejected |
| `ALLOW_PRODUCTION_FAILOVER` | Explicit override; do not set in CI |
| `COMPOSE_FILE` | Optional compose file for injectors |

## Add a scenario

1. Add an entry to `tests/failover/scenarios.yaml` with `failure.type` in
   `{database, redis, rpc_timeout, worker}`, probe URLs, and recovery timeout.
2. Prefer an `injector` (`docker` image substring or `compose` service).
3. Add a Django test in `test_failover.py` using `failover_helpers.py` if the
   failure is simulated in-process.
4. Run `python -m pytest tests/failover` and the Django failover file.

## CI

`Failover Tests` validates YAML, runs Django simulations, then live-injects a
Redis pause against the CI service container. Worker Compose injection is not
run in GitHub Actions (no Compose workers); that path is covered by Django
tests plus local Compose.

Reports are uploaded as `failover-probe-report`.
