# SoroScan Admin Guide

This guide documents the custom management actions available in the Django Admin panel for SoroScan administrators.

These tools are crucial for managing indexing state, manual interventions, and data exports.

## Permission Requirements

By default, all custom actions require the user to have `is_staff = True` to access the Django Admin interface.
Additionally, specific actions may require model-level permissions (e.g., `change_contractevent` or
`change_webhookdeliverylog`).

---

## Custom Management Actions

### 1. Backfill Events

- **Description**: Triggers a celery task to manually backfill events for selected contracts from a specific ledger
  sequence up to the current network tip.
- **Model**: `TrackedContract` / `ContractEvent`
- **Permissions Required**: `change_trackedcontract`
- **Use Case**: When a contract was paused for an extended period, or if a bug caused events to be missed, use this to
  restore consistency.

### 2. Clear Redis Cache for Selected Contracts

- **Description**: Purges all cached API responses and query results associated with the selected contracts from Redis.
- **Model**: `TrackedContract`
- **Permissions Required**: `change_trackedcontract`
- **Use Case**: After manual database interventions or if the cache becomes stale/corrupted for specific high-volume
  contracts.

### 3. Pause / Resume Selected Contracts

- **Description**: Toggles the indexing state for selected contracts.
  - **Pause**: The ingestion workers will skip these contracts until resumed.
  - **Resume**: Restarts indexing. (Note: You may need to use the "Backfill Events" action if they were paused for a
    long time).
- **Model**: `TrackedContract`
- **Permissions Required**: `change_trackedcontract`
- **Use Case**: Pausing contracts that are spamming the network or causing ingestion errors, allowing for investigation.

### 4. Trigger Re-index for Contract

- **Description**: Wipes all stored events for the contract and restarts ingestion from the contract's deployment ledger
  or a specified start ledger.
- **Model**: `TrackedContract`
- **Permissions Required**: `delete_contractevent`, `change_trackedcontract`
- **Use Case**: Useful when the ABI changes dramatically or if historical data was corrupted and a fresh start is
  required.

### 5. Export Selected Events to CSV

- **Description**: Generates and downloads a CSV file containing the raw data and decoded payloads of the selected
  events.
- **Model**: `ContractEvent`
- **Permissions Required**: `view_contractevent`
- **Use Case**: Data analysis, auditing, or sharing event logs with developers for debugging.

### 6. Retry Selected Webhook Deliveries

- **Description**: Manually queues a Celery task to retry failed webhook deliveries. It bypasses the normal exponential
  backoff schedule.
- **Model**: `WebhookDeliveryLog` or `WebhookDeadLetter`
- **Permissions Required**: `change_webhookdeliverylog`
- **Use Case**: After a downstream client fixes their server (e.g., resolving a 500 or timeout error), use this to push
  the pending payloads immediately.

---

## Custom Filter Sidebars

The Django Admin has been customized to include advanced sidebar filters for quickly finding specific events and webhook
logs based on their state.

![Django Admin Sidebar Filter Mockup](/home/ayo-ola/.gemini/antigravity-ide/brain/536cfa2b-d798-45fc-a1aa-74202b1a31c3/admin_sidebar_filter_1788122695233.png)
_Example of a modern custom sidebar filter for contract status and date ranges._
