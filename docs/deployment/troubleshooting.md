---
slug: /deployment/troubleshooting

title: Troubleshooting Production Issues
description: Quick diagnostics and remediation for common production problems.
sidebar_label: Troubleshooting
hide_title: false
---

Common issues and how to diagnose them quickly.

## High CPU / Memory
- Check pod metrics in Grafana.
- Inspect logs: `kubectl logs`.
- Common causes: large event payload decoding, runaway Celery tasks, memory leak.
- Remediation: restart offending pod, increase resources, add rate limiting.

## Database connection errors
- Check connection strings and DNS; verify `pg_isready`.
- Inspect DB connection pool usage; increase pool size or add read replicas.
- Verify max_connections on Postgres and tune application pool accordingly.

## Redis timeouts
- Check Redis memory usage and eviction policies.
- Use Redis INFO and monitor `used_memory`, `connected_clients`.
- Consider moving large caches to external stores or increasing memory.

## Event processing lag
- Inspect Celery queue length and task durations.
- Scale worker replicas and ensure Celery Beat and scheduler are healthy.

## Webhook delivery failures
- Inspect `WebhookDeliveryLog` and Celery worker logs.
- Check network reachability and TLS certificate validity for target endpoints.
- Implement exponential backoff and retries.

## API rate limit spikes
- Check rate limit analytics endpoint: `/api/analytics/rate-limits/`.
- Throttle abusive clients and consider temporary API key suspension.

## Debug commands
- View backend logs:
```bash
kubectl logs deployment/soroscan-backend -n soroscan
```
- Inspect Celery tasks:
```bash
kubectl exec -it deploy/soroscan-worker -n soroscan -- celery -A soroscan inspect active
```
- Database queries (slow queries):
```sql
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' ORDER BY duration DESC;
```
