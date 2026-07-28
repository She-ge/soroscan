# Soroban Contracts

This folder contains all Soroban smart contracts for SoroScan.

## Contracts

### soroscan_core

The core contract that:
- Accepts event submissions from authorized indexers
- Emits standardized events for off-chain consumption
- Stores event counters and latest events by type

## Building

```bash
cd soroscan_core
cargo build --target wasm32-unknown-unknown --release
```

## Testing

Unit tests live in `soroscan_core/src/lib.rs` under `#[cfg(test)]` and use
`soroban_sdk::testutils` (`Env::default()`, `register_contract`, `mock_all_auths`).

| Test | Scenario | Expected |
|------|----------|----------|
| `test_initialize` | Deploy and init with admin | Admin set correctly |
| `test_add_indexer_as_admin` | Admin adds indexer | Indexer whitelisted |
| `test_add_indexer_as_non_admin` | Non-admin adds indexer | `ContractError::Unauthorized` |
| `test_record_event_whitelisted` | Whitelisted indexer records event | Event emitted, counter incremented |
| `test_record_event_not_whitelisted` | Non-whitelisted address records | `ContractError::IndexerNotFound` |
| `test_remove_indexer` | Admin removes indexer | Indexer no longer whitelisted |

Run all tests:

```bash
cd soroscan_core
cargo test
```

Expected output: all tests passing with no warnings.

## Deploying to Testnet

```bash
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/soroscan_core.wasm \
  --source <YOUR_SECRET_KEY> \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```
