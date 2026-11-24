# Celery Task Queue Monitoring

> **Issue #1292** — `feat: expose Celery task queue metrics and status`

SoroScan exports Prometheus metrics for all Celery workers and queues, ships a Grafana dashboard, and provides a REST
endpoint for programmatic status checks.

---

## Architecture Overview

```
Celery signals        Prometheus metrics       Grafana dashboard
─────────────         ─────────────────────     ─────────────────
task_prerun     ──▶   celery_tasks_active        k8s/grafana-templates/
task_postrun    ──▶   celery_tasks_total          celery-task-queue.json
task_failure    ──▶   celery_tasks_total
                      celery_task_duration_seconds
                      (via OperationalHealthCollector)
Redis broker    ──▶   celery_queue_depth        Alerting rules
Celery inspect  ──▶   celery_workers_online      k8s/prometheus-rules.yaml
```

---

## Prometheus Metrics

All metrics are prefixed with `soroscan_`.

### Task execution metrics (`soroscan/ingest/metrics.py`)

| Metric                                  | Type      | Labels                              | Description                                         |
| --------------------------------------- | --------- | ----------------------------------- | --------------------------------------------------- |
| `soroscan_celery_tasks_total`           | Counter   | `task_name`, `status`, `error_type` | Terminal task outcomes (`success`, `failure`, etc.) |
| `soroscan_celery_tasks_active`          | Gauge     | `task_name`                         | Tasks currently executing                           |
| `soroscan_celery_task_duration_seconds` | Histogram | `task_name`                         | Wall-clock execution time                           |

### Operational metrics (`soroscan/operational_metrics.py`)

Collected live on every Prometheus scrape by `OperationalHealthCollector`:

| Metric                           | Type  | Labels   | Description                          |
| -------------------------------- | ----- | -------- | ------------------------------------ |
| `soroscan_celery_queue_depth`    | Gauge | `queue`  | Pending messages in Redis per queue  |
| `soroscan_celery_workers_online` | Gauge | `worker` | Workers responding to `inspect ping` |

Queues monitored: `high_priority`, `default`, `low_priority`, `backfill`.

### Useful PromQL queries

```promql
# Current queue depths
soroscan_celery_queue_depth

# Task failure rate (5-minute window)
100 * sum(rate(soroscan_celery_tasks_total{status="failure"}[5m]))
      / clamp_min(sum(rate(soroscan_celery_tasks_total[5m])), 0.001)

# Average task duration by name
sum(rate(soroscan_celery_task_duration_seconds_sum[5m])) by (task_name)
  / clamp_min(sum(rate(soroscan_celery_task_duration_seconds_count[5m])) by (task_name), 0.001)

# Active tasks by name
sum(soroscan_celery_tasks_active) by (task_name)
```

---

## Prometheus Alerting Rules (`k8s/prometheus-rules.yaml`)

### `SoroScanCeleryQueueDepthHigh`

Fires when any queue holds more than 100 pending messages for 10 minutes.

```yaml
alert: SoroScanCeleryQueueDepthHigh
expr: soroscan_celery_queue_depth > 100
for: 10m
labels:
  severity: warning
```

**Runbook**: Check `GET /api/celery/status/` for per-queue depth and `workers_online` count. Scale workers with
`kubectl scale deployment/soroscan-worker --replicas=N`.

### `SoroScanCeleryFailureRateHigh`

Fires when the failure rate across all tasks exceeds 5% over 5 minutes.

```yaml
alert: SoroScanCeleryFailureRateHigh
expr: |
  100 * sum(rate(soroscan_celery_tasks_total{status="failure"}[10m]))
    / clamp_min(sum(rate(soroscan_celery_tasks_total[10m])), 0.001) > 5
for: 5m
labels:
  severity: critical
```

**Runbook**: Check the `root_cause_query` annotation to identify the task names and error types with the highest failure
rates.

---

## Task Queue Status API

### `GET /api/celery/status/`

Returns a JSON snapshot of queue depths, worker health, and task metrics. Requires authentication.

**Example response**

```json
{
  "queues": {
    "high_priority": 0,
    "default": 3,
    "low_priority": 12,
    "backfill": 0
  },
  "workers": {
    "celery@worker-1": "online",
    "celery@worker-2": "online"
  },
  "workers_online": 2,
  "active_tasks": {
    "soroscan.ingest.tasks.dispatch_webhook": 2,
    "soroscan.ingest.tasks.ingest_latest_events": 1
  },
  "metrics": {
    "tasks_total": {
      "soroscan.ingest.tasks.dispatch_webhook.success": 15240,
      "soroscan.ingest.tasks.dispatch_webhook.failure": 3
    },
    "task_failure_rate": 0.0002
  }
}
```

**Authentication**: Bearer JWT or API key (same as other protected endpoints).

**cURL example**

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/token/ \
  -d '{"username":"admin","password":"pass"}' \
  -H "Content-Type: application/json" | jq -r .access)

curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/celery/status/
```

**URL routing**

The endpoint is registered at two paths:

- `/api/celery/status/` — primary path (via `soroscan/urls.py`)
- `/api/ingest/celery/status/` — also reachable via the ingest router

---

## Grafana Dashboard (`k8s/grafana-templates/celery-task-queue.json`)

Import the template into Grafana to get:

| Panel                      | Description                                 |
| -------------------------- | ------------------------------------------- |
| Queue Depth                | Time-series of pending messages per queue   |
| Active Tasks               | Currently executing tasks per task name     |
| Completed and Failed Tasks | Rate of terminal outcomes (success/failure) |
| Average Task Duration      | p50 execution time per task                 |
| Workers Online             | Stat panel showing total live workers       |

Import path: **Dashboards → Import → Upload JSON file** → select `k8s/grafana-templates/celery-task-queue.json`.

The dashboard uses template variables (`job`, `instance`) and auto-refreshes every 30 seconds.

---

## Signal Wiring (`soroscan/celery.py`)

The metrics are updated by three Celery signal handlers:

```python
@task_prerun.connect
def set_celery_task_context(sender, task_id, **kwargs):
    celery_tasks_active.labels(task_name=sender.name).inc()

@task_postrun.connect
def record_celery_task_completion(sender, task_id, state, **kwargs):
    celery_tasks_active.labels(task_name=sender.name).dec()
    celery_tasks_total.labels(task_name=..., status=..., error_type="").inc()
    celery_task_duration_seconds.labels(task_name=...).observe(elapsed)

@task_failure.connect
def record_celery_task_failure(sender, exception, **kwargs):
    celery_tasks_total.labels(task_name=..., status="failure", error_type=type(exception).__name__).inc()
```

No code changes are needed to instrument new tasks — the signals fire automatically for every Celery task.

---

## Environment Variables

No additional environment variables are required. The broker URL (`CELERY_BROKER_URL`) used by `operational_metrics.py`
is derived from `REDIS_URL`.

---

## Testing

Tests are in `soroscan/ingest/tests/test_celery_monitoring.py`:

```bash
cd django-backend
pytest soroscan/ingest/tests/test_celery_monitoring.py -v
```

| Test class                              | What it covers                                                    |
| --------------------------------------- | ----------------------------------------------------------------- |
| `CeleryMetricsRegisteredTests`          | All three metrics export without duplicate registration errors    |
| `CelerySignalHandlerTests`              | Prerun/postrun/failure signals update metrics correctly           |
| `CeleryDurationTests`                   | Duration histogram is observed on completion                      |
| `CeleryStatusViewTests`                 | API endpoint structure, auth, Redis/worker error handling         |
| `CeleryAlertRulesTests`                 | prometheus-rules.yaml has required alerts with correct thresholds |
| `OperationalHealthCollectorCeleryTests` | Collector yields queue/worker metrics gracefully under failures   |

---

## Source Files

| File                                              | Purpose                                                                     |
| ------------------------------------------------- | --------------------------------------------------------------------------- |
| `soroscan/ingest/metrics.py`                      | `celery_tasks_total`, `celery_tasks_active`, `celery_task_duration_seconds` |
| `soroscan/operational_metrics.py`                 | `OperationalHealthCollector` — queue depth and worker status                |
| `soroscan/celery.py`                              | Signal handlers wiring Celery events to metrics                             |
| `soroscan/ingest/views.py`                        | `celery_status_view` (GET `/api/celery/status/`)                            |
| `soroscan/urls.py`                                | URL registration                                                            |
| `soroscan/ingest/urls.py`                         | URL registration (ingest sub-router)                                        |
| `k8s/prometheus-rules.yaml`                       | `SoroScanCeleryQueueDepthHigh`, `SoroScanCeleryFailureRateHigh`             |
| `k8s/grafana-templates/celery-task-queue.json`    | Grafana dashboard template                                                  |
| `soroscan/ingest/tests/test_celery_monitoring.py` | Test suite                                                                  |
