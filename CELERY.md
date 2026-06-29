# Celery Worker Configuration

SoroScan uses [Celery](https://docs.celeryq.dev/) with Redis as the broker for background task processing.

---

## Queues

Tasks are routed to four queues based on priority and workload type:

| Queue | Purpose | Example tasks |
|---|---|---|
| `high_priority` | Real-time event ingestion — must stay low-latency | `ingest_latest_events` |
| `default` | General background work | `dispatch_webhook`, `evaluate_remediation_rules` |
| `low_priority` | Non-urgent analytics aggregation | `aggregate_event_statistics` |
| `backfill` | Long-running historical re-indexing — isolated to avoid starving real-time queues | `backfill_contract_events` |

**Why separate `backfill`?**  
Backfill jobs can run for hours and consume significant CPU/DB resources. Keeping them on a dedicated queue (with dedicated workers) ensures they never delay real-time ingestion.

---

## Starting Workers

Each worker process must declare which queues it consumes with `-Q`. Always start at least one worker for `high_priority` and `default`.

```bash
# Real-time ingestion worker (high_priority + default)
celery -A soroscan worker -Q high_priority,default --concurrency=4 --loglevel=info

# Backfill worker (isolated — run separately)
celery -A soroscan worker -Q backfill --concurrency=2 --loglevel=info

# Low-priority analytics worker
celery -A soroscan worker -Q low_priority --concurrency=2 --loglevel=info

# Beat scheduler (one instance only)
celery -A soroscan beat --loglevel=info
```

---

## Recommended Concurrency Settings

### Small deployment (≤4 CPU cores, ≤8 GB RAM)

```bash
# Single combined worker — all queues
celery -A soroscan worker -Q high_priority,default,low_priority --concurrency=4
```

- Keep backfill disabled or run it manually during off-peak hours.
- Use `--concurrency=2` if the machine is also running PostgreSQL.

### Large deployment (8+ CPU cores, 16+ GB RAM)

```bash
# Dedicated high-priority worker
celery -A soroscan worker -Q high_priority --concurrency=8 --loglevel=info

# Default + low-priority worker
celery -A soroscan worker -Q default,low_priority --concurrency=4 --loglevel=info

# Backfill worker (can be scaled independently)
celery -A soroscan worker -Q backfill --concurrency=4 --loglevel=info
```

### General guidelines

- **I/O-bound tasks** (webhook dispatch, DB writes): concurrency = 2–4× CPU count.
- **CPU-bound tasks** (event decoding, aggregation): concurrency = CPU count.
- Use `--max-tasks-per-child=500` to reclaim memory from long-running workers.
- Monitor queue depths via `celery -A soroscan inspect active_queues` or the `/api/health/workers/` endpoint.
- Prometheus metrics are emitted for active/completed/failed tasks, duration,
  worker status, and Redis queue depth. Import
  `k8s/grafana-templates/celery-task-queue.json` for the status dashboard.

---

## Docker Compose Example

```yaml
worker-realtime:
  image: soroscan-backend
  command: celery -A soroscan worker -Q high_priority,default --concurrency=4 --loglevel=info
  environment:
    REDIS_URL: redis://redis:6379/0
    DATABASE_URL: postgres://...

worker-backfill:
  image: soroscan-backend
  command: celery -A soroscan worker -Q backfill --concurrency=2 --loglevel=info
  environment:
    REDIS_URL: redis://redis:6379/0
    DATABASE_URL: postgres://...

beat:
  image: soroscan-backend
  command: celery -A soroscan beat --loglevel=info
  environment:
    REDIS_URL: redis://redis:6379/0
```

---

## Health Check

Use the `/api/health/workers/` endpoint to verify at least one worker is alive:

```bash
curl http://localhost:8000/api/health/workers/
# {"status": "ok", "workers": ["celery@worker1"]}
```

Returns `503` if no workers respond within 5 seconds.

---

## Further Reading

- [Celery routing docs](https://docs.celeryq.dev/en/stable/userguide/routing.html)
- [Celery concurrency docs](https://docs.celeryq.dev/en/stable/userguide/workers.html#concurrency)
