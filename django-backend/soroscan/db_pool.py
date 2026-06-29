"""Database connection lifecycle and sizing helpers."""

from __future__ import annotations

import os


def calculate_pool_limits(
    *,
    workers: int | None = None,
    connections_per_worker: int | None = None,
    minimum: int | None = None,
    hard_limit: int | None = None,
) -> tuple[int, int]:
    """Return load-aware minimum/maximum connection targets.

    Gunicorn/Celery process counts are the stable proxy for application load.
    The result is bounded so a scale-out event cannot exhaust PostgreSQL.
    Explicit environment values override each input for managed deployments.
    """
    worker_count = workers or int(os.getenv("WEB_CONCURRENCY", "4"))
    per_worker = connections_per_worker or int(
        os.getenv("DB_CONNECTIONS_PER_WORKER", "4")
    )
    min_connections = minimum or int(os.getenv("DB_POOL_MIN_SIZE", "2"))
    maximum = hard_limit or int(os.getenv("DB_POOL_HARD_LIMIT", "40"))
    return min(min_connections, maximum), min(
        maximum, max(min_connections, worker_count * per_worker)
    )
