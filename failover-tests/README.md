# Failover testing

SoroScan includes an automated failover test suite under `failover-tests/` and
`django-backend/soroscan/ingest/tests/test_failover.py`.

The harness validates scenario definitions by default. Live recovery probes run
only when both `--execute` and `SOROSCAN_FAILOVER_RUN=1` are provided.

## Scenarios

The suite covers:

- database connection failure
- Redis connection failure
- Soroban RPC timeout
- multiple Celery worker failures

Each scenario documents readiness, worker-health, and liveness probe URLs plus
recovery timeouts. Django tests simulate each failure, verify degraded health
responses, and confirm recovery when dependencies are restored.

## Validate locally

```bash
cd failover-tests
python -m pip install pytest PyYAML
python -m pytest -q
python run_failover.py
```

## Run Django failover simulations

```bash
cd django-backend
python -m pytest soroscan/ingest/tests/test_failover.py -v
```

## Run live recovery probes

Use a staging or disposable environment with the API running:

```bash
cd failover-tests
SOROSCAN_FAILOVER_RUN=1 python run_failover.py --execute
SOROSCAN_FAILOVER_RUN=1 BASE_URL=http://127.0.0.1:8000 python run_failover.py --scenario database_connection_failure --execute
```

## CI

The `Failover Tests` GitHub Actions workflow validates scenario definitions and
runs the Django failover simulation suite on changes to `failover-tests/**` or
`django-backend/soroscan/ingest/tests/test_failover.py`.
