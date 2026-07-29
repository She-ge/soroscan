"""
Tests for #280 GDPR data governance and #284 contract deployment tracking.
"""
import pytest
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from soroscan.ingest.models import (
    AuditLog,
    ContractABIVersion,
    ContractDeployment,
    ContractVerification,
    DataDeletionRequest,
    PIIField,
)
from soroscan.ingest.tasks import (
    detect_contract_upgrades,
    enforce_retention_policies,
    process_deletion_requests,
)

from .factories import (
    ContractEventFactory,
    TrackedContractFactory,
    UserFactory,
)

User = get_user_model()


@pytest.fixture
def user():
    return UserFactory()


@pytest.fixture
def staff_user():
    u = UserFactory()
    u.is_staff = True
    u.save()
    return u


@pytest.fixture
def contract(user):
    return TrackedContractFactory(owner=user)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def auth_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def staff_client(api_client, staff_user):
    api_client.force_authenticate(user=staff_user)
    return api_client


# ---------------------------------------------------------------------------
# AuditLog model — immutability
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAuditLogImmutability:
    def test_create_audit_log(self, user):
        log = AuditLog.objects.create(
            user=user,
            action=AuditLog.ACTION_CREATE,
            model_name="TrackedContract",
            object_id="123",
            changes={"name": "new"},
        )
        assert log.pk is not None

    def test_update_raises(self, user):
        log = AuditLog.objects.create(
            action=AuditLog.ACTION_CREATE,
            model_name="TrackedContract",
            object_id="1",
        )
        log.model_name = "Changed"
        with pytest.raises(ValidationError):
            log.save()

    def test_delete_raises(self, user):
        log = AuditLog.objects.create(
            action=AuditLog.ACTION_DELETE,
            model_name="TrackedContract",
            object_id="1",
        )
        with pytest.raises(ValidationError):
            log.delete()


# ---------------------------------------------------------------------------
# DataDeletionRequest — view
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestDeletionRequestsView:
    def test_create_deletion_request(self, auth_client, contract):
        response = auth_client.post(
            "/api/ingest/deletion-requests/",
            {"subject_identifier": "GABC123", "contract_ids": [contract.contract_id]},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["subject_identifier"] == "GABC123"
        assert response.data["status"] == "pending"

    def test_create_requires_subject_identifier(self, auth_client):
        response = auth_client.post("/api/ingest/deletion-requests/", {}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_list_own_requests(self, auth_client, user):
        DataDeletionRequest.objects.create(
            requested_by=user, subject_identifier="GABC"
        )
        response = auth_client.get("/api/ingest/deletion-requests/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    def test_staff_sees_all_requests(self, staff_client, user):
        DataDeletionRequest.objects.create(requested_by=user, subject_identifier="GABC")
        response = staff_client.get("/api/ingest/deletion-requests/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_unauthenticated_rejected(self, api_client):
        response = api_client.get("/api/ingest/deletion-requests/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


# ---------------------------------------------------------------------------
# Compliance export — view
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestComplianceExportView:
    def test_staff_can_export(self, staff_client, staff_user):
        AuditLog.objects.create(
            user=staff_user,
            action=AuditLog.ACTION_CREATE,
            model_name="TrackedContract",
            object_id="1",
        )
        response = staff_client.get("/api/ingest/compliance-export/")
        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"] == "text/csv"
        content = b"".join(response.streaming_content).decode()
        assert "model_name" in content  # header row
        assert "TrackedContract" in content

    def test_non_staff_forbidden(self, auth_client):
        response = auth_client.get("/api/ingest/compliance-export/")
        assert response.status_code == status.HTTP_403_FORBIDDEN


# ---------------------------------------------------------------------------
# Deployment timeline — view
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestDeploymentTimelineView:
    def test_empty_timeline(self, auth_client, contract):
        url = f"/api/ingest/contracts/{contract.contract_id}/deployments/"
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["contract_id"] == contract.contract_id
        assert response.data["deployments"] == []
        assert response.data["abi_versions"] == []
        assert response.data["compatibility_warnings"] == []

    def test_timeline_with_deployments(self, auth_client, contract):
        ContractDeployment.objects.create(
            contract=contract,
            bytecode_hash="a" * 64,
            ledger_deployed=1000,
            is_upgrade=False,
        )
        ContractDeployment.objects.create(
            contract=contract,
            bytecode_hash="b" * 64,
            ledger_deployed=2000,
            is_upgrade=True,
        )
        url = f"/api/ingest/contracts/{contract.contract_id}/deployments/"
        response = auth_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["deployments"]) == 2

    def test_compatibility_warnings_shown(self, auth_client, contract):
        deployment = ContractDeployment.objects.create(
            contract=contract,
            bytecode_hash="c" * 64,
            ledger_deployed=3000,
            is_upgrade=True,
        )
        ContractABIVersion.objects.create(
            contract=contract,
            deployment=deployment,
            version_number=2,
            abi_json=[],
            valid_from_ledger=3000,
            has_breaking_changes=True,
            breaking_change_details="Removed 'amount' field",
        )
        url = f"/api/ingest/contracts/{contract.contract_id}/deployments/"
        response = auth_client.get(url)
        assert len(response.data["compatibility_warnings"]) == 1
        assert "Removed 'amount' field" in response.data["compatibility_warnings"][0]["detail"]

    def test_unknown_contract_returns_404(self, auth_client):
        response = auth_client.get("/api/ingest/contracts/CNOTEXIST/deployments/")
        assert response.status_code == status.HTTP_404_NOT_FOUND


# ---------------------------------------------------------------------------
# Celery task: enforce_retention_policies
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestEnforceRetentionPolicies:
    def test_deletes_old_events(self, contract):
        from soroscan.ingest.models import DataRetentionPolicy

        old_event = ContractEventFactory(
            contract=contract,
            timestamp=timezone.now() - timezone.timedelta(days=400),
        )
        new_event = ContractEventFactory(
            contract=contract,
            timestamp=timezone.now() - timezone.timedelta(days=10),
        )
        DataRetentionPolicy.objects.create(
            contract=contract,
            retention_days=365,
            archive_enabled=False,
            s3_bucket="test-bucket",
        )
        result = enforce_retention_policies()
        assert contract.contract_id in result
        assert result[contract.contract_id] == 1
        # New event should still exist
        from soroscan.ingest.models import ContractEvent
        assert ContractEvent.objects.filter(pk=new_event.pk).exists()
        assert not ContractEvent.objects.filter(pk=old_event.pk).exists()

    def test_no_policy_skips_contract(self, contract):
        ContractEventFactory(
            contract=contract,
            timestamp=timezone.now() - timezone.timedelta(days=400),
        )
        result = enforce_retention_policies()
        assert contract.contract_id not in result


# ---------------------------------------------------------------------------
# Celery task: process_deletion_requests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestProcessDeletionRequests:
    def test_scrubs_pii_field(self, contract, user):
        PIIField.objects.create(
            contract=contract,
            event_type="transfer",
            field_path="sender",
        )
        event = ContractEventFactory(
            contract=contract,
            event_type="transfer",
            payload={"sender": "GABC123", "amount": 100},
        )
        req = DataDeletionRequest.objects.create(
            requested_by=user,
            subject_identifier="GABC123",
        )
        req.contracts.set([contract])

        result = process_deletion_requests()
        assert result[str(req.pk)]["status"] == "completed"
        assert result[str(req.pk)]["events_deleted"] == 1

        event.refresh_from_db()
        assert event.payload["sender"] == "[DELETED]"

    def test_non_matching_subject_not_scrubbed(self, contract, user):
        PIIField.objects.create(contract=contract, event_type="", field_path="sender")
        event = ContractEventFactory(
            contract=contract,
            payload={"sender": "GDIFFERENT", "amount": 50},
        )
        req = DataDeletionRequest.objects.create(
            requested_by=user,
            subject_identifier="GABC123",
        )
        req.contracts.set([contract])

        process_deletion_requests()
        event.refresh_from_db()
        assert event.payload["sender"] == "GDIFFERENT"


# ---------------------------------------------------------------------------
# Celery task: detect_contract_upgrades
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestDetectContractUpgrades:
    def test_creates_deployment_on_new_bytecode(self, contract):
        from soroscan.ingest.models import ContractSource

        source = ContractSource.objects.create(
            contract=contract,
            source_file="contract_sources/test.wasm",
            uploaded_by=contract.owner,
        )
        ContractVerification.objects.create(
            contract=contract,
            source=source,
            status=ContractVerification.Status.VERIFIED,
            bytecode_hash="d" * 64,
        )
        result = detect_contract_upgrades()
        assert result["new_deployments"] == 1
        assert result["upgrades_detected"] == 0
        assert ContractDeployment.objects.filter(contract=contract).count() == 1

    def test_detects_upgrade_when_hash_changes(self, contract):
        from soroscan.ingest.models import ContractSource

        # Pre-existing deployment
        ContractDeployment.objects.create(
            contract=contract,
            bytecode_hash="e" * 64,
            ledger_deployed=500,
            is_upgrade=False,
        )
        source = ContractSource.objects.create(
            contract=contract,
            source_file="contract_sources/test2.wasm",
            uploaded_by=contract.owner,
        )
        ContractVerification.objects.create(
            contract=contract,
            source=source,
            status=ContractVerification.Status.VERIFIED,
            bytecode_hash="f" * 64,
        )
        result = detect_contract_upgrades()
        assert result["upgrades_detected"] == 1
        new_dep = ContractDeployment.objects.get(contract=contract, bytecode_hash="f" * 64)
        assert new_dep.is_upgrade is True

    def test_skips_already_tracked_bytecode(self, contract):
        from soroscan.ingest.models import ContractSource

        ContractDeployment.objects.create(
            contract=contract,
            bytecode_hash="g" * 64,
            ledger_deployed=100,
        )
        source = ContractSource.objects.create(
            contract=contract,
            source_file="contract_sources/test3.wasm",
            uploaded_by=contract.owner,
        )
        ContractVerification.objects.create(
            contract=contract,
            source=source,
            status=ContractVerification.Status.VERIFIED,
            bytecode_hash="g" * 64,
        )
        result = detect_contract_upgrades()
        assert result["new_deployments"] == 0


# ---------------------------------------------------------------------------
# PIIField model
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestPIIField:
    def test_unique_constraint(self, contract):
        PIIField.objects.create(contract=contract, event_type="transfer", field_path="sender")
        with pytest.raises(Exception):
            PIIField.objects.create(contract=contract, event_type="transfer", field_path="sender")

    def test_str(self, contract):
        pii = PIIField.objects.create(contract=contract, event_type="transfer", field_path="sender")
        assert "sender" in str(pii)
