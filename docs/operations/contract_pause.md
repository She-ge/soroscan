# Contract Pause and Suspension Workflows

This guide explains how operators can pause contract event indexing during security
incidents, contract upgrades, or maintenance windows, and how to resume indexing
once the situation is resolved.

---

## Table of Contents

1. [Overview](#overview)
2. [How Pausing Works](#how-pausing-works)
3. [Pausing a Contract](#pausing-a-contract)
   - [Django Admin](#django-admin)
   - [REST API](#rest-api)
   - [GraphQL API](#graphql-api)
   - [Automated Pause via Remediation Rules](#automated-pause-via-remediation-rules)
4. [Resuming a Contract](#resuming-a-contract)
   - [Manual Resume](#manual-resume)
   - [Scheduled Auto-Resume](#scheduled-auto-resume)
5. [Webhook Behaviour During Pause](#webhook-behaviour-during-pause)
6. [In-App Notifications](#in-app-notifications)
7. [Audit and Observability](#audit-and-observability)
8. [Common Scenarios](#common-scenarios)

---

## Overview

Every `TrackedContract` has an `is_active` boolean flag. When `is_active=False`:

- The ingestion layer stops indexing new events for that contract.
- Active webhook subscriptions receive no new deliveries.
- The contract still appears in the registry and all historical events are preserved.
- The contract can be resumed at any time by setting `is_active=True`.

Pausing is non-destructive. No data is deleted.

---

## How Pausing Works

The ingestion pipeline filters contracts by `is_active=True` when resolving a
contract from the cache or database:

```python
# soroscan/ingest/stellar_client.py
TrackedContract.objects.get(contract_id=contract_id, is_active=True)
```

If the lookup returns no result (because `is_active=False`), the ingestion
layer skips all events for that contract. Events that arrive during the pause
are not buffered — they are permanently skipped unless a manual reconciliation
is run afterwards (see [reconciliation docs](DATA_RETENTION.md)).

---

## Pausing a Contract

### Django Admin

1. Navigate to **Ingest → Tracked Contracts**.
2. Find the contract by `contract_id` or name.
3. Uncheck **Is active** and click **Save**.

Bulk pause: select multiple contracts, choose **Mark selected contracts as
inactive** from the **Action** dropdown, and click **Go**.

### REST API

```http
PATCH /api/contracts/{id}/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "is_active": false
}
```

**Response:**

```json
{
  "id": "123",
  "contract_id": "CABC...XYZ",
  "name": "My Token Contract",
  "is_active": false,
  "updated_at": "2024-06-01T10:00:00Z"
}
```

Filter all currently paused contracts:

```http
GET /api/contracts/?is_active=false
Authorization: Bearer <access_token>
```

### GraphQL API

```graphql
mutation PauseContract($contractId: String!) {
  updateContract(contractId: $contractId, isActive: false) {
    contractId
    isActive
  }
}
```

When `isActive: false` is passed, the mutation automatically pushes a
`contract_paused` in-app notification to the contract owner (see
[In-App Notifications](#in-app-notifications)).

Resume with the same mutation:

```graphql
mutation ResumeContract($contractId: String!) {
  updateContract(contractId: $contractId, isActive: true) {
    contractId
    isActive
  }
}
```

### Automated Pause via Remediation Rules

`RemediationRule` records can pause a contract automatically when an anomaly
is detected. The `evaluate_remediation_rules` Celery task runs every **5 minutes**.

**Supported conditions:**

| Condition type | Description |
|---|---|
| `no_events_for_minutes` | No events indexed for the contract within N minutes |
| `decode_error_spike` | Sudden increase in payload decoding failures |

**Supported actions:**

| Action type | Effect |
|---|---|
| `pause_contract` | Sets `is_active=False` on the contract |
| `disable_webhooks` | Suspends all webhook subscriptions for the contract |
| `send_alert` | Sends an alert to the configured target (Slack / email / webhook) |

**Create a remediation rule via the Django admin:**

1. Navigate to **Ingest → Remediation Rules → Add**.
2. Set **Name**, **Condition**, and **Actions**.
3. Set **Grace period minutes** — the rule waits this long after first detection
   before executing actions (default: 10 minutes).
4. Set **Alert type** and **Alert target** for the ops notification.
5. Enable **Dry run** to test the rule without executing actions.

**Example rule (Python / data migration):**

```python
from soroscan.ingest.models import RemediationRule

RemediationRule.objects.create(
    name="Pause on silence — CABC...XYZ",
    condition={
        "type": "no_events_for_minutes",
        "contract_id": "CABC...XYZ",
        "minutes": 60,
    },
    actions=[
        {"type": "pause_contract"},
        {"type": "send_alert"},
    ],
    enabled=True,
    grace_period_minutes=15,
    alert_type="slack",
    alert_target="https://hooks.slack.com/services/T.../B.../...",
    dry_run=False,
)
```

The rule creates a `RemediationIncident` record for each triggered anomaly.
Its lifecycle is: `alerted` → `executed` → `resolved`.

---

## Resuming a Contract

### Manual Resume

Use any of the methods above with `is_active=true` / `is_active=True`.

**REST API:**

```http
PATCH /api/contracts/{id}/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "is_active": true
}
```

**Django admin:** Re-check **Is active** and save.

After resuming, new events from the Stellar network are indexed normally. Events
that arrived while the contract was paused are not automatically backfilled. To
recover them, trigger a manual backfill or reconciliation job.

### Scheduled Auto-Resume

SoroScan does not have a built-in `resume_at` timestamp on contracts. To
implement scheduled auto-resume:

**Option 1 — Celery task (recommended):**

Create a one-off Celery task with `countdown` or `eta`:

```python
from celery import shared_task
from soroscan.ingest.models import TrackedContract

@shared_task
def resume_contract(contract_id: str):
    TrackedContract.objects.filter(contract_id=contract_id).update(is_active=True)

# Schedule resume in 2 hours
from datetime import timedelta
from django.utils import timezone

resume_contract.apply_async(
    args=["CABC...XYZ"],
    eta=timezone.now() + timedelta(hours=2),
)
```

**Option 2 — Remediation rule resolution:**

When the anomaly condition is no longer met, the `evaluate_remediation_rules`
task marks the `RemediationIncident` as `resolved`. You can hook a
post-resolution signal to re-enable the contract.

**Option 3 — External scheduler:**

Use a cron job or deployment pipeline step to call the REST or GraphQL API at a
predetermined time.

---

## Webhook Behaviour During Pause

When a contract is paused (`is_active=False`), no new events are ingested, so
no new webhook deliveries are triggered. Existing pending deliveries in the
Celery queue at the moment of pause will still be attempted (they were
enqueued before the pause took effect).

| State | Behaviour |
|---|---|
| Contract paused | No new events indexed → no new webhook dispatches |
| Pending deliveries at pause time | Completed normally (already queued) |
| Webhook subscription `is_active` | Unchanged by contract pause alone |
| `disable_webhooks` remediation action | Sets `WebhookSubscription.is_active=False` and `status=suspended` for all subscriptions on the contract |
| After contract resume | New events resume; webhook subscriptions must be manually re-enabled if `disable_webhooks` was executed |

To check webhook subscription status after a pause:

```http
GET /api/webhooks/?contract_id=CABC...XYZ
Authorization: Bearer <access_token>
```

To re-enable a suspended webhook subscription:

```http
PATCH /api/webhooks/{id}/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "is_active": true,
  "status": "active"
}
```

---

## In-App Notifications

When a contract is paused via the **GraphQL `updateContract` mutation** with
`isActive: false`, the system automatically pushes a `contract_paused` in-app
notification to the contract owner:

```json
{
  "notification_type": "contract_paused",
  "title": "Contract Paused",
  "message": "Indexing for contract '<name>' has been paused.",
  "link": "/contracts/<contract_id>"
}
```

This notification appears in the SoroScan dashboard notification centre and is
also delivered over the `notifications` GraphQL subscription if the owner has an
active WebSocket connection.

> **Note:** Pausing via the Django admin or direct REST `PATCH` does **not**
> trigger this notification. Use the GraphQL mutation when operator-facing
> visibility is required.

---

## Audit and Observability

**Check current pause status:**

```sql
SELECT contract_id, name, is_active, updated_at
FROM ingest_trackedcontract
WHERE is_active = FALSE
ORDER BY updated_at DESC;
```

**Check remediation incidents for a contract:**

```sql
SELECT r.name AS rule, i.status, i.first_detected_at, i.executed_at
FROM ingest_remediationincident i
JOIN ingest_remediationrule r ON i.rule_id = r.id
JOIN ingest_trackedcontract c ON i.contract_id = c.id
WHERE c.contract_id = 'CABC...XYZ'
ORDER BY i.first_detected_at DESC;
```

**Prometheus metrics:**

The `active_contracts_gauge` metric is updated each time a new event is
ingested. A sudden drop in this gauge indicates contracts have been paused.

**Admin summary endpoint:**

```http
GET /api/admin/contracts/summary/
Authorization: Bearer <admin_token>
```

Returns `active_contracts` and `paused_contracts` counts.

---

## Common Scenarios

### Security incident — immediate pause

```bash
# Pause via REST immediately
curl -X PATCH https://api.soroscan.io/api/contracts/<id>/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
```

Then investigate. When safe, resume:

```bash
curl -X PATCH https://api.soroscan.io/api/contracts/<id>/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_active": true}'
```

After resuming, trigger a backfill to recover events missed during the pause.

### Contract upgrade — planned maintenance window

1. Pause the contract before deploying the new contract version.
2. Deploy and verify the upgrade on-chain.
3. Update the `contract_id` in the registry if the address changed.
4. Resume indexing.

### Automated pause on silence

Create a `RemediationRule` with `no_events_for_minutes` condition pointing to the
contract and `pause_contract` action. The system will pause automatically after
the grace period and alert your ops channel. Once the root cause is resolved,
mark the `RemediationIncident` as resolved (admin: **Ingest → Remediation
Incidents → mark resolved**) and manually resume the contract.
