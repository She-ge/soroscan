# Webhooks API Reference

## Endpoints

### List Webhooks

```
GET /api/webhooks/
```

**Response:**
```json
{
  "count": 3,
  "results": [
    {
      "id": "wh_abc123",
      "url": "https://your-app.com/webhook",
      "event_type": "SWAP_COMPLETE",
      "contract_id": "CABC...9X4Z",
      "active": true,
      "created_at": "2024-01-15T10:00:00Z",
      "last_delivery_at": "2024-01-15T11:30:00Z",
      "delivery_success_rate": 0.99
    }
  ]
}
```

### Create Webhook

```
POST /api/webhooks/
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhook",
  "event_type": "SWAP_COMPLETE",
  "contract_id": "CABC...9X4Z",
  "secret": "your-hmac-secret"
}
```

**Response (201):**
```json
{
  "id": "wh_abc123",
  "url": "https://your-app.com/webhook",
  "event_type": "SWAP_COMPLETE",
  "contract_id": "CABC...9X4Z",
  "active": true,
  "created_at": "2024-01-15T10:00:00Z"
}
```

### Get Webhook

```
GET /api/webhooks/{id}/
```

### Update Webhook

```
PATCH /api/webhooks/{id}/
```

**Request Body (partial):**
```json
{
  "active": false
}
```

### Delete Webhook

```
DELETE /api/webhooks/{id}/
```

Returns `204 No Content`.

### List Deliveries

```
GET /api/webhooks/{id}/deliveries/
```

**Response:**
```json
{
  "count": 150,
  "results": [
    {
      "id": "del_xyz789",
      "webhook_id": "wh_abc123",
      "event_id": "evt_123",
      "status": "success",
      "response_code": 200,
      "duration_ms": 234,
      "attempt": 1,
      "delivered_at": "2024-01-15T11:30:00Z"
    }
  ]
}
```

## Webhook Payload Schema

Every webhook delivery posts this JSON structure:

```json
{
  "webhook_id": "wh_abc123",
  "event_id": "evt_xyz789",
  "contract_id": "CABC...9X4Z",
  "event_type": "SWAP_COMPLETE",
  "ledger": 12345678,
  "timestamp": "2024-01-15T10:05:32Z",
  "data": {
    "amount_in": "1000000",
    "amount_out": "950000",
    "token_in": "XLM",
    "token_out": "USDC"
  }
}
```

## Signature Verification

All deliveries include the `X-SoroScan-Signature` header:

```
X-SoroScan-Signature: sha256=abc123def456...
```

Compute expected: `HMAC-SHA256(request_body, your_secret)`, then compare with `sha256=` prefix.

## Delivery Headers

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `X-SoroScan-Signature` | `sha256=<hmac_hex>` |
| `X-SoroScan-Webhook-Id` | Subscription ID |
| `X-SoroScan-Event-Id` | Event ID (idempotency key) |
| `X-SoroScan-Timestamp` | Unix timestamp |

## Code Examples

### Python

```python
client = SoroScanClient(api_key="sk_live_...")

# Create
webhook = await client.webhooks.create(
    url="https://your-app.com/webhook",
    event_type="SWAP_COMPLETE",
    contract_id="CABC...9X4Z",
    secret="hmac-secret"
)

# List deliveries
deliveries = await client.webhooks.deliveries(webhook_id=webhook.id)

# Delete
await client.webhooks.delete(webhook_id=webhook.id)
```

### TypeScript

```typescript
const client = new SoroScanClient({ apiKey: "sk_live_..." })

const webhook = await client.webhooks.create({
  url: "https://your-app.com/webhook",
  eventType: "SWAP_COMPLETE",
  contractId: "CABC...9X4Z",
  secret: "hmac-secret"
})

const deliveries = await client.webhooks.deliveries({
  webhookId: webhook.id
})

await client.webhooks.delete({ webhookId: webhook.id })
```

### Go

```go
webhook, err := client.Webhooks.Create(ctx, &soroscan.WebhookCreateInput{
    URL:        "https://your-app.com/webhook",
    EventType:  "SWAP_COMPLETE",
    ContractID: "CABC...9X4Z",
    Secret:     "hmac-secret",
})

deliveries, err := client.Webhooks.Deliveries(ctx, webhook.ID, nil)

err = client.Webhooks.Delete(ctx, webhook.ID)
```
