"""Tests for the SC-10 record-event CLI command."""

import json

import pytest
from pytest_httpx import HTTPXMock

from soroscan.cli import main, build_parser


BASE_CONTRACT = "CCAAA111222333444555666777888999AAABBBCCCDDDEEEFFF"
EVENT_TYPE = "transfer"
PAYLOAD_HASH = "a" * 64

RECORD_RESPONSE = {
    "status": "submitted",
    "tx_hash": "txabc123",
    "transaction_status": "pending",
    "error": None,
}


# ── Parser tests (no HTTP needed) ────────────────────────────────────────────

class TestRecordEventParser:
    def test_record_event_subcommand_exists(self):
        parser = build_parser()
        args = parser.parse_args([
            "record-event",
            BASE_CONTRACT,
            EVENT_TYPE,
            PAYLOAD_HASH,
        ])
        assert args.contract_id == BASE_CONTRACT
        assert args.event_type == EVENT_TYPE
        assert args.payload_hash == PAYLOAD_HASH
        assert args.output == "table"

    def test_record_event_json_flag(self):
        parser = build_parser()
        args = parser.parse_args([
            "record-event",
            BASE_CONTRACT,
            EVENT_TYPE,
            PAYLOAD_HASH,
            "--output", "json",
        ])
        assert args.output == "json"

    def test_record_event_missing_args_exits(self):
        parser = build_parser()
        with pytest.raises(SystemExit):
            parser.parse_args(["record-event"])


# ── Integration tests (HTTP mocked) ──────────────────────────────────────────

class TestRecordEventCLI:
    def test_record_event_table_output(
        self,
        base_url: str,
        httpx_mock: HTTPXMock,
        capsys,
    ) -> None:
        httpx_mock.add_response(
            url=f"{base_url}/api/record-event/",
            method="POST",
            json=RECORD_RESPONSE,
            status_code=201,
        )

        exit_code = main([
            "--base-url", base_url,
            "record-event",
            BASE_CONTRACT,
            EVENT_TYPE,
            PAYLOAD_HASH,
        ])

        assert exit_code == 0
        output = capsys.readouterr().out
        assert "submitted" in output
        assert "txabc123" in output

    def test_record_event_json_output(
        self,
        base_url: str,
        httpx_mock: HTTPXMock,
        capsys,
    ) -> None:
        httpx_mock.add_response(
            url=f"{base_url}/api/record-event/",
            method="POST",
            json=RECORD_RESPONSE,
            status_code=201,
        )

        exit_code = main([
            "--base-url", base_url,
            "record-event",
            BASE_CONTRACT,
            EVENT_TYPE,
            PAYLOAD_HASH,
            "--output", "json",
        ])

        assert exit_code == 0
        data = json.loads(capsys.readouterr().out)
        assert data["status"] == "submitted"
        assert data["tx_hash"] == "txabc123"
        assert data["error"] is None

    def test_record_event_api_error_prints_to_stderr(
        self,
        base_url: str,
        httpx_mock: HTTPXMock,
        capsys,
    ) -> None:
        httpx_mock.add_response(
            url=f"{base_url}/api/record-event/",
            method="POST",
            json={"detail": "Indexer not authorized"},
            status_code=403,
        )

        exit_code = main([
            "--base-url", base_url,
            "record-event",
            BASE_CONTRACT,
            EVENT_TYPE,
            PAYLOAD_HASH,
        ])

        assert exit_code == 1
        assert "Error" in capsys.readouterr().err
