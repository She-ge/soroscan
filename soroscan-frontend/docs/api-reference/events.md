# Events API Reference

## Endpoints

### List Events

```
GET /api/events/
```

Returns indexed Soroban contract events with filtering support.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `contract_id` | string | Filter by contract ID |
| `event_type` | string | Filter by event type (e.g., `SWAP_COMPLETE`) |
| `ledger_min` | integer | Minimum ledger sequence |
| `ledger_max` | integer | Maximum ledger sequence |
| `since` | ISO 8601 | Events after this timestamp |
| `until` | ISO 8601 | Events before this timestamp |
| `limit` | integer | Number of results (default: 20, max: 100) |
| `offset` | integer | Pagination offset |

**Response:**
```json
{
  "count": 15234,
  "next": "/api/events/?offset=20",
  "previous": null,
  "results": [
    {
      "id": "evt_xyz789",
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
  ]
}
```

### Get Event

```
GET /api/events/{id}/
```

**Response:**
```json
{
  "id": "evt_xyz789",
  "contract_id": "CABC...9X4Z",
  "event_type": "SWAP_COMPLETE",
  "ledger": 12345678,
  "timestamp": "2024-01-15T10:05:32Z",
  "transaction_hash": "a1b2c3...",
  "data": {
    "amount_in": "1000000",
    "amount_out": "950000",
    "token_in": "XLM",
    "token_out": "USDC"
  }
}
```

## GraphQL

```graphql
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
```

**Variables:**
```json
{
  "contractId": "CABC...9X4Z",
  "limit": 10
}
```

## Code Examples

### Python

```python
from soroscan import SoroScanClient, EventFilter
from datetime import datetime, timedelta

client = SoroScanClient(api_key="sk_live_...")

# List events with filtering
events = await client.events.list(
    contract_id="CABC...9X4Z",
    filter=EventFilter(
        event_type="SWAP_COMPLETE",
        since=datetime.utcnow() - timedelta(hours=24)
    ),
    limit=50
)

for event in events:
    print(f"{event.timestamp} | {event.event_type}")
    print(f"  Data: {event.data}")
```

### TypeScript

```typescript
import { SoroScanClient } from "@soroscan/sdk"

const client = new SoroScanClient({ apiKey: "sk_live_..." })

const { events } = await client.events.list({
  contractId: "CABC...9X4Z",
  eventType: "SWAP_COMPLETE",
  limit: 50
})

events.forEach(event => {
  console.log(`${event.timestamp} | ${event.eventType}`)
})
```

### Go

```go
events, err := client.Events.List(ctx, &soroscan.EventListOptions{
    ContractID: "CABC...9X4Z",
    EventType:  "SWAP_COMPLETE",
    Limit:      50,
})
if err != nil {
    log.Fatal(err)
}

for _, event := range events {
    fmt.Printf("%s | %s\n", event.Timestamp, event.EventType)
}
```

## Real-time Subscriptions (GraphQL)

```graphql
subscription OnContractEvent($contractId: String!) {
  contractEvent(contractId: $contractId) {
    id
    eventType
    ledgerSequence
    timestamp
    payload
  }
}
```

## Event Types

Common event types emitted by Soroban contracts:

| Event Type | Description |
|------------|-------------|
| `TRANSFER` | Token transfer between accounts |
| `SWAP_COMPLETE` | DEX swap completed |
| `LIQUIDITY_ADDED` | Liquidity provided to pool |
| `LIQUIDITY_REMOVED` | Liquidity withdrawn from pool |
| `CONTRACT_DEPLOYED` | New contract deployed |
| `ADMIN_CHANGED` | Contract admin updated |
