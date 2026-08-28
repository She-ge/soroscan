"""Tests for SC-9: indexer authorization."""

import pytest
from pytest_httpx import HTTPXMock

from soroscan import AsyncSoroScanClient, SoroScanClient
from soroscan.models import AddIndexerResponse

INDEXER_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
ADD_INDEXER_RESPONSE = {
    "status": "submitted",
    "tx_hash": "txaddindexer001",
    "transaction_status": "pending",
    "error": None,
}


def test_add_indexer(base_url: str, httpx_mock: HTTPXMock) -> None:
    """add_indexer posts to /api/ingest/indexers/add/ and returns response."""
    httpx_mock.add_response(
        url=f"{base_url}/api/ingest/indexers/add/",
        json=ADD_INDEXER_RESPONSE,
        status_code=202,
    )

    with SoroScanClient(base_url=base_url) as client:
        result = client.add_indexer(INDEXER_ADDRESS)

    assert isinstance(result, AddIndexerResponse)
    assert result.status == "submitted"
    assert result.tx_hash == "txaddindexer001"
    assert result.error is None


def test_add_indexer_request_validation() -> None:
    """AddIndexerRequest requires indexer_address."""
    from pydantic import ValidationError
    from soroscan.models import AddIndexerRequest

    with pytest.raises(ValidationError):
        AddIndexerRequest()


@pytest.mark.anyio
async def test_async_add_indexer(base_url: str, httpx_mock: HTTPXMock) -> None:
    """Async add_indexer posts correctly and returns response."""
    httpx_mock.add_response(
        url=f"{base_url}/api/ingest/indexers/add/",
        json=ADD_INDEXER_RESPONSE,
        status_code=202,
    )

    async with AsyncSoroScanClient(base_url=base_url) as client:
        result = await client.add_indexer(INDEXER_ADDRESS)

    assert result.status == "submitted"
    assert result.tx_hash == "txaddindexer001"
