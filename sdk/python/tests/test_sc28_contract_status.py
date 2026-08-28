"""Tests for SC-28: contract pause status."""

import pytest
from pytest_httpx import HTTPXMock

from soroscan import AsyncSoroScanClient, SoroScanClient
from soroscan.models import ContractStatus


# ── Fixtures ──────────────────────────────────────────────────────────────────

ACTIVE_STATUS_RESPONSE = {
    "paused": False,
    "admin": "GAAA111222333444555666777888999AAABBBCCCDDDEEEFFF",
    "total_events": 42,
}

PAUSED_STATUS_RESPONSE = {
    "paused": True,
    "admin": "GAAA111222333444555666777888999AAABBBCCCDDDEEEFFF",
    "total_events": 42,
}


# ── Sync client ───────────────────────────────────────────────────────────────


def test_get_contract_status_active(base_url: str, httpx_mock: HTTPXMock) -> None:
    """get_contract_status returns a not-paused status."""
    httpx_mock.add_response(
        url=f"{base_url}/api/contract-status/",
        json=ACTIVE_STATUS_RESPONSE,
        status_code=200,
    )

    with SoroScanClient(base_url=base_url) as client:
        result = client.get_contract_status()

    assert isinstance(result, ContractStatus)
    assert result.paused is False
    assert result.admin == "GAAA111222333444555666777888999AAABBBCCCDDDEEEFFF"
    assert result.total_events == 42


def test_get_contract_status_paused(base_url: str, httpx_mock: HTTPXMock) -> None:
    """get_contract_status returns a paused status."""
    httpx_mock.add_response(
        url=f"{base_url}/api/contract-status/",
        json=PAUSED_STATUS_RESPONSE,
        status_code=200,
    )

    with SoroScanClient(base_url=base_url) as client:
        result = client.get_contract_status()

    assert isinstance(result, ContractStatus)
    assert result.paused is True
    assert result.total_events == 42


def test_contract_status_payload_validation_missing_admin() -> None:
    """ContractStatus rejects a payload missing the required admin field."""
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        ContractStatus(paused=False, total_events=1)  # type: ignore[call-arg]


# ── Async client ──────────────────────────────────────────────────────────────


@pytest.mark.anyio
async def test_async_get_contract_status(base_url: str, httpx_mock: HTTPXMock) -> None:
    """Async get_contract_status fetches correctly and returns response."""
    httpx_mock.add_response(
        url=f"{base_url}/api/contract-status/",
        json=ACTIVE_STATUS_RESPONSE,
        status_code=200,
    )

    async with AsyncSoroScanClient(base_url=base_url) as client:
        result = await client.get_contract_status()

    assert isinstance(result, ContractStatus)
    assert result.paused is False
    assert result.total_events == 42


@pytest.mark.anyio
async def test_async_get_contract_status_paused(base_url: str, httpx_mock: HTTPXMock) -> None:
    """Async get_contract_status returns a paused status."""
    httpx_mock.add_response(
        url=f"{base_url}/api/contract-status/",
        json=PAUSED_STATUS_RESPONSE,
        status_code=200,
    )

    async with AsyncSoroScanClient(base_url=base_url) as client:
        result = await client.get_contract_status()

    assert result.paused is True
