"""Validate compressed JSON payloads stored on recent contract events."""

import json

import zstandard as zstd
from django.core.management.base import BaseCommand, CommandError
from django.db import connection

from soroscan.ingest.models import ContractEvent


class Command(BaseCommand):
    help = "Check recent ContractEvent payloads for valid Zstandard-compressed JSON"

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=1000,
            help="Number of most recent events to check (default: 1000)",
        )

    def handle(self, *args, **options):
        limit = options["limit"]
        if limit < 1:
            raise CommandError("--limit must be greater than zero.")

        table_name = connection.ops.quote_name(ContractEvent._meta.db_table)
        with connection.cursor() as cursor:
            cursor.execute(
                f"SELECT id, payload FROM {table_name} "
                "ORDER BY timestamp DESC, id DESC LIMIT %s",
                [limit],
            )
            rows = cursor.fetchall()

        valid_count = 0
        corrupt_ids = []
        decompressor = zstd.ZstdDecompressor()
        for event_id, payload in rows:
            try:
                if isinstance(payload, memoryview):
                    payload = payload.tobytes()
                decoded_payload = decompressor.decompress(payload).decode("utf-8")
                json.loads(decoded_payload)
            except (
                AttributeError,
                TypeError,
                UnicodeDecodeError,
                json.JSONDecodeError,
                zstd.ZstdError,
            ):
                corrupt_ids.append(event_id)
            else:
                valid_count += 1

        checked_count = len(rows)
        self.stdout.write(
            f"Checked {checked_count} recent event payload(s): "
            f"{valid_count} valid, {len(corrupt_ids)} corrupt."
        )
        self.stdout.write(f"Valid payloads: {valid_count}")
        self.stdout.write(f"Corrupt payloads: {len(corrupt_ids)}")
        for event_id in corrupt_ids:
            self.stdout.write(
                self.style.ERROR(f"Corrupt payload: ContractEvent id={event_id}")
            )