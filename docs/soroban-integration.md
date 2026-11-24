# Soroban Contract Integration Guide

This guide walks contract developers through integrating a custom Soroban smart contract with SoroScan — from emitting
compatible events, to registering an ABI, to verifying that ingestion and monitoring are working correctly.

---

## Overview

SoroScan indexes on-chain events emitted by Soroban contracts and makes them queryable via REST and GraphQL APIs,
WebSocket streams, and webhooks. For SoroScan to index your contract automatically, your contract must emit events in a
compatible format and be registered with the indexer.

```
Your Contract  ──events──►  Stellar Ledger
                                  │
                                  ▼
                        SoroScan Ingest Worker
                           │          │
                     REST API      Webhooks
                           │
                      Your App
```

---

## Prerequisites

- A deployed Soroban contract (testnet or mainnet) with a known contract ID.
- Access to the SoroScan API (obtain an API key from the dashboard or `POST /api/ingest/api-keys/`).
- `stellar-sdk` (Python / JavaScript) or the SoroScan SDK for testing.

---

## Step 1: Event Emission Standards

SoroScan processes Soroban `contract_events` emitted from your contract. Follow these conventions so events are indexed
correctly and searchable.

### Event Structure

Soroban events have a `topics` array and a `data` value. SoroScan maps:

| Soroban field        | SoroScan field        | Notes                                             |
| -------------------- | --------------------- | ------------------------------------------------- |
| `topics[0]` (Symbol) | `event_type`          | Keep it lowercase and snake_case, e.g. `transfer` |
| `topics[1..N]`       | indexed filter fields | Used for fast filtering queries                   |
| `data` (any ScVal)   | `payload`             | Stored as JSON; supports nested structures        |

### Recommended Rust Contract Pattern

```rust
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Symbol};

pub struct TransferEvent {
    pub from:   Address,
    pub to:     Address,
    pub amount: i128,
}

pub fn emit_transfer(env: &Env, from: Address, to: Address, amount: i128) {
    env.events().publish(
        // topics: event_type followed by key filter fields
        (symbol_short!("transfer"), from.clone(), to.clone()),
        // data: full event payload
        amount,
    );
}
```

### Naming Conventions

- Use `snake_case` symbols: `transfer`, `swap`, `liquidity_add`, `contract_upgraded`.
- Keep event type symbols ≤ 9 characters (Soroban `symbol_short!` limit) or use `Symbol::new(env, "longer_name")` for
  longer names.
- Be consistent — changing event type names is a breaking change for consumers.

### Versioned Events (SC-38)

For contracts that need schema evolution, use the versioned event helper:

```rust
// Emit with schema_version so SoroScan can handle schema migrations
env.events().publish(
    (symbol_short!("transfer"), schema_version_u32),
    (from, to, amount, correlation_id),
);
```

SoroScan's `record_structured_event` endpoint accepts `schema_version` and `correlation_id` for structured events.

---

## Step 2: ABI Registration

Register your contract's ABI (interface definition) so SoroScan can decode event payloads and provide typed search.

### What is an ABI in SoroScan?

SoroScan uses a JSON schema document that describes each event type your contract emits. This enables:

- Automatic payload decoding from XDR to JSON.
- Schema-validated ingestion (rejects malformed events).
- Typed field search via `?payload_field=amount&payload_op=gte&payload_value=1000`.

### ABI JSON Format

```json
{
  "contract_id": "CABC123...",
  "version": "1.0.0",
  "events": {
    "transfer": {
      "description": "Fungible token transfer between two accounts",
      "topics": [
        { "name": "event_type", "type": "symbol" },
        { "name": "from", "type": "address" },
        { "name": "to", "type": "address" }
      ],
      "data": {
        "type": "object",
        "properties": {
          "amount": { "type": "integer", "description": "Token amount in stroops" }
        },
        "required": ["amount"]
      }
    },
    "swap": {
      "description": "AMM token swap",
      "topics": [
        { "name": "event_type", "type": "symbol" },
        { "name": "pool_id", "type": "bytes" }
      ],
      "data": {
        "type": "object",
        "properties": {
          "token_in": { "type": "string" },
          "token_out": { "type": "string" },
          "amount_in": { "type": "integer" },
          "amount_out": { "type": "integer" }
        },
        "required": ["token_in", "token_out", "amount_in", "amount_out"]
      }
    }
  }
}
```

### Uploading the ABI

```bash
# Upload ABI JSON via the contracts endpoint
curl -X POST \
  https://api.soroscan.io/api/ingest/contracts/<contract_id>/upload_source/ \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: multipart/form-data" \
  -F "abi=@./abi.json"
```

Or via the Python SDK:

```python
from soroscan import SoroScanClient

client = SoroScanClient(
    base_url="https://api.soroscan.io",
    api_key="your-api-key",
)
client.upload_abi(contract_id="CABC123...", abi_path="./abi.json")
```

---

## Step 3: Register the Contract with SoroScan

Before SoroScan indexes events, the contract must be registered as a `TrackedContract`.

```bash
curl -X POST https://api.soroscan.io/api/ingest/contracts/ \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "contract_id": "CABC123...",
    "name": "My Token Contract",
    "alias": "my-token",
    "network": "testnet",
    "max_events_per_minute": 100
  }'
```

Response:

```json
{
  "id": 42,
  "contract_id": "CABC123...",
  "name": "My Token Contract",
  "alias": "my-token",
  "is_active": true,
  "network": "testnet",
  "created_at": "2026-08-28T00:00:00Z"
}
```

### Configuration Options

| Field                   | Description                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `max_events_per_minute` | Ingest rate limit for this contract (default: unlimited). Set to protect your quota. |
| `alias`                 | Short human-readable identifier for use in dashboard URLs.                           |
| `network`               | `testnet`, `mainnet`, or `futurenet`.                                                |
| `is_active`             | Set to `false` to pause indexing without deleting the registration.                  |

---

## Step 4: Test Event Ingestion

After registration, verify that SoroScan is picking up events from your contract.

### Trigger a Transaction

Submit a transaction that calls a function emitting an event, then check SoroScan:

```bash
# Poll events for the contract (may take 1-2 ledger closing times ~5 seconds)
curl -H "Authorization: Bearer <your-api-key>" \
  "https://api.soroscan.io/api/ingest/contracts/CABC123.../events/?page_size=5"
```

### Check Ingestion Stats

```bash
curl -H "Authorization: Bearer <your-api-key>" \
  https://api.soroscan.io/api/ingest/contracts/42/stats/
```

```json
{
  "contract_id": "CABC123...",
  "total_events": 3,
  "unique_event_types": 1,
  "latest_ledger": 512045,
  "last_activity": "2026-08-28T10:00:00Z"
}
```

### Use the Record Endpoint for Testing

For development testing without a live contract, use the ingest record endpoint to submit a synthetic event:

```bash
curl -X POST https://api.soroscan.io/api/ingest/record/ \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "contract_id": "CABC123...",
    "event_type": "transfer",
    "payload_hash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  }'
```

---

## Step 5: Webhook Configuration

Webhooks let your application receive real-time notifications when SoroScan indexes new events.

### Register a Webhook

```bash
curl -X POST https://api.soroscan.io/api/ingest/webhooks/ \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "target_url": "https://myapp.example.com/hooks/soroscan",
    "event_types": ["transfer", "swap"],
    "contract_id": "CABC123...",
    "secret": "your-webhook-signing-secret"
  }'
```

### Verify the Webhook Signature

SoroScan signs every delivery with HMAC-SHA256 using your `secret`. Verify it in your receiver:

```python
import hashlib, hmac

def verify_signature(secret: str, payload_bytes: bytes, signature_header: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload_bytes,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature_header)

# In your Django / Flask view:
sig = request.headers.get("X-SoroScan-Signature", "")
if not verify_signature(WEBHOOK_SECRET, request.body, sig):
    return HttpResponse(status=401)
```

### Test the Webhook

```bash
# Send a test delivery synchronously
curl -X POST \
  https://api.soroscan.io/api/ingest/webhooks/<webhook_id>/test/ \
  -H "Authorization: Bearer <your-api-key>"
```

```json
{
  "status": "test_webhook_queued"
}
```

### Webhook Payload Format

```json
{
  "event_id": 42,
  "contract_id": "CABC123...",
  "event_type": "transfer",
  "ledger": 512045,
  "timestamp": "2026-08-28T10:00:00Z",
  "tx_hash": "abcd1234...",
  "payload": {
    "from": "GAAA...",
    "to": "GBBB...",
    "amount": 1000
  }
}
```

---

## Step 6: Monitoring Integration

### Check Completeness

SoroScan tracks ledger completeness per contract. Use the completeness endpoint to verify no ledgers were missed:

```bash
curl -H "Authorization: Bearer <your-api-key>" \
  https://api.soroscan.io/api/ingest/contracts/42/completeness/
```

### Event Type Breakdown

```bash
curl https://api.soroscan.io/api/ingest/contracts/CABC123.../event-types/
```

```json
[
  { "event_type": "transfer", "count": 1250 },
  { "event_type": "swap", "count": 312 }
]
```

### Deployment History and ABI Versions

```bash
curl -H "Authorization: Bearer <your-api-key>" \
  https://api.soroscan.io/api/ingest/contracts/CABC123.../deployments/
```

Returns full deployment history with ABI version compatibility warnings for breaking changes.

### Prometheus Metrics to Watch

| Metric                                      | Labels                   | What it tells you                                           |
| ------------------------------------------- | ------------------------ | ----------------------------------------------------------- |
| `soroscan_events_ingested_total`            | `contract_id`, `network` | Ingestion throughput                                        |
| `soroscan_events_rate_limited_total`        | `contract_id`, `network` | Rate limit hits — raise `max_events_per_minute` if non-zero |
| `soroscan_events_validation_failures_total` | `contract_id`            | ABI mismatches — check your event schema                    |
| `soroscan_ledger_gaps_total`                | `contract_id`            | Missed ledgers — investigate ingest worker health           |
| `soroscan_missing_events_total`             | `contract_id`            | Reconciliation gaps                                         |

---

## Step 7: Example Contract (Full Walkthrough)

Below is a minimal Soroban contract that emits SoroScan-compatible events, suitable for testing the full integration
flow.

```rust
#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, token, Address, Env, Symbol};

#[contract]
pub struct SimpleToken;

#[contractimpl]
impl SimpleToken {
    /// Transfer tokens and emit a SoroScan-compatible event.
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();

        // ... (token balance logic omitted for brevity)

        // Emit event — topics: (event_type, from, to), data: amount
        env.events().publish(
            (symbol_short!("transfer"), from.clone(), to.clone()),
            amount,
        );
    }
}
```

After deploying to testnet, register the contract and upload the ABI (see Steps 2–3), then trigger a transfer and
confirm the event appears in `GET /api/ingest/contracts/<id>/events/`.

---

## Troubleshooting

### Events not appearing after a transaction

1. **Check contract registration:** Confirm the contract is registered and `is_active=true`.
1. **Check ledger lag:** SoroScan polls every few seconds. Wait 1–2 ledger closing times (~10 seconds on testnet).
1. **Check completeness:** `GET /api/ingest/contracts/<id>/completeness/` — look for `missing_ledgers`.
1. **Check ingest errors:** `GET /api/ingest/admin/ingest-errors/` (staff only) — look for validation failures.
1. **Check the network config:** Confirm `network` in the contract registration matches where you deployed.

### Events are ingested but payload is wrong

1. **Verify ABI:** Re-upload the ABI and confirm it matches the on-chain event structure.
1. **Check `events_validation_failures_total` metric** — rising values indicate ABI mismatch.
1. **Check the raw event:** Use `GET /api/ingest/events/<id>/` to inspect the raw stored payload.

### Webhook deliveries failing

1. **Check your endpoint:** It must respond with HTTP 200 within 30 seconds.
1. **Verify signature:** Confirm HMAC-SHA256 signature validation is not rejecting deliveries.
1. **Check dead-letter queue:** `GET /api/webhooks/deliveries/metrics/` for delivery status breakdown.
1. **Test delivery:** Use `POST /api/ingest/webhooks/<id>/test/` to send a synchronous test delivery.

### Rate limit exceeded (429)

- Check `RateLimit-Remaining` header — if it reaches 0 frequently, raise `max_events_per_minute` on the contract or your
  API key quota.
- Review `soroscan_events_rate_limited_total` metric to understand frequency.

---

_See also: `docs/rate-limits.mdx` · `django-backend/docs/api_reference.md` · `docs/deployment/monitoring.md`_
