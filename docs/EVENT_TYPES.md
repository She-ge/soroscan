# Standard Soroban Event Types

This document describes the standard event types emitted by Soroban smart contracts and indexed by SoroScan. It covers
token events (SEP-41 / Stellar Asset Contract standard), DEX/AMM events, and lending protocol events, along with their
topic structure, ABI definitions, and sample decoded payloads.

---

## How Soroban Events Are Structured

Every Soroban event has two parts:

- **Topics** — a vector of `SCVal` values that identify and categorise the event. The first topic is conventionally the
  event name as a `Symbol`. Additional topics carry indexed identifiers (e.g. addresses) that allow efficient filtering.
- **Data** — a single `SCVal` (often an `SCV_VEC`) carrying the event's payload fields.

On-chain (in the `SoroScanCore` contract), events are published as:

```rust
env.events().publish(
    (symbol_short!("soroscan"), event_type),  // topics
    record,                                   // data
);
```

Off-chain, SoroScan captures the raw XDR of the data field as `ContractEvent.raw_xdr` and decodes it into
`ContractEvent.decoded_payload` using the contract's registered ABI.

### Topic vector convention

```
topics[0]  →  event namespace / contract name  (Symbol, e.g. "transfer")
topics[1]  →  primary identifier               (Address — "from" for transfers)
topics[2]  →  secondary identifier             (Address — "to" for transfers, optional)
```

The exact topic structure is contract-specific. The conventions below reflect the
[Stellar SEP-41 token interface](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0041.md) and
common DEX patterns.

---

## Token Events

### `transfer`

Emitted when tokens move from one account to another.

**Topics:** `["transfer", <from: Address>, <to: Address>]`

**ABI definition:**

```json
{
  "name": "transfer",
  "fields": [
    { "name": "from", "type": "Address" },
    { "name": "to", "type": "Address" },
    { "name": "amount", "type": "I128" }
  ]
}
```

**Sample decoded payload:**

```json
{
  "event_type": "transfer",
  "ledger": 1204800,
  "tx_hash": "a3f9...c012",
  "decoded_payload": {
    "from": "GAHJJJKMOKYE4RVPZEWZTKH5FVI4PA3VL7GK2LFNUBSGBV3A3OQJSHL",
    "to": "GDRXE2BQUC3AZNPVFSCEZ76NJ3WWL25FYFK6RGZGIEKWE4SOOHSUJUJ",
    "amount": 5000000000
  }
}
```

> `amount` is in the token's base unit (stroops for XLM, or the smallest denomination for custom tokens). Divide by
> `10^decimals` for a human-readable value.

---

### `mint`

Emitted when new tokens are created and assigned to a recipient. Only callable by the token's admin/issuer.

**Topics:** `["mint", <admin: Address>, <to: Address>]`

**ABI definition:**

```json
{
  "name": "mint",
  "fields": [
    { "name": "admin", "type": "Address" },
    { "name": "to", "type": "Address" },
    { "name": "amount", "type": "I128" }
  ]
}
```

**Sample decoded payload:**

```json
{
  "event_type": "mint",
  "ledger": 1205100,
  "tx_hash": "b7e1...f340",
  "decoded_payload": {
    "admin": "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGPZKOSF6K3KI24I1UR3AE",
    "to": "GAHJJJKMOKYE4RVPZEWZTKH5FVI4PA3VL7GK2LFNUBSGBV3A3OQJSHL",
    "amount": 10000000000
  }
}
```

---

### `burn`

Emitted when tokens are permanently destroyed from an account's balance.

**Topics:** `["burn", <from: Address>]`

**ABI definition:**

```json
{
  "name": "burn",
  "fields": [
    { "name": "from", "type": "Address" },
    { "name": "amount", "type": "I128" }
  ]
}
```

**Sample decoded payload:**

```json
{
  "event_type": "burn",
  "ledger": 1205250,
  "tx_hash": "d2a4...8bc7",
  "decoded_payload": {
    "from": "GAHJJJKMOKYE4RVPZEWZTKH5FVI4PA3VL7GK2LFNUBSGBV3A3OQJSHL",
    "amount": 250000000
  }
}
```

---

### `approve`

Emitted when an account authorises a spender to use up to a given amount on its behalf (allowance pattern).

**Topics:** `["approve", <from: Address>, <spender: Address>]`

**ABI definition:**

```json
{
  "name": "approve",
  "fields": [
    { "name": "from", "type": "Address" },
    { "name": "spender", "type": "Address" },
    { "name": "amount", "type": "I128" },
    { "name": "expiration_ledger", "type": "U32" }
  ]
}
```

**Sample decoded payload:**

```json
{
  "event_type": "approve",
  "ledger": 1205400,
  "tx_hash": "e9c3...1a2f",
  "decoded_payload": {
    "from": "GAHJJJKMOKYE4RVPZEWZTKH5FVI4PA3VL7GK2LFNUBSGBV3A3OQJSHL",
    "spender": "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
    "amount": 1000000000,
    "expiration_ledger": 1300000
  }
}
```

---

### `clawback`

Emitted when an admin reclaims tokens from an account (requires clawback-enabled asset).

**Topics:** `["clawback", <admin: Address>, <from: Address>]`

**ABI definition:**

```json
{
  "name": "clawback",
  "fields": [
    { "name": "admin", "type": "Address" },
    { "name": "from", "type": "Address" },
    { "name": "amount", "type": "I128" }
  ]
}
```

**Sample decoded payload:**

```json
{
  "event_type": "clawback",
  "ledger": 1205600,
  "tx_hash": "f0b8...3d91",
  "decoded_payload": {
    "admin": "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGPZKOSF6K3KI24I1UR3AE",
    "from": "GAHJJJKMOKYE4RVPZEWZTKH5FVI4PA3VL7GK2LFNUBSGBV3A3OQJSHL",
    "amount": 500000000
  }
}
```

---

## DEX / AMM Events

### `swap`

Emitted by AMM pools when a user exchanges one token for another.

**Topics:** `["swap", <user: Address>]`

**ABI definition:**

```json
{
  "name": "swap",
  "fields": [
    { "name": "user", "type": "Address" },
    { "name": "token_in", "type": "Address" },
    { "name": "token_out", "type": "Address" },
    { "name": "amount_in", "type": "I128" },
    { "name": "amount_out", "type": "I128" }
  ]
}
```

**Sample decoded payload:**

```json
{
  "event_type": "swap",
  "ledger": 1206000,
  "tx_hash": "c1d5...7e44",
  "decoded_payload": {
    "user": "GAHJJJKMOKYE4RVPZEWZTKH5FVI4PA3VL7GK2LFNUBSGBV3A3OQJSHL",
    "token_in": "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
    "token_out": "CCWAMYJME4UECQQP56WLLBCGEIMH3PPJKIOUIQG5XJVXDCRQBWHB6CK",
    "amount_in": 2000000000,
    "amount_out": 1987654321
  }
}
```

---

### `deposit`

Emitted when a liquidity provider adds tokens to a pool.

**Topics:** `["deposit", <provider: Address>]`

**ABI definition:**

```json
{
  "name": "deposit",
  "fields": [
    { "name": "provider", "type": "Address" },
    { "name": "token_a", "type": "Address" },
    { "name": "token_b", "type": "Address" },
    { "name": "amount_a", "type": "I128" },
    { "name": "amount_b", "type": "I128" },
    { "name": "shares_minted", "type": "I128" }
  ]
}
```

**Sample decoded payload:**

```json
{
  "event_type": "deposit",
  "ledger": 1206200,
  "tx_hash": "a8f2...0c33",
  "decoded_payload": {
    "provider": "GAHJJJKMOKYE4RVPZEWZTKH5FVI4PA3VL7GK2LFNUBSGBV3A3OQJSHL",
    "token_a": "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
    "token_b": "CCWAMYJME4UECQQP56WLLBCGEIMH3PPJKIOUIQG5XJVXDCRQBWHB6CK",
    "amount_a": 5000000000,
    "amount_b": 4985000000,
    "shares_minted": 4992497500
  }
}
```

---

### `withdraw`

Emitted when a liquidity provider removes tokens from a pool by burning their LP shares.

**Topics:** `["withdraw", <provider: Address>]`

**ABI definition:**

```json
{
  "name": "withdraw",
  "fields": [
    { "name": "provider", "type": "Address" },
    { "name": "token_a", "type": "Address" },
    { "name": "token_b", "type": "Address" },
    { "name": "amount_a", "type": "I128" },
    { "name": "amount_b", "type": "I128" },
    { "name": "shares_burned", "type": "I128" }
  ]
}
```

**Sample decoded payload:**

```json
{
  "event_type": "withdraw",
  "ledger": 1206500,
  "tx_hash": "b3c9...5f17",
  "decoded_payload": {
    "provider": "GAHJJJKMOKYE4RVPZEWZTKH5FVI4PA3VL7GK2LFNUBSGBV3A3OQJSHL",
    "token_a": "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
    "token_b": "CCWAMYJME4UECQQP56WLLBCGEIMH3PPJKIOUIQG5XJVXDCRQBWHB6CK",
    "amount_a": 2490000000,
    "amount_b": 2481500000,
    "shares_burned": 2485745000
  }
}
```

---

## Lending Protocol Events

### `borrow`

Emitted when a user takes out a loan from a lending pool.

**Topics:** `["borrow", <borrower: Address>]`

**ABI definition:**

```json
{
  "name": "borrow",
  "fields": [
    { "name": "borrower", "type": "Address" },
    { "name": "asset", "type": "Address" },
    { "name": "amount", "type": "I128" },
    { "name": "borrow_rate", "type": "I128" }
  ]
}
```

**Sample decoded payload:**

```json
{
  "event_type": "borrow",
  "ledger": 1207000,
  "tx_hash": "e4d1...9a02",
  "decoded_payload": {
    "borrower": "GAHJJJKMOKYE4RVPZEWZTKH5FVI4PA3VL7GK2LFNUBSGBV3A3OQJSHL",
    "asset": "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
    "amount": 10000000000,
    "borrow_rate": 45000
  }
}
```

---

### `repay`

Emitted when a borrower repays part or all of an outstanding loan.

**Topics:** `["repay", <borrower: Address>]`

**ABI definition:**

```json
{
  "name": "repay",
  "fields": [
    { "name": "borrower", "type": "Address" },
    { "name": "asset", "type": "Address" },
    { "name": "amount", "type": "I128" }
  ]
}
```

**Sample decoded payload:**

```json
{
  "event_type": "repay",
  "ledger": 1207300,
  "tx_hash": "f6b3...c841",
  "decoded_payload": {
    "borrower": "GAHJJJKMOKYE4RVPZEWZTKH5FVI4PA3VL7GK2LFNUBSGBV3A3OQJSHL",
    "asset": "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
    "amount": 5000000000
  }
}
```

---

## SoroScan Internal Events

These events are emitted by the `SoroScanCore` on-chain contract itself and are also indexed.

### `soroscan` / `record`

Emitted by `record_event` and `record_events_batch` when an authorised indexer records an event on-chain.

**Topics:** `["soroscan", <event_type: Symbol>]`

**Data:** Full `EventRecord` struct:

```json
{
  "contract_id": "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
  "event_type": "transfer",
  "payload_hash": "a3f9c1d500000000000000000000000000000000000000000000000000000000",
  "ledger": 1204800,
  "timestamp": 1725012345
}
```

`payload_hash` is the SHA-256 hash of the event payload, used for tamper-evidence verification.

### `indexer` / `add` and `indexer` / `rem`

Emitted when the admin registers or removes an authorised indexer address.

**Topics:** `["indexer", "add"]` or `["indexer", "rem"]`

**Data:** The indexer `Address`.

### `admin` / `xfer`

Emitted when the contract admin transfers ownership to a new address.

**Topics:** `["admin", "xfer"]`

**Data:** `(old_admin: Address, new_admin: Address)`

---

## Topic Structure Summary

| Event      | topics[0]    | topics[1]            | topics[2]           |
| ---------- | ------------ | -------------------- | ------------------- |
| `transfer` | `"transfer"` | `from` (Address)     | `to` (Address)      |
| `mint`     | `"mint"`     | `admin` (Address)    | `to` (Address)      |
| `burn`     | `"burn"`     | `from` (Address)     | —                   |
| `approve`  | `"approve"`  | `from` (Address)     | `spender` (Address) |
| `clawback` | `"clawback"` | `admin` (Address)    | `from` (Address)    |
| `swap`     | `"swap"`     | `user` (Address)     | —                   |
| `deposit`  | `"deposit"`  | `provider` (Address) | —                   |
| `withdraw` | `"withdraw"` | `provider` (Address) | —                   |
| `borrow`   | `"borrow"`   | `borrower` (Address) | —                   |
| `repay`    | `"repay"`    | `borrower` (Address) | —                   |

---

## Filtering by Event Type

### REST API

```bash
curl "https://api.soroscan.io/api/events/?contract_id=C...&event_type=transfer" \
  -H "Authorization: ApiKey <your-key>"
```

### GraphQL

```graphql
query {
  contractEvents(contractId: "C...", eventType: "transfer", first: 20) {
    edges {
      node {
        ledger
        txHash
        decodedPayload
        timestamp
      }
    }
  }
}
```

### Django ORM

```python
from soroscan.ingest.models import ContractEvent

transfers = ContractEvent.objects.filter(
    contract__contract_id="C...",
    event_type="transfer",
    decoding_status="success",
).order_by("-timestamp")
```

---

## Adding a New Event Type

Event type names are free-form strings — SoroScan imposes no registry of allowed names. To index a new event type from
your contract:

1. Emit the event from your Soroban contract using `env.events().publish(...)`.
1. Register the contract with SoroScan (or ensure it is already tracked).
1. Upload an ABI definition for the new event type (see [event_decoding.md](./architecture/event_decoding.md)).
1. Run `reprocess_events` if historical events of this type already exist and you want them decoded immediately.

If you use an event filter whitelist on the `TrackedContract`, add the new event type to `event_filter_list` before it
starts appearing on-chain, otherwise those events will be dropped at ingest time.
