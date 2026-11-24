# API Keys and Rate Limits

SoroScan uses API keys for authentication and tiered rate limiting. Every key belongs to one of three tiers — Free, Pro,
or Enterprise — each with a different hourly request quota. Per-contract quota overrides are also supported for
fine-grained control.

---

## How API Keys Work

### Authentication

Pass your API key in the `Authorization` header on every request:

```http
Authorization: ApiKey <your-key>
```

Alternatively, you can pass it as a query parameter (useful for event streaming or quick testing):

```
GET /api/events/?contract_id=C...&api_key=<your-key>
```

The header form is preferred. Query parameter usage is accepted but logged separately.

When a valid key is presented, the request is authenticated as the key's owner user and the `APIKey` object is attached
to the request for downstream use by the throttle layer. If the key does not exist or `is_active` is `false`, the API
returns:

```http
HTTP/1.1 401 Unauthorized
{"detail": "Invalid or inactive API Key"}
```

### Key format

Keys are URL-safe random tokens, at least 48 bytes of entropy, truncated to 64 characters. They are generated
automatically on key creation using `secrets.token_urlsafe(48)`.

---

## Rate Limit Tiers

Quotas are enforced per calendar hour. Each tier has a default `quota_per_hour` that is set automatically when a key is
created.

| Tier           | Requests per hour | Notes                           |
| -------------- | ----------------- | ------------------------------- |
| **Free**       | 50                | Default tier for new keys       |
| **Pro**        | 5,000             |                                 |
| **Enterprise** | Unlimited         | Stored internally as 10,000,000 |

The quota is stored on the `APIKey.quota_per_hour` field. It is initialised from `TIER_QUOTAS` at creation time and can
be adjusted independently of the tier afterward (e.g. to grant a temporary increase to a Pro customer).

### Per-contract quota overrides

A `ContractQuota` record lets you set a tighter limit for a specific `(APIKey, TrackedContract)` pair. The effective
quota for a request is:

```
effective_quota = min(api_key.quota_per_hour, contract_quota.quota_per_hour)
```

Contract quotas cannot exceed the key's tier limit unless the key is Enterprise tier.

---

## Rate Limit Headers

Every response to an authenticated API-key request includes three headers that tell you your current quota state.

| Header                | Type           | Description                                |
| --------------------- | -------------- | ------------------------------------------ |
| `RateLimit-Limit`     | integer        | Total requests allowed in the current hour |
| `RateLimit-Remaining` | integer        | Requests remaining before the quota resets |
| `RateLimit-Reset`     | Unix timestamp | When the current 1-hour bucket resets      |

Example response headers:

```http
RateLimit-Limit: 5000
RateLimit-Remaining: 4987
RateLimit-Reset: 1725055200
```

The bucket resets at the start of each calendar hour (not a rolling window). `RateLimit-Reset` is always the Unix
timestamp of the top of the next hour.

These headers are injected by `APIKeyThrottle` into `request._api_key_throttle_headers` and forwarded to the response by
`SlowQueryMiddleware`.

---

## Handling 429 Too Many Requests

When the quota is exhausted, the API returns:

```http
HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 50
RateLimit-Remaining: 0
RateLimit-Reset: 1725055200
{"detail": "Request was throttled."}
```

The `RateLimit-Reset` timestamp tells you exactly when the bucket clears. Compute the wait time:

```python
import time

reset_ts = int(response.headers["RateLimit-Reset"])
wait_seconds = max(0, reset_ts - int(time.time()))
print(f"Retry in {wait_seconds}s")
```

**Client-side best practices:**

- Read `RateLimit-Remaining` on every response and back off before hitting zero.
- On a 429, wait until `RateLimit-Reset` rather than retrying immediately.
- For bulk operations, spread requests evenly across the hour rather than bursting at the start.
- Consider caching responses for read-heavy workloads to avoid burning quota.

### Ingest endpoint rate limit

The `POST /api/ingest/record/` endpoint has an additional stricter rate limit (`IngestRateThrottle`) applied on top of
the per-key quota. This is scoped separately and uses the standard DRF throttle response. The same 429 format applies.

---

## Generating API Keys

### Via the REST API

```bash
curl -X POST https://api.soroscan.io/api/keys/ \
  -H "Authorization: Bearer <user-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-app-key", "tier": "pro"}'
```

Response:

```json
{
  "id": 7,
  "name": "my-app-key",
  "key": "t8Kz3mNpQrVwXyAb...",
  "tier": "pro",
  "quota_per_hour": 5000,
  "is_active": true,
  "created_at": "2026-08-30T10:00:00Z"
}
```

Store the `key` value immediately — it is not shown again after creation.

### Via the Django admin

1. Log in to `/admin/`.
1. Navigate to **Ingest → API Keys → Add API Key**.
1. Select the user, choose a tier, and save. The key is generated automatically.

### Via the Django shell

```python
from django.contrib.auth.models import User
from soroscan.ingest.models import APIKey

user = User.objects.get(username="alice")
key = APIKey.objects.create(user=user, name="cli-key", tier="pro")
print(key.key)  # generated token
```

---

## Rotating API Keys

There is no in-place key rotation — rotation is a deactivate-and-replace workflow to ensure zero downtime.

### Step 1 — Create a new key

```bash
curl -X POST https://api.soroscan.io/api/keys/ \
  -H "Authorization: Bearer <user-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"name": "my-app-key-v2", "tier": "pro"}'
```

### Step 2 — Update your application

Deploy the new key value to your service before deactivating the old one.

### Step 3 — Deactivate the old key

```bash
curl -X PATCH https://api.soroscan.io/api/keys/6/ \
  -H "Authorization: Bearer <user-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
```

Or via the Django shell:

```python
APIKey.objects.filter(pk=6).update(is_active=False)
```

Deactivated keys are rejected immediately (`is_active=False` causes a 401). Historical `last_used_at` timestamps are
preserved for audit purposes.

### Step 4 — Verify

Confirm the old key returns 401 and the new key returns 200 with the expected `RateLimit-Limit` value.

---

## Checking Current Usage

The `last_used_at` field on `APIKey` is updated on every successful request. To inspect usage from the shell:

```python
from soroscan.ingest.models import APIKey
from django.core.cache import cache
import time

key = APIKey.objects.get(name="my-app-key")
bucket_hour = int(time.time()) // 3600
cache_key = f"soroscan_api_key_quota:{key.id}:{bucket_hour}"
current_count = cache.get(cache_key, 0)

print(f"Used this hour: {current_count}/{key.quota_per_hour}")
print(f"Last used: {key.last_used_at}")
```

Hourly usage history is also maintained in Redis for up to 8 days under keys of the form
`soroscan_api_key_quota_history:<key_id>:<bucket_hour>`, which feeds the analytics dashboard.
