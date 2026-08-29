"""Integration coverage for the SC-23 multi-contract event endpoint."""

import pytest
from django.urls import reverse
from rest_framework import status

from .factories import ContractEventFactory, TrackedContractFactory


@pytest.mark.django_db
class TestEventsByContracts:
    def test_returns_only_requested_contracts_in_ledger_order(self, authenticated_client, user):
        first = TrackedContractFactory(owner=user)
        second = TrackedContractFactory(owner=user)
        excluded = TrackedContractFactory(owner=user)
        ContractEventFactory(contract=first, ledger=20, event_type="transfer")
        ContractEventFactory(contract=second, ledger=10, event_type="transfer")
        ContractEventFactory(contract=excluded, ledger=30, event_type="transfer")

        response = authenticated_client.post(
            reverse("event-by-contracts"),
            {"contract_ids": [first.contract_id, second.contract_id], "ordering": "ledger"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 2
        assert [event["ledger"] for event in response.data["results"]] == [10, 20]
        assert response.data["contract_ids"] == [first.contract_id, second.contract_id]

    def test_rejects_empty_and_oversized_contract_lists(self, authenticated_client):
        url = reverse("event-by-contracts")
        assert authenticated_client.post(url, {"contract_ids": []}, format="json").status_code == status.HTTP_400_BAD_REQUEST
        response = authenticated_client.post(url, {"contract_ids": ["C" + "A" * 55] * 11}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
