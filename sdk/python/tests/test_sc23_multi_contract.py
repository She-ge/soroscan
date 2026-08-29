"""Tests for SC-23: multi-contract event query."""

import pytest
from pytest_httpx import HTTPXMock

from soroscan import AsyncSoroScanClient, SoroScanClient
from soroscan.models import (
    ContractEvent,
    GetEventsByContractsRequest,
    GetEventsByContractsResponse,
)


# ── Fixtures ──────────────────────────────────────────────────────────────────

CONTRACT_IDS = [
    "CCAAA111222333444555666777888999AAABBBCCCDDDEEEFFF",
    "CCBBB111222333444555666777888999AAABBBCCCDDDEEEFFF",
]

SAMPLE_EVENT = {
    "id": 1,
    "contract_id": CONTRACT_IDS[0],
    "contract_name": "Token A",
    "event_type": "transfer",
    "payload": {"from": "GAAA...", "to": "GBBB...", "amount": "100"},
    "payload_hash": "a" * 64,
    "ledger": 100000,
    "event_index": 0,
    "timestamp": "2026-01-01T12:00:00Z",
    "tx_hash": "txabc123",
    "schema_version": 1,
    "validation_status": "passed",
}

MULTI_RESPONSE = {
    "count": 1,
    "results": [SAMPLE_EVENT],
    "contract_ids": CONTRACT_IDS,
}


# ── Model validation ──────────────────────────────────────────────────────────


def test_request_model_valid() -> None:
    req = GetEventsByContractsRequest(contract_ids=CONTRACT_IDS)
    assert req.contract_ids == CONTRACT_IDS
    assert req.page == 1
    assert req.page_size == 50


def test_request_model_rejects_empty() -> None:
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        GetEventsByContractsRequest(contract_ids=[])


def test_request_model_rejects_too_many() -> None:
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        GetEventsByContractsRequest(contract_ids=["C" * 56] * 11)


def test_response_model_valid() -> None:
    resp = GetEventsByContractsResponse.model_validate(MULTI_RESPONSE)
    assert resp.count == 1
    assert len(resp.results) == 1
    assert resp.contract_ids == CONTRACT_IDS
    assert isinstance(resp.results[0], ContractEvent)


# ── Sync client ───────────────────────────────────────────────────────────────


def test_get_events_by_contracts(base_url: str, httpx_mock: HTTPXMock) -> None:
    """get_events_by_contracts posts to /api/events/by-contracts/ and returns response."""
    httpx_mock.add_response(
        url=f"{base_url}/api/events/by-contracts/",
        json=MULTI_RESPONSE,
        status_code=200,
    )

    with SoroScanClient(base_url=base_url) as client:
        result = client.get_events_by_contracts(contract_ids=CONTRACT_IDS)

    assert isinstance(result, GetEventsByContractsResponse)
    assert result.count == 1
    assert result.contract_ids == CONTRACT_IDS
    assert result.results[0].event_type == "transfer"


def test_get_events_by_contracts_with_filters(base_url: str, httpx_mock: HTTPXMock) -> None:
    """Filters are serialized and sent in the request body."""
    httpx_mock.add_response(
        url=f"{base_url}/api/events/by-contracts/",
        json={**MULTI_RESPONSE, "count": 0, "results": []},
        status_code=200,
    )

    with SoroScanClient(base_url=base_url) as client:
        result = client.get_events_by_contracts(
            contract_ids=CONTRACT_IDS,
            event_type="transfer",
            ledger_min=100000,
            ledger_max=200000,
            page_size=25,
        )

    assert result.count == 0


def test_get_events_by_contracts_single(base_url: str, httpx_mock: HTTPXMock) -> None:
    """Single contract ID is valid."""
    httpx_mock.add_response(
        url=f"{base_url}/api/events/by-contracts/",
        json={**MULTI_RESPONSE, "contract_ids": [CONTRACT_IDS[0]]},
        status_code=200,
    )

    with SoroScanClient(base_url=base_url) as client:
        result = client.get_events_by_contracts(contract_ids=[CONTRACT_IDS[0]])

    assert result.contract_ids == [CONTRACT_IDS[0]]


def test_get_events_by_contracts_error_propagation(
    base_url: str, httpx_mock: HTTPXMock
) -> None:
    """API errors are propagated correctly."""
    from soroscan.exceptions import SoroScanValidationError

    httpx_mock.add_response(
        url=f"{base_url}/api/events/by-contracts/",
        json={"error": "Too many contract IDs"},
        status_code=400,
    )

    with SoroScanClient(base_url=base_url) as client:
        with pytest.raises(SoroScanValidationError):
            client.get_events_by_contracts(contract_ids=CONTRACT_IDS)


# ── Async client ──────────────────────────────────────────────────────────────


@pytest.mark.anyio
async def test_async_get_events_by_contracts(base_url: str, httpx_mock: HTTPXMock) -> None:
    """Async get_events_by_contracts posts correctly and returns response."""
    httpx_mock.add_response(
        url=f"{base_url}/api/events/by-contracts/",
        json=MULTI_RESPONSE,
        status_code=200,
    )

    async with AsyncSoroScanClient(base_url=base_url) as client:
        result = await client.get_events_by_contracts(contract_ids=CONTRACT_IDS)

    assert isinstance(result, GetEventsByContractsResponse)
    assert result.count == 1
    assert len(result.results) == 1


@pytest.mark.anyio
async def test_async_get_events_by_contracts_error(
    base_url: str, httpx_mock: HTTPXMock
) -> None:
    """Async client propagates API errors from multi-contract endpoint."""
    from soroscan.exceptions import SoroScanValidationError

    httpx_mock.add_response(
        url=f"{base_url}/api/events/by-contracts/",
        json={"error": "Too many contract IDs"},
        status_code=400,
    )

    async with AsyncSoroScanClient(base_url=base_url) as client:
        with pytest.raises(SoroScanValidationError):
            await client.get_events_by_contracts(contract_ids=CONTRACT_IDS)
