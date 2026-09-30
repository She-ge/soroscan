"""
Management command to verify Redis connectivity and cache health.

Usage:
    python manage.py check_redis

Exits with code 0 on success, code 1 on any connection failure.
"""
import time

from django.core.cache import cache
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Check Redis connection status: ping, latency, and cache write/read"

    # Sentinel key used for the write/read smoke-test.
    _TEST_KEY = "soroscan:check_redis:probe"
    _TEST_VALUE = "ok"
    _TEST_TTL = 10  # seconds

    def handle(self, *args, **options):
        self.stdout.write("Checking Redis connection…\n")

        # 1. Ping -----------------------------------------------------------
        try:
            start = time.monotonic()
            result = cache.get(self._TEST_KEY)  # any cache op triggers connect
            # Use the lower-level client for an explicit PING when available.
            client = getattr(cache, "_cache", None) or getattr(cache, "client", None)
            if hasattr(client, "ping"):
                client.ping()
            elif hasattr(cache, "client") and hasattr(cache.client, "get_client"):
                cache.client.get_client().ping()
            else:
                # Fallback: a no-op get is enough to confirm connectivity.
                cache.get("soroscan:check_redis:ping_probe")
            latency_ms = (time.monotonic() - start) * 1000
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f"  ✗ Ping failed: {exc}"))
            raise SystemExit(1)

        self.stdout.write(self.style.SUCCESS(f"  ✓ Ping OK  (latency: {latency_ms:.2f} ms)"))

        # 2. Cache write ----------------------------------------------------
        try:
            cache.set(self._TEST_KEY, self._TEST_VALUE, timeout=self._TEST_TTL)
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f"  ✗ Cache SET failed: {exc}"))
            raise SystemExit(1)

        self.stdout.write(self.style.SUCCESS("  ✓ Cache SET OK"))

        # 3. Cache read back ------------------------------------------------
        try:
            read_back = cache.get(self._TEST_KEY)
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f"  ✗ Cache GET failed: {exc}"))
            raise SystemExit(1)

        if read_back != self._TEST_VALUE:
            self.stderr.write(
                self.style.ERROR(
                    f"  ✗ Cache GET returned unexpected value: {read_back!r}"
                )
            )
            raise SystemExit(1)

        self.stdout.write(self.style.SUCCESS("  ✓ Cache GET OK"))

        # 4. Cleanup --------------------------------------------------------
        cache.delete(self._TEST_KEY)

        self.stdout.write(
            self.style.SUCCESS(
                f"\nRedis is reachable and healthy. Latency: {latency_ms:.2f} ms\n"
            )
        )
