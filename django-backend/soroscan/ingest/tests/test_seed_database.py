"""
Tests for the seed_database management command.

Covers:
- Default fixture seeding (integration)
- Built-in scenario seeding: minimal, webhook
- Clear functionality
- Reset (clear + re-seed)
- Fixture factory unit tests
- Invalid fixture handling
"""
import json
import tempfile
from pathlib import Path

import pytest
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.core.management.base import CommandError

from soroscan.ingest.models import (
    AlertRule,
    ContractEvent,
    Organization,
    OrganizationMembership,
    Team,
    TeamMembership,
    TrackedContract,
    WebhookSubscription,
)

User = get_user_model()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

MINIMAL_FIXTURE = {
    "organizations": [
        {"name": "Test Org", "slug": "test-org", "owner_email": "seed@example.com", "settings": {}, "quota": 100}
    ],
    "teams": [],
    "users": [
        {"email": "seed@example.com", "password": "pass", "first_name": "Seed", "last_name": "User"}
    ],
    "memberships": [
        {"user_email": "seed@example.com", "organization_slug": "test-org", "role": "owner"}
    ],
    "team_memberships": [],
    "contracts": [
        {
            "contract_id": "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            "name": "Test Contract",
            "alias": "TC",
            "description": "A test contract",
            "owner_email": "seed@example.com",
            "organization_slug": "test-org",
            "team_name": None,
            "abi_schema": None,
            "event_filter_type": "none",
            "event_filter_list": [],
        }
    ],
    "events": {
        "per_contract": 5,
        "contracts": ["CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"],
        "event_types": ["transfer", "swap"],
        "days_back": 7,
    },
    "webhooks": [
        {
            "contract_id": "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            "event_type": "transfer",
            "target_url": "https://example.com/hook",
            "timeout_seconds": 10,
            "retry_backoff_strategy": "exponential",
            "retry_backoff_seconds": 2,
            "signature_algorithm": "sha256",
        }
    ],
    "webhook_delivery_logs": {"per_webhook": 3, "status_codes": [200, 500, 200]},
    "alert_rules": [
        {
            "contract_id": "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            "name": "Test Alert",
            "condition": {"op": "gt", "field": "amount", "value": 1000},
            "channels": [],
            "action_type": "email",
            "action_target": "ops@example.com",
        }
    ],
    "api_keys": [],
}


def _write_fixture(data: dict) -> Path:
    tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8")
    json.dump(data, tmp)
    tmp.close()
    return Path(tmp.name)


# ---------------------------------------------------------------------------
# Integration tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_seed_from_fixture_creates_core_entities():
    fixture_path = _write_fixture(MINIMAL_FIXTURE)
    call_command("seed_database", fixture=str(fixture_path))

    assert User.objects.filter(email="seed@example.com").exists()
    assert Organization.objects.filter(slug="test-org").exists()
    assert TrackedContract.objects.filter(
        contract_id="CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    ).exists()


@pytest.mark.django_db
def test_seed_creates_events():
    fixture_path = _write_fixture(MINIMAL_FIXTURE)
    call_command("seed_database", fixture=str(fixture_path))

    contract = TrackedContract.objects.get(
        contract_id="CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    )
    assert ContractEvent.objects.filter(contract=contract).count() == 5


@pytest.mark.django_db
def test_seed_creates_webhooks():
    fixture_path = _write_fixture(MINIMAL_FIXTURE)
    call_command("seed_database", fixture=str(fixture_path))

    contract = TrackedContract.objects.get(
        contract_id="CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    )
    assert WebhookSubscription.objects.filter(contract=contract).count() == 1


@pytest.mark.django_db
def test_seed_creates_alert_rules():
    fixture_path = _write_fixture(MINIMAL_FIXTURE)
    call_command("seed_database", fixture=str(fixture_path))

    contract = TrackedContract.objects.get(
        contract_id="CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    )
    assert AlertRule.objects.filter(contract=contract, name="Test Alert").exists()


@pytest.mark.django_db
def test_seed_creates_memberships():
    fixture_path = _write_fixture(MINIMAL_FIXTURE)
    call_command("seed_database", fixture=str(fixture_path))

    user = User.objects.get(email="seed@example.com")
    org = Organization.objects.get(slug="test-org")
    assert OrganizationMembership.objects.filter(user=user, organization=org, role="owner").exists()


@pytest.mark.django_db
def test_seed_is_idempotent():
    """Running seed twice should not raise errors or duplicate unique entities."""
    fixture_path = _write_fixture(MINIMAL_FIXTURE)
    call_command("seed_database", fixture=str(fixture_path))
    call_command("seed_database", fixture=str(fixture_path))

    assert User.objects.filter(email="seed@example.com").count() == 1
    assert Organization.objects.filter(slug="test-org").count() == 1
    assert TrackedContract.objects.filter(
        contract_id="CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    ).count() == 1


@pytest.mark.django_db
def test_seed_events_no_uniqueness_violation():
    """Events must not violate the (contract, ledger, event_index) unique constraint."""
    fixture_path = _write_fixture(MINIMAL_FIXTURE)
    call_command("seed_database", fixture=str(fixture_path))

    contract = TrackedContract.objects.get(
        contract_id="CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    )
    events = ContractEvent.objects.filter(contract=contract)
    ledger_index_pairs = [(e.ledger, e.event_index) for e in events]
    assert len(ledger_index_pairs) == len(set(ledger_index_pairs)), "Duplicate (ledger, event_index) pairs found"


# ---------------------------------------------------------------------------
# Scenario tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_minimal_scenario():
    call_command("seed_database", scenario="minimal")

    assert Organization.objects.filter(slug="minimal-org").exists()
    assert TrackedContract.objects.count() >= 3
    assert ContractEvent.objects.count() == 0


@pytest.mark.django_db
def test_webhook_scenario_creates_webhooks():
    call_command("seed_database", scenario="webhook")

    assert WebhookSubscription.objects.count() >= 2


# ---------------------------------------------------------------------------
# Clear tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_clear_removes_seeded_data():
    fixture_path = _write_fixture(MINIMAL_FIXTURE)
    call_command("seed_database", fixture=str(fixture_path))

    assert User.objects.filter(email="seed@example.com").exists()

    call_command("seed_database", clear=True, fixture=str(fixture_path))

    # After clear+re-seed the user should exist again (re-seeded)
    assert User.objects.filter(email="seed@example.com").exists()


@pytest.mark.django_db
def test_clear_only_removes_example_com_users():
    """Staff users and non-example.com users must not be deleted by --clear."""
    staff = User.objects.create_user(
        username="staff", email="staff@company.com", password="x", is_staff=True
    )
    fixture_path = _write_fixture(MINIMAL_FIXTURE)
    call_command("seed_database", fixture=str(fixture_path))
    call_command("seed_database", clear=True, fixture=str(fixture_path))

    assert User.objects.filter(pk=staff.pk).exists()


@pytest.mark.django_db
def test_reset_wipes_and_reseeds():
    fixture_path = _write_fixture(MINIMAL_FIXTURE)
    call_command("seed_database", fixture=str(fixture_path))
    first_event_ids = set(ContractEvent.objects.values_list("id", flat=True))

    # Reset: clear then re-seed
    call_command("seed_database", clear=True, fixture=str(fixture_path))
    second_event_ids = set(ContractEvent.objects.values_list("id", flat=True))

    # All old events were deleted; new ones were created
    assert first_event_ids.isdisjoint(second_event_ids)
    assert len(second_event_ids) == 5


# ---------------------------------------------------------------------------
# Error handling
# ---------------------------------------------------------------------------

@pytest.mark.django_db
def test_invalid_json_fixture_raises_command_error():
    tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8")
    tmp.write("{invalid json")
    tmp.close()

    with pytest.raises(CommandError, match="Invalid JSON"):
        call_command("seed_database", fixture=tmp.name)


@pytest.mark.django_db
def test_missing_owner_skips_contract_gracefully():
    """Contracts whose owner_email doesn't match any user are silently skipped."""
    data = {**MINIMAL_FIXTURE, "contracts": [
        {
            "contract_id": "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            "name": "Orphan",
            "alias": "",
            "description": "",
            "owner_email": "nobody@example.com",
            "organization_slug": None,
            "team_name": None,
            "abi_schema": None,
            "event_filter_type": "none",
            "event_filter_list": [],
        }
    ]}
    fixture_path = _write_fixture(data)
    call_command("seed_database", fixture=str(fixture_path))

    assert not TrackedContract.objects.filter(
        contract_id="CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    ).exists()


# ---------------------------------------------------------------------------
# Unit tests for fixture factory helpers
# ---------------------------------------------------------------------------

def test_random_hex_length():
    from soroscan.ingest.management.commands.seed_database import _random_hex
    assert len(_random_hex()) == 64
    assert len(_random_hex(32)) == 32
    assert all(c in "0123456789abcdef" for c in _random_hex())


def test_random_address_format():
    from soroscan.ingest.management.commands.seed_database import _random_address
    addr = _random_address()
    assert addr.startswith("G")
    assert len(addr) == 56


@pytest.mark.django_db
def test_seed_teams_with_org():
    data = {
        **MINIMAL_FIXTURE,
        "teams": [
            {"name": "Alpha Team", "organization_slug": "test-org", "created_by_email": "seed@example.com"}
        ],
        "team_memberships": [
            {"user_email": "seed@example.com", "team_name": "Alpha Team", "role": "owner"}
        ],
    }
    fixture_path = _write_fixture(data)
    call_command("seed_database", fixture=str(fixture_path))

    assert Team.objects.filter(name="Alpha Team").exists()
    team = Team.objects.get(name="Alpha Team")
    user = User.objects.get(email="seed@example.com")
    assert TeamMembership.objects.filter(team=team, user=user, role="owner").exists()
