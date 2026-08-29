# Playbook: Database Connection Pool Exhausted

**Alert:** `SoroScanDbPoolExhausted` / remediation condition `database_connection_pool_exhausted`  
**Severity:** critical  
**SLO impact:** API and ingest availability

## Detection

- `GET /api/meta/db-pool/` shows total/active near configured hard limit.
- Prometheus `soroscan_db_pool_connections` approaching `soroscan_db_pool_configured_limit`.
- Request latency and 5xx rate rising.

## Alert → action mapping

| Step | Owner | Action |
|------|-------|--------|
| 1 | Automation | `send_alert` with utilization snapshot |
| 2 | On-call | Confirm via `/api/meta/db-pool/` and `pg_stat_activity` |
| 3 | On-call | Terminate idle/long queries; reduce worker concurrency |
| 4 | On-call | Temporarily scale down Celery replicas or raise pool limit carefully |
| 5 | On-call | Fix connection leaks / missing `conn.close()` paths |

## Investigation commands

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://api/api/meta/db-pool/
kubectl top pods -n soroscan
# On DB host / via psql:
# SELECT state, count(*) FROM pg_stat_activity GROUP BY 1;
```

## Automation

```json
{"type": "database_connection_pool_exhausted", "utilization_percent": 90}
```

Actions: `[{"type": "send_alert"}]`  
(No automatic scale-up — capacity changes require human approval.)

## Resolution checklist

- [ ] Utilization back under 70%
- [ ] Leak or hot query identified
- [ ] Pool sizing reviewed against `calculate_pool_limits`
- [ ] Follow-up ticket filed if hard limit change needed
