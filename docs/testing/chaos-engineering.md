# Chaos Engineering Tests

SoroScan includes an opt-in chaos test harness under `chaos-tests/`.

By default the harness runs in dry-run mode and validates scenario definitions,
command construction, and recovery configuration. Disruptive Kubernetes actions
only run when both `--execute` and `SOROSCAN_CHAOS_RUN=1` are provided.

## Scenarios

The suite defines:

- pod termination for backend pods
- network latency injection
- temporary memory pressure
- temporary CPU throttling

Each scenario includes a recovery probe URL and timeout. Recovery is considered
successful when the probe responds before the timeout expires.

## Validate Locally

```bash
cd chaos-tests
python -m pip install pytest PyYAML
python -m pytest -q
python run_chaos.py
```

## Run Against Kubernetes

Use a staging or disposable environment, never production, unless an incident
response plan and rollback owner are assigned.

```bash
cd chaos-tests
SOROSCAN_CHAOS_RUN=1 python run_chaos.py --execute
SOROSCAN_CHAOS_RUN=1 python run_chaos.py --scenario pod_termination --execute
```

The runner uses `kubectl` and the selectors in `chaos-tests/scenarios.yaml`.
Update namespace, labels, and recovery URLs for your target environment before
executing scenarios.

## CI

The `Chaos Tests` GitHub Actions workflow runs the non-destructive validation
suite for changes to `chaos-tests/**`.
