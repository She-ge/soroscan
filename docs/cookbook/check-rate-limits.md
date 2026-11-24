# Check Rate Limits

## Goal

Inspect rate limit headers or query the rate limit API to understand current usage vs limit.

## Prerequisites

- A valid SoroScan API key.

## Code

```typescript
import { SoroScanClient } from "@soroscan/sdk";

const client = new SoroScanClient({ apiKey: "your_api_key" });

// Making any request will return rate limit headers
const response = await fetch("https://api.soroscan.io/api/ingest/contracts/", {
  headers: { Authorization: "Bearer your_api_key" },
});

const limit = response.headers.get("X-RateLimit-Limit");
const remaining = response.headers.get("X-RateLimit-Remaining");

console.log(`Rate Limit: ${remaining} / ${limit} remaining`);
```

## Expected Output

```text
Rate Limit: 995 / 1000 remaining
```

## Error Handling

When `remaining` hits `0`, the API will return a `429 Too Many Requests`. You should parse the `Retry-After` or
`X-RateLimit-Reset` headers to determine when to resume requests.
