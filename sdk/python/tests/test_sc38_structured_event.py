"""SC-38 structured-event SDK coverage."""

import json

import pytest
from pydantic import ValidationError
from pytest_httpx import HTTPXMock

from soroscan import AsyncSoroScanClient, SoroScanClient
from soroscan.models import StructuredEventRequest


def test_structured_event_request_rejects_zero_schema_version() -> None:
    with pytest.raises(ValidationError):
        StructuredEventRequest(
            contract_id="CABC", event_type="transfer", payload_hash="a" * 64,
            schema_version=0, correlation_id="b" * 64,
        )


def test_record_structured_event(base_url: str, httpx_mock: HTTPXMock) -> None:
    httpx_mock.add_response(
        url=f"{base_url}/api/record/structured/",
        status_code=202,
        json={"status": "submitted", "tx_hash": "abc", "transaction_status": "PENDING"},
    )
    with SoroScanClient(base_url=base_url) as client:
        result = client.record_structured_event("CABC", "transfer", "a" * 64, 1, "b" * 64)
    assert result.status == "submitted"
    request = httpx_mock.get_requests()[0]
    assert json.loads(request.content) == {
        "contract_id": "CABC", "event_type": "transfer", "payload_hash": "a" * 64,
        "schema_version": 1, "correlation_id": "b" * 64,
    }


@pytest.mark.anyio
async def test_async_record_structured_event(base_url: str, httpx_mock: HTTPXMock) -> None:
    httpx_mock.add_response(
        url=f"{base_url}/api/record/structured/", status_code=202,
        json={"status": "submitted", "tx_hash": "abc", "transaction_status": "PENDING"},
    )
    async with AsyncSoroScanClient(base_url=base_url) as client:
        result = await client.record_structured_event("CABC", "transfer", "a" * 64, 1, "b" * 64)
    assert result.tx_hash == "abc"
