# Grafana Dashboards

SoroScan ships five importable Grafana dashboard templates for the most common
operational questions: service health, event ingestion, webhook delivery, API
performance, and Celery queue health.

The templates live in [`k8s/grafana-templates/`](https://github.com/SoroScan/soroscan/tree/main/k8s/grafana-templates):

| File | Dashboard | UID |
| --- | --- | --- |
| `system-health-overview.json` | SoroScan - System Health Overview | `soroscan-system-health-template` |
| `event-ingestion-metrics.json` | SoroScan - Event Ingestion Metrics | `soroscan-ingestion-template` |
| `webhook-delivery-status.json` | SoroScan - Webhook Delivery Status | `soroscan-webhook-template` |
| `performance-analysis.json` | SoroScan - Performance Analysis | `soroscan-performance-template` |
| `celery-task-queue.json` | SoroScan - Celery Task Queue | `soroscan-celery-queue` |

All five dashboards refresh every 30 seconds, use the Prometheus datasource
supplied at import time through the `DS_PROMETHEUS` input, and expose `job` and
`instance` template variables. The system health dashboard adds a `namespace`
variable for Kubernetes deployment annotations.

> The templates are dashboard JSON, not Kubernetes resources. Do not run
> `kubectl apply` on the files in `k8s/grafana-templates/`. Use the Grafana UI or
> provision them as ConfigMaps as described below.

## Prerequisites

- Prometheus scraping the SoroScan backend (`/metrics`) and the Celery worker
  metrics endpoint (port `9100`), as configured by `k8s/servicemonitor.yaml`.
- Grafana able to reach Prometheus. `k8s/grafana-datasource.yaml` provisions a
  Prometheus datasource named `Prometheus`.
- Metric sources:
  - `django_*` metrics from `django-prometheus` (HTTP responses, request
    latency, DB errors and query duration).
  - `celery_*` metrics from a Prometheus Celery exporter (`celery_tasks_total`,
    `celery_worker_tasks_active`, `celery_task_runtime_seconds`).
  - `soroscan_celery_*` metrics emitted by SoroScan itself
    (`soroscan_celery_queue_depth`, `soroscan_celery_tasks_active`,
    `soroscan_celery_tasks_total`, `soroscan_celery_task_duration_seconds`,
    `soroscan_celery_workers_online`). See
    [Celery Task Queue Monitoring](../features/celery-task-queue-monitoring.md)
    for label details.

## Import a template in the Grafana UI

1. Open Grafana and go to **Dashboards -> New -> Import**.
2. Upload one of the JSON files from `k8s/grafana-templates/` (or paste its
   contents).
3. When Grafana prompts for the `DS_PROMETHEUS` input, select the Prometheus
   datasource that scrapes SoroScan.
4. Set the variable defaults:
   - `namespace`: the Kubernetes namespace that runs SoroScan (the system health
     dashboard only). Its default is `default`.
   - `job`: the Prometheus scrape job (`All` by default). The value must match
     the `job` label on the scraped targets.
   - `instance`: a specific target (`All` by default).
5. Select **Import**. The dashboard is created with the template UID; importing a
   second copy creates a new dashboard unless you reuse the UID.

If a panel shows "No data", check the `job` and `instance` variables first. They
are populated with `label_values(...)` queries against the selected datasource,
so an empty value usually means the scrape labels differ from the defaults.

## Provision dashboards from Kubernetes

Two ConfigMaps in `k8s/` wire Grafana to Prometheus and to a dashboard directory:

- `k8s/grafana-datasource.yaml` creates `grafana-datasources` with a Prometheus
  datasource at
  `http://prometheus-server.monitoring.svc.cluster.local:9090`, marked as the
  default and read-only.
- `k8s/grafana-dashboard-provider.yaml` creates `grafana-dashboard-provider`,
  which tells Grafana's file provider to load dashboards from
  `/var/lib/grafana/dashboards` every 10 seconds.

Apply them in the `monitoring` namespace (or adjust the namespaces to match your
Grafana installation):

```bash
kubectl apply -f k8s/grafana-datasource.yaml
kubectl apply -f k8s/grafana-dashboard-provider.yaml
```

Both ConfigMaps carry the labels `grafana_datasource: "1"` and
`grafana_dashboard: "1"`, which the Grafana Helm chart's sidecars watch when
sidecar provisioning is enabled. If your Grafana instance uses a different
provisioning mechanism, mount the generated `datasources.yaml` and
`dashboards.yaml` files at the usual paths
(`/etc/grafana/provisioning/datasources` and
`/etc/grafana/provisioning/dashboards`).

To load the templates through the file provider:

1. Create a ConfigMap from each dashboard JSON and mount the files into
   `/var/lib/grafana/dashboards`, for example:

   ```bash
   kubectl create configmap soroscan-grafana-system-health \
     --from-file=system-health-overview.json=k8s/grafana-templates/system-health-overview.json \
     -n monitoring
   ```

2. The file provider does not resolve import-time `__inputs`. Replace
   `${DS_PROMETHEUS}` in the JSON with a concrete datasource UID before
   provisioning. The simplest approach is to pin the UID on the datasource:

   ```yaml
   # k8s/grafana-datasource.yaml -> data.datasources.yaml
   datasources:
     - name: Prometheus
       uid: prometheus
       type: prometheus
       # ...
   ```

   Then replace every `"${DS_PROMETHEUS}"` with `"prometheus"` in the dashboard
   JSON. Without this step, provisioned dashboards load but their panels cannot
   resolve a datasource.

Files in `k8s/grafana-templates/` intentionally remain import-ready templates;
`k8s/grafana-dashboard.json` is a separate prebuilt dashboard that can be
imported directly.

## Dashboard reference

### System Health Overview

**File:** `k8s/grafana-templates/system-health-overview.json`  
**Default range:** last 6 hours  
**Variables:** `namespace`, `job`, `instance`

Answers "is SoroScan up, and are errors or queue pressure building?" It is the
first dashboard to check during an incident.

| Panel | Type | Query |
| --- | --- | --- |
| Service Up | stat | `max(up{job=~"$job",instance=~"$instance"})` |
| HTTP Error Rate | timeseries | 5xx: `sum(rate(django_http_responses_total_by_status_total{status=~"5..",job=~"$job",instance=~"$instance"}[5m]))`; 4xx: same with `status=~"4.."` |
| Celery Queue Depth | timeseries | `sum(celery_worker_tasks_active{instance=~"$instance"})` |
| DB Error Count | timeseries | `sum(rate(django_db_errors_total{job=~"$job"}[5m])) by (type)` |
| Worker Runtime p95 | timeseries | `histogram_quantile(0.95, sum(rate(celery_task_runtime_seconds_bucket{instance=~"$instance"}[5m])) by (le, name))` |

**Annotation:** `Deployments` fires when
`changes(kube_deployment_status_observed_generation{namespace=~"$namespace"}[5m]) > 0`,
so a rollout appears on the same timeline as latency and error changes.

### Event Ingestion Metrics

**File:** `k8s/grafana-templates/event-ingestion-metrics.json`  
**Default range:** last 6 hours  
**Variables:** `job`, `instance`

Tracks whether Soroban events are being indexed at the expected rate and whether
ingestion tasks are failing.

| Panel | Type | Query |
| --- | --- | --- |
| Events Indexed / min | timeseries | `sum(rate(celery_tasks_total{name=~".*ingest.*",state="SUCCESS",job=~"$job"}[1m])) * 60` |
| Ingestion Failures / min | timeseries | `sum(rate(celery_tasks_total{name=~".*ingest.*",state="FAILURE",job=~"$job"}[1m])) * 60` |
| Task Runtime p95 | timeseries | `histogram_quantile(0.95, sum(rate(celery_task_runtime_seconds_bucket{name=~".*ingest.*",instance=~"$instance"}[5m])) by (le, name))` |
| Deduplication and DB Errors | timeseries | `sum(rate(django_db_errors_total{job=~"$job"}[5m])) by (type)` |

**Annotation:** `Ingestion incidents` fires when
`increase(django_db_errors_total{type="ingest"}[5m]) > 0`.

The ingestion counters rely on task names that contain `ingest`. If your task
names differ, update the `name=~".*ingest.*"` matchers.

### Webhook Delivery Status

**File:** `k8s/grafana-templates/webhook-delivery-status.json`  
**Default range:** last 24 hours  
**Variables:** `job`, `instance`

Shows webhook delivery health and breaks failures down by task name.

| Panel | Type | Query |
| --- | --- | --- |
| Webhook Success Rate | timeseries | `100 * sum(rate(celery_tasks_total{name=~".*webhook.*",state="SUCCESS",job=~"$job"}[5m])) / clamp_min(sum(rate(celery_tasks_total{name=~".*webhook.*",job=~"$job"}[5m])), 1)` |
| Webhook Retry Throughput | timeseries | `sum(rate(celery_tasks_total{name=~".*webhook.*retry.*",job=~"$job"}[5m]))` |
| Webhook Delivery Runtime p95 | timeseries | `histogram_quantile(0.95, sum(rate(celery_task_runtime_seconds_bucket{name=~".*webhook.*",instance=~"$instance"}[5m])) by (le, name))` |
| Failure Breakdown | table | `sum(rate(celery_tasks_total{name=~".*webhook.*",state="FAILURE",job=~"$job"}[5m])) by (name)` |

**Annotation:** `Retry spikes` fires when
`sum(rate(celery_tasks_total{name=~".*webhook.*retry.*",state="STARTED"}[5m])) > 0`.

The success-rate denominator uses `clamp_min(..., 1)` so a period with no traffic
reports 0% instead of `NaN`.

### Performance Analysis

**File:** `k8s/grafana-templates/performance-analysis.json`  
**Default range:** last 6 hours  
**Variables:** `job`, `instance`

Focuses on API latency, which views dominate traffic, and database query cost.

| Panel | Type | Query |
| --- | --- | --- |
| API Latency Percentiles | timeseries | p50/p95/p99: `histogram_quantile(0.50, ...)`, `histogram_quantile(0.95, ...)`, and `histogram_quantile(0.99, ...)` over `sum(rate(django_http_requests_latency_seconds_bucket{job=~"$job",instance=~"$instance"}[5m])) by (le)` |
| Request Rate by View | timeseries | `sum(rate(django_http_requests_total_by_view_transport_method_total{job=~"$job"}[5m])) by (view)` |
| DB Query Latency p95 | timeseries | `histogram_quantile(0.95, sum(rate(django_db_execute_many_duration_seconds_bucket{job=~"$job"}[5m])) by (le, vendor))` |
| Top Slow Views (avg latency) | table | `topk(10, sum(rate(django_http_requests_latency_seconds_sum{job=~"$job"}[5m])) by (view) / clamp_min(sum(rate(django_http_requests_latency_seconds_count{job=~"$job"}[5m])) by (view), 1))` |

**Annotation:** `Performance regressions` fires when the p99 API latency exceeds
two seconds:
`histogram_quantile(0.99, sum(rate(django_http_requests_latency_seconds_bucket[5m])) by (le)) > 2`.

### Celery Task Queue

**File:** `k8s/grafana-templates/celery-task-queue.json`  
**Default range:** last 6 hours  
**Variables:** `job`, `instance`

Uses SoroScan's own `soroscan_celery_*` metrics and is the canonical queue view.
See [Celery Task Queue Monitoring](../features/celery-task-queue-monitoring.md)
for the metric definitions and alert rules.

| Panel | Type | Query |
| --- | --- | --- |
| Queue Depth | timeseries | `soroscan_celery_queue_depth{job=~"$job",instance=~"$instance"}` (one series per `queue`) |
| Active Tasks | timeseries | `sum(soroscan_celery_tasks_active{job=~"$job",instance=~"$instance"}) by (task_name)` |
| Completed and Failed Tasks | timeseries | `sum(rate(soroscan_celery_tasks_total{job=~"$job",instance=~"$instance"}[5m])) by (status,task_name)` |
| Average Task Duration | timeseries | `sum(rate(soroscan_celery_task_duration_seconds_sum{job=~"$job",instance=~"$instance"}[5m])) by (task_name) / clamp_min(sum(rate(soroscan_celery_task_duration_seconds_count{job=~"$job",instance=~"$instance"}[5m])) by (task_name), 0.001)` |
| Workers Online | stat | `sum(soroscan_celery_workers_online{job=~"$job",instance=~"$instance"})` |

**Annotation:** `Queue backlog` fires when
`soroscan_celery_queue_depth{job=~"$job"} > 100`, matching the
`SoroScanCeleryQueueDepthHigh` alert in `k8s/prometheus-rules.yaml`.

The "Average Task Duration" legend says average rather than p50; it divides the
duration sum by the count, so it is a true mean.

## Metric quick reference

| Metric | Used by | Meaning |
| --- | --- | --- |
| `up` | System health | Scrape target availability |
| `django_http_responses_total_by_status_total` | System health | HTTP responses by status code |
| `django_http_requests_latency_seconds_bucket` | Performance | API request latency histogram |
| `django_http_requests_total_by_view_transport_method_total` | Performance | Request rate by view and method |
| `django_db_errors_total` | System health, ingestion | Database errors by type |
| `django_db_execute_many_duration_seconds_bucket` | Performance | Database query duration histogram |
| `celery_worker_tasks_active` | System health | Tasks currently executing (exporter metric) |
| `celery_tasks_total` | Ingestion, webhooks | Task outcomes by `name` and `state` |
| `celery_task_runtime_seconds_bucket` | System health, ingestion, webhooks | Task runtime histogram |
| `soroscan_celery_queue_depth` | Celery queue | Pending messages per queue |
| `soroscan_celery_tasks_active` | Celery queue | Active tasks per `task_name` |
| `soroscan_celery_tasks_total` | Celery queue | Task outcomes per `status` and `task_name` |
| `soroscan_celery_task_duration_seconds` | Celery queue | Task duration histogram |
| `soroscan_celery_workers_online` | Celery queue | Workers responding to `inspect ping` |

## Related pages

- [Monitoring & Observability](../deployment/monitoring.md) — Prometheus
  configuration, alerts, and SLOs.
- [Celery Task Queue Monitoring](../features/celery-task-queue-monitoring.md) —
  custom Celery metrics, alert rules, and the status API.
- [Structured Logging Standard](./structured-logging.md) — correlating logs with
  the events shown on these dashboards.
- [`k8s/README.md`](https://github.com/SoroScan/soroscan/blob/main/k8s/README.md)
  — how the Kubernetes manifests fit together.
