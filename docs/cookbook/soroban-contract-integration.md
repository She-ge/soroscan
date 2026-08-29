# Soroban Contract Integration Guide

This guide shows how to integrate custom Soroban contracts with SoroScan so events are indexed, queryable, and deliverable via webhooks.

## What You Will Configure

- Event emission format in your Soroban contract.
- Contract registration and ABI/schema setup in SoroScan.
- Event ingestion validation.
- Webhook routing for contract events.
- Monitoring for ingestion health and delivery reliability.

## Prerequisites

- Deployed Soroban contract.
- SoroScan API key.
- Access to SoroScan backend endpoint.
- Contract identifier (for example `C...`).

## 1) Event Emission Standards

Emit stable, explicit event topics and payload fields.

Recommended event shape:

- Topic: operation name, such as `transfer`, `swap`, `mint`.
- Payload: deterministic key/value object.
- Required metadata in payload when relevant: actor, amount, asset, timestamp or ledger context.

### Example contract event (Rust)

```rust
#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env};

#[contract]
pub struct TokenContract;

#[contractimpl]
impl TokenContract {
    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        let topic = symbol_short!("transfer");
        env.events().publish((topic,), (from, to, amount));
    }
}
```

Guidelines:

- Do not change topic names after production launch unless versioned.
- Keep payload ordering and data types stable.
- Use explicit integer/string types to avoid downstream ambiguity.

## 2) Register Contract and ABI

Register the contract so SoroScan starts indexing it.

```bash
curl -X POST https://api.soroscan.io/api/ingest/contracts/ \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contract_id": "CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "name": "My Custom Soroban Contract",
    "description": "Primary protocol contract",
    "abi_schema": {
      "events": [
        {
          "name": "transfer",
          "fields": ["from", "to", "amount"]
        }
      ]
    }
  }'
```

If you maintain JSON schema for payload validation, include `json_schema` in the same create/update workflow.

## 3) Test Event Ingestion

After emitting events on-chain, confirm they are indexed.

```bash
curl "https://api.soroscan.io/api/ingest/events/?contract_id=CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX&limit=10" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Expected result:

- HTTP `200`.
- Recent events present for your contract.
- Correct `event_type`, `ledger`, `tx_hash`, and payload fields.

## 4) Configure Webhooks

Create a webhook for all events or a specific event type.

```bash
curl -X POST https://api.soroscan.io/api/ingest/webhooks/ \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contract": 123,
    "event_type": "transfer",
    "target_url": "https://your-app.example/webhooks/soroscan",
    "is_active": true
  }'
```

Operational recommendations:

- Verify HMAC signatures on every webhook request.
- Implement idempotency by `event_id` or `tx_hash` + `event_index`.
- Return `2xx` quickly and process asynchronously.

## 5) Monitoring Integration

Track ingestion and delivery with these baseline signals:

- Ingestion lag: latest indexed ledger vs network head.
- Event volume: events/min by contract and type.
- Webhook outcomes: success rate, retries, and 4xx/5xx splits.
- Rate-limit signals: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`.

Use dashboard alerts for:

- Sustained ingestion lag.
- Spike in webhook failures.
- Repeated 429 responses.

## End-to-End Walkthrough

1. Deploy contract update with stable event topics.
2. Register contract in SoroScan.
3. Emit test transaction that triggers your event.
4. Query events endpoint and validate payload.
5. Add webhook subscription.
6. Trigger event again and verify webhook receipt.
7. Add monitor/alerts for lag and failures.

## Troubleshooting

### Contract registered but no events

- Verify contract ID matches deployment network.
- Confirm the contract actually emits events for the tested action.
- Check indexer/network connectivity and ingestion logs.

### Events visible but webhook not firing

- Confirm webhook is active and points to a reachable URL.
- Inspect webhook receiver response codes.
- Validate event type filter matches emitted topic.

### Frequent 429 responses

- Reduce polling cadence.
- Batch queries when possible.
- Monitor RateLimit headers and back off before exhaustion.

### Payload decoding issues

- Update `abi_schema` to match current contract output.
- Keep event field ordering stable across deployments.
