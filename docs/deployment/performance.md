---
slug: /deployment/performance

title: Performance Tuning & Load Testing
description: DB optimizations, caching, connection pooling, and benchmarking methodology.
sidebar_label: Performance
hide_title: false
---

Guidance for tuning performance and running benchmarks.

## Database tuning
- Index frequently queried columns (e.g., `contract_id`, `tx_hash`, `event_type`).
- Monitor slow queries via `pg_stat_statements`.
- Use connection pooling (PgBouncer) in transaction-pooling mode for web frontends.

## Redis caching strategy
- Cache expensive GraphQL/REST queries with stable keys and TTLs.
- Use separate Redis databases for caching and Celery broker if traffic is high.

## Connection pooling
- For Django use `CONN_MAX_AGE` sensibly and PgBouncer for larger fleets.
- Tune web server worker counts and concurrency (gunicorn/uvicorn) based on CPU.

## Load testing
- Use `k6` or `locust` for load tests.
- Establish baseline: p95 latency, error rate at 50, 100, 500 RPS.
- Scale resources and re-run tests; document before/after results.

## Benchmark baseline (example)
- Small: 3 node EKS, t3.medium — target 50 RPS with p95 < 300ms
- Medium: 5 node EKS, t3.large — target 200 RPS with p95 < 300ms

## Profiling
- Use Django debug toolbar in staging or lightweight profilers to find hotspots.
- Profile Celery tasks separately for event decoding and webhook delivery.
