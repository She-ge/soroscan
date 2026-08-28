# Webhooks

SoroScan delivers real-time event notifications to your endpoint via HTTP POST. Payloads are HMAC-SHA256 signed for security.

## Creating a Subscription

```bash
curl -X POST https://soroscan.io/api/webhooks/ \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://your-app.com/webhook",
    "event_type": "SWAP_COMPLETE",
    "contract_id": "CABC...9X4Z",
    "secret": "your-webhook-secret"
  }'
```

Response:
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

## Payload Structure

Every delivery sends a JSON payload:

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

Each delivery includes an `X-SoroScan-Signature` header. **Always verify this in production.**

### Python

```python
import hmac
import hashlib

def verify_signature(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)

# In your webhook handler:
signature = request.headers.get("X-SoroScan-Signature", "")
if not verify_signature(request.body, signature, "your-webhook-secret"):
    return HttpResponse(status=401)
```

### TypeScript

```typescript
import * as crypto from "crypto"

function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")
  return crypto.timingSafeEqual(
    Buffer.from(`sha256=${expected}`),
    Buffer.from(signature)
  )
}
```

## Retry Policy

Failed deliveries are retried with exponential backoff:

| Attempt | Delay |
|---------|-------|
| 1st retry | 1 minute |
| 2nd retry | 5 minutes |
| 3rd retry | 30 minutes |
| 4th retry | 2 hours |
| Final retry | 8 hours |

After 5 failed attempts, the subscription is marked as **suspended**.

## Managing Subscriptions

```bash
# List subscriptions
curl https://soroscan.io/api/webhooks/ \
  -H 'Authorization: Bearer YOUR_TOKEN'

# Delete a subscription
curl -X DELETE https://soroscan.io/api/webhooks/wh_abc123/ \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

## Delivery Headers

| Header | Description |
|--------|-------------|
| `X-SoroScan-Signature` | HMAC-SHA256 of the payload body |
| `X-SoroScan-Webhook-Id` | Unique webhook subscription ID |
| `X-SoroScan-Event-Id` | Unique event ID (for deduplication) |
| `X-SoroScan-Timestamp` | Unix timestamp of delivery |
| `Content-Type` | Always `application/json` |
