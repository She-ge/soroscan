# Soroban Contracts

This folder contains all Soroban smart contracts for SoroScan.

## Repository layout

```text
soroban-contracts/
├── soroscan_core/    # Compiled and deployed contract crate
└── soroscan_macros/  # Procedural macros used by soroscan_core
```

`soroscan_core` is the only deployable contract in this repository. The uppercase `lib.RS` prototype and the
un-manifested `src/` feature snippets were removed because they were never part of a Cargo package or CI build. Their
supported behavior lives in `soroscan_core` and the off-chain indexer.

## Contracts

### soroscan_core

The core contract that:

- Accepts event submissions from authorized indexers
- Emits standardized events for off-chain consumption
- Stores event counters and latest events by type

### Emitting Custom Events

To emit custom indexed events for off-chain consumption, use `env.events().publish(...)` in your contract functions. The
first argument is a tuple of up to 4 topics (keys), and the second argument is the event data payload.

```rust
#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Env, Symbol};

#[contract]
pub struct CustomEventContract;

#[contractimpl]
impl CustomEventContract {
    pub fn emit_custom_event(env: Env, user_id: u32, action: Symbol) {
        // Topics define how the event is indexed. Use a tuple for multiple topics.
        let topics = (symbol_short!("action"), user_id);

        // The data payload of the event
        let data = action;

        // Emit the custom event
        env.events().publish(topics, data);
    }
}
```

## Building

```bash
cd soroscan_core
cargo build --target wasm32-unknown-unknown --release
```

## Testing

Unit tests live in `soroscan_core/src/lib.rs` under `#[cfg(test)]` and use `soroban_sdk::testutils` (`Env::default()`,
`register_contract`, `mock_all_auths`).

| Test                                          | Scenario                                  | Expected                             |
| --------------------------------------------- | ----------------------------------------- | ------------------------------------ |
| `test_initialize`                             | Deploy and init with admin                | Admin set correctly                  |
| `test_add_indexer_as_admin`                   | Admin adds indexer                        | Indexer whitelisted                  |
| `test_add_indexer_as_non_admin`               | Non-admin adds indexer                    | `ContractError::Unauthorized`        |
| `test_record_event_whitelisted`               | Whitelisted indexer records event         | Event emitted, counter incremented   |
| `test_record_event_not_whitelisted`           | Non-whitelisted address records           | `ContractError::IndexerNotFound`     |
| `test_remove_indexer`                         | Admin removes indexer                     | Indexer no longer whitelisted        |
| `test_recent_events_returns_newest_first`     | Query recent events after several records | Events returned newest-first         |
| `test_recent_events_respects_limit`           | Query with a `limit` smaller than history | Only `limit` newest events returned  |
| `test_recent_events_evicts_oldest_beyond_cap` | Record more than the retention cap        | Oldest entries evicted, cap enforced |
| `test_recent_events_invalid_limit`            | Query with `limit` above the cap          | `ContractError::InvalidLimit`        |

### SC-9: Indexer authorization

The `add_indexer` contract function is exposed via:

- Django: `POST /api/ingest/indexers/add/`
- Python SDK: `client.add_indexer(indexer_address)`
- TypeScript SDK: `client.addIndexer({ indexerAddress })`
- CLI: `soroscan indexers add <address>`

### SC-15: Contract authorization queries

Read-only Soroban simulations for `is_indexer` and `get_admin` are exposed via:

- Django: `GET /api/ingest/indexers/check/?indexer_address=...`, `GET /api/ingest/contract/admin/`
- Python SDK: `client.is_indexer()`, `client.get_admin()`
- TypeScript SDK: `client.isIndexer()`, `client.getAdmin()`

Run all tests:

```bash
cd soroscan_core
cargo test
```

Expected output: all tests passing with no warnings.

## SC-38 structured events

`record_structured_event` adds an opt-in, backward-compatible event format. It accepts the existing contract ID, event
type, and SHA-256 payload hash plus a non-zero `schema_version` and a 32-byte `correlation_id`. The correlation ID is
stored and rejects retries that would otherwise publish a duplicate event.

The Python and TypeScript SDKs expose this as `record_structured_event` and `recordStructuredEvent`; both submit to
`POST /api/record/structured/`.

## SC-30 recent events per contract

`recent_events(contract_id, limit)` returns the most recently recorded events for a specific contract, newest first. The
contract keeps a bounded, per-contract FIFO buffer (`MAX_RECENT_EVENTS_PER_CONTRACT`, currently 20 entries) that is
updated by both `record_event` and `record_events_batch`; older entries are evicted automatically once the cap is
reached.

- `limit == 0` returns everything currently retained (up to the cap).
- `limit` greater than the cap returns `ContractError::InvalidLimit`.

The Python and TypeScript SDKs expose this as `get_contract_recent_events` and `getContractRecentEvents`, backed by
`GET /api/contracts/<contract_id>/recent-events/` (Python) and `GET /v1/contracts/<contract_id>/recent-events`
(TypeScript), which query the richer off-chain indexed event history rather than calling the contract directly.

## Deploying to Testnet

```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/soroscan_core.wasm \
  --source <YOUR_SECRET_KEY> \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```
