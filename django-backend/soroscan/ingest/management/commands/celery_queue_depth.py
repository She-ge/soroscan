"""
Inspect pending message counts in the Celery/Redis queues.

Usage:
    python manage.py celery_queue_depth
"""
from urllib.parse import urlparse

from django.conf import settings
from django.core.management.base import BaseCommand
from redis import Redis
from redis.exceptions import RedisError

# Mirrors CELERY_TASK_ROUTES in soroscan/settings.py and
# soroscan/operational_metrics.py:QUEUES.
QUEUES = ("high_priority", "default", "low_priority", "backfill")


class Command(BaseCommand):
    help = "Print pending message counts for each Celery queue."

    def handle(self, *args, **options):
        try:
            parsed = urlparse(settings.CELERY_BROKER_URL)
            redis = Redis.from_url(parsed.geturl(), socket_timeout=2)
            depths = {queue: redis.llen(queue) for queue in QUEUES}
        except (RedisError, ValueError) as exc:
            self.stderr.write(
                self.style.ERROR(f"Could not read Celery queue depths: {exc}")
            )
            return

        self.stdout.write("Celery queue depths")
        self.stdout.write("=" * 22)
        for queue in QUEUES:
            self.stdout.write(f"{queue:<16} {depths[queue]:>6}")
