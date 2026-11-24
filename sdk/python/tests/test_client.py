"""Tests for synchronous SoroScan client."""

import httpx
import pytest
from pytest_httpx import HTTPXMock

from soroscan import AsyncSoroScanClient, SoroScanClient
from soroscan.exceptions import (
    SoroScanAuthError,
    SoroScanNotFoundError,
    SoroScanRateLimitError,
    SoroScanServerError,
    SoroScanValidationError,
)
from soroscan.models import ContractEvent, ContractStats, TrackedContract, WebhookSubscription


def test_client_initialization(base_url: str, api_key: str) -> None:
    """Test client initialization."""
    client = SoroScanClient(base_url=base_url, api_key=api_key, timeout=60.0)
    assert client.base_url == base_url
    assert client.api_key == api_key
    assert client.timeout == 60.0
    client.close()


def test_client_default_max_retries(base_url: str) -> None:
    """Test that max_retries defaults to 3."""
    with SoroScanClient(base_url=base_url) as client:
        assert client.max_retries == 3


def test_client_custom_max_retries(base_url: str) -> None:
    """Test that max_retries can be configured."""
    with SoroScanClient(base_url=base_url, max_retries=5) as client:
        assert client.max_retries == 5


@pytest.mark.parametrize("status_code", [502, 503, 504])
def test_client_retries_transient_gateway_errors(
    base_url: str,
    sample_contract_data: dict,
    httpx_mock: HTTPXMock,
    monkeypatch: pytest.MonkeyPatch,
    status_code: int,
) -> None:
    """Test that transient gateway errors are retried up to max_retries."""
    url = f"{base_url}/api/contracts/1/"
    httpx_mock.add_response(url=url, status_code=status_code)
    httpx_mock.add_response(url=url, status_code=status_code)
    httpx_mock.add_response(url=url, json=sample_contract_data)
    monkeypatch.setattr("soroscan.client.random.uniform", lambda _start, _end: 0.0)

    with SoroScanClient(base_url=base_url, max_retries=3) as client:
        contract = client.get_contract("1")

        assert isinstance(contract, TrackedContract)
        assert contract.id == 1

    assert len(httpx_mock.get_requests()) == 3


def test_client_retries_exhausted_raises(
    base_url: str,
    httpx_mock: HTTPXMock,
) -> None:
    """Test that exhausting retries on 503 surfaces the error."""
    url = f"{base_url}/api/contracts/1/"
    for _ in range(4):
        httpx_mock.add_response(url=url, status_code=503)

    with SoroScanClient(base_url=base_url, max_retries=3) as client:
        with pytest.raises(SoroScanServerError):
            client.get_contract("1")

    assert len(httpx_mock.get_requests()) == 4


def test_client_does_not_retry_4xx(
    base_url: str,
    httpx_mock: HTTPXMock,
) -> None:
    """Test that 4xx client errors are not retried."""
    url = f"{base_url}/api/contracts/1/"
    httpx_mock.add_response(url=url, status_code=404, json={"detail": "Not found"})

    with SoroScanClient(base_url=base_url, max_retries=3) as client:
        with pytest.raises(SoroScanNotFoundError):
            client.get_contract("1")

    assert len(httpx_mock.get_requests()) == 1


def test_client_does_not_retry_other_5xx(
    base_url: str,
    httpx_mock: HTTPXMock,
) -> None:
    """Test that retries are limited to 502, 503, and 504."""
    httpx_mock.add_response(
        url=f"{base_url}/api/contracts/1/",
        status_code=500,
        json={"detail": "Server error"},
    )

    with SoroScanClient(base_url=base_url, max_retries=3) as client:
        with pytest.raises(SoroScanServerError):
            client.get_contract("1")

    assert len(httpx_mock.get_requests()) == 1


def test_client_retries_connection_errors(
    base_url: str,
    sample_contract_data: dict,
    httpx_mock: HTTPXMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test that connection errors are retried before a successful response."""
    url = f"{base_url}/api/contracts/1/"
    httpx_mock.add_exception(httpx.ConnectError("connection refused"), url=url)
    httpx_mock.add_response(url=url, json=sample_contract_data)
    monkeypatch.setattr("soroscan.client.random.uniform", lambda _start, _end: 0.0)

    with SoroScanClient(base_url=base_url, max_retries=1) as client:
        contract = client.get_contract("1")

    assert isinstance(contract, TrackedContract)
    assert len(httpx_mock.get_requests()) == 2


def test_client_uses_exponential_backoff(
    base_url: str,
    sample_contract_data: dict,
    httpx_mock: HTTPXMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test that retry delays use full jitter over exponential ceilings."""
    url = f"{base_url}/api/contracts/1/"
    httpx_mock.add_response(url=url, status_code=503)
    httpx_mock.add_response(url=url, status_code=503)
    httpx_mock.add_response(url=url, json=sample_contract_data)
    ceilings: list[float] = []
    delays: list[float] = []

    def midpoint(lower: float, upper: float) -> float:
        ceilings.append(upper)
        return (lower + upper) / 2

    monkeypatch.setattr("soroscan.client.random.uniform", midpoint)
    monkeypatch.setattr("soroscan.client.time.sleep", delays.append)

    with SoroScanClient(base_url=base_url, max_retries=2) as client:
        client.get_contract("1")

    assert ceilings == [0.25, 0.5]
    assert delays == [0.125, 0.25]


@pytest.mark.asyncio
@pytest.mark.parametrize("status_code", [502, 503, 504])
async def test_async_client_retries_transient_gateway_errors(
    base_url: str,
    sample_contract_data: dict,
    httpx_mock: HTTPXMock,
    monkeypatch: pytest.MonkeyPatch,
    status_code: int,
) -> None:
    """Test that async requests retry transient gateway errors."""
    url = f"{base_url}/api/contracts/1/"
    httpx_mock.add_response(url=url, status_code=status_code)
    httpx_mock.add_response(url=url, json=sample_contract_data)
    monkeypatch.setattr("soroscan.client.random.uniform", lambda _start, _end: 0.0)

    async with AsyncSoroScanClient(base_url=base_url, max_retries=1) as client:
        contract = await client.get_contract("1")

    assert isinstance(contract, TrackedContract)
    assert len(httpx_mock.get_requests()) == 2


@pytest.mark.asyncio
async def test_async_client_uses_exponential_backoff(
    base_url: str,
    sample_contract_data: dict,
    httpx_mock: HTTPXMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test that async retry delays use exponential backoff."""
    url = f"{base_url}/api/contracts/1/"
    httpx_mock.add_response(url=url, status_code=503)
    httpx_mock.add_response(url=url, status_code=503)
    httpx_mock.add_response(url=url, json=sample_contract_data)
    ceilings: list[float] = []
    delays: list[float] = []

    def midpoint(lower: float, upper: float) -> float:
        ceilings.append(upper)
        return (lower + upper) / 2

    async def record_delay(delay: float) -> None:
        delays.append(delay)

    monkeypatch.setattr("soroscan.client.random.uniform", midpoint)
    monkeypatch.setattr("soroscan.client.asyncio.sleep", record_delay)

    async with AsyncSoroScanClient(base_url=base_url, max_retries=2) as client:
        await client.get_contract("1")

    assert ceilings == [0.25, 0.5]
    assert delays == [0.125, 0.25]


@pytest.mark.asyncio
async def test_async_client_retries_connection_errors(
    base_url: str,
    sample_contract_data: dict,
    httpx_mock: HTTPXMock,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Test that async connection errors are retried."""
    url = f"{base_url}/api/contracts/1/"
    httpx_mock.add_exception(httpx.ConnectError("connection refused"), url=url)
    httpx_mock.add_response(url=url, json=sample_contract_data)
    monkeypatch.setattr("soroscan.client.random.uniform", lambda _start, _end: 0.0)

    async with AsyncSoroScanClient(base_url=base_url, max_retries=1) as client:
        contract = await client.get_contract("1")

    assert isinstance(contract, TrackedContract)
    assert len(httpx_mock.get_requests()) == 2


@pytest.mark.asyncio
async def test_async_client_does_not_retry_4xx(
    base_url: str,
    httpx_mock: HTTPXMock,
) -> None:
    """Test that async requests do not retry client errors."""
    httpx_mock.add_response(
        url=f"{base_url}/api/contracts/1/",
        status_code=404,
        json={"detail": "Not found"},
    )

    async with AsyncSoroScanClient(base_url=base_url, max_retries=3) as client:
        with pytest.raises(SoroScanNotFoundError):
            await client.get_contract("1")

    assert len(httpx_mock.get_requests()) == 1


def test_client_context_manager(base_url: str) -> None:
    """Test client as context manager."""
    with SoroScanClient(base_url=base_url) as client:
        assert client.base_url == base_url


def test_get_contracts(
    base_url: str,
    sample_contract_data: dict,
    sample_paginated_response: dict,
    httpx_mock: HTTPXMock,
) -> None:
    """Test listing contracts."""
    response_data = sample_paginated_response.copy()
    response_data["results"] = [sample_contract_data]

    httpx_mock.add_response(
        url=f"{base_url}/api/contracts/?page=1&page_size=50",
        json=response_data,
    )

    with SoroScanClient(base_url=base_url) as client:
        result = client.get_contracts()

        assert result.count == 100
        assert len(result.results) == 1
        assert isinstance(result.results[0], TrackedContract)
        assert result.results[0].name == "Test Token"


def test_get_contract(
    base_url: str,
    sample_contract_data: dict,
    httpx_mock: HTTPXMock,
) -> None:
    """Test getting a specific contract."""
    httpx_mock.add_response(
        url=f"{base_url}/api/contracts/1/",
        json=sample_contract_data,
    )

    with SoroScanClient(base_url=base_url) as client:
        contract = client.get_contract("1")

        assert isinstance(contract, TrackedContract)
        assert contract.id == 1
        assert contract.name == "Test Token"
        assert contract.event_count == 42


def test_create_contract(
    base_url: str,
    sample_contract_data: dict,
    httpx_mock: HTTPXMock,
) -> None:
    """Test creating a new contract."""
    httpx_mock.add_response(
        url=f"{base_url}/api/contracts/",
        json=sample_contract_data,
        status_code=201,
    )

    with SoroScanClient(base_url=base_url) as client:
        contract = client.create_contract(
            contract_id="CCAAA111222333444555666777888999AAABBBCCCDDDEEEFFF",
            name="Test Token",
            description="A test token contract",
        )

        assert isinstance(contract, TrackedContract)
        assert contract.name == "Test Token"


def test_update_contract(
    base_url: str,
    sample_contract_data: dict,
    httpx_mock: HTTPXMock,
) -> None:
    """Test updating a contract."""
    updated_data = sample_contract_data.copy()
    updated_data["name"] = "Updated Token"

    httpx_mock.add_response(
        url=f"{base_url}/api/contracts/1/",
        json=updated_data,
    )

    with SoroScanClient(base_url=base_url) as client:
        contract = client.update_contract("1", name="Updated Token")

        assert contract.name == "Updated Token"


def test_delete_contract(
    base_url: str,
    httpx_mock: HTTPXMock,
) -> None:
    """Test deleting a contract."""
    httpx_mock.add_response(
        url=f"{base_url}/api/contracts/1/",
        status_code=204,
    )

    with SoroScanClient(base_url=base_url) as client:
        client.delete_contract("1")


def test_get_contract_stats(
    base_url: str,
    httpx_mock: HTTPXMock,
) -> None:
    """Test getting contract statistics."""
    stats_data = {
        "contract_id": "CCAAA111222333444555666777888999AAABBBCCCDDDEEEFFF",
        "name": "Test Token",
        "total_events": 100,
        "unique_event_types": 5,
        "latest_ledger": 100000,
        "last_activity": "2026-01-01T12:00:00Z",
    }

    httpx_mock.add_response(
        url=f"{base_url}/api/contracts/1/stats/",
        json=stats_data,
    )

    with SoroScanClient(base_url=base_url) as client:
        stats = client.get_contract_stats("1")

        assert isinstance(stats, ContractStats)
        assert stats.total_events == 100
        assert stats.unique_event_types == 5


def test_get_events(
    base_url: str,
    sample_event_data: dict,
    sample_paginated_response: dict,
    httpx_mock: HTTPXMock,
) -> None:
    """Test querying events."""
    response_data = sample_paginated_response.copy()
    response_data["results"] = [sample_event_data]

    httpx_mock.add_response(
        url=(
            f"{base_url}/api/events/?page=1&page_size=50&ordering=-timestamp"
            "&contract__contract_id=CCAAA111222333444555666777888999AAABBBCCCDDDEEEFFF"
            "&event_type=transfer"
        ),
        json=response_data,
    )

    with SoroScanClient(base_url=base_url) as client:
        result = client.get_events(
            contract_id="CCAAA111222333444555666777888999AAABBBCCCDDDEEEFFF",
            event_type="transfer",
        )

        assert result.count == 100
        assert len(result.results) == 1
        assert isinstance(result.results[0], ContractEvent)
        assert result.results[0].event_type == "transfer"


def test_get_event(
    base_url: str,
    sample_event_data: dict,
    httpx_mock: HTTPXMock,
) -> None:
    """Test getting a specific event."""
    httpx_mock.add_response(
        url=f"{base_url}/api/events/1/",
        json=sample_event_data,
    )

    with SoroScanClient(base_url=base_url) as client:
        event = client.get_event(1)

        assert isinstance(event, ContractEvent)
        assert event.id == 1
        assert event.event_type == "transfer"


def test_record_event(
    base_url: str,
    httpx_mock: HTTPXMock,
) -> None:
    """Test recording a new event."""
    response_data = {
        "status": "submitted",
        "tx_hash": "tx123456",
        "transaction_status": "pending",
        "error": None,
    }

    httpx_mock.add_response(
        url=f"{base_url}/api/record-event/",
        json=response_data,
        status_code=202,
    )

    with SoroScanClient(base_url=base_url) as client:
        result = client.record_event(
            contract_id="CCAAA111222333444555666777888999AAABBBCCCDDDEEEFFF",
            event_type="transfer",
            payload_hash="abc123def456",
        )

        assert result.status == "submitted"
        assert result.tx_hash == "tx123456"


def test_get_webhooks(
    base_url: str,
    sample_webhook_data: dict,
    sample_paginated_response: dict,
    httpx_mock: HTTPXMock,
) -> None:
    """Test listing webhooks."""
    response_data = sample_paginated_response.copy()
    response_data["results"] = [sample_webhook_data]

    httpx_mock.add_response(
        url=f"{base_url}/api/webhooks/?page=1&page_size=50",
        json=response_data,
    )

    with SoroScanClient(base_url=base_url) as client:
        result = client.get_webhooks()

        assert result.count == 100
        assert len(result.results) == 1
        assert isinstance(result.results[0], WebhookSubscription)


def test_create_webhook(
    base_url: str,
    sample_webhook_data: dict,
    httpx_mock: HTTPXMock,
) -> None:
    """Test creating a webhook."""
    httpx_mock.add_response(
        url=f"{base_url}/api/webhooks/",
        json=sample_webhook_data,
        status_code=201,
    )

    with SoroScanClient(base_url=base_url) as client:
        webhook = client.create_webhook(
            contract_id=1,
            target_url="https://example.com/webhook",
            event_type="transfer",
        )

        assert isinstance(webhook, WebhookSubscription)
        assert webhook.target_url == "https://example.com/webhook"


def test_test_webhook(
    base_url: str,
    httpx_mock: HTTPXMock,
) -> None:
    """Test sending a test webhook."""
    httpx_mock.add_response(
        url=f"{base_url}/api/webhooks/1/test/",
        json={"status": "sent"},
        status_code=200,
    )

    with SoroScanClient(base_url=base_url) as client:
        result = client.test_webhook(1)

        assert result["status"] == "sent"


def test_auth_error(
    base_url: str,
    httpx_mock: HTTPXMock,
) -> None:
    """Test authentication error handling."""
    httpx_mock.add_response(
        url=f"{base_url}/api/contracts/1/",
        status_code=401,
        json={"detail": "Invalid API key"},
    )

    with SoroScanClient(base_url=base_url, api_key="bad-key") as client:
        with pytest.raises(SoroScanAuthError):
            client.get_contract("1")


def test_not_found_error(
    base_url: str,
    httpx_mock: HTTPXMock,
) -> None:
    """Test not found error handling."""
    httpx_mock.add_response(
        url=f"{base_url}/api/contracts/999/",
        status_code=404,
        json={"detail": "Not found"},
    )

    with SoroScanClient(base_url=base_url) as client:
        with pytest.raises(SoroScanNotFoundError):
            client.get_contract("999")


def test_validation_error(
    base_url: str,
    httpx_mock: HTTPXMock,
) -> None:
    """Test validation error handling."""
    httpx_mock.add_response(
        url=f"{base_url}/api/contracts/",
        status_code=400,
        json={"name": ["This field is required."]},
    )

    with SoroScanClient(base_url=base_url) as client:
        with pytest.raises(SoroScanValidationError):
            client.create_contract(contract_id="invalid", name="Invalid contract")


def test_rate_limit_error(
    base_url: str,
    httpx_mock: HTTPXMock,
) -> None:
    """Test rate limit error handling."""
    httpx_mock.add_response(
        url=f"{base_url}/api/contracts/1/",
        status_code=429,
        json={"detail": "Rate limit exceeded"},
    )

    with SoroScanClient(base_url=base_url) as client:
        with pytest.raises(SoroScanRateLimitError):
            client.get_contract("1")
