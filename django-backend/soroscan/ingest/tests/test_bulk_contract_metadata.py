"""
Tests for bulk contract metadata endpoint (issue #1008).
"""
import pytest
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from soroscan.ingest.models import ContractMetadata, TrackedContract


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(username="bulk_meta_user", password="password")


@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def contracts(db, user):
    c1 = TrackedContract.objects.create(
        contract_id="C" + "A" * 55,
        name="Contract One",
        owner=user,
    )
    c2 = TrackedContract.objects.create(
        contract_id="C" + "B" * 55,
        name="Contract Two",
        owner=user,
    )
    c3 = TrackedContract.objects.create(
        contract_id="C" + "C" * 55,
        name="Contract Three",
        owner=user,
    )
    return c1, c2, c3


@pytest.fixture
def metadata(contracts):
    c1, c2, c3 = contracts
    m1 = ContractMetadata.objects.create(
        contract=c1,
        name="Metadata One",
        description="First contract",
        tags=["defi", "token"],
        documentation_url="https://docs.example.com/1",
        github_repo="https://github.com/example/1",
        team_email="team1@example.com",
    )
    m2 = ContractMetadata.objects.create(
        contract=c2,
        name="Metadata Two",
        description="Second contract",
        tags=["nft"],
    )
    return m1, m2


@pytest.mark.django_db
class TestBulkContractMetadata:
    def test_returns_metadata_for_found_contracts(self, authenticated_client, metadata):
        m1, m2 = metadata
        url = reverse("bulk-contract-metadata")
        response = authenticated_client.post(
            url,
            {"contract_ids": [m1.contract.contract_id, m2.contract.contract_id]},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_found"] == 2
        assert response.data["total_missing"] == 0
        assert len(response.data["results"]) == 2
        assert len(response.data["missing"]) == 0

    def test_returns_missing_for_unknown_contracts(self, authenticated_client, metadata):
        m1, _ = metadata
        url = reverse("bulk-contract-metadata")
        response = authenticated_client.post(
            url,
            {"contract_ids": [m1.contract.contract_id, "C" + "Z" * 55]},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_found"] == 1
        assert response.data["total_missing"] == 1
        assert "C" + "Z" * 55 in response.data["missing"]

    def test_empty_results_when_no_ids_match(self, authenticated_client):
        url = reverse("bulk-contract-metadata")
        response = authenticated_client.post(
            url,
            {"contract_ids": ["C" + "X" * 55]},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["total_found"] == 0
        assert response.data["total_missing"] == 1

    def test_respects_max_limit(self, authenticated_client):
        url = reverse("bulk-contract-metadata")
        ids = ["C" + chr(65 + i) * 55 for i in range(51)]
        response = authenticated_client.post(
            url,
            {"contract_ids": ids},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_rejects_empty_list(self, authenticated_client):
        url = reverse("bulk-contract-metadata")
        response = authenticated_client.post(
            url,
            {"contract_ids": []},
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_requires_authentication(self, api_client):
        url = reverse("bulk-contract-metadata")
        response = api_client.post(
            url,
            {"contract_ids": ["C" + "A" * 55]},
            format="json",
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_metadata_fields_are_complete(self, authenticated_client, metadata):
        m1, _ = metadata
        url = reverse("bulk-contract-metadata")
        response = authenticated_client.post(
            url,
            {"contract_ids": [m1.contract.contract_id]},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        result = response.data["results"][0]
        assert result["contract_id"] == m1.contract.contract_id
        assert result["name"] == "Metadata One"
        assert result["description"] == "First contract"
        assert result["tags"] == ["defi", "token"]
        assert result["documentation_url"] == "https://docs.example.com/1"
        assert result["github_repo"] == "https://github.com/example/1"
        assert result["team_email"] == "team1@example.com"
