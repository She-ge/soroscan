# ADR 0003: Database Schema Rationale

## Status
Accepted

## Context
Soroban smart contracts emit events containing `topics` and `data`. The structure of `data` is entirely dependent on the specific smart contract, making it highly variable and schema-less. We needed a storage solution that could handle both relational data (Users, Webhooks, API Keys) and this highly dynamic blockchain data, while maintaining high query performance.

## Decision
We decided to use **PostgreSQL** as our primary database and utilize its native **JSONB** column type for the dynamic event payloads.
* Relational models (Users, Webhooks) use standard strict column types.
* The `EventRecord` model stores the smart contract payload as:
  * `topics`: `JSONField` (Array of strings)
  * `data`: `JSONField` (Object representing the parsed XDR)
* We applied a composite B-Tree index on `(contract_id, ledger_seq DESC)`.
* We applied a GIN index on the `topics` JSONB column to allow fast filtering by specific event types.

## Consequences
**Positive:**
* **Single Datastore:** We avoid the operational complexity of maintaining both a relational database (like MySQL) and a NoSQL database (like MongoDB).
* **ACID Guarantees:** Postgres provides robust transaction safety for our webhook dispatch states and billing data.
* **Flexibility:** JSONB allows us to store any arbitrary Soroban event without schema migrations, while still allowing querying inside the JSON document via Django's `__contains` and `__has_key` lookups.

**Negative:**
* **Storage Size:** JSONB consumes more disk space than highly optimized, strictly typed binary schemas.
* **Complex Queries:** Deeply nested JSONB queries can be less performant than querying indexed relational columns. If a specific data field becomes highly queried, we may need to extract it to an indexed generated column.
