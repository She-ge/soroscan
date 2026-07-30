"""Tests for SC-29: batch event recording."""

import pytest
from pytest_httpx import HTTPXMock

from soroscan import AsyncSoroScanClient, SoroScanClient
from soroscan.models import EventEntry, RecordEventsBatchResponse


# ── Fixtures ──────────────────────────────────────────────────────────────────

BATCH_RESPONSE = {
    "status": "submitted",
    "total_events": 3,
    "tx_hash": "txbatch001",
    "transaction_status": "pending",
    "error": None,
}

ENTRIES = [
    EventEntry(
        contract_id="CCAAA111222333444555666777888999AAABBBCCCDDDEEEFFF",
        event_type="transfer",
        payload_hash="a" * 64,
    ),
    EventEntry(
        contract_id="CCAAA111222333444555666777888999AAABBBCCCDDDEEEFFF",
        event_type="swap",
        payload_hash="b" * 64,
    ),
]


# ── Sync client ───────────────────────────────────────────────────────────────


def test_record_events_batch(base_url: str, httpx_mock: HTTPXMock) -> None:
    """record_events_batch posts to /api/record-events-batch/ and returns response."""
    httpx_mock.add_response(
        url=f"{base_url}/api/record-events-batch/",
        json=BATCH_RESPONSE,
        status_code=202,
    )

    with SoroScanClient(base_url=base_url) as client:
        result = client.record_events_batch(ENTRIES)

    assert isinstance(result, RecordEventsBatchResponse)
    assert result.status == "submitted"
    assert result.total_events == 3
    assert result.tx_hash == "txbatch001"
    assert result.error is None


def test_record_events_batch_single_entry(base_url: str, httpx_mock: HTTPXMock) -> None:
    """Batch of one entry is valid."""
    httpx_mock.add_response(
        url=f"{base_url}/api/record-events-batch/",
        json={**BATCH_RESPONSE, "total_events": 1},
        status_code=202,
    )

    with SoroScanClient(base_url=base_url) as client:
        result = client.record_events_batch([ENTRIES[0]])

    assert result.total_events == 1


def test_record_events_batch_max_entries(base_url: str, httpx_mock: HTTPXMock) -> None:
    """Batch of 25 entries (max) is accepted."""
    entries = [
        EventEntry(
            contract_id="CCAAA111222333444555666777888999AAABBBCCCDDDEEEFFF",
            event_type="ev",
            payload_hash="c" * 64,
        )
        for _ in range(25)
    ]
    httpx_mock.add_response(
        url=f"{base_url}/api/record-events-batch/",
        json={**BATCH_RESPONSE, "total_events": 25},
        status_code=202,
    )

    with SoroScanClient(base_url=base_url) as client:
        result = client.record_events_batch(entries)

    assert result.total_events == 25


def test_record_events_batch_payload_validation_empty() -> None:
    """RecordEventsBatchRequest rejects empty list."""
    from pydantic import ValidationError
    from soroscan.models import RecordEventsBatchRequest

    with pytest.raises(ValidationError):
        RecordEventsBatchRequest(events=[])


def test_record_events_batch_payload_validation_too_large() -> None:
    """RecordEventsBatchRequest rejects lists > 25."""
    from pydantic import ValidationError
    from soroscan.models import RecordEventsBatchRequest

    entries = [
        EventEntry(
            contract_id="CCAAA111222333444555666777888999AAABBBCCCDDDEEEFFF",
            event_type="ev",
            payload_hash="d" * 64,
        )
        for _ in range(26)
    ]
    with pytest.raises(ValidationError):
        RecordEventsBatchRequest(events=entries)


# ── Async client ──────────────────────────────────────────────────────────────


@pytest.mark.anyio
async def test_async_record_events_batch(base_url: str, httpx_mock: HTTPXMock) -> None:
    """Async record_events_batch posts correctly and returns response."""
    httpx_mock.add_response(
        url=f"{base_url}/api/record-events-batch/",
        json=BATCH_RESPONSE,
        status_code=202,
    )

    async with AsyncSoroScanClient(base_url=base_url) as client:
        result = await client.record_events_batch(ENTRIES)

    assert isinstance(result, RecordEventsBatchResponse)
    assert result.status == "submitted"
    assert result.total_events == 3


@pytest.mark.anyio
async def test_async_record_events_batch_error_propagation(
    base_url: str, httpx_mock: HTTPXMock
) -> None:
    """Async client propagates API errors from batch endpoint."""
    from soroscan.exceptions import SoroScanValidationError

    httpx_mock.add_response(
        url=f"{base_url}/api/record-events-batch/",
        json={"error": "Batch too large"},
        status_code=400,
    )

    async with AsyncSoroScanClient(base_url=base_url) as client:
        with pytest.raises(SoroScanValidationError):
            await client.record_events_batch(ENTRIES)
