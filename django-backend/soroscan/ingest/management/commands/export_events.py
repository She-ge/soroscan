"""
Management command: export_events.

Streams ContractEvent rows to Parquet, CSV, JSON, or Avro without loading
all events into memory.

Usage examples:
    python manage.py export_events --contract CXXX --format csv --output events.csv
    python manage.py export_events --contract-id CXXX --format json --output events.json
    python manage.py export_events --contract-id CXXX --format parquet --output events.parquet \
        --start-ledger 1000000 --end-ledger 2000000
"""
from datetime import datetime, time

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime

from soroscan.ingest.models import TrackedContract
from soroscan.ingest.services.export_import import (
    _count_events,
    export_avro,
    export_csv,
    export_json,
    export_parquet,
)


class Command(BaseCommand):
    help = (
        "Export contract events to CSV, JSON, Parquet, or Avro.\n"
        "Examples:\n"
        "  python manage.py export_events --contract ABC123 --format csv --output events.csv\n"
        "  python manage.py export_events --contract-id ABC123 --format json "
        "--start-date 2026-01-01 --end-date 2026-01-31 --output events.json"
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--contract",
            dest="contract_id",
            help="Contract ID/address to export (alias for --contract-id)",
        )
        parser.add_argument(
            "--contract-id",
            dest="contract_id",
            help="Contract ID/address to export",
        )
        parser.add_argument(
            "--format",
            choices=["parquet", "csv", "json", "avro"],
            default="json",
            help="Output format (default: json)",
        )
        parser.add_argument(
            "--output",
            required=True,
            help="Output file path (use - for stdout on csv/json)",
        )
        parser.add_argument(
            "--start-ledger",
            type=int,
            default=None,
            help="Export events from this ledger (inclusive)",
        )
        parser.add_argument(
            "--end-ledger",
            type=int,
            default=None,
            help="Export events up to this ledger (inclusive)",
        )
        parser.add_argument(
            "--start-date",
            default=None,
            help="Export events from this timestamp/date (inclusive; ISO-8601)",
        )
        parser.add_argument(
            "--end-date",
            default=None,
            help="Export events up to this timestamp/date (inclusive; ISO-8601)",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=500,
            help="Internal streaming batch size (default: 500)",
        )

    def handle(self, *args, **options):
        contract_id = options["contract_id"]
        fmt = options["format"]
        output = options["output"]
        start_ledger = options["start_ledger"]
        end_ledger = options["end_ledger"]
        start_date = self._parse_datetime_option(
            options["start_date"],
            "--start-date",
            is_end=False,
        )
        end_date = self._parse_datetime_option(
            options["end_date"],
            "--end-date",
            is_end=True,
        )

        if not contract_id:
            raise CommandError("Either --contract or --contract-id is required.")

        if not TrackedContract.objects.filter(contract_id=contract_id).exists():
            raise CommandError(
                f"No TrackedContract found with contract_id={contract_id!r}"
            )

        if start_ledger is not None and end_ledger is not None and start_ledger > end_ledger:
            raise CommandError("--start-ledger must be <= --end-ledger")
        if start_date is not None and end_date is not None and start_date > end_date:
            raise CommandError("--start-date must be <= --end-date")

        total = _count_events(
            contract_id,
            start_ledger,
            end_ledger,
            start_date,
            end_date,
        )
        self.stderr.write(
            f"Exporting {total} events from contract {contract_id} as {fmt} -> {output}"
        )

        try:
            count = self._do_export(
                fmt,
                contract_id,
                output,
                start_ledger,
                end_ledger,
                start_date,
                end_date,
            )
        except ImportError as exc:
            raise CommandError(str(exc))

        self.stdout.write(self.style.SUCCESS(f"Exported {count} events to {output}"))

    def _parse_datetime_option(self, value: str | None, option_name: str, is_end: bool):
        if not value:
            return None

        parsed = parse_datetime(value)
        if parsed is None:
            parsed_date = parse_date(value)
            if parsed_date is None:
                raise CommandError(f"{option_name} must be an ISO-8601 date or datetime.")
            parsed = datetime.combine(parsed_date, time.max if is_end else time.min)

        if timezone.is_naive(parsed):
            parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
        return parsed

    def _do_export(
        self,
        fmt,
        contract_id,
        output,
        start_ledger,
        end_ledger,
        start_date,
        end_date,
    ) -> int:
        if fmt == "json":
            if output == "-":
                return export_json(
                    contract_id,
                    self.stdout,
                    start_ledger,
                    end_ledger,
                    start_date,
                    end_date,
                )
            with open(output, "w", encoding="utf-8") as f:
                return export_json(
                    contract_id,
                    f,
                    start_ledger,
                    end_ledger,
                    start_date,
                    end_date,
                )

        if fmt == "csv":
            if output == "-":
                return export_csv(
                    contract_id,
                    self.stdout,
                    start_ledger,
                    end_ledger,
                    start_date,
                    end_date,
                )
            with open(output, "w", encoding="utf-8", newline="") as f:
                return export_csv(
                    contract_id,
                    f,
                    start_ledger,
                    end_ledger,
                    start_date,
                    end_date,
                )

        if fmt == "parquet":
            if output == "-":
                raise CommandError(
                    "Parquet format cannot be written to stdout; provide a file path."
                )
            return export_parquet(
                contract_id,
                output,
                start_ledger,
                end_ledger,
                start_date,
                end_date,
            )

        if fmt == "avro":
            if output == "-":
                raise CommandError(
                    "Avro format cannot be written to stdout; provide a file path."
                )
            return export_avro(
                contract_id,
                output,
                start_ledger,
                end_ledger,
                start_date,
                end_date,
            )

        raise CommandError(f"Unknown format: {fmt}")
