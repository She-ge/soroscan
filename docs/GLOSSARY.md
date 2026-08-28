# Stellar & Soroban Glossary

This glossary defines common Stellar, Soroban, and SoroScan terminology used throughout the project. Terms are alphabetized for quick reference.

## Official references

- [Stellar data structures](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures)
- [Ledgers](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/ledgers)
- [Events](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/events)
- [Smart contract overview](https://developers.stellar.org/docs/build/smart-contracts/overview)
- [Contract authorization](https://developers.stellar.org/docs/learn/fundamentals/contract-development/authorization)
- [Contract storage](https://developers.stellar.org/docs/learn/fundamentals/contract-development/storage/persisting-data)
- [State archival and TTL](https://developers.stellar.org/docs/learn/fundamentals/contract-development/storage/state-archival)
- [Contract events guide](https://developers.stellar.org/docs/build/guides/events)
- [Stellar RPC](https://developers.stellar.org/docs/data/apis/rpc)
- [Horizon](https://developers.stellar.org/docs/data/apis/horizon)
- [Networks](https://developers.stellar.org/docs/networks)
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli/stellar-cli)
- [XDR](https://developers.stellar.org/docs/learn/fundamentals/data-format/xdr)

## SoroScan references

- [Track contract events](./cookbook/track-contract-events.md)
- [Soroban contract integration](./cookbook/soroban-contract-integration.md)
- [Filter by event type](./cookbook/filter-by-event-type.md)
- [Query transaction events](./cookbook/query-transaction-events.md)
- [Webhook guide](./cookbook/webhooks.md)
- [GraphQL API](./api-reference/graphql.mdx)
- [Deployment runbook](./DEPLOYMENT.md)
- [Architecture overview](./architecture/README.md)

---

## A

### Account

A ledger entry representing a Stellar account. Accounts can hold XLM, establish trustlines, sign transactions, and act as transaction source accounts.

Official docs: [Stellar data structures](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures)

### Address

A human-readable Stellar identifier for an account or smart contract. In Soroban APIs, addresses are commonly represented through `ScAddress`.

Official docs: [Smart contract overview](https://developers.stellar.org/docs/build/smart-contracts/overview)

### Asset

A unit of value represented on Stellar, including native XLM and issued assets. Stellar assets can also be exposed to smart contracts through the built-in Stellar Asset Contract.

Official docs: [Stellar data structures](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures)

### Auth Entry

Short form for a Soroban authorization entry. It carries the credentials and authorized invocation tree required when a contract call needs authorization beyond the transaction signature.

Official docs: [Contract authorization](https://developers.stellar.org/docs/learn/fundamentals/contract-development/authorization)

## B

### Base Fee

The network fee charged per operation before any surge-pricing adjustment. Fee values are denominated in stroops.

Official docs: [Ledgers](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/ledgers)

### Base Reserve

The reserve amount used when calculating the minimum XLM balance required for ledger entries associated with an account.

Official docs: [Ledgers](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/ledgers)

## C

### Classic Asset Contract

The built-in smart contract interface that lets Soroban contracts interact with Stellar classic assets and their issuer controls.

Official docs: [Smart contract overview](https://developers.stellar.org/docs/build/smart-contracts/overview)

### Contract

Executable WebAssembly code plus associated state deployed to Stellar's smart-contract platform. Contracts expose functions that can be invoked by transactions or other contracts.

Official docs: [Smart contract overview](https://developers.stellar.org/docs/build/smart-contracts/overview)

SoroScan: [Soroban contract integration](./cookbook/soroban-contract-integration.md)

### Contract Data

Ledger entries of type `CONTRACT_DATA` used by smart contracts to store state. Contract data may use instance, persistent, or temporary storage semantics.

Official docs: [Contract storage](https://developers.stellar.org/docs/learn/fundamentals/contract-development/storage/persisting-data)

### Contract Event

An event emitted by a smart contract to describe an action or state change for off-chain consumers. Successful Soroban transactions can include contract events in transaction metadata.

Official docs: [Events](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/events)

SoroScan: [Track contract events](./cookbook/track-contract-events.md)

### Contract ID

The identifier of a deployed smart contract. SoroScan uses contract IDs to select which contracts are tracked, queried, filtered, or subscribed to.

Official docs: [Smart contract overview](https://developers.stellar.org/docs/build/smart-contracts/overview)

SoroScan: [Soroban contract integration](./cookbook/soroban-contract-integration.md)

### Contract Instance

The ledger entry that represents a deployed contract instance and its instance storage. Instance storage shares the lifecycle of the contract instance.

Official docs: [State archival and TTL](https://developers.stellar.org/docs/learn/fundamentals/contract-development/storage/state-archival)

### Contract Storage

The state managed by a smart contract. Soroban provides instance, persistent, and temporary storage types with different lifecycle behavior.

Official docs: [Contract storage](https://developers.stellar.org/docs/learn/fundamentals/contract-development/storage/persisting-data)

## D

### Diagnostic Event

A diagnostic event emitted for debugging or execution diagnostics. Unlike normal contract events, diagnostic events are not intended as durable application-level business events.

Official docs: [Events](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/events)

## E

### Envelope

The signed XDR structure that wraps a Stellar transaction for submission to the network.

Official docs: [XDR](https://developers.stellar.org/docs/learn/fundamentals/data-format/xdr)

### Event

A structured record describing something that occurred during Stellar transaction processing. Events can include contract, system, diagnostic, fee, and operation-related information depending on protocol metadata.

Official docs: [Events](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/events)

SoroScan: [Track contract events](./cookbook/track-contract-events.md)

### Event Topic

One of the indexed values attached to a smart-contract event. Topics let clients identify and filter events without decoding the entire event payload.

Official docs: [Contract events guide](https://developers.stellar.org/docs/build/guides/events)

SoroScan: [Filter by event type](./cookbook/filter-by-event-type.md)

## F

### Fee Bump Transaction

A transaction envelope that allows one account to pay the fee for another transaction while preserving the inner transaction's source and operations.

Official docs: [Stellar data structures](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures)

### Footprint

The set of ledger keys a Soroban transaction declares that it expects to read from or write to. The footprint is used during simulation and resource accounting.

Official docs: [Smart contract overview](https://developers.stellar.org/docs/build/smart-contracts/overview)

### Friendbot

A development service used on supported test networks to create and fund test accounts. It is intended for testing and not for production/mainnet funding.

Official docs: [Networks](https://developers.stellar.org/docs/networks)

## H

### Horizon

Stellar's HTTP API service for accessing classic network data such as accounts, transactions, operations, effects, and ledgers. Smart-contract applications increasingly use Stellar RPC for Soroban-specific transaction and event workflows.

Official docs: [Horizon](https://developers.stellar.org/docs/data/apis/horizon)

### Host Function

A function executed by the Soroban host environment. Host functions include invoking a contract, uploading contract Wasm, and creating a contract.

Official docs: [Smart contract overview](https://developers.stellar.org/docs/build/smart-contracts/overview)

## I

### Invocation

A call to a contract function, including nested calls that may occur when one contract invokes another. Authorization entries can describe an invocation tree.

Official docs: [Contract authorization](https://developers.stellar.org/docs/learn/fundamentals/contract-development/authorization)

## L

### Ledger

The network state produced after a Stellar consensus round. A ledger contains entries such as accounts, balances, offers, liquidity pools, and smart-contract data.

Official docs: [Ledgers](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/ledgers)

### Ledger Entry

A typed record stored in the Stellar ledger. Examples include accounts, trustlines, offers, contract data, and contract instances.

Official docs: [Ledgers](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/ledgers)

### Ledger Key

The XDR key used to identify a particular ledger entry. Soroban transaction footprints are expressed in terms of ledger keys.

Official docs: [XDR](https://developers.stellar.org/docs/learn/fundamentals/data-format/xdr)

### Ledger Sequence

The monotonically increasing sequence number of a ledger. The genesis ledger has sequence `1`, and each subsequent ledger increments the sequence by one.

Official docs: [Ledgers](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/ledgers)

SoroScan: [Query transaction events](./cookbook/query-transaction-events.md)

### Ledger TTL

The remaining time-to-live associated with smart-contract ledger entries. When TTL reaches zero, behavior depends on storage type: entries may be archived or permanently removed.

Official docs: [State archival and TTL](https://developers.stellar.org/docs/learn/fundamentals/contract-development/storage/state-archival)

### Liquidity Pool

A ledger object that holds reserves for automated market-making between two Stellar assets.

Official docs: [Stellar data structures](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures)

### Lumen (XLM)

The native asset of the Stellar network. XLM is used for fees, minimum balance requirements, and native value transfers.

Official docs: [Stellar data structures](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures)

## N

### Network Passphrase

A network-specific string included in Stellar signing domains. Using the wrong passphrase when signing produces signatures that are invalid for the intended network.

Official docs: [Networks](https://developers.stellar.org/docs/networks)

## O

### Operation

An action contained in a Stellar transaction. Smart-contract invocation uses the `InvokeHostFunction` operation.

Official docs: [Smart contract overview](https://developers.stellar.org/docs/build/smart-contracts/overview)

## P

### Protocol Version

The version of the Stellar protocol active for a ledger. Protocol upgrades can add or change network capabilities, XDR types, host functions, and smart-contract behavior.

Official docs: [Networks](https://developers.stellar.org/docs/networks)

## R

### RPC

Remote Procedure Call. In the Stellar ecosystem, Stellar RPC provides JSON-RPC methods for simulating transactions, submitting Soroban transactions, retrieving transaction status, ledger entries, and contract events.

Official docs: [Stellar RPC](https://developers.stellar.org/docs/data/apis/rpc)

## S

### ScAddress

The XDR value type used to represent a Stellar account address or contract address inside Soroban data structures.

Official docs: [XDR](https://developers.stellar.org/docs/learn/fundamentals/data-format/xdr)

### SCVal

The XDR union used for Soroban contract values. It can represent primitives and structured values such as booleans, integers, symbols, addresses, vectors, and maps.

Official docs: [XDR](https://developers.stellar.org/docs/learn/fundamentals/data-format/xdr)

### Sequence Number

A number associated with a Stellar account and consumed by source-account transactions to prevent replay and establish transaction ordering.

Official docs: [Stellar data structures](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures)

### Signature

Cryptographic proof attached to a transaction or authorization payload to demonstrate that an authorized signer approved it.

Official docs: [Contract authorization](https://developers.stellar.org/docs/learn/fundamentals/contract-development/authorization)

### Smart Contract

A program deployed to Stellar and compiled to WebAssembly. Smart contracts can store state, expose callable functions, require authorization, and emit events.

Official docs: [Smart contract overview](https://developers.stellar.org/docs/build/smart-contracts/overview)

### Soroban

The name of Stellar's smart-contract platform. Soroban functionality is integrated into the Stellar protocol and is used to build and run smart contracts.

Official docs: [Smart contract overview](https://developers.stellar.org/docs/build/smart-contracts/overview)

### Soroban Authorization

The smart-contract authorization framework used to express who authorizes an invocation and which invocation tree is approved.

Official docs: [Contract authorization](https://developers.stellar.org/docs/learn/fundamentals/contract-development/authorization)

### Soroban RPC

A commonly used name for the Stellar RPC service when referring specifically to Soroban workflows. It exposes methods used by smart-contract clients for simulation, submission, status lookup, ledger data, and events.

Official docs: [Stellar RPC](https://developers.stellar.org/docs/data/apis/rpc)

### Stellar Consensus Protocol (SCP)

The federated Byzantine agreement protocol Stellar nodes use to reach agreement on the transaction set applied to the next ledger.

Official docs: [Ledgers](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/ledgers)

### Stellar Core

The node software that participates in the Stellar peer-to-peer network, runs consensus, validates transactions, and applies ledger state transitions.

Official docs: [Networks](https://developers.stellar.org/docs/networks)

### Stroop

The smallest unit of XLM. One stroop is `0.0000001 XLM`; transaction fee values are commonly expressed in stroops.

Official docs: [Stellar CLI](https://developers.stellar.org/docs/tools/cli/stellar-cli)

### Symbol

A compact Soroban value often used for function names, enum-like keys, and event topics.

Official docs: [Contract events guide](https://developers.stellar.org/docs/build/guides/events)

## T

### Testnet

Stellar's public development network. Testnet is intended for testing and can be reset, so applications must not treat its state as permanently durable.

Official docs: [Networks](https://developers.stellar.org/docs/networks)

### Topic Filter

A filter that matches contract events by one or more event-topic values. Topic filters are useful for narrowing event ingestion or subscription queries.

Official docs: [Contract events guide](https://developers.stellar.org/docs/build/guides/events)

SoroScan: [Filter by event type](./cookbook/filter-by-event-type.md)

### Transaction

A signed container of one or more Stellar operations. Soroban contract interaction is submitted through a Stellar transaction containing an `InvokeHostFunction` operation.

Official docs: [Smart contract overview](https://developers.stellar.org/docs/build/smart-contracts/overview)

### Transaction Hash

The cryptographic identifier derived from a transaction. SoroScan uses transaction hashes to correlate indexed events with their originating network transaction.

Official docs: [XDR](https://developers.stellar.org/docs/learn/fundamentals/data-format/xdr)

SoroScan: [Query transaction events](./cookbook/query-transaction-events.md)

### Transaction Meta

The XDR metadata produced when a transaction is applied. It records state changes and, for smart-contract transactions, can contain contract and diagnostic event information.

Official docs: [Events](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/events)

### TTL

Time To Live. Soroban ledger entries have a TTL that determines how long their state remains live before archival or deletion rules apply.

Official docs: [State archival and TTL](https://developers.stellar.org/docs/learn/fundamentals/contract-development/storage/state-archival)

## W

### Wasm

WebAssembly, the portable binary format used for Stellar smart-contract executables. Soroban contracts are commonly written in Rust and compiled to Wasm before upload and deployment.

Official docs: [Smart contract overview](https://developers.stellar.org/docs/build/smart-contracts/overview)

### Webhook

An HTTP callback used by SoroScan to push matching indexed event data to a subscriber endpoint.

SoroScan: [Webhook guide](./cookbook/webhooks.md)

## X

### XDR

External Data Representation, the canonical binary serialization format used throughout Stellar for ledger data, transactions, results, history, and protocol messages.

Official docs: [XDR](https://developers.stellar.org/docs/learn/fundamentals/data-format/xdr)
