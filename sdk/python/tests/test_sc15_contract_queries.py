"""Tests for SC-15: contract authorization queries."""

import pytest
from pytest_httpx import HTTPXMock

from soroscan import AsyncSoroScanClient, SoroScanClient

INDEXER_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"


def test_is_indexer(base_url: str, httpx_mock: HTTPXMock) -> None:
    httpx_mock.add_response(
        url=f"{base_url}/api/ingest/indexers/check/?indexer_address={INDEXER_ADDRESS}",
        json={"is_indexer": True},
    )

    with SoroScanClient(base_url=base_url) as client:
        result = client.is_indexer(INDEXER_ADDRESS)

    assert result.is_indexer is True


def test_get_admin(base_url: str, httpx_mock: HTTPXMock) -> None:
    httpx_mock.add_response(
        url=f"{base_url}/api/ingest/contract/admin/",
        json={"admin_address": INDEXER_ADDRESS},
    )

    with SoroScanClient(base_url=base_url) as client:
        result = client.get_admin()

    assert result.admin_address == INDEXER_ADDRESS


@pytest.mark.anyio
async def test_async_is_indexer(base_url: str, httpx_mock: HTTPXMock) -> None:
    httpx_mock.add_response(
        url=f"{base_url}/api/ingest/indexers/check/?indexer_address={INDEXER_ADDRESS}",
        json={"is_indexer": False},
    )

    async with AsyncSoroScanClient(base_url=base_url) as client:
        result = await client.is_indexer(INDEXER_ADDRESS)

    assert result.is_indexer is False
