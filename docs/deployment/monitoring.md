---
slug: /deployment/monitoring

title: Monitoring & Observability
description: Prometheus, Grafana, logging, alerting, and SLOs for SoroScan.
sidebar_label: Monitoring
hide_title: false
---

This page explains how to monitor SoroScan in production: metrics, dashboards, logs, and alerting.

## Metrics (Prometheus)
- Expose application metrics via `django-prometheus` or `prometheus_client`.
- Scrape targets:
  - `soroscan-backend` `/metrics`
  - `celery` workers `/metrics`
  - Postgres exporter
  - Redis exporter

### Important application metrics
- `http_request_duration_seconds` (95th/99th percentile)
- `http_requests_total` (by endpoint, status)
- `celery_task_duration_seconds` (latency of ingest tasks)
- `events_indexed_total` and `events_indexed_rate`
- `webhook_delivery_success_total` and `webhook_delivery_failure_total`
- `soroscan_db_pool_connections` and `soroscan_db_pool_configured_limit`
- `soroscan_celery_queue_depth`, `soroscan_celery_tasks_active`,
  `soroscan_celery_tasks_total`, and `soroscan_celery_task_duration_seconds`

## Grafana dashboards
- Import `k8s/grafana-dashboard.json` as a starting point.
- Key panels:
  - API latency (p95/p99)
  - Error rate (5xx) per minute
  - Celery queue depth and task latency
  - DB connections and slow queries
  - Redis memory & hit/miss rate

## Logging strategy
- Structured JSON logs from Django & Celery (logfmt or JSON).
- Centralize logs to Loki or ELK (Elasticsearch + Logstash + Kibana).
- Include request id, user id (if available), contract id, and correlation id in logs.

## Alerting
- Use Alertmanager for Prometheus alerts. Example alerts:
  - High API error rate: alert when 5xx rate > 1% for 5min
  - High latency: p95 > X ms for 5min
  - DB connection saturation: connections > 80% of max
  - Celery queue backlog: pending tasks > threshold
  - Webhook failure spikes: failure rate increased by 5x

Apply the checked-in SLA rules with:

```bash
kubectl apply -f k8s/prometheus-rules.yaml
```

The warning API alert fires above 1% 5xx responses for five minutes; the
critical alert fires above 5% for two minutes. Both include the service label
and a PromQL root-cause query grouped by view and error type. Celery alerts
cover queue depth above 100 and task failure rate above 5%.

## Incident escalation
- Configure Alertmanager to send critical alerts to PagerDuty or Slack.
- Use runbooks (see Runbooks page) for standard remediation steps.

## Health checks
- Liveness probe: simple Django endpoint `/health/` returning 200
- Readiness probe: `/ready/` verifying DB and Redis connectivity

## SLOs and SLIs
- Example SLOs:
  - 99.9% availability for the API
  - p95 request latency < 500ms for list queries
- Track SLIs via Prometheus and report in Grafana.
