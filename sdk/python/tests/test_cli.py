"""Tests for the SoroScan CLI."""

import json

from pytest_httpx import HTTPXMock

from soroscan.cli import main


def test_events_json_output(
    base_url: str,
    sample_event_data: dict,
    sample_paginated_response: dict,
    httpx_mock: HTTPXMock,
    capsys,
) -> None:
    response_data = sample_paginated_response.copy()
    response_data["results"] = [sample_event_data]
    httpx_mock.add_response(
        url=(
            f"{base_url}/api/events/?page=1&page_size=10&ordering=-timestamp"
            "&contract__contract_id=CCAAA111222333444555666777888999AAABBBCCCDDDEEEFFF"
            "&event_type=transfer"
        ),
        json=response_data,
    )

    exit_code = main(
        [
            "--base-url",
            base_url,
            "events",
            "--contract",
            "CCAAA111222333444555666777888999AAABBBCCCDDDEEEFFF",
            "--event-type",
            "transfer",
            "--limit",
            "10",
            "--output",
            "json",
        ]
    )

    assert exit_code == 0
    data = json.loads(capsys.readouterr().out)
    assert data[0]["event_type"] == "transfer"


def test_events_table_output(
    base_url: str,
    sample_event_data: dict,
    sample_paginated_response: dict,
    httpx_mock: HTTPXMock,
    capsys,
) -> None:
    response_data = sample_paginated_response.copy()
    response_data["results"] = [sample_event_data]
    httpx_mock.add_response(
        url=f"{base_url}/api/events/?page=1&page_size=1&ordering=-timestamp",
        json=response_data,
    )

    exit_code = main(["--base-url", base_url, "events", "--limit", "1"])

    assert exit_code == 0
    output = capsys.readouterr().out
    assert "event_type" in output
    assert "transfer" in output


def test_webhooks_list_json(
    base_url: str,
    sample_webhook_data: dict,
    sample_paginated_response: dict,
    httpx_mock: HTTPXMock,
    capsys,
) -> None:
    response_data = sample_paginated_response.copy()
    response_data["results"] = [sample_webhook_data]
    httpx_mock.add_response(
        url=f"{base_url}/api/webhooks/?page=1&page_size=50",
        json=response_data,
    )

    exit_code = main(
        ["--base-url", base_url, "webhooks", "list", "--output", "json"]
    )

    assert exit_code == 0
    data = json.loads(capsys.readouterr().out)
    assert data[0]["target_url"] == "https://example.com/webhook"


def test_webhooks_test_table(
    base_url: str,
    httpx_mock: HTTPXMock,
    capsys,
) -> None:
    httpx_mock.add_response(
        url=f"{base_url}/api/webhooks/1/test/",
        json={"status": "test_webhook_queued"},
    )

    exit_code = main(["--base-url", base_url, "webhooks", "test", "1"])

    assert exit_code == 0
    assert "test_webhook_queued" in capsys.readouterr().out


def test_contracts_list_table(
    base_url: str,
    sample_contract_data: dict,
    sample_paginated_response: dict,
    httpx_mock: HTTPXMock,
    capsys,
) -> None:
    response_data = sample_paginated_response.copy()
    response_data["results"] = [sample_contract_data]
    httpx_mock.add_response(
        url=f"{base_url}/api/contracts/?page=1&page_size=50",
        json=response_data,
    )

    exit_code = main(["--base-url", base_url, "contracts", "list"])

    assert exit_code == 0
    assert "Test Token" in capsys.readouterr().out


def test_contracts_get_json(
    base_url: str,
    sample_contract_data: dict,
    httpx_mock: HTTPXMock,
    capsys,
) -> None:
    httpx_mock.add_response(
        url=f"{base_url}/api/contracts/1/",
        json=sample_contract_data,
    )

    exit_code = main(
        ["--base-url", base_url, "contracts", "get", "1", "--output", "json"]
    )

    assert exit_code == 0
    data = json.loads(capsys.readouterr().out)
    assert data["name"] == "Test Token"
