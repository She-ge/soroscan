"""
Management command: bulk_import_metadata

Thin wrapper around ``soroscan.ingest.services.metadata_bulk_import``.
"""
import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from soroscan.ingest.services.metadata_bulk_import import (
    BulkImportError,
    detect_format,
    import_metadata_rows,
    parse_rows,
)


class Command(BaseCommand):
    help = "Bulk import contract metadata from CSV or JSON."

    def add_arguments(self, parser):
        parser.add_argument(
            "--input",
            required=True,
            help="Input file path (use - for stdin)",
        )
        parser.add_argument(
            "--format",
            choices=["csv", "json"],
            default=None,
            help="Input format (auto-detected from extension if omitted)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Validate all rows without modifying the database",
        )
        parser.add_argument(
            "--on-error",
            choices=["rollback", "skip"],
            default="rollback",
            help="Behavior on validation error: rollback entire batch or skip row",
        )
        parser.add_argument(
            "--encoding",
            default="utf-8",
            help="File encoding (default: utf-8)",
        )
        parser.add_argument(
            "--report",
            default=None,
            help="Write import report JSON to this file",
        )

    def handle(self, *args, **options):
        input_path = options["input"]
        fmt = options["format"]
        dry_run = options["dry_run"]
        on_error = options["on_error"]
        encoding = options["encoding"]
        report_path = options["report"]

        try:
            fmt = detect_format(None if input_path == "-" else input_path, fmt)
        except ValueError as exc:
            raise CommandError(str(exc)) from exc

        raw = self._load_input(input_path, encoding)
        try:
            rows = parse_rows(raw, fmt)
        except ValueError as exc:
            raise CommandError(str(exc)) from exc

        if not rows:
            self.stdout.write("No metadata rows to import.")
            return

        try:
            report = import_metadata_rows(rows, dry_run=dry_run, on_error=on_error)
        except BulkImportError as exc:
            self._print_report(exc.report)
            raise CommandError(str(exc)) from exc

        self._print_report(report)
        if report_path:
            self._write_report(report, report_path)

    def _load_input(self, input_path: str, encoding: str) -> str:
        if input_path == "-":
            return self.stdin.read()
        try:
            with open(input_path, "r", encoding=encoding, newline="") as f:
                return f.read()
        except OSError as exc:
            raise CommandError(f"Cannot read input file {input_path}: {exc}") from exc

    def _print_report(self, report: dict):
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=== Import Report ==="))
        self.stdout.write(f"Mode:                         {report['mode']}")
        self.stdout.write(f"Total rows:                   {report['total_rows']}")
        self.stdout.write(f"Created:                      {report['created']}")
        self.stdout.write(f"Updated:                      {report['updated']}")
        self.stdout.write(f"Skipped (no contract):        {report['skipped_no_contract']}")
        self.stdout.write(f"Skipped (on error):           {report['skipped_on_error']}")
        self.stdout.write(f"Errors:                       {report['errors']}")
        if report["error_details"]:
            self.stdout.write("")
            self.stdout.write(self.style.ERROR("Errors:"))
            for err in report["error_details"]:
                self.stdout.write(
                    f"  Row {err['row']} ({err.get('contract_id', '?')}): {err['error']}"
                )

    def _write_report(self, report: dict, path: str):
        out = Path(path)
        out.parent.mkdir(parents=True, exist_ok=True)
        with open(out, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, default=str)
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(f"Report written to {out}"))
