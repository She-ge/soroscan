"""Tests for incident playbooks, webhook replay, dedup API, and metadata bulk import."""

from __future__ import annotations

import json
from datetime import timedelta
from pathlib import Path
from unittest.mock import patch

import pytest
import yaml
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from soroscan.ingest.models import (
    ContractMetadata,
    IngestError,
    RemediationRule,
    WebhookDeliveryLog,
    WebhookReplayJob,
)
from soroscan.ingest.services.event_dedup import fingerprint_event
from soroscan.ingest.services.incident_playbooks import (
    ALERT_ACTION_MAP,
    default_remediation_rule_specs,
)
from soroscan.ingest.services.metadata_bulk_import import (
    BulkImportError,
    import_metadata_rows,
    parse_csv,
    parse_json,
)
from soroscan.ingest.services.webhook_replay import create_replay_job, run_replay_job
from soroscan.ingest.tasks import _detect_anomaly
from soroscan.ingest.tests.factories import (
    ContractEventFactory,
    RemediationRuleFactory,
    TrackedContractFactory,
    UserFactory,
    WebhookSubscriptionFactory,
)

ROOT = Path(__file__).resolve().parents[4]
RULES = ROOT / "k8s" / "prometheus-rules.yaml"
PLAYBOOKS = ROOT / "docs" / "deployment" / "playbooks"


def _alerts():
    document = yaml.safe_load(RULES.read_text())
    return {
        rule["alert"]: rule
        for group in document["spec"]["groups"]
        for rule in group["rules"]
    }


@pytest.mark.django_db
class TestIncidentPlaybooks:
    def test_playbook_docs_exist(self):
        expected = [
            "event-ingestion-lag.md",
            "webhook-delivery-failure-burst.md",
            "database-connection-pool-exhausted.md",
            "rpc-endpoint-unavailable.md",
            "README.md",
        ]
        for name in expected:
            assert (PLAYBOOKS / name).exists(), name

    def test_alert_action_map_covers_four_incidents(self):
        assert len(ALERT_ACTION_MAP) == 4
        for key, mapping in ALERT_ACTION_MAP.items():
            assert mapping["automated_actions"]
            assert mapping["manual_actions"]
            assert mapping["prometheus_alert"]
            assert (ROOT / mapping["playbook"]).exists()

    def test_prometheus_playbook_alerts_present(self):
        alerts = _alerts()
        for name in (
            "SoroScanEventIngestionLag",
            "SoroScanWebhookFailureBurst",
            "SoroScanDbPoolExhausted",
            "SoroScanRpcEndpointUnavailable",
        ):
            assert name in alerts
            assert "runbook_url" in alerts[name]["annotations"]
            assert "playbooks/" in alerts[name]["annotations"]["runbook_url"]

    def test_seed_specs_are_valid(self):
        specs = default_remediation_rule_specs()
        assert len(specs) == 4
        for spec in specs:
            assert spec["condition"]["type"]
            assert isinstance(spec["actions"], list)

    def test_detect_ingestion_lag(self):
        contract = TrackedContractFactory(last_event_at=timezone.now() - timedelta(minutes=30))
        rule = RemediationRuleFactory(
            condition={"type": RemediationRule.CONDITION_INGESTION_LAG, "minutes": 15}
        )
        triggered, snapshot = _detect_anomaly(rule, contract)
        assert triggered is True
        assert snapshot["type"] == RemediationRule.CONDITION_INGESTION_LAG

    def test_detect_webhook_failure_burst(self):
        contract = TrackedContractFactory()
        webhook = WebhookSubscriptionFactory(contract=contract)
        for _ in range(5):
            WebhookDeliveryLog.objects.create(
                subscription=webhook,
                status=WebhookDeliveryLog.STATUS_FAILED,
                attempt_number=1,
            )
        rule = RemediationRuleFactory(
            condition={
                "type": RemediationRule.CONDITION_WEBHOOK_FAILURE_BURST,
                "window_minutes": 60,
                "failure_threshold": 3,
                "failure_ratio_percent": 50,
            }
        )
        triggered, snapshot = _detect_anomaly(rule, contract)
        assert triggered is True
        assert snapshot["failed"] >= 3

    def test_detect_rpc_unavailable(self):
        contract = TrackedContractFactory()
        for _ in range(5):
            IngestError.objects.create(
                error_type=IngestError.ErrorType.RPC_ERROR,
                contract_id=contract.contract_id,
                error_message="rpc down",
                sample_error="rpc down",
            )
        rule = RemediationRuleFactory(
            condition={
                "type": RemediationRule.CONDITION_RPC_UNAVAILABLE,
                "window_minutes": 60,
                "min_errors": 3,
            }
        )
        triggered, snapshot = _detect_anomaly(rule, contract)
        assert triggered is True
        assert snapshot["rpc_errors"] >= 3


@pytest.mark.django_db
class TestWebhookReplay:
    def test_create_and_run_dry_run_job(self):
        contract = TrackedContractFactory()
        webhook = WebhookSubscriptionFactory(contract=contract, event_type="")
        ContractEventFactory(contract=contract, event_type="swap")
        job = create_replay_job(
            subscription=webhook,
            contract_id=contract.contract_id,
            event_type="swap",
            limit=10,
            rate_limit_per_second=100.0,
            dry_run=True,
        )
        assert job.status == WebhookReplayJob.STATUS_PENDING
        assert job.total_events >= 1

        status = run_replay_job(job.id)
        assert status["status"] == WebhookReplayJob.STATUS_COMPLETED
        assert status["processed_events"] >= 1
        assert status["succeeded"] >= 1

        job.refresh_from_db()
        assert job.finished_at is not None

    def test_replay_endpoint_creates_job(self):
        owner = UserFactory()
        contract = TrackedContractFactory(owner=owner)
        webhook = WebhookSubscriptionFactory(contract=contract, event_type="")
        ContractEventFactory(contract=contract, event_type="swap")

        client = APIClient()
        client.force_authenticate(user=owner)
        url = reverse("webhook-replay", kwargs={"pk": webhook.pk})
        with patch("soroscan.ingest.tasks.run_webhook_replay_job.delay") as delay:
            resp = client.post(
                url,
                {
                    "event_type": "swap",
                    "limit": 5,
                    "rate_limit_per_second": 10,
                    "dry_run": True,
                },
                format="json",
            )
        assert resp.status_code == 202, resp.content
        assert resp.data["status"] == WebhookReplayJob.STATUS_PENDING
        delay.assert_called_once()

        status_url = reverse(
            "webhook-replay-status",
            kwargs={"pk": webhook.pk, "job_id": resp.data["id"]},
        )
        status_resp = client.get(status_url)
        assert status_resp.status_code == 200
        assert status_resp.data["id"] == resp.data["id"]


@pytest.mark.django_db
class TestDedupApi:
    def test_get_put_and_test_endpoints(self):
        owner = UserFactory(is_staff=True)
        contract = TrackedContractFactory(owner=owner)
        client = APIClient()
        client.force_authenticate(user=owner)

        get_url = reverse("contract-dedup-config", kwargs={"pk": contract.pk})
        resp = client.get(get_url)
        assert resp.status_code == 200
        assert resp.data["enabled"] is False

        put_resp = client.put(
            get_url,
            {"enabled": True, "fields": ["event_type", "amount", "tx_hash"]},
            format="json",
        )
        assert put_resp.status_code == 200
        assert put_resp.data["fields"] == ["event_type", "amount", "tx_hash"]

        test_url = reverse("contract-dedup-test", kwargs={"pk": contract.pk})
        test_resp = client.post(
            test_url,
            {
                "event_type": "transfer",
                "tx_hash": "abc",
                "payload": {"amount": 42},
            },
            format="json",
        )
        assert test_resp.status_code == 200
        assert test_resp.data["dedup_enabled"] is True
        expected, _ = fingerprint_event(
            ["event_type", "amount", "tx_hash"],
            event_type="transfer",
            tx_hash="abc",
            payload={"amount": 42},
        )
        assert test_resp.data["dedup_hash"] == expected


@pytest.mark.django_db
class TestBulkMetadataImport:
    def test_parse_and_import_csv_with_report(self):
        contract = TrackedContractFactory()
        csv_body = (
            "contract_id,name,description,tags,documentation_url,github_repo,team_email\n"
            f"{contract.contract_id},Stablecoin,An AMM,\"defi,amm\",https://docs.example,https://github.com/x,team@example.com\n"
        )
        rows = parse_csv(csv_body)
        report = import_metadata_rows(rows, dry_run=False, on_error="rollback")
        assert report["created"] == 1
        assert report["errors"] == 0
        assert ContractMetadata.objects.filter(contract=contract, name="Stablecoin").exists()

    def test_rollback_on_missing_contract(self):
        contract = TrackedContractFactory()
        rows = parse_json(
            json.dumps(
                {
                    "metadata": [
                        {"contract_id": contract.contract_id, "name": "Ok"},
                        {"contract_id": "C" + "A" * 55, "name": "Missing"},
                    ]
                }
            )
        )
        with pytest.raises(BulkImportError):
            import_metadata_rows(rows, dry_run=False, on_error="rollback")
        assert not ContractMetadata.objects.filter(contract=contract).exists()

    def test_api_bulk_import_endpoint(self):
        admin = UserFactory(is_staff=True)
        contract = TrackedContractFactory(owner=admin)
        client = APIClient()
        client.force_authenticate(user=admin)
        url = reverse("contract-bulk-import-metadata")
        payload = {
            "format": "json",
            "dry_run": True,
            "on_error": "rollback",
            "content": json.dumps(
                {"metadata": [{"contract_id": contract.contract_id, "name": "Demo"}]}
            ),
        }
        resp = client.post(url, payload, format="json")
        assert resp.status_code == 200, resp.content
        assert resp.data["mode"] == "dry-run"
        assert resp.data["created"] == 1
