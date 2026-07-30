"""Tests for the generate_api_docs management command and docstring parser."""
from __future__ import annotations

import json
from io import StringIO
from pathlib import Path

import pytest
from django.core.management import call_command

from soroscan.ingest.management.commands.generate_api_docs import (
    EndpointDoc,
    QueryParam,
    ResponseCode,
    _parse_docstring,
    collect_endpoints,
    render_json,
    render_markdown,
)


class TestParseDocstring:
    def test_empty_docstring(self):
        parsed = _parse_docstring(None)
        assert parsed["summary"] == ""
        assert parsed["query_params"] == []
        assert parsed["request_body"] == []

    def test_summary_from_first_line(self):
        parsed = _parse_docstring("List tracked contracts.\n\nReturns paginated results.")
        assert parsed["summary"] == "List tracked contracts."
        assert "Returns paginated results." in parsed["description"]

    def test_query_params_section(self):
        raw = """
        Search events with filters.

        Query params:
        - contract_id (string) - Filter by contract ID (required)
        - page (int) - Page number, default 1
        """
        parsed = _parse_docstring(raw)
        assert parsed["summary"] == "Search events with filters."
        assert len(parsed["query_params"]) == 2
        assert parsed["query_params"][0].name == "contract_id"
        assert parsed["query_params"][0].required is True
        assert parsed["query_params"][1].name == "page"
        assert parsed["query_params"][1].required is False

    def test_request_body_section(self):
        raw = """
        Record a new event.

        Request body:
        - contract_id (string) - Soroban contract address
        - event_type (string) - Event type label
        """
        parsed = _parse_docstring(raw)
        assert len(parsed["request_body"]) == 2
        assert parsed["request_body"][0].type == "string"
        assert parsed["request_body"][1].name == "event_type"

    def test_response_codes(self):
        raw = """
        Delete a webhook subscription.

        - 204: Subscription removed
        - 401: Unauthorized
        - 404: Not found
        """
        parsed = _parse_docstring(raw)
        codes = {rc.code: rc.description for rc in parsed["response_codes"]}
        assert codes[204] == "Subscription removed"
        assert codes[401] == "Unauthorized"
        assert codes[404] == "Not found"


class TestRenderMarkdown:
    def test_renders_endpoint_summary_and_path(self):
        endpoints = [
            EndpointDoc(
                path="/api/ingest/health/",
                methods=["GET"],
                name="health-check",
                summary="Health check endpoint.",
                description="Returns service status.",
                auth_required=False,
                response_codes=[ResponseCode(200, "Success")],
                tags=["Ingest"],
            )
        ]
        md = render_markdown(endpoints, include_examples=False)
        assert "# SoroScan API Reference" in md
        assert "Health check endpoint." in md
        assert "`/api/ingest/health/`" in md
        assert "🔓 No" in md
        assert "Returns service status." in md

    def test_renders_auth_required_badge(self):
        endpoints = [
            EndpointDoc(
                path="/api/audit-trail/",
                methods=["GET"],
                name="audit-trail",
                summary="Query audit trail.",
                description="",
                auth_required=True,
                tags=["General"],
            )
        ]
        md = render_markdown(endpoints, include_examples=False)
        assert "✅ Yes" in md


class TestRenderJson:
    def test_serializes_endpoints(self):
        endpoints = [
            EndpointDoc(
                path="/v1/events/",
                methods=["GET"],
                name="v1-events",
                summary="List SDK events.",
                description="",
                auth_required=False,
                query_params=[QueryParam(name="first", description="Page size")],
                tags=["V1"],
            )
        ]
        payload = json.loads(render_json(endpoints))
        assert payload[0]["path"] == "/v1/events/"
        assert payload[0]["query_params"][0]["name"] == "first"


@pytest.mark.django_db
class TestCollectEndpoints:
    def test_collects_named_api_routes(self):
        docs = collect_endpoints()
        paths = {doc.path for doc in docs}
        names = {doc.name for doc in docs}

        assert "/api/ingest/health/" in paths or any("health" in n for n in names)
        assert len(docs) > 0

    def test_health_endpoint_uses_view_docstring(self):
        docs = collect_endpoints()
        health = next(
            (doc for doc in docs if doc.name == "health-check"),
            None,
        )
        assert health is not None
        assert "health" in health.summary.lower()


@pytest.mark.django_db
class TestGenerateApiDocsCommand:
    def test_writes_markdown_file(self, tmp_path):
        output = tmp_path / "api_reference.md"
        call_command("generate_api_docs", output=str(output), format="markdown")

        content = output.read_text(encoding="utf-8")
        assert "# SoroScan API Reference" in content
        assert "Auto-generated from view docstrings" in content

    def test_writes_json_file(self, tmp_path):
        output = tmp_path / "api_reference.json"
        call_command("generate_api_docs", output=str(output), format="json")

        payload = json.loads(output.read_text(encoding="utf-8"))
        assert isinstance(payload, list)
        assert len(payload) > 0
        assert "path" in payload[0]
        assert "methods" in payload[0]

    def test_stdout_mode(self):
        out = StringIO()
        call_command(
            "generate_api_docs",
            stdout=out,
            stderr=StringIO(),
            format="markdown",
            no_examples=True,
        )
        content = out.getvalue()
        assert "# SoroScan API Reference" in content

    def test_default_output_path_is_under_docs(self):
        """Verify the default output location matches project convention."""
        from soroscan.ingest.management.commands.generate_api_docs import Command

        command = Command()
        parser = command.create_parser("manage.py", "generate_api_docs")
        output_action = next(a for a in parser._actions if a.dest == "output")
        assert output_action.default == "docs/api_reference.md"
        assert Path(output_action.default).parent.name == "docs"
