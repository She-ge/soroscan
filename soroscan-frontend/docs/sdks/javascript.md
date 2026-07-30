# JavaScript / TypeScript SDK

The SoroScan SDK for JavaScript and TypeScript provides a type-safe interface for interacting with the SoroScan API.

## Installation

```bash
npm install @soroscan/sdk
# or
yarn add @soroscan/sdk
# or
pnpm add @soroscan/sdk
```

## Authentication

```typescript
import { SoroScanClient } from "@soroscan/sdk"

const client = new SoroScanClient({
  apiKey: "sk_live_your_key_here"
})
```

## Listing Events

```typescript
import { SoroScanClient } from "@soroscan/sdk"

const client = new SoroScanClient({ apiKey: "sk_live_..." })

// Fetch events for a specific contract
const { events } = await client.events.list({
  contractId: "CABC...9X4Z",
  limit: 50
})

events.forEach(event => {
  console.log(`Ledger ${event.ledger}: ${event.eventType}`)
  console.log(`  Data: ${event.data}`)
})
```

## Filtering Events

```typescript
import { SoroScanClient } from "@soroscan/sdk"

const client = new SoroScanClient({ apiKey: "sk_live_..." })

const { events } = await client.events.list({
  contractId: "CABC...9X4Z",
  eventType: "SWAP_COMPLETE",
  minLedger: 12000000,
  limit: 100
})
```

## Registering a Contract

```typescript
const contract = await client.contracts.create({
  contractId: "CABC...9X4Z",
  label: "my-amm-contract"
})
console.log(`Registered: ${contract.id}`)
```

## Managing Webhooks

```typescript
// Create webhook subscription
const webhook = await client.webhooks.create({
  url: "https://your-app.com/webhook",
  eventType: "SWAP_COMPLETE",
  contractId: "CABC...9X4Z",
  secret: "your-hmac-secret"
})
console.log(`Webhook ID: ${webhook.id}`)

// List webhooks
const { webhooks } = await client.webhooks.list()

// Delete a webhook
await client.webhooks.delete({ webhookId: "wh_abc123" })
```

## GraphQL Queries

```typescript
const result = await client.graphql.query(`
  query GetRecentEvents {
    events(contractId: "CABC...9X4Z", first: 10) {
      edges {
        node {
          id
          eventType
          data
          createdAt
        }
      }
    }
  }
`)
```

## Type Safety

The SDK is fully typed:

```typescript
import { SoroScanClient, Event, Contract, Webhook } from "@soroscan/sdk"

const client = new SoroScanClient({ apiKey: "sk_live_..." })

// TypeScript knows the shape of the response
const { events }: { events: Event[] } = await client.events.list({
  contractId: "CABC...9X4Z"
})

// Autocomplete works for all fields
events.forEach((event: Event) => {
  console.log(event.ledger)        // number
  console.log(event.eventType)     // string
  console.log(event.timestamp)     // Date
  console.log(event.data)          // object
})
```

## Error Handling

```typescript
import {
  SoroScanClient,
  AuthenticationError,
  RateLimitError,
  NotFoundError
} from "@soroscan/sdk"

const client = new SoroScanClient({ apiKey: "sk_live_..." })

try {
  const { events } = await client.events.list({ contractId: "INVALID" })
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Invalid API key")
  } else if (error instanceof RateLimitError) {
    console.error(`Rate limited. Retry after ${error.retryAfter}s`)
  } else if (error instanceof NotFoundError) {
    console.error("Contract not found")
  }
}
```

## Configuration

```typescript
import { SoroScanClient } from "@soroscan/sdk"

const client = new SoroScanClient({
  apiKey: "sk_live_...",
  baseUrl: "https://soroscan.io",  // Optional, default shown
  timeout: 30000,                   // Request timeout in ms
  maxRetries: 3,                    // Auto-retry on network errors
  retryDelay: 1000,                 // Base delay between retries (ms)
})
```

## React Integration

```tsx
import { SoroScanClient } from "@soroscan/sdk"
import { useEffect, useState } from "react"

function EventsView() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const client = new SoroScanClient({ apiKey: "sk_live_..." })
    
    client.events.list({ contractId: "CABC...9X4Z", limit: 10 })
      .then(({ events }) => {
        setEvents(events)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <ul>
      {events.map(event => (
        <li key={event.id}>
          {event.eventType} - Ledger {event.ledger}
        </li>
      ))}
    </ul>
  )
}
```

## Node.js Server Example

```typescript
import express from "express"
import { SoroScanClient } from "@soroscan/sdk"

const app = express()
const client = new SoroScanClient({ apiKey: process.env.SOROSCAN_API_KEY! })

app.get("/events", async (req, res) => {
  try {
    const { events } = await client.events.list({
      contractId: req.query.contractId as string,
      limit: 50
    })
    res.json({ events })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch events" })
  }
})

app.listen(3000, () => {
  console.log("Server running on port 3000")
})
```
