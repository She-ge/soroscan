# ADR 0004: Webhook Delivery System

## Status
Accepted

## Context
A core feature of SoroScan is pushing real-time alerts to developers when specific events occur on-chain. When the ingestion layer parses a new ledger, it must trigger registered webhooks. Because user-provided endpoint URLs can be slow, offline, or return errors, synchronous HTTP requests during ingestion would halt the entire indexing pipeline.

## Decision
We implemented an asynchronous dispatch system using **Celery and Redis**:
1. When an event is ingested, a lightweight Django signal creates a `WebhookDispatch` record in the database with a status of `PENDING`.
2. A Celery task (`dispatch_webhook`) is immediately sent to the Redis queue.
3. Dedicated Celery workers consume these tasks, making the HTTP POST request via the `requests` library with a strict 5-second timeout.
4. If the destination URL fails (e.g., returns 5xx or times out), Celery automatically schedules a retry using an exponential backoff algorithm (e.g., 2s, 4s, 8s, 16s...).

## Consequences
**Positive:**
* **Isolation:** The ingestion loop is completely insulated from slow external user endpoints.
* **Reliability:** Built-in retries ensure that temporary network blips do not cause users to miss critical on-chain events.
* **Auditability:** The `WebhookDispatch` table tracks the exact payload, response code, and attempt count, allowing users to debug their endpoints in our dashboard.

**Negative:**
* **Queue Buildup:** A massive spike in events combined with failing user endpoints can quickly fill the Redis queue and exhaust worker pools. We must actively monitor the `celery.queue.backlog` metric.
* **Database Write Amplification:** Every dispatch attempt updates the database, creating high write I/O. We may need to batch updates in the future.
