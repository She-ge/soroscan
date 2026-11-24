# Testing SoroScan Webhooks Locally with Webhook.site and ngrok

This tutorial explains how to test SoroScan webhook deliveries during development without deploying a public server.

Two approaches are covered:

- **Webhook.site** — the quickest way to receive and inspect a SoroScan webhook without running a local receiver.
- **ngrok** — exposes a receiver running on your computer through a temporary public URL, allowing you to test the
  complete webhook delivery flow.

Webhook.site is useful when you only need to inspect what SoroScan sends. Use ngrok when you also need to test how your
own application processes and acknowledges webhook requests.

## Prerequisites

Before starting, make sure you have:

- access to a running SoroScan backend;
- a valid authenticated SoroScan session, JWT, or API key;
- at least one tracked contract when creating a webhook subscription;
- `curl` or another HTTP client;
- Node.js if you want to follow the local ngrok receiver example.

The examples below assume that the SoroScan backend is running locally at:

```text
http://localhost:8000
```

Replace this address if your SoroScan backend is running elsewhere.

---

## Option 1: Test with Webhook.site

Webhook.site gives you a temporary public URL and displays requests sent to that URL in your browser.

This is the easiest option when you want to inspect:

- the HTTP method;
- request headers;
- the JSON payload;
- SoroScan signature headers;
- timestamps;
- repeated deliveries.

You do not need to run a web server on your computer for this method.

### Step 1: Create a Webhook.site URL

Open Webhook.site in your browser.

A unique URL is generated automatically. It looks similar to:

```text
https://webhook.site/00000000-0000-0000-0000-000000000000
```

Copy the unique URL shown on the page.

Do not copy the browser application's `#!/view/...` address. Use the unique webhook URL displayed by Webhook.site.

Keep the Webhook.site page open so incoming requests appear immediately.

> **Privacy note:** Do not send secrets, authentication tokens, private user information, or production-sensitive data
> to a public testing URL. Free Webhook.site URLs should be treated as temporary development tools.

### Step 2: Confirm the URL Works

Before connecting SoroScan, send a simple request:

```bash
curl -X POST "https://webhook.site/<your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "SoroScan webhook test"
  }'
```

Return to Webhook.site.

You should see a new `POST` request in the request list.

Select the request and confirm that the JSON body contains:

```json
{
  "message": "SoroScan webhook test"
}
```

If the request appears, the URL is ready to use as a SoroScan webhook target.

---

## Step 3: Find the Tracked Contract ID

SoroScan webhook subscriptions reference the database ID of a tracked contract.

List the available contracts:

```bash
curl "http://localhost:8000/api/ingest/contracts/" \
  -H "Authorization: Bearer <your-access-token>"
```

Find the contract you want to use and note its numeric `id`.

For example:

```json
{
  "id": 12,
  "contract_id": "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "name": "Example Contract",
  "is_active": true
}
```

In this example, the value used when creating the webhook is:

```text
12
```

---

## Step 4: Create a SoroScan Webhook Subscription

Create a subscription using your Webhook.site URL:

```bash
curl -X POST "http://localhost:8000/api/ingest/webhooks/" \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "contract": 12,
    "target_url": "https://webhook.site/<your-token>",
    "event_type": "transfer"
  }'
```

Replace:

- `12` with the numeric ID of your tracked contract;
- `<your-token>` with your Webhook.site token;
- `transfer` with an event type used by your contract.

If you want the subscription to receive all event types for the selected contract, omit `event_type`:

```bash
curl -X POST "http://localhost:8000/api/ingest/webhooks/" \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "contract": 12,
    "target_url": "https://webhook.site/<your-token>"
  }'
```

A successful response contains the new webhook subscription ID.

For example:

```json
{
  "id": 42,
  "contract": 12,
  "contract_id": "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "event_type": "transfer",
  "target_url": "https://webhook.site/<your-token>",
  "is_active": true,
  "signature_algorithm": "sha256",
  "ack_header_name": "X-SoroScan-Ack",
  "ack_header_value": "ok",
  "failure_count": 0
}
```

Keep the webhook `id`. The examples below use:

```text
42
```

---

## Step 5: Send a SoroScan Test Webhook

SoroScan provides a test action that sends a webhook directly to the configured target.

Run:

```bash
curl -X POST "http://localhost:8000/api/ingest/webhooks/42/test/" \
  -H "Authorization: Bearer <your-access-token>"
```

Replace `42` with your webhook subscription ID.

The API response should look similar to:

```json
{
  "status": "test_webhook_queued"
}
```

Now return to Webhook.site.

A new `POST` request should appear.

Select it and inspect its body.

The test request uses a payload shaped like:

```json
{
  "contract_id": "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "event_type": "test",
  "payload": {
    "message": "This is a test webhook"
  },
  "timestamp": "2026-08-28T12:00:00+00:00"
}
```

The timestamp and contract ID will differ in your request.

### What to Verify

Confirm that:

1. the request method is `POST`;
1. the request body is valid JSON;
1. `event_type` is `test`;
1. `contract_id` matches the subscription's tracked contract;
1. the payload contains the test message;
1. the request contains a `Content-Type: application/json` header;
1. the request contains SoroScan signing headers.

A test delivery can include headers similar to:

```http
Content-Type: application/json
X-SoroScan-Signature: sha256=<signature>
X-SoroScan-Timestamp: <timestamp>
X-Signature: ed25519=<base64-signature>
```

`X-SoroScan-Signature` is the subscription-specific HMAC signature.

When SoroScan's Ed25519 signing key is configured, the request can also contain `X-Signature`.

Do not compare signatures by copying an example value from this guide. Signatures depend on the exact raw request body
and configured signing credentials.

---

## Webhook.site Delivery Log

After sending the test webhook, the Webhook.site request inspector should show the received request, headers, and JSON
body.

![Webhook.site showing a received SoroScan webhook request](./images/webhook-site-delivery-log.png)

When capturing this screenshot for documentation:

- show the received `POST` request;
- show enough of the headers or request body to make the delivery clear;
- remove or hide sensitive values;
- do not include real access tokens, API keys, webhook secrets, or production data.

---

## Sample SoroScan Webhook Payloads

### Test Payload

The `/test/` action sends a payload similar to:

```json
{
  "contract_id": "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "event_type": "test",
  "payload": {
    "message": "This is a test webhook"
  },
  "timestamp": "2026-08-28T12:00:00+00:00"
}
```

### Ping Payload

SoroScan also provides a ping action:

```bash
curl -X POST "http://localhost:8000/api/ingest/webhooks/42/ping/" \
  -H "Authorization: Bearer <your-access-token>"
```

This queues a lightweight connectivity check with a payload shaped like:

```json
{
  "timestamp": "2026-08-28T12:00:00+00:00",
  "type": "ping"
}
```

The ping request includes:

```http
X-SoroScan-Event: ping
```

Use the test action when you want to inspect the standard SoroScan signing headers. Use ping when you only need a basic
reachability check.

### Contract Event Payload

A normal event delivery contains contract and transaction information.

For example:

```json
{
  "contract_id": "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "event_index": 0,
  "event_type": "transfer",
  "ledger": 123456,
  "payload": {
    "from": "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    "to": "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
    "amount": "10000000"
  },
  "tx_hash": "9f86d081884c7d659a2feaa0c55ad015"
}
```

The contents of `payload` depend on the contract and event being indexed.

---

## Option 2: Test a Local Receiver with ngrok

Webhook.site proves that SoroScan is sending requests correctly, but eventually you will normally want to test your own
webhook handler.

A service running on:

```text
http://localhost:3000
```

cannot normally receive webhook requests from an external service.

ngrok solves this by creating a temporary public endpoint that forwards requests to your local application.

The flow becomes:

```text
SoroScan
   |
   v
ngrok public HTTPS URL
   |
   v
localhost:3000
```

---

## Step 1: Create a Local Receiver

Create a temporary file outside the SoroScan repository, for example:

```text
webhook_receiver.js
```

Add:

```javascript
const http = require("http");

const PORT = 3000;

const server = http.createServer((req, res) => {
  if (req.method !== "POST" || req.url !== "/webhooks/soroscan") {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }

  let body = "";

  req.on("data", (chunk) => {
    body += chunk;
  });

  req.on("end", () => {
    console.log("\nReceived SoroScan webhook");
    console.log("Headers:", req.headers);

    try {
      const payload = JSON.parse(body);
      console.log("Payload:", JSON.stringify(payload, null, 2));
    } catch {
      console.log("Raw body:", body);
    }

    res.writeHead(200, {
      "Content-Type": "application/json",
      "X-SoroScan-Ack": "ok",
    });

    res.end(
      JSON.stringify({
        received: true,
      }),
    );
  });
});

server.listen(PORT, () => {
  console.log(`Webhook receiver listening on http://localhost:${PORT}`);
});
```

Start it:

```bash
node webhook_receiver.js
```

You should see:

```text
Webhook receiver listening on http://localhost:3000
```

The receiver returns:

```http
X-SoroScan-Ack: ok
```

This matters for normal SoroScan event delivery because SoroScan checks the configured acknowledgement header before
considering an event delivery successful.

---

## Step 2: Install and Authenticate ngrok

Install ngrok using the instructions for your operating system.

After installation, authenticate the ngrok agent:

```bash
ngrok config add-authtoken <your-ngrok-authtoken>
```

Do not commit your ngrok authentication token to the repository.

---

## Step 3: Expose the Local Receiver

With the local Node receiver still running, open another terminal and run:

```bash
ngrok http 3000
```

ngrok will display a forwarding address similar to:

```text
Forwarding  https://example.ngrok.app -> http://localhost:3000
```

Copy your HTTPS forwarding URL.

Append the local receiver route:

```text
https://example.ngrok.app/webhooks/soroscan
```

That is now your temporary public webhook target.

---

## Step 4: Create a Webhook Using the ngrok URL

Create another SoroScan webhook subscription:

```bash
curl -X POST "http://localhost:8000/api/ingest/webhooks/" \
  -H "Authorization: Bearer <your-access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "contract": 12,
    "target_url": "https://example.ngrok.app/webhooks/soroscan",
    "event_type": "transfer"
  }'
```

Replace:

- `12` with your tracked contract's numeric ID;
- the example ngrok domain with the URL assigned to your tunnel;
- `transfer` with the event type you want to test.

Note the new webhook subscription ID returned by SoroScan.

---

## Step 5: Trigger a Test Delivery

Assuming the new subscription ID is `43`:

```bash
curl -X POST "http://localhost:8000/api/ingest/webhooks/43/test/" \
  -H "Authorization: Bearer <your-access-token>"
```

Check the terminal running `webhook_receiver.js`.

You should see output similar to:

```text
Received SoroScan webhook
Headers: {
  'content-type': 'application/json',
  'x-soroscan-signature': 'sha256=...',
  'x-soroscan-timestamp': '...',
  'x-signature': 'ed25519=...'
}
Payload: {
  "contract_id": "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  "event_type": "test",
  "payload": {
    "message": "This is a test webhook"
  },
  "timestamp": "2026-08-28T12:00:00+00:00"
}
```

You can also inspect the request in ngrok's traffic inspector.

![ngrok traffic inspector showing a forwarded SoroScan webhook](./images/ngrok-traffic-inspector.png)

The ngrok request inspector is useful for checking:

- request headers;
- request bodies;
- response status;
- response headers;
- request timing;
- whether traffic reached the local application.

---

## Verifying a Real Delivery

The `/test/` action is useful for validating connectivity and inspecting signing headers.

A real contract event delivery follows a stricter success flow.

For a normal SoroScan event dispatch to be treated as successful:

1. SoroScan sends an HTTP `POST` request.
1. The receiver returns a `2xx` response.
1. The receiver includes the configured acknowledgement header.
1. By default, the expected response header is:

```http
X-SoroScan-Ack: ok
```

The local Node receiver in this guide already returns this header.

## Check SoroScan Delivery Logs

After a real event has triggered the subscription, inspect the webhook delivery history:

```bash
curl "http://localhost:8000/api/ingest/webhooks/43/deliveries/" \
  -H "Authorization: Bearer <your-access-token>"
```

A successful delivery record can contain fields such as:

```json
{
  "id": 101,
  "subscription_id": 43,
  "event_id": 77,
  "attempt_number": 1,
  "status": "success",
  "status_code": 200,
  "success": true,
  "acknowledged": true,
  "within_sla": true,
  "latency_ms": 86,
  "duration_ms": 86,
  "payload_bytes": 312,
  "error": "",
  "response_body": "{\"received\":true}",
  "timestamp": "2026-08-28T12:05:00Z"
}
```

The exact values depend on the delivery.

Verify:

```text
status          = success
status_code     = 200
success         = true
acknowledged    = true
```

These fields confirm that SoroScan successfully delivered the event and received the expected acknowledgement.

---

## Important Difference Between Webhook.site and ngrok

Webhook.site is excellent for confirming that a request was sent and inspecting its contents.

However, a default Webhook.site URL does not necessarily return SoroScan's configured acknowledgement header:

```http
X-SoroScan-Ack: ok
```

As a result, a normal SoroScan event may reach Webhook.site successfully while SoroScan records the delivery as
unacknowledged.

This does **not** mean Webhook.site failed to receive the request.

For quick payload inspection, use:

```text
POST /api/ingest/webhooks/{id}/test/
```

For testing the complete production-style acknowledgement flow, use ngrok with a local receiver that returns:

```http
X-SoroScan-Ack: ok
```

---

## Inspecting Signatures

Normal SoroScan event deliveries can include two signature mechanisms.

## Subscription HMAC Signature

The subscription-specific signature is sent using:

```http
X-SoroScan-Signature: sha256=<hex-signature>
```

The exact algorithm is controlled by the webhook subscription's signature configuration.

The signature is calculated from the raw request body and the webhook secret.

When implementing verification, calculate the expected signature from the **raw request bytes** before parsing or
modifying the JSON body.

## Ed25519 Signature

When platform Ed25519 signing is configured, SoroScan also adds:

```http
X-Signature: ed25519=<base64-signature>
```

The corresponding public key is available from SoroScan's webhook signing public-key endpoint.

Signature verification should always use the raw request body received from SoroScan.

Do not store real webhook secrets or private signing keys in tutorial screenshots.

---

## Testing Failure Scenarios

Once successful delivery works, deliberately test failures so you know how your application behaves.

## Return an HTTP Error

Temporarily change the local receiver from:

```javascript
res.writeHead(200, {
  "Content-Type": "application/json",
  "X-SoroScan-Ack": "ok",
});
```

to:

```javascript
res.writeHead(500, {
  "Content-Type": "application/json",
});
```

Send another webhook and inspect the result.

Restore the successful response after testing.

## Test a Missing Acknowledgement

Return `200 OK` without:

```http
X-SoroScan-Ack: ok
```

A normal event delivery can then be recorded as unsuccessful because the expected acknowledgement is missing.

## Test Rate Limiting

A receiver returning:

```http
429 Too Many Requests
```

causes SoroScan's delivery logic to treat the endpoint as rate limited and apply its retry behavior.

Do not leave intentional failure behavior enabled after completing your test.

---

## Troubleshooting

## Nothing Appears in Webhook.site

Check that:

- you copied the unique webhook URL rather than the browser view URL;
- the SoroScan test endpoint was called for the correct subscription;
- the subscription's `target_url` matches your Webhook.site URL;
- your computer and SoroScan backend have internet access.

Test the URL directly with `curl` before troubleshooting SoroScan.

## ngrok Shows a Request but the Local App Does Not

Check that:

- your receiver is still running;
- the local application is listening on port `3000`;
- ngrok was started with `ngrok http 3000`;
- the target URL includes `/webhooks/soroscan`;
- no local firewall is blocking the receiver.

## The Local Receiver Returns 404

Make sure the webhook URL ends with:

```text
/webhooks/soroscan
```

The sample receiver only accepts `POST` requests on that path.

## Delivery Is Received but SoroScan Reports Failure

For normal event delivery, check that your receiver returns both:

```http
HTTP 200
X-SoroScan-Ack: ok
```

A successful HTTP status without the expected acknowledgement header is not sufficient for the normal SoroScan delivery
path.

## Signature Verification Fails

Make sure you:

- verify the original raw request bytes;
- use the correct webhook secret for `X-SoroScan-Signature`;
- use the correct SoroScan public key for `X-Signature`;
- do not reformat the JSON before calculating the signature;
- use the algorithm indicated by the signature prefix.

---

## Cleanup

After testing:

1. stop ngrok with `Ctrl+C`;
1. stop the local webhook receiver with `Ctrl+C`;
1. delete temporary webhook subscriptions that are no longer required;
1. close or discard temporary Webhook.site URLs;
1. remove temporary test files created outside the repository;
1. make sure screenshots contain no secrets before committing them.

Do not commit:

- access tokens;
- API keys;
- webhook secrets;
- ngrok authentication tokens;
- production payloads containing sensitive data.

---

## Verification Checklist

Before considering local webhook testing complete, verify that:

- [ ] Webhook.site receives a SoroScan test request.
- [ ] The request method is `POST`.
- [ ] The JSON payload is visible and valid.
- [ ] `X-SoroScan-Signature` is visible on the signed test request.
- [ ] `X-Signature` is inspected when Ed25519 signing is configured.
- [ ] The ngrok HTTPS URL forwards requests to the local receiver.
- [ ] The local receiver logs the webhook payload.
- [ ] The local receiver returns a `2xx` response.
- [ ] The local receiver returns `X-SoroScan-Ack: ok`.
- [ ] A real delivery can be inspected through the SoroScan delivery-log endpoint.
- [ ] Screenshots contain no authentication credentials or secrets.

## Related Documentation

For more information, see:

- `docs/cookbook/setup-webhook.md`
- `docs/cookbook/webhooks.md`
- `django-backend/soroscan/ingest/views.py`
- `django-backend/soroscan/ingest/tasks.py`
- `django-backend/soroscan/webhook_signing.py`
