# Monitoring, Logging & Observability Guide

This guide explains what to monitor, how to collect logs and metrics, and how to build useful dashboards and alerts for
SoroScan.

- [Structured Logging Standard](./structured-logging.md) — canonical log format, field naming, levels, error and masking
  rules.
- [Grafana Dashboards](./grafana-dashboards.md) — the five packaged dashboard
  templates, the panels and Prometheus metrics they query, and
  import/provisioning steps.

## Observability Strategy

- Observe three pillars: metrics, logs, and traces.
- Use RED (Rate, Errors, Duration) and USE (Utilization, Saturation, Errors) methods.
- Define service-level objectives (SLOs) for availability and latency.

## Metrics & Prometheus

- Configure application metrics and export them to Prometheus.
- Track key metrics such as request rate, error rate, latency, queue depth, and cache hit ratio.
- Watch cardinality to prevent metric explosion.
- Use PromQL to analyze service performance and build alerts.

## Logging Strategy

- Use structured logs for consistent fields and easier parsing.
- Apply clear log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL.
- Aggregate logs in a central platform such as Loki, Elasticsearch, or hosted logging.
- Define retention policies appropriate to support troubleshooting and compliance.

## Distributed Tracing

- Instrument services with OpenTelemetry or equivalent tracing libraries.
- Configure trace sampling to balance visibility and cost.
- Use traces to investigate latency, error propagation, and request flow.

## Grafana Dashboards

- Import the packaged templates instead of building dashboards from scratch: see
  [Grafana Dashboards](./grafana-dashboards.md) for the five dashboards in
  `k8s/grafana-templates/` and the import/provisioning workflow.
- The templates cover system health, event ingestion, webhook delivery, API
  performance, and the Celery task queue.
- Create additional panels for request latency and error trends as needed.
- Use alerts on key thresholds such as high error rate, request latency regression, or backend queue saturation.

## Practical Observability

- Monitor both infrastructure and application-level signals.
- Correlate logs, metrics, and traces for faster root cause analysis.
- Keep dashboards focused and actionable, with clear alert definitions.
