# Pact Contract Testing Guide

SoroScan uses [Pact](https://docs.pact.io/) consumer-driven contract testing to
keep the TypeScript and Python SDKs compatible with the Django API without
standing up full integration environments on every run.

This guide explains how the consumer and provider flows work, how to run them
locally and in CI, and how to debug contract mismatches.

## How the flow works

1. **Consumer tests generate contracts.** Each SDK runs Pact consumer tests
   against a mock provider local to the test process. Passing interactions are
   written as JSON pact files into `pacts/` at the repo root.
1. **Contracts are committed.** Generated pact files live in `pacts/` and are
   reviewed like code. SoroScan does not use a Pact Broker; the committed files
   are the source of truth.
1. **The provider verifies contracts.** The Django API replays every recorded
   interaction against a real test server (Django `live_server`) with real
   database state seeded through the provider-states endpoint.
1. **CI wires it together.** The consumer jobs run first, upload the generated
   pacts as artifacts, and the provider job downloads them and verifies them.

## Repo layout

| Path | Role |
|------|------|
| `pacts/*.json` | Generated contracts (source of truth, committed) |
| `sdk/typescript/test/pact/consumer.pact.test.ts` | TypeScript SDK consumer tests |
| `sdk/python/tests/test_pact_consumer.py` | Python SDK consumer tests |
| `django-backend/soroscan/pact_tests/test_provider_verification.py` | Provider verification |
| `django-backend/soroscan/pact_provider.py` | Provider-state endpoint and fixtures |
| `.github/workflows/pact-tests.yml` | CI pipeline for all of the above |

Contract naming: `<consumer>-<provider>.json`, e.g.
`soroscan-typescript-sdk-soroscan-api.json`.

## Consumer flow

Consumer tests describe exactly what the SDK sends and expects back, then run
against Pact's mock server. Use matchers (`like`, `eachLike`, `term`) so the
contract stays flexible on values that do not matter.

Python SDK example (`sdk/python/tests/test_pact_consumer.py`):

```python
pact = Pact("soroscan-python-sdk", "soroscan-api").with_specification("V4")

(
    pact.upon_receiving("a request for ingest service health")
    .given("the API is healthy")
    .with_request("GET", "/api/ingest/health/")
    .will_respond_with(200)
    .with_body({"status": "healthy", "service": "soroscan"},
               content_type="application/json")
)

with pact.serve() as srv:
    response = httpx.get(f"{srv.url}/api/ingest/health/")

pact.write_file(REPO_ROOT / "pacts")
```

TypeScript SDK example (`sdk/typescript/test/pact/consumer.pact.test.ts`) uses
`@pact-foundation/pact` with the same interaction model; the mock server is
started in the test harness hooks.

Rules of thumb for adding a new consumer interaction:

- Wrap it in a helper on the real SDK client so the test exercises the same
  code path users hit.
- Match loosely on response values (`like`) and strictly on structure.
- Always declare a `given(...)` provider state; the provider uses it to seed
  fixtures.
- Regenerate the pact file and commit it alongside the test change.

## Provider flow

Provider verification lives in
`django-backend/soroscan/pact_tests/test_provider_verification.py`. It:

- loads every `pacts/*.json` file,
- starts a Django `live_server`,
- verifies each interaction against real Django views with a real database,
- seeds state per interaction via the provider-state handler.

Provider states are implemented in `django-backend/soroscan/pact_provider.py`
and exposed through `POST /_pact/provider-states`, which is only enabled when
`PACT_PROVIDER_STATES_ENABLED=1` (test/CI environments only). States are reset
before each setup call.

Adding a new provider state:

1. Register the state name in `pact_provider.py` and have it create/delete the
   fixtures the interaction needs.
1. Reference the same state name in the consumer tests with `given(...)`.
1. Update both SDKs if the interaction is shared; states must match exactly.

## Running locally

### 1. Generate / refresh contracts (consumers)

```bash
# TypeScript SDK
cd sdk/typescript
npm install
npm run test:pact

# Python SDK
cd sdk/python
pip install -e ".[dev]" pact-python
pytest tests/test_pact_consumer.py -v
```

### 2. Verify contracts (provider)

```bash
cd django-backend
pip install -r requirements.txt
DJANGO_SETTINGS_MODULE=soroscan.settings_test
PACT_PROVIDER_STATES_ENABLED=1
pytest soroscan/pact_tests/test_provider_verification.py -v
```

This requires reachable PostgreSQL and Redis (see the env vars in
`.github/workflows/pact-tests.yml` for the exact `DATABASE_URL` /
`REDIS_URL` used in CI).

### 3. Inspect results

- Consumer failures fail immediately in the test run.
- Provider verification reports each interaction as a mismatch if any
  expected request/response cannot be honoured; the failure message contains
  the full diff (see [troubleshooting](#troubleshooting-mismatches)).

## Running in CI

`.github/workflows/pact-tests.yml` runs three jobs:

1. **consumer-typescript** — installs the TS SDK, runs `npm run test:pact`,
   uploads generated pacts as the `pact-contracts-typescript` artifact.
1. **consumer-python** — installs the Python SDK with extras, runs
   `pytest tests/test_pact_consumer.py`, uploads the
   `pact-contracts-python` artifact.
1. **provider-verification** — needs both consumer jobs, spins up
   Postgres 15 + Redis 7 service containers, downloads the pact artifacts,
   installs backend requirements, and runs the provider verification with
   `PACT_PROVIDER_STATES_ENABLED=1` and
   `DJANGO_SETTINGS_MODULE=soroscan.settings_test`.

The workflow triggers on pushes and PRs touching `pacts/**`, `sdk/**`,
`django-backend/**`, or the workflow file itself.

When adding an SDK feature, the CI order matters: update consumer tests first
(pact file changes), then make the provider changes in the same PR so
verification passes.

Also run the v1 API unit tests that back the contract surface:

```bash
pytest soroscan/pact_tests/test_v1_views.py -v
```

## Troubleshooting mismatches

Most Pact failures fall into a few buckets. Read the mismatch diff from the
inside out: expected vs actual, then status, headers, and body.

### 1. Status code mismatch

The consumer recorded `200` but the provider returned `404`/`401`/`500`.

- Usually a missing provider state (fixture not seeded) - check that the
  `given(...)` name matches `pact_provider.py` exactly.
- Or the provider requires authentication the state did not create
  (`_ensure_api_access` handles the test API key).

### 2. Body structure mismatch

- The provider added or removed a field the consumer depends on. Either
  update the consumer expectation (intentional API change) or restore the
  field on the provider.
- Missing keys are failures even when present values match; use matchers with
  care so optional fields are modelled explicitly (`like` with `None` where
  allowed, or split interactions).
- Type changes fail too: Pact v4 matches types, not string content, unless a
  `term`/regex matcher is used.

### 3. Header and content-type mismatches

- The provider must respond with the declared content type, typically
  `application/json`.
- Auth headers on requests: specify them as matchers if the consumer sends
  them dynamically (tokens, API keys), otherwise verification can pass locally
  but fail with real data.

### 4. Stale contract files

If `pacts/*.json` for a consumer is older than the SDK's current client code,
the provider may be verifying interactions that no longer exist.

- Regenerate the pact files with the consumer test suites and commit them.
- Verify with `git diff pacts/` that regenerated files only changed where you
  expect.

### Common commands for triage

```bash
# Re-run only one interaction source after a fix (filter by test name)
pytest soroscan/pact_tests/test_provider_verification.py -v -k health

# Check what states the provider supports
grep -n "state" django-backend/soroscan/pact_provider.py
```

## Checklist for contributors

- [ ] New/changed SDK behaviour covered by a consumer test with a `given` state
- [ ] Regenerated `pacts/*.json` committed with the change
- [ ] Provider states implemented in `pact_provider.py` when needed
- [ ] `npm run test:pact` and `pytest tests/test_pact_consumer.py` pass locally
- [ ] Provider verification passes locally before opening the PR
- [ ] PR touches both the SDK change and the API change together
