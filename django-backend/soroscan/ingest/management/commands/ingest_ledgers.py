import logging
import signal
import sys
import time
from typing import Optional

from django.core.management.base import BaseCommand
from django.utils import timezone

from soroscan.ingest.models import IndexerState
from soroscan.ingest.stellar_client import SorobanClient
from soroscan.ingest.tasks import process_ledger_events

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Continuously stream ledgers from Horizon and index Soroban events."

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.should_stop = False
        self.client = SorobanClient()
        self._setup_signals()

    def _setup_signals(self):
        """Setup signal handlers for graceful shutdown."""
        signal.signal(signal.SIGINT, self._handle_exit)
        signal.signal(signal.SIGTERM, self._handle_exit)

    def _handle_exit(self, signum, frame):
        self.stdout.write(self.style.SUCCESS(f"\nReceived signal {signum}. Stopping gracefully..."))
        self.should_stop = True

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting continuous ledger ingestion worker..."))

        cursor_state, _ = IndexerState.objects.get_or_create(
            key="horizon_cursor",
            defaults={"value": "now"},
        )
        cursor = cursor_state.value
        self.stdout.write(f"Resuming from cursor: {cursor}")

        try:
            for ledger in self.client.stream_ledgers(cursor=cursor):
                if self.should_stop:
                    break

                ledger_seq = ledger.get("sequence")
                paging_token = ledger.get("paging_token")

                if not ledger_seq:
                    continue

                start_time = time.monotonic()
                new_events = process_ledger_events(ledger_seq)
                elapsed = time.monotonic() - start_time

                if new_events > 0:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Ledger {ledger_seq}: Indexed {new_events} events (took {elapsed:.2f}s)"
                        )
                    )
                else:
                    self.stdout.write(f"Ledger {ledger_seq}: No events (took {elapsed:.2f}s)")

                # Update cursor
                cursor_state.value = paging_token
                cursor_state.save()
                cursor = paging_token

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Critical error in ingestion worker: {e}"))
            logger.exception("Ingestion worker failed")
            sys.exit(1)

        self.stdout.write(self.style.SUCCESS("Ingestion worker stopped."))
