/**
 * Static documentation content map.
 * All Markdown strings are embedded at build time — no runtime fs reads needed.
 */

export const DOC_CONTENT: Record<string, string> = {
  quickstart: `# Quickstart Guide

Get up and running with SoroScan in under 5 minutes.

## 1. Get Your API Key

Register at the SoroScan portal to generate your API key. Keys are scoped per project and rate-limited by plan.

\`\`\`bash
curl https://soroscan.io/api/auth/token/ \\
  -H 'Content-Type: application/json' \\
  -d '{"email": "you@example.com", "password": "yourpassword"}'
\`\`\`

Response:
\`\`\`json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "1", "email": "you@example.com" }
}
\`\`\`

## 2. Register a Contract

Whitelist your Soroban contract address so SoroScan can begin indexing its events.

\`\`\`bash
curl -X POST https://soroscan.io/api/contracts/ \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{"contract_id": "CABC...9X4Z", "label": "my-amm"}'
\`\`\`

## 3. Query Events

Start querying indexed events immediately via REST or GraphQL.

\`\`\`bash
curl 'https://soroscan.io/api/events/?contract_id=CABC...9X4Z&limit=10' \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
\`\`\`

## 4. Subscribe to Webhooks

Get real-time push notifications when events occur.

\`\`\`bash
curl -X POST https://soroscan.io/api/webhooks/ \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "url": "https://your-app.com/webhook",
    "event_type": "SWAP_COMPLETE",
    "contract_id": "CABC...9X4Z"
  }'
\`\`\`

## Next Steps

- [Authentication Guide](/developer-portal/docs/authentication) — Token management, refresh flows, scopes
- [GraphQL API](/developer-portal/docs/api-reference/events) — Full schema reference
- [SDK Documentation](/developer-portal/docs/sdks/python) — Python, JavaScript, Go SDKs
- [Webhook Guide](/developer-portal/docs/webhooks) — Verify signatures, retry logic
`,

  authentication: `# Authentication

SoroScan uses JWT (JSON Web Token) based authentication. All API endpoints require a valid Bearer token.

## Obtaining Tokens

POST to \`/api/auth/token/\` with your credentials:

\`\`\`bash
curl -X POST https://soroscan.io/api/auth/token/ \\
  -H 'Content-Type: application/json' \\
  -d '{"email": "user@example.com", "password": "secret"}'
\`\`\`

Response:
\`\`\`json
{
  "access": "eyJhbGci...",
  "refresh": "eyJhbGci..."
}
\`\`\`

- **Access token**: Short-lived (15 minutes). Use in all API requests.
- **Refresh token**: Long-lived (7 days). Use to obtain new access tokens.

## Using the Token

\`\`\`bash
curl https://soroscan.io/api/events/ \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
\`\`\`

## Refreshing Tokens

\`\`\`bash
curl -X POST https://soroscan.io/api/auth/token/refresh/ \\
  -H 'Content-Type: application/json' \\
  -d '{"refresh": "YOUR_REFRESH_TOKEN"}'
\`\`\`

## Rate Limits

| Plan | Requests/hour |
|------|--------------|
| Free | 1,000 |
| Pro | 10,000 |
| Enterprise | Custom |

Rate limit headers in every response:

\`\`\`
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1706745600
\`\`\`

## Error Responses

| Status | Meaning |
|--------|---------|
| \`401 Unauthorized\` | Missing or expired token |
| \`403 Forbidden\` | Valid token but insufficient permissions |
`,

  webhooks: `# Webhooks

SoroScan delivers real-time event notifications to your endpoint via HTTP POST. Payloads are HMAC-SHA256 signed.

## Creating a Subscription

\`\`\`bash
curl -X POST https://soroscan.io/api/webhooks/ \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "url": "https://your-app.com/webhook",
    "event_type": "SWAP_COMPLETE",
    "contract_id": "CABC...9X4Z",
    "secret": "your-webhook-secret"
  }'
\`\`\`

## Payload Structure

\`\`\`json
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
\`\`\`

## Signature Verification

Each delivery includes an \`X-SoroScan-Signature\` header. **Always verify this in production.**

\`\`\`python
import hmac
import hashlib

def verify_signature(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)
\`\`\`

## Retry Policy

| Attempt | Delay |
|---------|-------|
| 1st retry | 1 minute |
| 2nd retry | 5 minutes |
| 3rd retry | 30 minutes |
| 4th retry | 2 hours |
| Final retry | 8 hours |
`,

  "sdks/python": `# Python SDK

The SoroScan Python SDK provides a convenient interface for querying events, managing contracts, and configuring webhooks.

## Installation

\`\`\`bash
pip install soroscan
\`\`\`

## Authentication

\`\`\`python
from soroscan import SoroScanClient

client = SoroScanClient(api_key="sk_live_your_key_here")
\`\`\`

## Listing Events

\`\`\`python
events = await client.events.list(
    contract_id="CABC...9X4Z",
    event_type="SWAP_COMPLETE",
    limit=50,
)

for event in events:
    print(f"Ledger {event.ledger}: {event.event_type}")
\`\`\`

## Registering a Contract

\`\`\`python
contract = await client.contracts.create(
    contract_id="CABC...9X4Z",
    label="my-amm-contract"
)
print(f"Registered: {contract.id}")
\`\`\`

## Managing Webhooks

\`\`\`python
webhook = await client.webhooks.create(
    url="https://your-app.com/webhook",
    event_type="SWAP_COMPLETE",
    contract_id="CABC...9X4Z",
    secret="your-hmac-secret"
)
\`\`\`

## Error Handling

\`\`\`python
from soroscan.exceptions import AuthenticationError, RateLimitError, NotFoundError

try:
    events = await client.events.list(contract_id="INVALID")
except AuthenticationError:
    print("Invalid API key")
except RateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after} seconds")
except NotFoundError:
    print("Contract not found")
\`\`\`
`,

  "sdks/javascript": `# JavaScript / TypeScript SDK

The SoroScan SDK for JavaScript and TypeScript provides a type-safe interface for interacting with the SoroScan API.

## Installation

\`\`\`bash
npm install @soroscan/sdk
\`\`\`

## Authentication

\`\`\`typescript
import { SoroScanClient } from "@soroscan/sdk"

const client = new SoroScanClient({ apiKey: "sk_live_your_key_here" })
\`\`\`

## Listing Events

\`\`\`typescript
const { events } = await client.events.list({
  contractId: "CABC...9X4Z",
  eventType: "SWAP_COMPLETE",
  limit: 50
})

events.forEach(event => {
  console.log(\`Ledger \${event.ledger}: \${event.eventType}\`)
})
\`\`\`

## Managing Webhooks

\`\`\`typescript
const webhook = await client.webhooks.create({
  url: "https://your-app.com/webhook",
  eventType: "SWAP_COMPLETE",
  contractId: "CABC...9X4Z",
  secret: "your-hmac-secret"
})
console.log(\`Webhook ID: \${webhook.id}\`)
\`\`\`

## Error Handling

\`\`\`typescript
import { SoroScanClient, AuthenticationError, RateLimitError } from "@soroscan/sdk"

try {
  const { events } = await client.events.list({ contractId: "INVALID" })
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Invalid API key")
  } else if (error instanceof RateLimitError) {
    console.error(\`Rate limited. Retry after \${error.retryAfter}s\`)
  }
}
\`\`\`
`,

  "sdks/go": `# Go SDK

The SoroScan Go SDK provides idiomatic Go bindings for the SoroScan APIs.

## Installation

\`\`\`bash
go get github.com/soroscan/soroscan-go
\`\`\`

## Authentication

\`\`\`go
package main

import (
    soroscan "github.com/soroscan/soroscan-go"
)

func main() {
    client := soroscan.NewClient("sk_live_your_key_here")
}
\`\`\`

## Listing Events

\`\`\`go
events, err := client.Events.List(ctx, &soroscan.EventListOptions{
    ContractID: "CABC...9X4Z",
    EventType:  "SWAP_COMPLETE",
    Limit:      50,
})
if err != nil {
    panic(err)
}

for _, event := range events {
    fmt.Printf("Ledger %d: %s\\n", event.Ledger, event.EventType)
}
\`\`\`

## Managing Webhooks

\`\`\`go
webhook, err := client.Webhooks.Create(ctx, &soroscan.WebhookCreateInput{
    URL:        "https://your-app.com/webhook",
    EventType:  "SWAP_COMPLETE",
    ContractID: "CABC...9X4Z",
    Secret:     "your-hmac-secret",
})
if err != nil {
    panic(err)
}
fmt.Printf("Webhook ID: %s\\n", webhook.ID)
\`\`\`

## Error Handling

\`\`\`go
import "errors"

var rateLimitErr *soroscan.RateLimitError
if errors.As(err, &rateLimitErr) {
    fmt.Printf("Rate limited. Retry after %d seconds\\n", rateLimitErr.RetryAfter)
}
\`\`\`
`,

  "api-reference/contracts": `# Contracts API Reference

## Endpoints

### List Contracts

\`\`\`
GET /api/contracts/
\`\`\`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| \`limit\` | integer | Number of results (default: 20, max: 100) |
| \`offset\` | integer | Pagination offset |

**Response:**

\`\`\`json
{
  "count": 42,
  "results": [
    {
      "id": "1",
      "contract_id": "CABC...9X4Z",
      "label": "my-amm",
      "created_at": "2024-01-15T10:00:00Z",
      "event_count": 15234
    }
  ]
}
\`\`\`

### Register Contract

\`\`\`
POST /api/contracts/
\`\`\`

**Request Body:**

\`\`\`json
{
  "contract_id": "CABC...9X4Z",
  "label": "my-amm"
}
\`\`\`

### Get Contract

\`\`\`
GET /api/contracts/{id}/
\`\`\`

### Delete Contract

\`\`\`
DELETE /api/contracts/{id}/
\`\`\`

Returns \`204 No Content\`.

## GraphQL

\`\`\`graphql
query ListContracts {
  contracts {
    id
    name
    address
    riskScore
    vulnerabilities {
      severity
      title
    }
  }
}
\`\`\`
`,

  "api-reference/events": `# Events API Reference

## Endpoints

### List Events

\`\`\`
GET /api/events/
\`\`\`

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| \`contract_id\` | string | Filter by contract ID |
| \`event_type\` | string | Filter by event type |
| \`since\` | ISO 8601 | Events after this timestamp |
| \`limit\` | integer | Number of results (default: 20, max: 100) |

**Response:**

\`\`\`json
{
  "count": 15234,
  "results": [
    {
      "id": "evt_xyz789",
      "contract_id": "CABC...9X4Z",
      "event_type": "SWAP_COMPLETE",
      "ledger": 12345678,
      "timestamp": "2024-01-15T10:05:32Z",
      "data": { "amount_in": "1000000", "token_in": "XLM" }
    }
  ]
}
\`\`\`

### Get Event

\`\`\`
GET /api/events/{id}/
\`\`\`

## GraphQL

\`\`\`graphql
query GetEvents($contractId: String!, $limit: Int) {
  events(contractId: $contractId, first: $limit) {
    edges {
      node {
        id
        contractId
        eventType
        data
        createdAt
      }
    }
  }
}
\`\`\`

## Event Types

| Event Type | Description |
|------------|-------------|
| \`TRANSFER\` | Token transfer between accounts |
| \`SWAP_COMPLETE\` | DEX swap completed |
| \`LIQUIDITY_ADDED\` | Liquidity provided to pool |
| \`LIQUIDITY_REMOVED\` | Liquidity withdrawn from pool |
`,

  "api-reference/webhooks": `# Webhooks API Reference

## Endpoints

### List Webhooks

\`\`\`
GET /api/webhooks/
\`\`\`

### Create Webhook

\`\`\`
POST /api/webhooks/
\`\`\`

**Request Body:**

\`\`\`json
{
  "url": "https://your-app.com/webhook",
  "event_type": "SWAP_COMPLETE",
  "contract_id": "CABC...9X4Z",
  "secret": "your-hmac-secret"
}
\`\`\`

### Delete Webhook

\`\`\`
DELETE /api/webhooks/{id}/
\`\`\`

### List Deliveries

\`\`\`
GET /api/webhooks/{id}/deliveries/
\`\`\`

## Webhook Payload Schema

\`\`\`json
{
  "webhook_id": "wh_abc123",
  "event_id": "evt_xyz789",
  "contract_id": "CABC...9X4Z",
  "event_type": "SWAP_COMPLETE",
  "ledger": 12345678,
  "timestamp": "2024-01-15T10:05:32Z",
  "data": {}
}
\`\`\`

## Delivery Headers

| Header | Description |
|--------|-------------|
| \`X-SoroScan-Signature\` | HMAC-SHA256 of the payload body |
| \`X-SoroScan-Webhook-Id\` | Subscription ID |
| \`X-SoroScan-Event-Id\` | Event ID (idempotency key) |
| \`X-SoroScan-Timestamp\` | Unix timestamp of delivery |
`,
};

export function getDocContent(slug: string): string {
  return DOC_CONTENT[slug] ?? `# Not Found\n\nNo documentation found for \`${slug}\`.`;
}

export const ALL_DOC_SLUGS = Object.keys(DOC_CONTENT);
