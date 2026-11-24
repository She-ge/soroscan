# Setup Webhook

## Goal

Register a webhook endpoint to receive HTTP POST requests whenever a contract emits a specific event.

## Prerequisites

- A publicly accessible HTTP endpoint to receive POST requests.
- SoroScan API key.

## Code

```typescript
import { SoroScanClient } from "@soroscan/sdk";

const client = new SoroScanClient({ apiKey: "your_api_key" });
const webhook = await client.createWebhook({
  target_url: "https://myapp.com/webhooks/soroban",
  contract_id: "CCAAA...",
  event_types: ["transfer", "mint"],
});
console.log(`Webhook created! Secret: ${webhook.secret}`);
```

## Expected Output

```json
{
  "id": 12,
  "target_url": "https://myapp.com/webhooks/soroban",
  "secret": "wh_sec_xyz123...",
  "status": "active"
}
```

## Error Handling

Ensure your `target_url` responds with a `200 OK` within 5 seconds, otherwise the delivery will be marked as failed and
eventually disabled after multiple retries.
