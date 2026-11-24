# TypeScript SDK

The **@soroscan/sdk** is the official TypeScript/JavaScript client for SoroScan. It is designed to work in both
server-side (Node.js) and client-side (Browser, React, Vite) environments.

## Installation

```bash
npm install @soroscan/sdk
# or
yarn add @soroscan/sdk
```

## Basic Usage

### Client Setup

```typescript
import { SoroScanClient } from "@soroscan/sdk";

const client = new SoroScanClient({
  baseUrl: "https://api.soroscan.io",
  apiKey: "your-api-key", // optional for public endpoints
});
```

### Fetching Events

```typescript
const events = await client.getEvents({
  contractId: "CCAAA...",
  eventType: "transfer",
  first: 50,
});

for (const event of events.items) {
  console.log(`[${event.ledger}] ${event.type}: ${event.txHash}`);
}
```

## Advanced Features

### Webhook Subscriptions

```typescript
const webhook = await client.subscribeWebhook({
  url: "https://your-app.com/api/webhook",
  triggers: ["event.created", "transaction.success"],
  contractId: "CCAAA...",
});

console.log(`Webhook secret for verification: ${webhook.secret}`);
```

### Async Iteration (Pagination)

```typescript
let after: string | null = null;

do {
  const page = await client.getEvents({ first: 100, after });
  // Process events...
  after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
} while (after);
```

### Tagged Events (SC-24)

You can submit events classified by up to 4 tags to support efficient event category indexing:

```typescript
const response = await client.recordTaggedEvent({
  contractId: "CCAAA...",
  eventType: "transfer",
  payloadHash: "a".repeat(64),
  tags: ["defi", "token"],
});

console.log(`Status: ${response.status}, tags: ${response.tags.join(", ")}`);
```

### Contract Statistics (SC-42)

`getContractStats(contractId)` returns aggregate statistics for a tracked contract as a typed
`ContractStats` object. The argument is the contract's **database id** (the `{id}` used by
`GET /api/ingest/contracts/{id}/stats/`), not its Stellar address. The returned `contractId`
field is the Stellar address reported by the API.

```typescript
import { SoroScanClient, type ContractStats } from "@soroscan/sdk";

const stats: ContractStats = await client.getContractStats("42");

console.log(stats.contractId);       // Stellar address
console.log(stats.totalEvents);      // number of indexed events
console.log(stats.uniqueEventTypes); // distinct event types
console.log(stats.latestLedger);     // number | null
console.log(stats.lastActivity);     // ISO date string | null
```

Errors use the standard SDK error classes: an unknown contract id throws `SoroScanNotFoundError`
(HTTP 404), and a malformed response throws `SoroScanValidationError`.

## Features

- **Strict Typing**: Full TypeScript support for all request and response shapes.
- **Zero Dependencies**: Uses native `fetch` API for a minimal footprint.
- **Dual Build**: Supports both ESM and CJS modules.
- **React/Vite Friendly**: Ready for modern frontend frameworks.

## Error Handling

```typescript
import { SoroScanError } from "@soroscan/sdk";

try {
  await client.getContract({ contractId: "INVALID" });
} catch (err) {
  if (err instanceof SoroScanError) {
    console.error(`API Error: ${err.message} (Status: ${err.statusCode})`);
  }
}
```

For more details, see the [TypeScript SDK README](https://github.com/Harbduls/soroscan/tree/main/sdk/typescript).

If you want to add or maintain SDK methods, use the [SDK Development Guide](./contributing/sdk-development.md) and the
comprehensive [SDK & Library Development Guide](./sdk/sdk-development-guide.md).
