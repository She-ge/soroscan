# PostgreSQL Performance Tuning Guide for SoroScan

SoroScan handles a high-volume, write-heavy ingestion workload by continually pulling and indexing block events from the Soroban network. The default PostgreSQL configuration settings are optimized for small-footprint environments and will quickly bottleneck the ingestion pipelines under sustained throughput.

This document describes the recommended database tuning configurations for optimizing write-throughput, smoothing out checkpoint spikes, and speeding up index execution.

## Application Connection Pool

SoroScan derives its connection target from process concurrency:

`max connections = min(DB_POOL_HARD_LIMIT, WEB_CONCURRENCY × DB_CONNECTIONS_PER_WORKER)`

The defaults produce a target range of 2–16 connections for four Gunicorn
workers, and automatically increase as the deployment scales. PostgreSQL must
reserve capacity for migrations, Celery, and administration; keep
`DB_POOL_HARD_LIMIT` below the database server's `max_connections`.

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `WEB_CONCURRENCY` | `4` | Number of API worker processes |
| `DB_CONNECTIONS_PER_WORKER` | `4` | Connection budget per worker |
| `DB_POOL_MIN_SIZE` | `2` | Warm connection target |
| `DB_POOL_HARD_LIMIT` | `40` | Safety cap during scale-out |
| `DB_CONNECT_TIMEOUT` | `5` | Seconds allowed to establish a connection |
| `DB_CONN_MAX_AGE` | `300` | Recycle persistent Django connections after five minutes |

`CONN_HEALTH_CHECKS` is enabled so recycled connections are checked before
reuse. In larger deployments, point `DATABASE_URL` at PgBouncer in transaction
mode and apply the calculated maximum there.

Prometheus exports:

- `soroscan_db_pool_connections{state="total|active|idle|wait_queue"}`
- `soroscan_db_pool_configured_limit{limit="min|max"}`

Alert when active connections exceed 80% of the configured maximum or when
`wait_queue` remains non-zero.

---

## Recommended Base Parameters (Target: 8GB RAM System)

For self-managed setups or dedicated database instances (e.g., standard containers with 8GB RAM and 4 vCPUs), update your `postgresql.conf` or parameter group with these targets:

| Parameter | Recommended Value | Scope / Type | Description |
| :--- | :--- | :--- | :--- |
| `shared_buffers` | `2GB` (25% of RAM) | Memory (Requires Restart) | Cache for data pages. Avoids unnecessary disk read/write cycles during rapid ingestion loops. |
| `effective_cache_size` | `6GB` (75% of RAM) | Memory (Reload) | Informative setting telling the query planner how much total memory is available for caching pages (DB + OS combined). |
| `work_mem` | `64MB` | Memory (Reload) | Maximum memory per sort/hash join operation per connection. Prevents internal query sorting operations from spilling to disk. |
| `maintenance_work_mem` | `512MB` | Memory (Reload) | Dedicated allocation for management tasks. Speeds up `CREATE INDEX` and `VACUUM` processing. |
| `max_wal_size` | `16GB` | WAL (Reload) | Maximum size to let the Write-Ahead Log grow before forcing a checkpoint. Reduces frequent I/O spikes. |
| `checkpoint_timeout` | `15min` | WAL (Reload) | Extends time between checkpoints to minimize redundant full-page disk writes. |
| `checkpoint_completion_target`| `0.9` | WAL (Reload) | Smooths disk write operations by spreading the checkpoint workload over 90% of the timeout window. |
| `wal_buffers` | `64MB` | WAL (Requires Restart) | Buffers transaction log data before forcing disk writes. Alleviates bottlenecks on parallel worker batches. |

---

## Workload Ingestion Rationales

### 1. Smoothing Out Checkpoint I/O Spikes
In default configurations, PostgreSQL triggers a checkpoint every 5 minutes or after 1GB of Write-Ahead Logs (`max_wal_size`) are generated. SoroScan creates massive amounts of WAL records during peak event synchronization loops, causing rapid back-to-back checkpoints that choke disk I/O.
* Raising `max_wal_size` to `16GB` and extending `checkpoint_timeout` to `15min` makes checkpoints predictable and strictly timed.
* Setting `checkpoint_completion_target = 0.9` guarantees that instead of flushing data to disk all at once, PostgreSQL trickles the data down smoothly over the length of the timeout.

### 2. High-Performance Maintenance and Indexing
As tables like `ContractEvent` approach millions of rows, background data maintenance and index updates require ample working overhead.
* A healthy `maintenance_work_mem` setting (`512MB`) allows index optimization processes to run entirely inside RAM instead of exhausting disk read/write loops, maximizing the performance of concurrent worker threads.

### 3. Solid-State Drive (SSD) Optimization
If your underlying instance uses solid-state storage (such as AWS EBS gp3/io2 or NVMe volumes), ensure you update:
* `random_page_cost = 1.1`

This informs the PostgreSQL engine that random index lookups are virtually as cheap as sequential disk scans, favoring smarter index-driven plans.
