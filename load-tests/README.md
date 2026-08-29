# Load testing

SoroScan uses [k6](https://k6.io/) (not Locust) because k6 is already in this
repository and matches the GitHub Actions image.

**Never run these scripts against production.** `setup()` aborts when
`BASE_URL` looks like production unless `ALLOW_PRODUCTION_LOAD=true`.

## Prerequisites

- Running SoroScan API (`python manage.py runserver` or Compose `web`)
- [k6 installed](https://grafana.com/docs/k6/latest/set-up/install-k6/)

## Quick start

```bash
# Smoke (health + readiness) — safe defaults for local/CI
k6 run load-tests/k6/smoke.js

# Full workflows: health, JWT, contracts, events, webhooks, export, GraphQL
mkdir -p load-tests/results
K6_REPORT_PATH=load-tests/results/scenarios-summary.json \
  k6 run load-tests/k6/scenarios.js
```

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://127.0.0.1:8000` | API base URL |
| `K6_VUS` | `5` | Virtual users / smoke VUs |
| `K6_DURATION` | `30s` / `45s` | Steady-state duration |
| `K6_RAMP_UP` | `10s` | Ramp-up for the health scenario |
| `K6_REPORT_PATH` | `load-tests/results/*.json` | JSON summary output |
| `K6_USERNAME` / `K6_PASSWORD` | empty | JWT via `POST /api/token/` |
| `K6_API_TOKEN` | empty | Bearer token if you already have one |
| `ALLOW_PRODUCTION_LOAD` | unset | Required to target production hosts |
| `SOROSCAN_ENVIRONMENT` | unset | `production`/`prod` is blocked |
| `SOROSCAN_PRODUCTION_HOSTS` | `api.soroscan.io`, … | Extra blocked hostnames |

Thresholds in the scripts are CI-safe defaults (error rate and p95). They are
not fabricated product SLOs.

## Add a scenario

1. Confirm the route exists in `django-backend/soroscan/urls.py` or
   `ingest/urls.py`. Do not invent endpoints.
2. Add an `exec` function in `load-tests/k6/scenarios.js` and a `scenarios`
   entry with configurable VUs.
3. Use `http.expectedStatuses` for authenticated routes that return 401
   without credentials.
4. Extend `load-tests/tests/test_k6_config.py`.

## CI

- Pull requests: smoke test + static config/safety tests.
- Nightly schedule and `workflow_dispatch` (`suite=scenarios`): full workflow
  suite. Reports are uploaded as artifacts.

```bash
python -m pytest -q load-tests/tests
```

## Interpreting reports

k6 writes `handleSummary` JSON to `K6_REPORT_PATH`. Check `metrics.http_req_failed`,
`http_req_duration` p95, and `iterations` for throughput. Stdout is the human
summary.
