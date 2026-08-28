# Celery Troubleshooting Guide

This guide provides solutions for common Celery issues in SoroScan, including task timeouts, Redis connection drops, and queue congestion.

## Table of Contents

- [Task Timeouts](#task-timeouts)
- [OOM (Out of Memory) Errors](#oom-out-of-memory-errors)
- [Redis Connection Issues](#redis-connection-issues)
- [Queue Congestion](#queue-congestion)
- [Task Retries](#task-retries)
- [Task Lag](#task-lag)
- [Monitoring Commands](#monitoring-commands)
- [Concurrency Tuning](#concurrency-tuning)
- [Configuration Reference](#configuration-reference)

## Task Timeouts

### Symptoms
- Tasks failing with `SoftTimeLimitExceeded` or `TimeLimitExceeded`
- Workers appearing to hang or become unresponsive
- Tasks taking longer than expected to complete

### Current Configuration
```python
# Global timeout settings (soroscan/settings.py)
CELERY_TASK_TIME_LIMIT = 600        # Hard timeout: 10 minutes
CELERY_TASK_SOFT_TIME_LIMIT = 540   # Soft timeout: 9 minutes
```

### Solutions

#### 1. Increase Task Timeouts
For specific long-running tasks, adjust timeouts in the task decorator:

```python
@shared_task(
    bind=True,
    soft_time_limit=300,    # 5 minutes
    time_limit=360          # 6 minutes hard limit
)
def your_long_task(self):
    # Task implementation
    pass
```

#### 2. Environment Variable Override
```bash
# In .env file
CELERY_TASK_TIME_LIMIT=1200          # 20 minutes
CELERY_TASK_SOFT_TIME_LIMIT=1080     # 18 minutes
```

#### 3. Handle Soft Timeouts Gracefully
```python
from celery.exceptions import SoftTimeLimitExceeded

@shared_task(bind=True)
def robust_task(self):
    try:
        # Your task logic here
        pass
    except SoftTimeLimitExceeded:
        # Clean up resources
        logger.warning(f"Task {self.request.id} soft timeout, cleaning up...")
        # Optionally retry with longer timeout
        raise self.retry(countdown=60)
```

#### 4. Monitor Task Duration
Check which tasks are timing out:

```bash
# View active tasks and their runtime
celery -A soroscan inspect active

# View task duration metrics in logs
grep "task_duration_seconds" /var/log/celery/worker.log
```

## OOM (Out of Memory) Errors

### Symptoms
- Workers crashing with exit code 137 (SIGKILL)
- `MemoryError` exceptions in task logs
- System running out of available memory

### Solutions

#### 1. Reduce Worker Concurrency
```bash
# Start workers with lower concurrency
celery -A soroscan worker --concurrency=2 --loglevel=info

# Or set via environment
export CELERY_WORKER_CONCURRENCY=2
```

#### 2. Enable Worker Memory Limits
```python
# In soroscan/settings.py
CELERY_WORKER_MAX_MEMORY_PER_CHILD = 200000  # 200MB per worker process
CELERY_WORKER_MAX_TASKS_PER_CHILD = 50      # Restart worker after 50 tasks
```

#### 3. Use Memory-Efficient Task Design
```python
@shared_task(bind=True)
def memory_efficient_task(self):
    # Process data in chunks instead of loading everything
    for chunk in queryset.iterator(chunk_size=1000):
        process_chunk(chunk)
        # Explicit cleanup
        del chunk
        
    # Force garbage collection for large datasets
    import gc
    gc.collect()
```

#### 4. Monitor Memory Usage
```bash
# Monitor worker memory usage
ps aux | grep celery | awk '{print $2, $4, $6, $11}' | column -t

# Monitor system memory
free -h
top -p $(pgrep -f "celery.*worker")
```

#### 5. Batch Large Operations
```python
# Instead of processing all events at once
def process_all_events():
    events = ContractEvent.objects.all()  # Memory intensive!
    
# Use batching
def process_events_batched():
    batch_size = 1000
    for batch in queryset_batches(ContractEvent.objects.all(), batch_size):
        for event in batch:
            process_event(event)
```

## Redis Connection Issues

### Symptoms
- `ConnectionError: Error connecting to Redis`
- Tasks getting lost or not executing
- Intermittent connection drops

### Solutions

#### 1. Connection Pool Configuration
```python
# In soroscan/settings.py
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
CELERY_BROKER_CONNECTION_RETRY = True
CELERY_BROKER_CONNECTION_MAX_RETRIES = 10

# Redis connection pool settings
CELERY_REDIS_MAX_CONNECTIONS = 20
CELERY_REDIS_RETRY_ON_TIMEOUT = True
```

#### 2. Health Check Redis Connection
```bash
# Test Redis connectivity
redis-cli -u "$REDIS_URL" ping

# Monitor Redis connections
redis-cli -u "$REDIS_URL" info clients

# Check Redis memory usage
redis-cli -u "$REDIS_URL" info memory
```

#### 3. Handle Connection Failures in Tasks
```python
from celery.exceptions import Retry
import redis

@shared_task(bind=True, autoretry_for=(redis.ConnectionError,), max_retries=5)
def redis_dependent_task(self):
    try:
        # Task logic
        pass
    except redis.ConnectionError as exc:
        logger.warning(f"Redis connection failed: {exc}")
        raise self.retry(countdown=30, exc=exc)
```

#### 4. Redis Configuration Tuning
```bash
# In redis.conf or via environment
# Increase timeout values
timeout 300
tcp-keepalive 60

# Connection limits
maxclients 10000
```

## Queue Congestion

### Symptoms
- Tasks piling up in queues without processing
- Increasing task lag times
- Queue length growing continuously

### Solutions

#### 1. Monitor Queue Status
```bash
# Check queue lengths
celery -A soroscan inspect active_queues

# View tasks in queues
celery -A soroscan inspect reserved

# Queue statistics
redis-cli -u "$REDIS_URL" llen celery
redis-cli -u "$REDIS_URL" llen high_priority
redis-cli -u "$REDIS_URL" llen low_priority
```

#### 2. Scale Workers by Queue
```bash
# Start dedicated workers for specific queues
celery -A soroscan worker -Q high_priority --concurrency=4
celery -A soroscan worker -Q default --concurrency=2
celery -A soroscan worker -Q low_priority --concurrency=1
```

#### 3. Purge Stuck Queues
```bash
# Purge all tasks from a queue (USE WITH CAUTION)
celery -A soroscan purge -Q low_priority

# Purge all queues
celery -A soroscan purge --force
```

#### 4. Task Routing Optimization
Review and optimize task routing in `settings.py`:

```python
CELERY_TASK_ROUTES = {
    # High-priority, time-sensitive tasks
    "ingest.tasks.ingest_latest_events": {"queue": "high_priority"},
    "ingest.tasks.dispatch_webhook": {"queue": "default"},
    
    # Resource-intensive, can be delayed
    "ingest.tasks.aggregate_event_statistics": {"queue": "low_priority"},
    "soroscan.ingest.tasks.backfill_contract_events": {"queue": "backfill"},
}
```

## Task Retries

### Current Retry Configurations
SoroScan uses different retry strategies per task type:

```python
# Webhook dispatch: 5 retries with exponential backoff
@shared_task(bind=True, max_retries=5)
def dispatch_webhook(self, subscription_id: int, event_id: int):
    pass

# Backfill tasks: 3 retries with 60s delay
@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def backfill_contract_events(self):
    pass

# Alert tasks: 5 retries with exponential backoff
@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, max_retries=5)
def send_alert(self, rule_id: int, event_id: int):
    pass
```

### Solutions

#### 1. Implement Custom Retry Logic
```python
@shared_task(bind=True)
def robust_task_with_custom_retry(self):
    try:
        # Task logic
        pass
    except (ConnectionError, TimeoutError) as exc:
        # Retry with exponential backoff
        countdown = 2 ** self.request.retries
        raise self.retry(countdown=countdown, exc=exc, max_retries=5)
    except ValidationError:
        # Don't retry validation errors
        logger.error("Validation failed, not retrying")
        raise
```

#### 2. Monitor Retry Patterns
```bash
# View failed tasks
celery -A soroscan events

# Check retry statistics in logs
grep "Celery task retrying" /var/log/celery/worker.log | tail -20
```

#### 3. Handle Exhausted Retries
```python
@shared_task(bind=True, max_retries=3)
def task_with_fallback(self):
    try:
        # Main logic
        pass
    except Exception as exc:
        if self.request.retries >= self.max_retries:
            # Send to dead letter queue or alert
            send_failure_notification.delay(self.request.id, str(exc))
            return False
        raise self.retry(exc=exc)
```

## Task Lag

### Symptoms
- Tasks taking a long time to start after being queued
- Backlog of pending tasks
- Poor user experience due to delays

### Solutions

#### 1. Identify Bottlenecks
```bash
# Check worker utilization
celery -A soroscan inspect stats

# View active tasks
celery -A soroscan inspect active

# Monitor task execution time
grep "task_duration_seconds" /var/log/celery/worker.log | sort -k3 -n
```

#### 2. Optimize Database Queries
```python
# Use select_related and prefetch_related
def optimize_database_task():
    # Bad: N+1 queries
    for event in ContractEvent.objects.all():
        print(event.contract.name)
    
    # Good: Single query with join
    events = ContractEvent.objects.select_related('contract').all()
    for event in events:
        print(event.contract.name)
```

#### 3. Add Task Prioritization
```python
# Use priority routing
@shared_task(bind=True)
def urgent_task(self):
    pass

# Route to high-priority queue
CELERY_TASK_ROUTES = {
    'urgent_task': {'queue': 'high_priority'},
}
```

#### 4. Scale Horizontally
```bash
# Run multiple worker instances
celery -A soroscan worker --hostname=worker1@%h --concurrency=4
celery -A soroscan worker --hostname=worker2@%h --concurrency=4
```

## Monitoring Commands

### Worker Status
```bash
# Check active workers
celery -A soroscan inspect active

# Worker statistics
celery -A soroscan inspect stats

# Registered tasks
celery -A soroscan inspect registered

# Worker status
celery -A soroscan status
```

### Queue Monitoring
```bash
# Queue lengths
redis-cli -u "$REDIS_URL" llen celery
redis-cli -u "$REDIS_URL" llen high_priority
redis-cli -u "$REDIS_URL" llen low_priority

# Queue contents (first 10 items)
redis-cli -u "$REDIS_URL" lrange celery 0 9

# All queues
redis-cli -u "$REDIS_URL" keys "*queue*"
```

### Task Monitoring
```bash
# Real-time task events
celery -A soroscan events

# Task history
celery -A soroscan inspect reserved

# Failed task details
celery -A soroscan inspect failed
```

### Performance Monitoring
```bash
# Worker memory usage
ps aux | grep "celery.*worker" | awk '{print $2, $4, $6, $11}' | column -t

# Redis memory usage
redis-cli -u "$REDIS_URL" info memory | grep used_memory_human

# CPU usage
top -p $(pgrep -f "celery.*worker")

# Network connections
netstat -an | grep :6379
```

### Log Analysis
```bash
# Recent task failures
grep "ERROR" /var/log/celery/worker.log | tail -20

# Task duration analysis
grep "task_duration_seconds" /var/log/celery/worker.log | \
    awk '{print $NF}' | sort -n | tail -10

# Retry patterns
grep "retrying" /var/log/celery/worker.log | \
    awk '{print $1, $2, $NF}' | sort | uniq -c
```

## Concurrency Tuning

### Current Setup
SoroScan uses these worker configurations by default:

```bash
# Default worker startup (from Makefile)
celery -A soroscan worker --loglevel=info
```

### Recommendations

#### 1. CPU-Bound vs I/O-Bound Tasks

**For CPU-intensive tasks:**
```bash
# Use processes (default), limit to CPU cores
celery -A soroscan worker --concurrency=$(nproc) --pool=prefork
```

**For I/O-intensive tasks (webhooks, API calls):**
```bash
# Use threads or gevent for better I/O concurrency
celery -A soroscan worker --concurrency=20 --pool=threads
# or
celery -A soroscan worker --concurrency=100 --pool=gevent
```

#### 2. Queue-Specific Concurrency
```bash
# High-priority queue: More workers
celery -A soroscan worker -Q high_priority --concurrency=8 --hostname=hp_worker@%h

# Background tasks: Fewer workers
celery -A soroscan worker -Q low_priority --concurrency=2 --hostname=bg_worker@%h

# I/O-heavy webhooks: Thread pool
celery -A soroscan worker -Q default --concurrency=10 --pool=threads --hostname=webhook_worker@%h
```

#### 3. Memory-Based Concurrency
```bash
# For systems with limited memory
celery -A soroscan worker --concurrency=2 --max-memory-per-child=200000

# For memory-rich systems
celery -A soroscan worker --concurrency=8 --max-memory-per-child=500000
```

#### 4. Dynamic Scaling with Autoscale
```bash
# Auto-scale between 2-10 workers based on load
celery -A soroscan worker --autoscale=10,2 --loglevel=info

# Different scaling per queue
celery -A soroscan worker -Q high_priority --autoscale=8,4
celery -A soroscan worker -Q low_priority --autoscale=4,1
```

#### 5. Production Configuration Example
```bash
#!/bin/bash
# production-celery.sh

# High-priority worker
celery -A soroscan worker \
    -Q high_priority \
    --concurrency=4 \
    --hostname=hp_worker@%h \
    --loglevel=info \
    --max-memory-per-child=300000 \
    --max-tasks-per-child=100 &

# Default webhook worker (I/O intensive)
celery -A soroscan worker \
    -Q default \
    --concurrency=15 \
    --pool=threads \
    --hostname=webhook_worker@%h \
    --loglevel=info \
    --max-memory-per-child=200000 &

# Background processing worker
celery -A soroscan worker \
    -Q low_priority,backfill \
    --concurrency=2 \
    --hostname=bg_worker@%h \
    --loglevel=info \
    --max-memory-per-child=400000 \
    --max-tasks-per-child=50 &

# Beat scheduler
celery -A soroscan beat --loglevel=info &

wait
```

### Tuning Guidelines

1. **Start Conservative**: Begin with `concurrency=2` and increase gradually
2. **Monitor Resources**: Watch CPU, memory, and I/O usage during load testing
3. **Queue Separation**: Use dedicated workers for different task types
4. **Memory Limits**: Set `max-memory-per-child` to prevent OOM issues
5. **Task Limits**: Use `max-tasks-per-child` to prevent memory leaks
6. **Pool Selection**: 
   - `prefork` for CPU-bound tasks
   - `threads` for I/O-bound tasks with shared state
   - `gevent` for high-concurrency I/O without shared state

## Configuration Reference

### Environment Variables
```bash
# Core settings
REDIS_URL=redis://localhost:6379/0
CELERY_TASK_TIME_LIMIT=600
CELERY_TASK_SOFT_TIME_LIMIT=540

# Worker settings  
CELERY_WORKER_CONCURRENCY=4
CELERY_WORKER_MAX_MEMORY_PER_CHILD=200000
CELERY_WORKER_MAX_TASKS_PER_CHILD=100

# Connection settings
CELERY_BROKER_CONNECTION_RETRY=True
CELERY_BROKER_CONNECTION_MAX_RETRIES=10
```

### Django Settings
```python
# soroscan/settings.py - Key Celery configurations

# Broker and backend
CELERY_BROKER_URL = env("REDIS_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = env("REDIS_URL", default="redis://localhost:6379/0")

# Serialization
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE

# Timeouts
CELERY_TASK_TIME_LIMIT = env.int("CELERY_TASK_TIME_LIMIT", default=600)
CELERY_TASK_SOFT_TIME_LIMIT = env.int("CELERY_TASK_SOFT_TIME_LIMIT", default=540)

# Routing
CELERY_TASK_ROUTES = {
    "ingest.tasks.ingest_latest_events": {"queue": "high_priority"},
    "ingest.tasks.dispatch_webhook": {"queue": "default"},
    "ingest.tasks.aggregate_event_statistics": {"queue": "low_priority"},
    "soroscan.ingest.tasks.backfill_contract_events": {"queue": "backfill"},
}
```

### Task Decorator Examples
```python
# Basic task with retries
@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def basic_task(self):
    pass

# I/O intensive task with soft timeout
@shared_task(bind=True, soft_time_limit=30, max_retries=5)
def io_task(self):
    pass

# CPU intensive task with longer timeout
@shared_task(bind=True, time_limit=300, soft_time_limit=270)
def cpu_task(self):
    pass

# Auto-retry with exponential backoff
@shared_task(
    bind=True,
    autoretry_for=(ConnectionError, TimeoutError),
    retry_backoff=True,
    retry_backoff_max=300,
    max_retries=5
)
def network_task(self):
    pass
```

## Emergency Procedures

### Stopping All Workers
```bash
# Graceful shutdown
pkill -TERM -f "celery.*worker"

# Force shutdown if needed
pkill -KILL -f "celery.*worker"
```

### Clearing All Queues
```bash
# Clear specific queue
celery -A soroscan purge -Q high_priority

# Clear all queues (DANGER: ALL PENDING TASKS LOST)
celery -A soroscan purge --force
```

### Restarting Services
```bash
# Restart workers
sudo systemctl restart celery-worker

# Restart beat scheduler
sudo systemctl restart celery-beat

# Restart Redis
sudo systemctl restart redis
```

---

For additional help, check the [SoroScan documentation](../README.md) or contact the development team.