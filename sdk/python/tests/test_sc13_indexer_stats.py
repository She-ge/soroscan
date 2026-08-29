"""Tests for SC-13: per-indexer event statistics."""

import pytest
from pytest_httpx import HTTPXMock

from soroscan import AsyncSoroScanClient, SoroScanClient
from soroscan.models import IndexerStats


# ── Fixtures ──────────────────────────────────────────────────────────────────

INDEXER_ADDRESS = "GABC111222333444555666777888999AAABBBCCCDDDEEEFFF00"

STATS_RESPONSE = {
    "indexer": INDEXER_ADDRESS,
    "events_recorded": 42,
}

ZERO_STATS_RESPONSE = {
    "indexer": INDEXER_ADDRESS,
    "events_recorded": 0,
}


# ── Sync client ───────────────────────────────────────────────────────────────


def test_get_indexer_stats(base_url: str, httpx_mock: HTTPXMock) -> None:
    """get_indexer_stats fetches from /api/indexer-stats/{indexer}/ and returns parsed stats."""
    httpx_mock.add_response(
        url=f"{base_url}/api/indexer-stats/{INDEXER_ADDRESS}/",
        json=STATS_RESPONSE,
        status_code=200,
    )

    with SoroScanClient(base_url=base_url) as client:
        result = client.get_indexer_stats(INDEXER_ADDRESS)

    assert isinstance(result, IndexerStats)
    assert result.indexer == INDEXER_ADDRESS
    assert result.events_recorded == 42


def test_get_indexer_stats_zero_events(base_url: str, httpx_mock: HTTPXMock) -> None:
    """An indexer with no recorded events returns events_recorded=0, not an error."""
    httpx_mock.add_response(
        url=f"{base_url}/api/indexer-stats/{INDEXER_ADDRESS}/",
        json=ZERO_STATS_RESPONSE,
        status_code=200,
    )

    with SoroScanClient(base_url=base_url) as client:
        result = client.get_indexer_stats(INDEXER_ADDRESS)

    assert result.events_recorded == 0


def test_indexer_stats_payload_validation_missing_field() -> None:
    """IndexerStats rejects a payload missing a required field."""
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        IndexerStats(indexer=INDEXER_ADDRESS)  # missing events_recorded


# ── Async client ──────────────────────────────────────────────────────────────


@pytest.mark.anyio
async def test_async_get_indexer_stats(base_url: str, httpx_mock: HTTPXMock) -> None:
    """Async get_indexer_stats fetches correctly and returns parsed stats."""
    httpx_mock.add_response(
        url=f"{base_url}/api/indexer-stats/{INDEXER_ADDRESS}/",
        json=STATS_RESPONSE,
        status_code=200,
    )

    async with AsyncSoroScanClient(base_url=base_url) as client:
        result = await client.get_indexer_stats(INDEXER_ADDRESS)

    assert isinstance(result, IndexerStats)
    assert result.indexer == INDEXER_ADDRESS
    assert result.events_recorded == 42


@pytest.mark.anyio
async def test_async_get_indexer_stats_zero_events(base_url: str, httpx_mock: HTTPXMock) -> None:
    """Async client also handles a zero-events indexer correctly."""
    httpx_mock.add_response(
        url=f"{base_url}/api/indexer-stats/{INDEXER_ADDRESS}/",
        json=ZERO_STATS_RESPONSE,
        status_code=200,
    )

    async with AsyncSoroScanClient(base_url=base_url) as client:
        result = await client.get_indexer_stats(INDEXER_ADDRESS)

    assert result.events_recorded == 0
