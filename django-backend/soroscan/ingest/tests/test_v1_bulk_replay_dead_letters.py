"""Authorization tests for the v1 bulk dead-letter replay endpoint (issue #1664).

The endpoint historically only required ``IsAuthenticated``, which let any
logged-in user replay another tenant's failed webhooks by guessing
``dead_letter_ids``. These tests pin the intended access rules: staff may act
on anything, while everyone else is limited to dead letters whose contract they
own or share through a team/organization.
"""

from datetime import datetime, timezone

import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from soroscan.ingest.models import Team, TeamMembership, WebhookReplayJob

from .factories import (
    ContractEventFactory,
    TrackedContractFactory,
    WebhookDeadLetterFactory,
    WebhookSubscriptionFactory,
)

User = get_user_model()

BULK_REPLAY_URL = "/v1/webhooks/dead-letters/bulk-replay"

# `ContractEvent` is range-partitioned on timestamp with hard-coded 2026-08 /
# 2026-09 partitions, so a fixed date inside that window keeps the fixtures
# deterministic (the factory default uses `Faker("date_time")`).
EVENT_TIMESTAMP = datetime(2026, 9, 15, 12, 0, 0, tzinfo=timezone.utc)


def make_dead_letter(*, owner, team=None):
    contract = TrackedContractFactory(owner=owner, team=team)
    subscription = WebhookSubscriptionFactory(contract=contract)
    event = ContractEventFactory(contract=contract, timestamp=EVENT_TIMESTAMP)
    return WebhookDeadLetterFactory(subscription=subscription, event=event)


def authed_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
class TestBulkReplayDeadLettersAuthorization:
    def test_owner_can_replay_their_own_dead_letter(self):
        owner = User.objects.create_user(username="owner", password="test")
        dead_letter = make_dead_letter(owner=owner)

        response = authed_client(owner).post(
            BULK_REPLAY_URL, {"dead_letter_ids": [dead_letter.id]}, format="json"
        )

        assert response.status_code == status.HTTP_202_ACCEPTED
        assert len(response.data["job_ids"]) == 1

        dead_letter.refresh_from_db()
        assert dead_letter.resolved is True
        assert WebhookReplayJob.objects.count() == 1

    def test_non_owner_cannot_replay_another_users_dead_letter(self):
        owner = User.objects.create_user(username="owner", password="test")
        intruder = User.objects.create_user(username="intruder", password="test")
        dead_letter = make_dead_letter(owner=owner)

        response = authed_client(intruder).post(
            BULK_REPLAY_URL, {"dead_letter_ids": [dead_letter.id]}, format="json"
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert WebhookReplayJob.objects.count() == 0

        dead_letter.refresh_from_db()
        assert dead_letter.resolved is False

    def test_mixed_ownership_request_replays_nothing(self):
        """One unentitled id is enough to reject the whole batch."""
        intruder = User.objects.create_user(username="intruder", password="test")
        own_dead_letter = make_dead_letter(owner=intruder)
        foreign_dead_letter = make_dead_letter(
            owner=User.objects.create_user(username="other", password="test")
        )

        response = authed_client(intruder).post(
            BULK_REPLAY_URL,
            {"dead_letter_ids": [own_dead_letter.id, foreign_dead_letter.id]},
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert WebhookReplayJob.objects.count() == 0
        own_dead_letter.refresh_from_db()
        assert own_dead_letter.resolved is False

    def test_staff_can_replay_any_dead_letter(self):
        owner = User.objects.create_user(username="owner", password="test")
        staff = User.objects.create_user(
            username="staff", password="test", is_staff=True
        )
        dead_letter = make_dead_letter(owner=owner)

        response = authed_client(staff).post(
            BULK_REPLAY_URL, {"dead_letter_ids": [dead_letter.id]}, format="json"
        )

        assert response.status_code == status.HTTP_202_ACCEPTED
        assert len(response.data["job_ids"]) == 1

        dead_letter.refresh_from_db()
        assert dead_letter.resolved is True

    def test_team_member_can_replay_shared_contract_dead_letters(self):
        owner = User.objects.create_user(username="owner", password="test")
        member = User.objects.create_user(username="member", password="test")
        team = Team.objects.create(name="Core", created_by=owner)
        TeamMembership.objects.create(team=team, user=member)

        dead_letter = make_dead_letter(owner=owner, team=team)

        response = authed_client(member).post(
            BULK_REPLAY_URL, {"dead_letter_ids": [dead_letter.id]}, format="json"
        )

        assert response.status_code == status.HTTP_202_ACCEPTED
        assert len(response.data["job_ids"]) == 1

    def test_requires_authentication(self):
        response = APIClient().post(
            BULK_REPLAY_URL, {"dead_letter_ids": [1]}, format="json"
        )
        assert response.status_code in (
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        )

    def test_rejects_empty_dead_letter_ids(self):
        owner = User.objects.create_user(username="owner", password="test")
        response = authed_client(owner).post(
            BULK_REPLAY_URL, {"dead_letter_ids": []}, format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_rejects_non_list_dead_letter_ids(self):
        owner = User.objects.create_user(username="owner", password="test")
        response = authed_client(owner).post(
            BULK_REPLAY_URL, {"dead_letter_ids": "1,2"}, format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_rejects_non_integer_dead_letter_ids(self):
        owner = User.objects.create_user(username="owner", password="test")
        response = authed_client(owner).post(
            BULK_REPLAY_URL, {"dead_letter_ids": ["abc"]}, format="json"
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_owner_replaying_unknown_ids_is_a_no_op(self):
        owner = User.objects.create_user(username="owner", password="test")
        response = authed_client(owner).post(
            BULK_REPLAY_URL, {"dead_letter_ids": [987654]}, format="json"
        )
        assert response.status_code == status.HTTP_202_ACCEPTED
        assert response.data["job_ids"] == []
