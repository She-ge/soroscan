# SoroScan Grafana Dashboard Templates

This folder contains reusable Grafana dashboard JSON templates for common monitoring scenarios.

## Templates

- `system-health-overview.json`: service uptime, error rates, queue pressure, and resource health.
- `event-ingestion-metrics.json`: ingestion throughput, lag, deduplication, and error tracking.
- `webhook-delivery-status.json`: delivery success rate, retries, response latency, and failure diagnostics.
- `performance-analysis.json`: API latency percentiles, DB query performance, and worker runtime analysis.
- `celery-task-queue.json`: pending/active/completed tasks, failures, duration, queue depth, and worker availability.

## Template Features

- Multi-instance dashboard variables: `namespace` (system health only), `job`, and `instance`.
- The Prometheus datasource is supplied at import time via the `DS_PROMETHEUS` input.
- Event annotations for timeline correlation (deployments, incidents, regressions, retry spikes, queue backlogs).
- Exportable JSON dashboards for easy sharing/importing.

## Usage

1. Open Grafana and navigate to **Dashboards -> New -> Import**.
2. Upload one of the JSON files in this folder.
3. Select your Prometheus datasource when prompted.
4. Adjust variable defaults (`namespace`, `job`, `instance`) for your environment.
