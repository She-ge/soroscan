"""Python SDK consumer-driven Pact contract tests."""
from __future__ import annotations

from collections.abc import Generator
from pathlib import Path
from typing import Any

import httpx
import pytest

REPO_ROOT = Path(__file__).resolve().parents[3]
PACTS_DIR = REPO_ROOT / "pacts"


@pytest.fixture
def pact() -> Generator[Any, None, None]:
    pact_module = pytest.importorskip("pact")
    Pact = pact_module.Pact

    pact = Pact("soroscan-python-sdk", "soroscan-api").with_specification("V4")
    yield pact
    pact.write_file(PACTS_DIR)


def test_health_contract(pact: Any) -> None:
    match = pytest.importorskip("pact").match
    body = {
        "status": match.str("healthy"),
        "service": match.str("soroscan"),
    }
    (
        pact.upon_receiving("a request for ingest service health")
        .given("the API is healthy")
        .with_request("GET", "/api/ingest/health/")
        .will_respond_with(200)
        .with_body(body, content_type="application/json")
    )

    with pact.serve() as srv:
        response = httpx.get(f"{srv.url}/api/ingest/health/")
        assert response.status_code == 200
        payload = response.json()
        assert payload["status"] == "healthy"
