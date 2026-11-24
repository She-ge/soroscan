# Playbook: Celery Queue Backlog

**Alert:** `SoroScanCeleryQueueBacklog` / remediation condition `celery_queue_backlog`  
**Severity:** high (critical if backlog doubles for 3 consecutive checks)  
**SLO impact:** Event indexing freshness and webhook delivery latency

## Detection

- Celery queue depth above the configured threshold (default 1,000 messages)
  or growing monotonically for 10 minutes with no sign of draining.
- Queue age (oldest unacked task) exceeds 15 minutes.
- Worker heartbeats stale on one or more queues while producers keep enqueuing.
- Redis list length for Celery queues growing faster than completion rate.

Queue depth can be inspected directly per queue:

```bash
redis-cli -u "$REDIS_URL" llen high_priority
redis-cli -u "$REDIS_URL" llen default
redis-cli -u "$REDIS_URL" llen low_priority
redis-cli -u "$REDIS_URL" llen backfill
```

## Alert → action mapping

| Step | Owner | Action |
|------|-------|--------|
| 1 | Automation | `send_alert` to on-call (Slack/PagerDuty) |
| 2 | Automation (after grace) | `send_alert` again with queue identifier and depth trend |
| 3 | On-call | Identify which queue is backing up and whether workers are alive |
| 4 | On-call | Scale workers on the affected queue or restart wedged workers |
| 5 | On-call | Pause or rate-limit producers (ingest scheduling, webhooks) if enqueue rate exceeds capacity |
| 6 | On-call | Requeue stranded tasks once workers are healthy again |

## Triage

1. **Which queue?** Compare depths above. `high_priority` and `default`
   backlogs affect customer-facing freshness first; `backfill` may be
   intentionally deep during catch-up runs.
1. **Worker or producer problem?**
   - Workers healthy but stalled: check task soft-time-limit expiries,
     database connection pool exhaustion, and RPC availability
     (see [rpc-endpoint-unavailable.md](./rpc-endpoint-unavailable.md)).
   - Workers dead: `kubectl pods -n soroscan` for restart/OOM loops.
   - Producers flooding: check beat schedule and ingest task enqueues for a
     burst (e.g. a contract added and backfilling).
1. **Poison tasks?** A single task crashing workers repeatedly re-drives the
   backlog; check Celery logs for repeated failures on the same task ID.

## Remediation

Scale the workers for the affected queue (Compose names shown; k8s equivalent
uses the celery deployment replicas):

```bash
docker compose up -d --scale worker-default=4 worker-default
kubectl scale deploy/soroscan-celery-webhook --replicas=4 -n soroscan
```

Restart wedged workers gracefully (finishes current tasks first):

```bash
docker compose restart worker-high worker-default
```

Pause producers while you recover (prevents the backlog from growing):

```bash
python manage.py pause_contract --contract-id "<id>"
python manage.py shell -c "from soroscan.ingest.services import incident_playbooks; \
print(incident_playbooks.evaluate_remediation_rules())"
```

Purge or requeue the queue only as a last resort and only if tasks are safely
idempotent or reproducible via backfill:

```bash
kubectl exec deploy/soroscan-celery-default -n soroscan -- \
  celery -A soroscan inspect reserved
```

Resume paused producers once queue depth is falling.

## Investigation commands

```bash
kubectl logs deploy/soroscan-celery-default -n soroscan --tail=200
redis-cli -u "$REDIS_URL" llen default
curl -H "Authorization: Bearer $TOKEN" https://api/api/health/workers/
celery -A soroscan inspect active -d celery@$HOSTNAME
```

## Automation

RemediationRule condition:

```json
{"type": "celery_queue_backlog", "minutes": 10}
```

Actions: `[{"type": "send_alert"}]`

Worker scaling is manual today; the automation role alerts and attaches the
queue depth series. Escalate to scaling by following the remediation section.

## Resolution checklist

- [ ] Backlog cause identified (worker crash, slow task, producer burst)
- [ ] Workers scaled/restarted and queue depth trending down
- [ ] Producers resumed if paused
- [ ] Backfill scheduled for any purged or skipped work
- [ ] Rule incident marked resolved
- [ ] Post-incident notes added
