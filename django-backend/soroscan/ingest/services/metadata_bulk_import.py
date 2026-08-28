"""
Bulk import of contract metadata from CSV or JSON.

Extracted from the ``bulk_import_metadata`` management command so the same
logic can be reused by REST endpoints and the admin UI.
"""

from __future__ import annotations

import csv
import io
import json
from typing import Any

from django.db import transaction

from soroscan.ingest.models import ContractMetadata, TrackedContract


class BulkImportError(Exception):
    """Raised when validation fails and on_error=rollback."""

    def __init__(self, message: str, report: dict[str, Any]):
        super().__init__(message)
        self.report = report


def detect_format(filename: str | None, explicit: str | None = None) -> str:
    if explicit in ("csv", "json"):
        return explicit
    if not filename:
        raise ValueError("format is required when filename is not provided")
    lower = filename.lower()
    if lower.endswith(".csv"):
        return "csv"
    if lower.endswith(".json"):
        return "json"
    raise ValueError("Cannot detect format; use format=csv or format=json")


def parse_csv(raw: str) -> list[dict[str, Any]]:
    try:
        reader = csv.DictReader(io.StringIO(raw))
        rows = list(reader)
    except csv.Error as exc:
        raise ValueError(f"CSV parse error: {exc}") from exc
    if not rows or "contract_id" not in (reader.fieldnames or []):
        raise ValueError("CSV file must have a 'contract_id' column.")
    return [_normalize_row(row) for row in rows if (row.get("contract_id") or "").strip()]


def parse_json(raw: str) -> list[dict[str, Any]]:
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"JSON parse error: {exc}") from exc
    if isinstance(data, list):
        items = data
    elif isinstance(data, dict):
        items = data.get("metadata") or data.get("items") or data.get("contracts") or []
    else:
        raise ValueError("JSON must be an array or an object with a 'metadata' key.")
    if not isinstance(items, list):
        raise ValueError("Expected a list of metadata entries in JSON.")
    normalized = []
    for item in items:
        if not isinstance(item, dict):
            continue
        row = _normalize_row(item)
        if row["contract_id"]:
            normalized.append(row)
    return normalized


def parse_rows(raw: str, fmt: str) -> list[dict[str, Any]]:
    if fmt == "csv":
        return parse_csv(raw)
    if fmt == "json":
        return parse_json(raw)
    raise ValueError(f"Unsupported format: {fmt}")


def _normalize_row(row: dict[str, Any]) -> dict[str, Any]:
    contract_id = str(row.get("contract_id") or "").strip()
    tags = row.get("tags", [])
    if isinstance(tags, str):
        tags = [t.strip() for t in tags.split(",") if t.strip()]
    elif not isinstance(tags, list):
        tags = []
    return {
        "contract_id": contract_id,
        "name": str(row.get("name") or "").strip(),
        "description": str(row.get("description") or "").strip(),
        "tags": [str(t).strip() for t in tags if str(t).strip()],
        "documentation_url": str(row.get("documentation_url") or "").strip(),
        "github_repo": str(row.get("github_repo") or "").strip(),
        "team_email": str(row.get("team_email") or "").strip(),
    }


def validate_row(row: dict[str, Any]) -> dict[str, Any]:
    validated = dict(row)
    if not validated.get("contract_id"):
        raise ValueError("contract_id is required")
    if not validated.get("name"):
        validated["name"] = validated["contract_id"]
    if len(validated.get("name", "")) > 256:
        raise ValueError("name exceeds max length of 256")
    if len(validated.get("description", "")) > 5000:
        raise ValueError("description exceeds max length of 5000")
    tags = validated.get("tags", [])
    if not isinstance(tags, list):
        raise ValueError("tags must be a list")
    if len(tags) > 100:
        raise ValueError("tags exceeds max length of 100")
    for field in ("documentation_url", "github_repo"):
        value = validated.get(field, "")
        if value and len(value) > 2048:
            raise ValueError(f"{field} exceeds max length of 2048")
    if validated.get("team_email") and len(validated["team_email"]) > 254:
        raise ValueError("team_email exceeds max length of 254")
    return validated


def import_metadata_rows(
    rows: list[dict[str, Any]],
    *,
    dry_run: bool = False,
    on_error: str = "rollback",
) -> dict[str, Any]:
    """
    Import metadata rows.

    ``on_error``:
      - ``rollback``: abort and undo all changes on first error
      - ``skip``: skip the failing row and continue
    """
    if on_error not in ("rollback", "skip"):
        raise ValueError("on_error must be 'rollback' or 'skip'")

    report: dict[str, Any] = {
        "mode": "dry-run" if dry_run else "live",
        "on_error": on_error,
        "total_rows": len(rows),
        "created": 0,
        "updated": 0,
        "skipped_no_contract": 0,
        "skipped_on_error": 0,
        "errors": 0,
        "error_details": [],
        "imported": [],
    }

    def _run() -> dict[str, Any]:
        for idx, row in enumerate(rows, start=1):
            try:
                contract = TrackedContract.objects.filter(
                    contract_id=row["contract_id"]
                ).first()
                if not contract:
                    report["skipped_no_contract"] += 1
                    report["error_details"].append(
                        {
                            "row": idx,
                            "contract_id": row["contract_id"],
                            "error": "TrackedContract not found",
                        }
                    )
                    if on_error == "rollback":
                        raise BulkImportError(
                            f"Row {idx}: TrackedContract not found for {row['contract_id']}.",
                            report,
                        )
                    continue

                validated = validate_row(row)
                exists = ContractMetadata.objects.filter(contract=contract).exists()
                if dry_run:
                    if exists:
                        report["updated"] += 1
                    else:
                        report["created"] += 1
                    report["imported"].append(
                        {
                            "row": idx,
                            "contract_id": validated["contract_id"],
                            "action": "update" if exists else "create",
                            "dry_run": True,
                        }
                    )
                    continue

                defaults = {
                    "name": validated["name"],
                    "description": validated["description"],
                    "tags": validated["tags"],
                    "documentation_url": validated["documentation_url"] or None,
                    "github_repo": validated["github_repo"] or None,
                    "team_email": validated["team_email"] or None,
                }
                meta, created = ContractMetadata.objects.update_or_create(
                    contract=contract,
                    defaults=defaults,
                )
                if created:
                    report["created"] += 1
                    action = "create"
                else:
                    report["updated"] += 1
                    action = "update"
                report["imported"].append(
                    {
                        "row": idx,
                        "contract_id": validated["contract_id"],
                        "action": action,
                        "metadata_id": meta.pk,
                    }
                )
            except BulkImportError:
                raise
            except Exception as exc:
                report["errors"] += 1
                report["error_details"].append(
                    {
                        "row": idx,
                        "contract_id": row.get("contract_id"),
                        "error": str(exc),
                    }
                )
                if on_error == "rollback":
                    raise BulkImportError(
                        f"Row {idx}: {exc}. Rolling back import.",
                        report,
                    ) from exc
                report["skipped_on_error"] += 1
        return report

    if dry_run or on_error == "skip":
        return _run()

    try:
        with transaction.atomic():
            return _run()
    except BulkImportError:
        # Atomic block already rolled back DB changes.
        report["mode"] = "rolled-back"
        raise
