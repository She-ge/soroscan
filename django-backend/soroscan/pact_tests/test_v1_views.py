"""Unit tests for the public v1 API shim used by Pact contracts."""

import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from soroscan.ingest.tests.factories import ContractEventFactory, TrackedContractFactory
from soroscan.pact_provider import PACT_CONTRACT_ID


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
class TestV1ApiViews:
    def test_list_events_returns_sdk_shape(self, api_client):
        contract = TrackedContractFactory(contract_id=PACT_CONTRACT_ID)
        ContractEventFactory(contract=contract, event_type="transfer")

        response = api_client.get(reverse("v1-events"), {"first": 5})

        assert response.status_code == status.HTTP_200_OK
        assert "items" in response.data
        assert "pageInfo" in response.data
        assert "totalCount" in response.data
        assert response.data["totalCount"] >= 1
        assert response.data["items"][0]["type"] == "transfer"

    def test_list_events_paginates_forward_after_cursor(self, api_client):
        contract = TrackedContractFactory(contract_id=PACT_CONTRACT_ID)
        for ledger in (101, 102, 103):
            ContractEventFactory(
                contract=contract,
                event_type="transfer",
                ledger=ledger,
                event_index=0,
            )

        first_page = api_client.get(reverse("v1-events"), {"first": 2})
        second_page = api_client.get(
            reverse("v1-events"),
            {"first": 2, "after": first_page.data["pageInfo"]["endCursor"]},
        )

        assert [item["pagingToken"] for item in first_page.data["items"]] == [
            "103-0",
            "102-0",
        ]
        assert first_page.data["pageInfo"]["hasNextPage"] is True
        assert first_page.data["pageInfo"]["hasPreviousPage"] is False
        assert [item["pagingToken"] for item in second_page.data["items"]] == ["101-0"]
        assert second_page.data["pageInfo"]["hasNextPage"] is False
        assert second_page.data["pageInfo"]["hasPreviousPage"] is True
        assert second_page.data["totalCount"] == 3

    def test_list_events_filters_before_cursor_and_reports_page_boundaries(
        self, api_client
    ):
        contract = TrackedContractFactory(contract_id=PACT_CONTRACT_ID)
        for ledger in (101, 102, 103):
            ContractEventFactory(
                contract=contract,
                event_type="transfer",
                ledger=ledger,
                event_index=0,
            )

        response = api_client.get(reverse("v1-events"), {"first": 1, "before": "102-0"})

        assert [item["pagingToken"] for item in response.data["items"]] == ["103-0"]
        assert response.data["pageInfo"]["hasPreviousPage"] is False
        assert response.data["pageInfo"]["hasNextPage"] is True

        after_oldest = api_client.get(
            reverse("v1-events"), {"first": 1, "after": "101-0"}
        )
        assert after_oldest.data["items"] == []
        assert after_oldest.data["pageInfo"]["hasPreviousPage"] is True
        assert after_oldest.data["pageInfo"]["hasNextPage"] is False

        before_newest = api_client.get(
            reverse("v1-events"), {"first": 1, "before": "103-0"}
        )
        assert before_newest.data["items"] == []
        assert before_newest.data["pageInfo"]["hasPreviousPage"] is False
        assert before_newest.data["pageInfo"]["hasNextPage"] is True

    def test_list_events_rejects_malformed_cursor(self, api_client):
        response = api_client.get(reverse("v1-events"), {"after": "invalid"})

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data == {"error": "Invalid after cursor"}

    def test_get_contract_returns_sdk_shape(self, api_client):
        TrackedContractFactory(contract_id=PACT_CONTRACT_ID, name="SDK Contract")

        response = api_client.get(
            reverse("v1-contract-detail", kwargs={"contract_id": PACT_CONTRACT_ID})
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == PACT_CONTRACT_ID
        assert response.data["label"] == "SDK Contract"

    def test_get_contract_not_found(self, api_client):
        missing_id = "C" + "B" * 55
        response = api_client.get(
            reverse("v1-contract-detail", kwargs={"contract_id": missing_id})
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
