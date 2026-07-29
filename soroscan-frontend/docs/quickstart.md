# Quickstart Guide

Get up and running with SoroScan in under 5 minutes.

## 1. Get Your API Key

Register at the SoroScan portal to generate your API key. Keys are scoped per project and rate-limited by plan.

```bash
curl https://soroscan.io/api/auth/token \
  -H 'Content-Type: application/json' \
  -d '{"email": "you@example.com", "password": "yourpassword"}'
```

Response:
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "1", "email": "you@example.com" }
}
```

## 2. Register a Contract

Whitelist your Soroban contract address so SoroScan can begin indexing its events.

```bash
curl -X POST https://soroscan.io/api/contracts/ \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"contract_id": "CABC...9X4Z", "label": "my-amm"}'
```

## 3. Query Events

Start querying indexed events immediately via REST or GraphQL.

```bash
curl 'https://soroscan.io/api/events/?contract_id=CABC...9X4Z&limit=10' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
```

## 4. Subscribe to Webhooks

Get real-time push notifications when events occur.

```bash
curl -X POST https://soroscan.io/api/webhooks/ \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://your-app.com/webhook",
    "event_type": "SWAP_COMPLETE",
    "contract_id": "CABC...9X4Z"
  }'
```

## Next Steps

- [Authentication Guide](/developer-portal/docs/authentication) — Token management, refresh flows, scopes
- [GraphQL API](/developer-portal/docs/api-reference/events) — Full schema reference
- [SDK Documentation](/developer-portal/docs/sdks/python) — Python, JavaScript, Go SDKs
- [Webhook Guide](/developer-portal/docs/webhooks) — Verify signatures, retry logic
