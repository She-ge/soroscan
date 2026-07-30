"""Tests for SC-24: tagged event submission."""

import json

import pytest
from pydantic import ValidationError
from pytest_httpx import HTTPXMock

from soroscan import AsyncSoroScanClient, SoroScanClient
from soroscan.models import (
    MAX_TAGS,
    TaggedEventRequest,
    TaggedEventResponse,
)


# ── Constants ─────────────────────────────────────────────────────────────────

CONTRACT_ID = "CCAAA111222333444555666777888999AAABBBCCCDDDEEEFFF"
PAYLOAD_HASH = "a" * 64
TAGS = ["defi", "token"]

TAGGED_RESPONSE = {
    "status": "submitted",
    "tx_hash": "txabcdef",
    "transaction_status": "PENDING",
    "error": None,
    "tags": TAGS,
}


# ── Model validation ──────────────────────────────────────────────────────────


def test_tagged_event_request_default_tags() -> None:
    """Tags default to an empty list when not provided."""
    req = TaggedEventRequest(
        contract_id=CONTRACT_ID,
        event_type="transfer",
        payload_hash=PAYLOAD_HASH,
    )
    assert req.tags == []


def test_tagged_event_request_with_tags() -> None:
    req = TaggedEventRequest(
        contract_id=CONTRACT_ID,
        event_type="transfer",
        payload_hash=PAYLOAD_HASH,
        tags=["defi", "token"],
    )
    assert req.tags == ["defi", "token"]


def test_tagged_event_request_max_tags_accepted() -> None:
    """Exactly MAX_TAGS tags should be accepted."""
    req = TaggedEventRequest(
        contract_id=CONTRACT_ID,
        event_type="swap",
        payload_hash=PAYLOAD_HASH,
        tags=["a", "b", "c", "d"],  # MAX_TAGS == 4
    )
    assert len(req.tags) == MAX_TAGS


def test_tagged_event_request_rejects_too_many_tags() -> None:
    """More than MAX_TAGS tags must raise ValidationError."""
    with pytest.raises(ValidationError):
        TaggedEventRequest(
            contract_id=CONTRACT_ID,
            event_type="swap",
            payload_hash=PAYLOAD_HASH,
            tags=["a", "b", "c", "d", "e"],  # 5 > MAX_TAGS
        )


def test_tagged_event_response_model() -> None:
    resp = TaggedEventResponse.model_validate(TAGGED_RESPONSE)
    assert resp.status == "submitted"
    assert resp.tx_hash == "txabcdef"
    assert resp.tags == TAGS


# ── Sync client ───────────────────────────────────────────────────────────────


def test_record_tagged_event_posts_to_correct_url(
    base_url: str, httpx_mock: HTTPXMock
) -> None:
    """record_tagged_event posts to /api/record/tagged/ and returns TaggedEventResponse."""
    httpx_mock.add_response(
        url=f"{base_url}/api/record/tagged/",
        json=TAGGED_RESPONSE,
        status_code=202,
    )

    with SoroScanClient(base_url=base_url) as client:
        result = client.record_tagged_event(
            contract_id=CONTRACT_ID,
            event_type="transfer",
            payload_hash=PAYLOAD_HASH,
            tags=TAGS,
        )

    assert isinstance(result, TaggedEventResponse)
    assert result.status == "submitted"
    assert result.tx_hash == "txabcdef"
    assert result.tags == TAGS


def test_record_tagged_event_serializes_payload(
    base_url: str, httpx_mock: HTTPXMock
) -> None:
    """The request body contains all fields including tags."""
    httpx_mock.add_response(
        url=f"{base_url}/api/record/tagged/",
        json=TAGGED_RESPONSE,
        status_code=202,
    )

    with SoroScanClient(base_url=base_url) as client:
        client.record_tagged_event(
            contract_id=CONTRACT_ID,
            event_type="mint",
            payload_hash=PAYLOAD_HASH,
            tags=["nft", "collection"],
        )

    request = httpx_mock.get_requests()[0]
    body = json.loads(request.content)
    assert body == {
        "contract_id": CONTRACT_ID,
        "event_type": "mint",
        "payload_hash": PAYLOAD_HASH,
        "tags": ["nft", "collection"],
    }


def test_record_tagged_event_empty_tags(
    base_url: str, httpx_mock: HTTPXMock
) -> None:
    """Empty tag list is accepted and serialized correctly."""
    httpx_mock.add_response(
        url=f"{base_url}/api/record/tagged/",
        json={**TAGGED_RESPONSE, "tags": []},
        status_code=202,
    )

    with SoroScanClient(base_url=base_url) as client:
        result = client.record_tagged_event(
            contract_id=CONTRACT_ID,
            event_type="burn",
            payload_hash=PAYLOAD_HASH,
        )

    request = httpx_mock.get_requests()[0]
    body = json.loads(request.content)
    assert body["tags"] == []
    assert result.tags == []


def test_record_tagged_event_default_none_tags(
    base_url: str, httpx_mock: HTTPXMock
) -> None:
    """Passing tags=None uses an empty list internally."""
    httpx_mock.add_response(
        url=f"{base_url}/api/record/tagged/",
        json={**TAGGED_RESPONSE, "tags": []},
        status_code=202,
    )

    with SoroScanClient(base_url=base_url) as client:
        result = client.record_tagged_event(
            contract_id=CONTRACT_ID,
            event_type="swap",
            payload_hash=PAYLOAD_HASH,
            tags=None,
        )

    assert result.tags == []


def test_record_tagged_event_error_propagation(
    base_url: str, httpx_mock: HTTPXMock
) -> None:
    """API errors (400) are surfaced as SoroScanValidationError."""
    from soroscan.exceptions import SoroScanValidationError

    httpx_mock.add_response(
        url=f"{base_url}/api/record/tagged/",
        json={"error": "Too many tags"},
        status_code=400,
    )

    with SoroScanClient(base_url=base_url) as client:
        with pytest.raises(SoroScanValidationError):
            client.record_tagged_event(
                contract_id=CONTRACT_ID,
                event_type="swap",
                payload_hash=PAYLOAD_HASH,
                tags=TAGS,
            )


def test_record_tagged_event_auth_header(
    base_url: str, httpx_mock: HTTPXMock
) -> None:
    """The Authorization header is included when an API key is set."""
    httpx_mock.add_response(
        url=f"{base_url}/api/record/tagged/",
        json=TAGGED_RESPONSE,
        status_code=202,
    )
    client = SoroScanClient(base_url=base_url, api_key="secret-key")
    client.record_tagged_event(
        contract_id=CONTRACT_ID,
        event_type="transfer",
        payload_hash=PAYLOAD_HASH,
        tags=TAGS,
    )
    client.close()

    request = httpx_mock.get_requests()[0]
    assert request.headers["Authorization"] == "Bearer secret-key"


# ── Async client ──────────────────────────────────────────────────────────────


@pytest.mark.anyio
async def test_async_record_tagged_event(
    base_url: str, httpx_mock: HTTPXMock
) -> None:
    """Async record_tagged_event posts correctly and returns TaggedEventResponse."""
    httpx_mock.add_response(
        url=f"{base_url}/api/record/tagged/",
        json=TAGGED_RESPONSE,
        status_code=202,
    )

    async with AsyncSoroScanClient(base_url=base_url) as client:
        result = await client.record_tagged_event(
            contract_id=CONTRACT_ID,
            event_type="transfer",
            payload_hash=PAYLOAD_HASH,
            tags=TAGS,
        )

    assert isinstance(result, TaggedEventResponse)
    assert result.status == "submitted"
    assert result.tx_hash == "txabcdef"
    assert result.tags == TAGS


@pytest.mark.anyio
async def test_async_record_tagged_event_serializes_payload(
    base_url: str, httpx_mock: HTTPXMock
) -> None:
    """Async client serializes tags correctly in the request body."""
    httpx_mock.add_response(
        url=f"{base_url}/api/record/tagged/",
        json=TAGGED_RESPONSE,
        status_code=202,
    )

    async with AsyncSoroScanClient(base_url=base_url) as client:
        await client.record_tagged_event(
            contract_id=CONTRACT_ID,
            event_type="swap",
            payload_hash=PAYLOAD_HASH,
            tags=["dex", "liquidity"],
        )

    request = httpx_mock.get_requests()[0]
    body = json.loads(request.content)
    assert body["tags"] == ["dex", "liquidity"]


@pytest.mark.anyio
async def test_async_record_tagged_event_empty_tags(
    base_url: str, httpx_mock: HTTPXMock
) -> None:
    """Async client accepts empty tags."""
    httpx_mock.add_response(
        url=f"{base_url}/api/record/tagged/",
        json={**TAGGED_RESPONSE, "tags": []},
        status_code=202,
    )

    async with AsyncSoroScanClient(base_url=base_url) as client:
        result = await client.record_tagged_event(
            contract_id=CONTRACT_ID,
            event_type="burn",
            payload_hash=PAYLOAD_HASH,
        )

    assert result.tags == []


@pytest.mark.anyio
async def test_async_record_tagged_event_error_propagation(
    base_url: str, httpx_mock: HTTPXMock
) -> None:
    """Async client surfaces 400 errors as SoroScanValidationError."""
    from soroscan.exceptions import SoroScanValidationError

    httpx_mock.add_response(
        url=f"{base_url}/api/record/tagged/",
        json={"error": "Invalid payload"},
        status_code=400,
    )

    async with AsyncSoroScanClient(base_url=base_url) as client:
        with pytest.raises(SoroScanValidationError):
            await client.record_tagged_event(
                contract_id=CONTRACT_ID,
                event_type="transfer",
                payload_hash=PAYLOAD_HASH,
                tags=TAGS,
            )
