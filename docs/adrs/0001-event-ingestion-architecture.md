# ADR 0001: Event Ingestion Architecture

## Status
Accepted

## Context
SoroScan needs to continuously monitor the Soroban network for smart contract events. The Stellar network produces a new ledger roughly every 5 seconds. We need a reliable, horizontally scalable way to ingest these events without missing any data during network instability or application downtime. Options considered included relying on Horizon streaming or directly polling the Soroban RPC.

## Decision
We decided to use a polling-based architecture using Celery workers against the Soroban RPC.
1. A singleton Celery Beat task acts as the "Ingestion Coordinator," checking the latest network ledger against our database's highest processed ledger.
2. The coordinator chunks the missing ledgers and dispatches separate Celery tasks to fetch events for those chunks concurrently.
3. Once a chunk is successfully fetched and persisted to PostgreSQL, the cursor is updated.

## Consequences
**Positive:**
* **Resilience:** If the application goes down, it simply resumes polling from the last saved cursor. No events are missed.
* **Scalability:** By chunking ledgers, we can spin up multiple Celery workers to backfill data extremely fast.
* **RPC Friendly:** We have precise control over request rates and can implement backoff strategies when the RPC rate limits us.

**Negative:**
* **Latency:** Polling introduces a slight delay (typically 1-3 seconds) compared to a pure push-based streaming architecture.
* **Complexity:** Requires managing Celery workers, Redis (as a broker), and ensuring the coordinator doesn't dispatch overlapping chunks.
