"""Prometheus collectors for database and Celery operational health."""

from __future__ import annotations

import logging
from urllib.parse import urlparse

from django.conf import settings
from django.db import connections
from prometheus_client.core import GaugeMetricFamily, REGISTRY
from redis import Redis

from soroscan.meta_views import (
    _collect_fallback_pool_stats,
    _collect_postgres_pool_stats,
)

logger = logging.getLogger(__name__)
QUEUES = ("high_priority", "default", "low_priority", "backfill")


class OperationalHealthCollector:
    """Collect live pool and broker state whenever Prometheus scrapes."""

    def describe(self):
        """Describe metrics without opening database or Redis connections."""
        yield GaugeMetricFamily(
            "soroscan_db_pool_connections",
            "Current database connections by state",
            labels=["state"],
        )
        yield GaugeMetricFamily(
            "soroscan_db_pool_configured_limit",
            "Configured database pool target",
            labels=["limit"],
        )
        yield GaugeMetricFamily(
            "soroscan_celery_queue_depth",
            "Pending messages in each Celery queue",
            labels=["queue"],
        )
        yield GaugeMetricFamily(
            "soroscan_celery_workers_online",
            "Celery workers responding to health probes",
            labels=["worker"],
        )

    def collect(self):
        connection_metric = GaugeMetricFamily(
            "soroscan_db_pool_connections",
            "Current database connections by state",
            labels=["state"],
        )
        try:
            wrapper = connections["default"]
            stats = (
                _collect_postgres_pool_stats(wrapper)
                if wrapper.vendor == "postgresql"
                else _collect_fallback_pool_stats(wrapper)
            )
            for state, value in stats.items():
                connection_metric.add_metric([state], value)
        except Exception:
            logger.exception("Unable to collect database pool metrics")
        yield connection_metric

        limit_metric = GaugeMetricFamily(
            "soroscan_db_pool_configured_limit",
            "Configured database pool target",
            labels=["limit"],
        )
        limit_metric.add_metric(["min"], getattr(settings, "DB_POOL_MIN_SIZE", 1))
        limit_metric.add_metric(["max"], getattr(settings, "DB_POOL_MAX_SIZE", 1))
        yield limit_metric

        depth_metric = GaugeMetricFamily(
            "soroscan_celery_queue_depth",
            "Pending messages in each Celery queue",
            labels=["queue"],
        )
        try:
            parsed = urlparse(settings.CELERY_BROKER_URL)
            redis = Redis.from_url(parsed.geturl(), socket_timeout=1)
            for queue in QUEUES:
                depth_metric.add_metric([queue], redis.llen(queue))
        except Exception:
            logger.exception("Unable to collect Celery queue depths")
        yield depth_metric

        worker_metric = GaugeMetricFamily(
            "soroscan_celery_workers_online",
            "Celery workers responding to health probes",
            labels=["worker"],
        )
        try:
            from soroscan.celery import app

            responses = app.control.inspect(timeout=0.5).ping() or {}
            if responses:
                for worker in responses:
                    worker_metric.add_metric([worker], 1)
            else:
                worker_metric.add_metric(["none"], 0)
        except Exception:
            logger.exception("Unable to collect Celery worker status")
            worker_metric.add_metric(["unknown"], 0)
        yield worker_metric


def register_operational_collector() -> None:
    """Register the collector once per process."""
    if not getattr(REGISTRY, "_soroscan_operational_collector", False):
        REGISTRY.register(OperationalHealthCollector())
        REGISTRY._soroscan_operational_collector = True
