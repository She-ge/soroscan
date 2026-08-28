"""
Event deduplication helpers.

Computes fingerprints from EventDeduplicationConfig field lists and
evaluates whether an incoming event is a duplicate.
"""

from __future__ import annotations

import hashlib
import json
from typing import Any

SPECIAL_TOKENS = frozenset({"event_type", "ledger", "event_index", "tx_hash"})


def build_dedup_material(
    fields: list[str],
    *,
    event_type: str | None = None,
    ledger: int | None = None,
    event_index: int | None = None,
    tx_hash: str | None = None,
    payload: dict[str, Any] | None = None,
    raw: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Build the material dict used for fingerprinting.

    ``fields`` may contain special tokens (event_type, ledger, event_index,
    tx_hash) or payload keys. When ``raw`` is provided (admin test endpoint
    shape), special tokens are read from the top level and other fields from
    ``raw["payload"]``.
    """
    payload = payload or {}
    raw = raw or {}
    material: dict[str, Any] = {}

    for field in fields or []:
        if field in SPECIAL_TOKENS:
            if field == "event_type":
                material[field] = event_type if event_type is not None else raw.get(field)
            elif field == "ledger":
                material[field] = ledger if ledger is not None else raw.get(field)
            elif field == "event_index":
                material[field] = (
                    event_index if event_index is not None else raw.get(field)
                )
            elif field == "tx_hash":
                material[field] = tx_hash if tx_hash is not None else raw.get(field)
        else:
            if field in payload:
                material[field] = payload.get(field)
            else:
                nested = raw.get("payload") if isinstance(raw.get("payload"), dict) else {}
                material[field] = nested.get(field) if nested else payload.get(field)

    return material


def compute_dedup_hash(material: dict[str, Any]) -> str:
    dedup_material = json.dumps(material, sort_keys=True, default=str)
    return hashlib.sha256(dedup_material.encode("utf-8")).hexdigest()


def fingerprint_event(
    fields: list[str],
    *,
    event_type: str | None = None,
    ledger: int | None = None,
    event_index: int | None = None,
    tx_hash: str | None = None,
    payload: dict[str, Any] | None = None,
    raw: dict[str, Any] | None = None,
) -> tuple[str, dict[str, Any]]:
    material = build_dedup_material(
        fields,
        event_type=event_type,
        ledger=ledger,
        event_index=event_index,
        tx_hash=tx_hash,
        payload=payload,
        raw=raw,
    )
    return compute_dedup_hash(material), material


ALLOWED_DEDUP_FIELDS = sorted(
    SPECIAL_TOKENS
    | {
        "amount",
        "from",
        "to",
        "asset",
        "token",
        "sender",
        "recipient",
        "owner",
        "id",
        "key",
        "value",
        "topic",
        "address",
    }
)
