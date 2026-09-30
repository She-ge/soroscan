from django.core.cache import cache
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Clear Redis cache keys matching pattern soroscan:contract:*"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be deleted without actually deleting",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        pattern = "soroscan:contract:*"

        redis_client = cache.client.get_client()
        keys = list(redis_client.scan_iter(match=pattern, count=1000))

        if not keys:
            self.stdout.write(self.style.SUCCESS("No contract cache keys found"))
            return

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f"DRY RUN: Would delete {len(keys)} cache keys matching '{pattern}'"
                )
            )
            for key in keys:
                self.stdout.write(f"  {key.decode() if isinstance(key, bytes) else key}")
        else:
            deleted = redis_client.delete(*keys)
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully deleted {deleted} cache keys matching '{pattern}'"
                )
            )