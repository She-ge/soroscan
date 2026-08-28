# Playbook: Webhook Delivery Failure Burst

**Alert:** `SoroScanWebhookFailureBurst` / remediation condition `webhook_delivery_failure_burst`  
**Severity:** critical  
**SLO impact:** Subscriber notification reliability

## Detection

- Spike in `WebhookDeliveryLog` rows with status `failed` or `dead_letter`.
- Subscriptions auto-suspended after retry exhaustion.
- Celery webhook queue failure rate elevated.

## Alert → action mapping

| Step | Owner | Action |
|------|-------|--------|
| 1 | Automation | `send_alert` with failure counts / ratio |
| 2 | Automation (after grace) | `disable_webhooks` for the affected contract |
| 3 | On-call | Inspect subscriber endpoint health and HMAC validation |
| 4 | On-call | Fix subscriber or rotate secrets |
| 5 | On-call | Replay missed events via `POST /api/ingest/webhooks/{id}/replay/` |
| 6 | On-call | Re-enable webhooks |

## Investigation commands

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://api/api/ingest/webhooks/{id}/deliveries/?status=failed"
curl -H "Authorization: Bearer $TOKEN" \
  -X POST https://api/api/ingest/webhooks/{id}/replay/ \
  -H 'Content-Type: application/json' \
  -d '{"from_date":"2026-01-01T00:00:00Z","rate_limit_per_second":2,"dry_run":true}'
```

## Automation

```json
{
  "type": "webhook_delivery_failure_burst",
  "window_minutes": 10,
  "failure_threshold": 20,
  "failure_ratio_percent": 50
}
```

Actions: `[{"type": "send_alert"}, {"type": "disable_webhooks"}]`

## Resolution checklist

- [ ] Subscriber restored and test/ping succeeds
- [ ] Replay job completed (or dry-run reviewed)
- [ ] Webhooks re-enabled
- [ ] DLQ items marked resolved
