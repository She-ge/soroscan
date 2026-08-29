# Playbook: Event Ingestion Lag

**Alert:** `SoroScanEventIngestionLag` / remediation condition `event_ingestion_lag`  
**Severity:** critical  
**SLO impact:** Indexed event freshness

## Detection

- Contract `last_event_at` older than the configured threshold (default 15 minutes).
- Completeness reconcile reports rising ledger gaps.
- Celery ingest queue depth climbing without corresponding event writes.

## Alert → action mapping

| Step | Owner | Action |
|------|-------|--------|
| 1 | Automation | `send_alert` to on-call (Slack/PagerDuty) |
| 2 | Automation (after grace) | `pause_contract` to stop compounding incomplete state |
| 3 | On-call | Verify RPC/Horizon health and Celery worker liveness |
| 4 | On-call | Run `reconcile_event_completeness` / backfill missing ledgers |
| 5 | On-call | Resume contract indexing once catch-up completes |

## Investigation commands

```bash
kubectl logs deploy/soroscan-celery -n soroscan --tail=200
curl -H "Authorization: Bearer $TOKEN" https://api/api/ingest/contracts/{id}/completeness/
curl -H "Authorization: Bearer $TOKEN" https://api/api/health/workers/
```

## Automation

RemediationRule condition:

```json
{"type": "event_ingestion_lag", "minutes": 15}
```

Actions: `[{"type": "send_alert"}, {"type": "pause_contract"}]`

## Resolution checklist

- [ ] Lag root cause identified (RPC, worker, filter, pause)
- [ ] Missing ledgers backfilled
- [ ] Contract resumed / rule incident marked resolved
- [ ] Post-incident notes added
