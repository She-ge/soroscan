# Contract Event Count Cache Warming

This document describes the proactive cache warming architecture for contract event counts in SoroScan.

## Problem Context

Querying total event counts for active Soroban contracts requires counting large numbers of rows in PostgreSQL
(`COUNT(*)` queries on indexed `contract_id` partitions). For popular smart contracts with millions of emitted events,
un-cached count queries can cause latency spikes and unnecessary database CPU utilization.

## Solution Architecture

SoroScan implements a proactive background cache-warming mechanism to ensure that frequently queried contract statistics
are pre-computed and stored in Redis before user or dashboard requests arrive.

### 1. Periodic Celery Task

- **Task Name**: `warm_event_count_cache`
- **Location**: `django-backend/soroscan/ingest/tasks.py`
- **Schedule**: Executes periodically via Celery Beat every 5 minutes (300 seconds).
- **Scope**: Identifies the top 100 most active smart contracts ordered by recent event frequency.

### 2. Cache Invalidation and Expiration

- Cache keys follow the pattern: `contract:event_count:{contract_id}`.
- Keys are populated with a time-to-live (TTL) of 600 seconds (10 minutes), providing a 2x safety window against task
  execution delays.
- When new batches of events are ingested for a contract, incremental cache updates adjust the counter without requiring
  full table scans.

### 3. Celery Beat Configuration

The schedule is registered in `django-backend/soroscan/settings.py`:

```python
CELERY_BEAT_SCHEDULE = {
    "warm-event-count-cache": {
        "task": "soroscan.ingest.tasks.warm_event_count_cache",
        "schedule": 300.0,
    },
}
```

## Benefits

- **Predictable API Latency**: Contract detail and explorer queries serve cached counts in sub-millisecond time.
- **Reduced Database Load**: Eliminates repetitive aggregate count scans on the primary PostgreSQL cluster.
- **Graceful Degradation**: If Redis is temporarily unavailable, query handlers fall back to direct database count
  queries transparently.

## Related Documentation

- [SoroScan Architecture Overview](../architecture/README.md)
- [Database Operations Guide](../database/operations-guide.md)
- [Performance Playbook](../PERFORMANCE_PLAYBOOK.md)
