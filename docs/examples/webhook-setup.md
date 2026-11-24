# Example: Webhook Setup

Webhooks are the most efficient way to keep your application in sync with on-chain events. This example shows how to
register a webhook using the SoroScan SDKs and how to verify the signature of incoming requests.

## Scenario

We want to receive a notification whenever a `transfer` event occurs for our contract, and we'll use a secret key to
verify the source.

---

### Step 1: Register the Webhook

#### Python

```python
from soroscan import SoroScanClient

client = SoroScanClient(base_url="https://api.soroscan.io", api_key="your-api-key")

webhook = client.create_webhook(
    url="https://myapp.com/api/webhooks/soroscan",
    triggers=["event.created"],
    contract_id="CCAAA...",
    secret="your-shared-secret"
)

print(f"Webhook {webhook.id} is now active!")
```

#### TypeScript

```typescript
import { SoroScanClient } from "@soroscan/sdk";

const client = new SoroScanClient({ baseUrl: "https://api.soroscan.io", apiKey: "your-api-key" });

const webhook = await client.subscribeWebhook({
  url: "https://myapp.com/api/webhooks/soroscan",
  triggers: ["event.created"],
  contractId: "CCAAA...",
  secret: "your-shared-secret",
});

console.log(`Webhook ${webhook.id} registered!`);
```

---

### Step 2: Verify the Signature

When SoroScan sends a webhook, it includes a signature in the `X-SoroScan-Signature` header. This signature is an
`HMAC-SHA256` hash of the payload using your secret key.

#### Node.js (Express)

```javascript
const crypto = require("crypto");

app.post("/api/webhooks/soroscan", (req, res) => {
  const signature = req.headers["x-soroscan-signature"];
  const payload = JSON.stringify(req.body);
  const secret = "your-shared-secret";

  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  if (signature !== expectedSignature) {
    return res.status(401).send("Invalid Signature");
  }

  // Handle the event
  console.log("Verified event:", req.body.event_type);
  res.status(200).send("OK");
});
```

## Best Practices

1. **Keep Secrets Safe**: Never expose your webhook secret in client-side code or public repositories.
1. **Respond Quickly**: Return a `200 OK` status immediately and process the data in the background (using a task queue
   like Celery or BullMQ).
1. **Handle Retries**: SoroScan will retry delivery if your server returns a non-2xx status code. Ensure your endpoint
   is idempotent.
1. **Endpoint Security**: Use HTTPS for your webhook endpoint to encrypt the payload in transit.
