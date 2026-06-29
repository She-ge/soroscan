import pytest
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from soroscan.ingest.tests.factories import (
    ContractEventFactory,
    TrackedContractFactory,
)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()


@pytest.mark.django_db
class TestEventTypeStatisticsEndpoint:
    def test_endpoint_returns_event_type_distribution_for_contract(self, api_client):
        contract = TrackedContractFactory()

        ContractEventFactory(contract=contract, event_type="transfer")
        ContractEventFactory(contract=contract, event_type="transfer")
        ContractEventFactory(contract=contract, event_type="swap")

        url = reverse("event-type-statistics")
        response = api_client.get(url, {"contract_id": contract.contract_id})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["contract_id"] == contract.contract_id
        assert response.data["total_events"] == 3

        counts = {
            item["event_type"]: item["count"]
            for item in response.data["event_types"]
        }

        assert counts["transfer"] == 2
        assert counts["swap"] == 1

    def test_endpoint_filters_by_contract(self, api_client):
        contract = TrackedContractFactory()
        other_contract = TrackedContractFactory()

        ContractEventFactory(contract=contract, event_type="transfer")
        ContractEventFactory(contract=contract, event_type="transfer")
        ContractEventFactory(contract=other_contract, event_type="mint")

        url = reverse("event-type-statistics")
        response = api_client.get(url, {"contract_id": contract.contract_id})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_events"] == 2

        returned_contract_ids = {
            item["contract_id"]
            for item in response.data["event_types"]
        }

        assert returned_contract_ids == {contract.contract_id}

    def test_endpoint_returns_global_distribution_without_contract_filter(self, api_client):
        contract = TrackedContractFactory()
        other_contract = TrackedContractFactory()

        ContractEventFactory(contract=contract, event_type="transfer")
        ContractEventFactory(contract=other_contract, event_type="mint")

        url = reverse("event-type-statistics")
        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["contract_id"] is None
        assert response.data["total_events"] == 2
        assert len(response.data["event_types"]) == 2

    def test_endpoint_returns_404_for_unknown_contract(self, api_client):
        url = reverse("event-type-statistics")
        response = api_client.get(url, {"contract_id": "C" + "Z" * 55})

        assert response.status_code == status.HTTP_404_NOT_FOUND