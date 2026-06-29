# TypeScript SDK

The **@soroscan/sdk** is the official TypeScript/JavaScript client for SoroScan. It is designed to work in both server-side (Node.js) and client-side (Browser, React, Vite) environments.

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

If you want to add or maintain SDK methods, use the [SDK Development Guide](./contributing/sdk-development.md).
