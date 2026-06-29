"""
End-to-end API workflow tests for critical user journeys (issue #519).

Each test mirrors a scenario in e2e-tests/scenarios.yaml and chains multiple
API calls to validate full workflows without external services.
"""
import csv
from io import StringIO

import pytest
import responses
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from soroscan.ingest.models import AuditLog, IngestError, TrackedContract, WebhookSubscription
from soroscan.ingest.tests.factories import ContractEventFactory, TrackedContractFactory

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
def test_e2e_user_signup_to_viewing_events(api_client):
    """Signup -> register contract -> view events."""
    user = User.objects.create_user(
        username="e2e_signup_user",
        email="e2e_signup@example.com",
        password="secret",
    )
    api_client.force_authenticate(user=user)

    contract_payload = {
        "contract_id": "C" + "A" * 55,
        "name": "E2E Onboarding Contract",
        "description": "Created during signup workflow",
        "is_active": True,
    }
    create_response = api_client.post(reverse("contract-list"), contract_payload)
    assert create_response.status_code == status.HTTP_201_CREATED

    contract = TrackedContract.objects.get(pk=create_response.data["id"])
    ContractEventFactory.create_batch(3, contract=contract, event_type="transfer")

    events_response = api_client.get(reverse("contract-events", args=[contract.id]))
    assert events_response.status_code == status.HTTP_200_OK
    assert len(events_response.data) == 3

    list_response = api_client.get(reverse("contract-list"))
    assert list_response.status_code == status.HTTP_200_OK
    assert any(item["id"] == contract.id for item in list_response.data["results"])


@pytest.mark.django_db
@responses.activate
def test_e2e_webhook_subscription_lifecycle(api_client):
    """Create webhook -> list -> test delivery -> delete."""
    user = User.objects.create_user(username="e2e_webhook_user", password="secret")
    contract = TrackedContractFactory(owner=user)
    api_client.force_authenticate(user=user)

    target_url = "https://example.com/e2e-webhook"
    create_response = api_client.post(
        reverse("webhook-list"),
        {
            "contract": contract.id,
            "event_type": "swap",
            "target_url": target_url,
            "is_active": True,
        },
    )
    assert create_response.status_code == status.HTTP_201_CREATED
    webhook_id = create_response.data["id"]

    list_response = api_client.get(reverse("webhook-list"))
    assert list_response.status_code == status.HTTP_200_OK
    assert any(item["id"] == webhook_id for item in list_response.data["results"])

    responses.add(responses.POST, target_url, status=200)
    test_response = api_client.post(reverse("webhook-test", args=[webhook_id]))
    assert test_response.status_code == status.HTTP_200_OK
    assert test_response.data["status"] == "test_webhook_queued"

    delete_response = api_client.delete(reverse("webhook-detail", args=[webhook_id]))
    assert delete_response.status_code == status.HTTP_204_NO_CONTENT
    assert not WebhookSubscription.objects.filter(pk=webhook_id).exists()


@pytest.mark.django_db
def test_e2e_compliance_data_export(api_client):
    """Staff user exports compliance audit trail CSV."""
    staff_user = User.objects.create_user(
        username="e2e_staff_exporter",
        password="secret",
        is_staff=True,
    )
    api_client.force_authenticate(user=staff_user)

    AuditLog.objects.create(
        user=staff_user,
        action="create",
        model_name="TrackedContract",
        object_id="1",
        ip_address="127.0.0.1",
        changes={"name": "E2E Contract"},
    )

    export_response = api_client.get(reverse("compliance-export"))
    assert export_response.status_code == status.HTTP_200_OK
    assert export_response["Content-Type"] == "text/csv"

    content = b"".join(export_response.streaming_content).decode("utf-8")
    rows = list(csv.reader(StringIO(content)))
    assert rows[0] == [
        "id",
        "timestamp",
        "user",
        "action",
        "model_name",
        "object_id",
        "ip_address",
        "changes",
    ]
    assert len(rows) >= 2
    assert rows[1][2] == staff_user.username


@pytest.mark.django_db
def test_e2e_admin_ingest_error_review(api_client):
    """Staff user reviews grouped ingest errors."""
    staff_user = User.objects.create_user(
        username="e2e_staff_admin",
        password="secret",
        is_staff=True,
    )
    api_client.force_authenticate(user=staff_user)

    IngestError.objects.create(
        error_type="decode_error",
        contract_id="C" + "B" * 55,
        error_message="Failed to decode XDR",
        ledger=1000,
    )
    IngestError.objects.create(
        error_type="decode_error",
        contract_id="C" + "B" * 55,
        error_message="Another decode error",
        ledger=1001,
    )

    response = api_client.get(reverse("admin-ingest-errors"))
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["count"] == 2
    assert data[0]["error_type"] == "decode_error"


def test_e2e_framework_files_exist():
    """Sanity check that the E2E scenario catalog is present."""
    from pathlib import Path

    repo_root = Path(__file__).resolve().parents[4]
    assert (repo_root / "e2e-tests/scenarios.yaml").is_file()
    assert (repo_root / "e2e-tests/scenarios.py").is_file()
    assert (repo_root / ".github/workflows/e2e-tests.yml").is_file()
