# Chaos Engineering Tests

**Destructive.** These experiments delete pods, inject latency, and change
resource limits. They must never run against production.

SoroScan uses an in-repo harness (`tests/chaos/run_chaos.py`) compatible with
the existing Kubernetes manifests and Docker Compose stack. Chaos Mesh /
chaos-toolkit are not required.

By default the harness is dry-run only. Disruptive actions require **all** of:

1. `--execute`
2. `SOROSCAN_CHAOS_RUN=1`
3. `SOROSCAN_ENVIRONMENT` not `production`/`prod`
4. Target namespace on the allow-list (`chaos-testing`, `soroscan-chaos`,
   `soroscan` for staging). Override with `SOROSCAN_CHAOS_ALLOWED_NAMESPACES`.

The default scenario namespace is `chaos-testing`, not the production
`soroscan` namespace from `k8s/namespace.yaml`.

## Scenarios

| Name | Failure | Expected behavior | Cleanup |
|------|---------|-------------------|---------|
| `pod_termination` | Delete backend pods | Deployment recreates pods; readiness returns 200 | No leftover pods/jobs |
| `network_latency` | `tc netem` delay | Process stays up; latency increases | qdisc removed after duration |
| `memory_exhaustion` | Low memory limit | May restart; readiness recovers | Limits restored to 512Mi |
| `cpu_throttling` | Low CPU limit | Slows down, does not invent extra HA | Limits restored |

Recovery is a **200** on the configured probe (not 4xx). Polling uses bounded
timeouts rather than a single `sleep`.

## Validate locally

```bash
PYTHONPATH=. python -m pytest -q testing/tests
cd tests/chaos
python -m pip install pytest PyYAML
PYTHONPATH=../.. python -m pytest -q
PYTHONPATH=../.. python run_chaos.py
PYTHONPATH=../.. python run_chaos.py --backend compose
```

## Kubernetes (dedicated namespace)

```bash
kubectl create namespace chaos-testing
# deploy a copy of the operator/backend into that namespace
export SOROSCAN_CHAOS_RUN=1
export SOROSCAN_ENVIRONMENT=chaos
PYTHONPATH=. python tests/chaos/run_chaos.py --execute
PYTHONPATH=. python tests/chaos/run_chaos.py --scenario pod_termination --execute
```

## Docker Compose isolation

```bash
docker compose -f docker-compose.yml -f docker-compose.chaos.yml \
  --project-name soroscan-chaos up -d db redis web
export SOROSCAN_CHAOS_RUN=1
export SOROSCAN_ENVIRONMENT=local
PYTHONPATH=. python tests/chaos/run_chaos.py --backend compose --execute
docker compose -f docker-compose.yml -f docker-compose.chaos.yml \
  --project-name soroscan-chaos down -v
```

Network latency via `tc` needs `NET_ADMIN` in the container. If that capability
is missing, skip `network_latency` rather than claiming it ran.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `SOROSCAN_CHAOS_RUN` | Must be `1` to execute |
| `SOROSCAN_ENVIRONMENT` | Rejected when `production`/`prod` |
| `SOROSCAN_CHAOS_BACKEND` | `kubernetes` (default) or `compose` |
| `SOROSCAN_CHAOS_ALLOWED_NAMESPACES` | Comma-separated allow-list |

## Add an experiment

1. Add a scenario to `tests/chaos/scenarios.yaml` with `action.type` in
   `{pod_termination, network_latency, memory_exhaustion, cpu_throttling}`,
   `expected.behavior`, `expected.cleanup`, and a recovery URL.
2. Extend `build_kubernetes_commands` / `build_compose_commands` if needed.
3. Add an assertion in `tests/chaos/tests/test_run_chaos.py`.

## CI

The `Chaos Tests` workflow **only** validates definitions and dry-runs command
construction. It never talks to a cluster. Reports are uploaded as
`chaos-dry-run-report`.

Live Kubernetes/Compose execution is a manual or staging-only operation.

## Recovery and leftover state

If an experiment is interrupted:

```bash
kubectl -n chaos-testing rollout undo deploy/soroscan-backend
kubectl -n chaos-testing delete pod -l app=soroscan-backend --force
docker compose --project-name soroscan-chaos down -v
```
