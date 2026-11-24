# SoroScan TypeScript SDK Quickstart

Get started with `@soroscan/sdk` in 5 minutes.

## Installation

```bash
npm install @soroscan/sdk
```

## 1. Initialize the Client

```ts
import { SoroScanClient } from "@soroscan/sdk";

const client = new SoroScanClient({
  baseUrl: "https://api.soroscan.io",
  apiKey: process.env.SOROSCAN_API_KEY, // optional for public endpoints
});
```

## 2. Fetch Events (async/await)

```ts
const events = await client.getEvents({
  contractId: "CCAAA...",
  eventType: "transfer",
  first: 50,
});

for (const event of events.items) {
  console.log(event.ledger, event.type, event.txHash);
}
```

## 3. Fetch Events (Promise chaining)

Every client method returns a native `Promise`, so `.then()`/`.catch()` works the same as `await`:

```ts
client
  .getEvents({ contractId: "CCAAA...", first: 50 })
  .then((events) => {
    events.items.forEach((event) => console.log(event.type, event.ledger));
  })
  .catch((err) => {
    console.error("Failed to fetch events:", err);
  });
```

## 4. Register a Contract

```ts
const contract = await client.getContract({ contractId: "CCAAA..." });
console.log(`Contract: ${contract.spec?.functions?.length ?? 0} functions`);
```

## 5. Subscribe a Webhook

```ts
const webhook = await client.subscribeWebhook({
  url: "https://myapp.com/webhook/soroscan",
  triggers: ["event.created"],
  contractId: "CCAAA...",
});

console.log("Webhook ID:", webhook.id);
```

## Error Handling

```ts
import { SoroScanError } from "@soroscan/sdk";

try {
  const contract = await client.getContract({ contractId: "INVALID" });
} catch (err) {
  if (err instanceof SoroScanError) {
    console.error(`[${err.statusCode}] ${err.code}: ${err.message}`);
  }
}
```

## Next Steps

- Read the [full API reference](README.md)
- Explore [type definitions](src/types.ts)
- See the [Python SDK quickstart](../python/QUICKSTART.md) for the equivalent workflow in Python

## Support

- GitHub: <https://github.com/soroscan/soroscan/issues>
