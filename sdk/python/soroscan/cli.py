"""Command-line interface for the SoroScan Python SDK."""

from __future__ import annotations

import argparse
import json
import os
import sys
from collections.abc import Iterable
from typing import Any

from pydantic import BaseModel

from soroscan.client import SoroScanClient
from soroscan.exceptions import SoroScanError


DEFAULT_BASE_URL = "https://api.soroscan.io"


def _model_to_dict(value: Any) -> dict[str, Any]:
    if isinstance(value, BaseModel):
        return value.model_dump(mode="json")
    if isinstance(value, dict):
        return value
    return dict(value)


def _print_json(payload: Any) -> None:
    if isinstance(payload, BaseModel):
        payload = payload.model_dump(mode="json")
    elif isinstance(payload, list):
        payload = [_model_to_dict(item) for item in payload]
    print(json.dumps(payload, indent=2, sort_keys=True))


def _format_cell(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        return json.dumps(value, sort_keys=True)
    return str(value)


def _print_table(rows: Iterable[Any], columns: list[str]) -> None:
    data = [_model_to_dict(row) for row in rows]
    widths = {
        column: max(
            [len(column)]
            + [len(_format_cell(row.get(column, ""))) for row in data]
        )
        for column in columns
    }

    header = "  ".join(column.ljust(widths[column]) for column in columns)
    separator = "  ".join("-" * widths[column] for column in columns)
    print(header)
    print(separator)
    for row in data:
        print(
            "  ".join(
                _format_cell(row.get(column, "")).ljust(widths[column])
                for column in columns
            )
        )


def _build_client(args: argparse.Namespace) -> SoroScanClient:
    return SoroScanClient(
        base_url=args.base_url or os.getenv("SOROSCAN_BASE_URL", DEFAULT_BASE_URL),
        api_key=args.api_key or os.getenv("SOROSCAN_API_KEY"),
        timeout=args.timeout,
    )


def _handle_events(args: argparse.Namespace) -> int:
    with _build_client(args) as client:
        response = client.get_events(
            contract_id=args.contract,
            event_type=args.event_type,
            page_size=args.limit,
            ordering=args.ordering,
        )
    if args.output == "json":
        _print_json(response.results)
    else:
        _print_table(
            response.results,
            ["id", "contract_id", "event_type", "ledger", "event_index", "timestamp"],
        )
    return 0


def _handle_contracts(args: argparse.Namespace) -> int:
    with _build_client(args) as client:
        if args.contract_command == "get":
            contract = client.get_contract(args.contract_id)
            if args.output == "json":
                _print_json(contract)
            else:
                _print_table(
                    [contract],
                    ["id", "contract_id", "name", "is_active", "event_count"],
                )
            return 0

        response = client.get_contracts(
            is_active=args.active,
            search=args.search,
            page_size=args.limit,
        )
    if args.output == "json":
        _print_json(response.results)
    else:
        _print_table(
            response.results,
            ["id", "contract_id", "name", "is_active", "event_count"],
        )
    return 0


def _handle_webhooks(args: argparse.Namespace) -> int:
    with _build_client(args) as client:
        if args.webhook_command == "test":
            result = client.test_webhook(args.webhook_id)
            if args.output == "json":
                _print_json(result)
            else:
                _print_table([result], sorted(result.keys()))
            return 0

        response = client.get_webhooks(page_size=args.limit)
    if args.output == "json":
        _print_json(response.results)
    else:
        _print_table(
            response.results,
            ["id", "contract_id", "event_type", "target_url", "is_active", "failure_count"],
        )
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="soroscan",
        description="Query SoroScan events, contracts, and webhooks.",
    )
    parser.add_argument(
        "--base-url",
        default=None,
        help="SoroScan API base URL (default: SOROSCAN_BASE_URL or production API)",
    )
    parser.add_argument(
        "--api-key",
        default=None,
        help="API key (default: SOROSCAN_API_KEY)",
    )
    parser.add_argument("--timeout", type=float, default=30.0, help="Request timeout in seconds")

    subcommands = parser.add_subparsers(dest="command", required=True)

    events = subcommands.add_parser("events", help="Query indexed events")
    events.add_argument("--contract", help="Filter by contract ID/address")
    events.add_argument("--event-type", help="Filter by event type")
    events.add_argument("--limit", type=int, default=10, help="Maximum events to return")
    events.add_argument("--ordering", default="-timestamp", help="API ordering expression")
    events.add_argument("--output", choices=["table", "json"], default="table")
    events.set_defaults(func=_handle_events)

    webhooks = subcommands.add_parser("webhooks", help="Manage webhook subscriptions")
    webhook_subcommands = webhooks.add_subparsers(dest="webhook_command", required=True)
    webhooks_list = webhook_subcommands.add_parser("list", help="List webhooks")
    webhooks_list.add_argument("--limit", type=int, default=50)
    webhooks_list.add_argument("--output", choices=["table", "json"], default="table")
    webhooks_list.set_defaults(func=_handle_webhooks)
    webhooks_test = webhook_subcommands.add_parser("test", help="Send a test webhook")
    webhooks_test.add_argument("webhook_id", type=int)
    webhooks_test.add_argument("--output", choices=["table", "json"], default="table")
    webhooks_test.set_defaults(func=_handle_webhooks)

    contracts = subcommands.add_parser("contracts", help="Query tracked contracts")
    contract_subcommands = contracts.add_subparsers(dest="contract_command", required=True)
    contracts_list = contract_subcommands.add_parser("list", help="List contracts")
    contracts_list.add_argument("--active", action="store_true", default=None)
    contracts_list.add_argument("--search", help="Search by name or contract ID")
    contracts_list.add_argument("--limit", type=int, default=50)
    contracts_list.add_argument("--output", choices=["table", "json"], default="table")
    contracts_list.set_defaults(func=_handle_contracts)
    contracts_get = contract_subcommands.add_parser("get", help="Get a contract")
    contracts_get.add_argument("contract_id")
    contracts_get.add_argument("--output", choices=["table", "json"], default="table")
    contracts_get.set_defaults(func=_handle_contracts)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        return args.func(args)
    except SoroScanError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
