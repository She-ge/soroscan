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

## Soak & stress

`load-tests/k6/soak.js` adds sustained-load and stress-ramp profiles that the
smoke and short scenario scripts do not cover. Select a profile with `K6_PROFILE`:

```bash
# Soak (default): sustained moderate load for 10m to surface latency drift
mkdir -p load-tests/results
k6 run load-tests/k6/soak.js

# Shorter soak for a quick local check
K6_PROFILE=soak K6_SOAK_VUS=10 K6_SOAK_DURATION=1m k6 run load-tests/k6/soak.js

# Stress ramp: push VUs up to find the breaking point
K6_PROFILE=stress K6_STRESS_VUS=100 k6 run load-tests/k6/soak.js
```

The soak profile ramps to `K6_SOAK_VUS` and holds them for `K6_SOAK_DURATION`,
tracking `http_req_duration` and `iteration_duration` p95; a rising trend over
the sustained run signals degradation that usually tracks server-side
memory/resource leaks (monitor those on the host separately). The stress
profile ramps VUs to `K6_STRESS_VUS`, holds, then ramps down. Thresholds are
CI-safe defaults, not product SLOs.

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://127.0.0.1:8000` | API base URL |
| `K6_VUS` | `5` | Virtual users / smoke VUs |
| `K6_DURATION` | `30s` / `45s` | Steady-state duration |
| `K6_RAMP_UP` | `10s` | Ramp-up for the health scenario |
| `K6_PROFILE` | `soak` | `soak` or `stress` profile for `soak.js` |
| `K6_SOAK_VUS` | `10` | Sustained VUs for the soak profile |
| `K6_SOAK_DURATION` | `10m` | Sustained duration for the soak profile |
| `K6_STRESS_VUS` | `100` | Peak VUs for the stress ramp |
| `K6_RAMP_DOWN` | `1m` | Stress profile ramp-down duration |
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
1. Add an `exec` function in `load-tests/k6/scenarios.js` and a `scenarios`
   entry with configurable VUs.
1. Use `http.expectedStatuses` for authenticated routes that return 401
   without credentials.
1. Extend `load-tests/tests/test_k6_config.py`.

## CI

- Pull requests: smoke test + static config/safety tests.
- Nightly schedule and `workflow_dispatch` (`suite=scenarios`): full workflow
  suite. Reports are uploaded as artifacts.
- `load-tests/k6/soak.js` (soak/stress) is run on demand; the static config
  tests below validate its profiles and production guard on every PR.

```bash
python -m pytest -q load-tests/tests
```

## Interpreting reports

k6 writes `handleSummary` JSON to `K6_REPORT_PATH`. Check `metrics.http_req_failed`,
`http_req_duration` p95, and `iterations` for throughput. Stdout is the human
summary.
