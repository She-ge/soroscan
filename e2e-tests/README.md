# End-to-end test scenarios

SoroScan tracks critical user workflows in `scenarios.yaml` and validates them with
pytest-based API journey tests in `django-backend/soroscan/ingest/tests/test_e2e_workflows.py`.

## Critical workflows

| Scenario | Status |
|----------|--------|
| User signup to viewing events | Implemented |
| Webhook subscription lifecycle | Implemented |
| Compliance data export | Implemented |
| Admin ingest error review | Implemented |
| API key lifecycle | Planned |

Coverage target: **80%** of critical workflows (4 of 5).

## Run locally

```bash
# Validate scenario catalog and coverage threshold
cd e2e-tests
python -m pip install pytest PyYAML
python -m pytest -q

# Run API workflow tests
cd ../django-backend
python -m pytest soroscan/ingest/tests/test_e2e_workflows.py -v
```

## CI

The `E2E Tests` GitHub Actions workflow validates the scenario catalog on every
change to `e2e-tests/**` and runs workflow tests in the Django backend CI pipeline.
