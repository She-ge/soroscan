from datetime import timedelta
from unittest.mock import patch

from django.contrib.admin.sites import AdminSite
from django.test import RequestFactory, TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from soroscan.ingest.admin import TrackedContractAdmin
from soroscan.ingest.models import TrackedContract, WebhookSubscription
from soroscan.ingest.tasks import (
    auto_resume_paused_contracts,
    notify_contract_pause_state,
)
from soroscan.ingest.tests.factories import (
    TrackedContractFactory,
    WebhookSubscriptionFactory,
)


class ContractPauseResumeModelTests(TestCase):
    def setUp(self):
        self.contract = TrackedContractFactory(is_paused=False)

    @patch("soroscan.ingest.tasks.notify_contract_pause_state.delay")
    def test_pause_sets_fields_and_notifies(self, mock_notify):
        resume_at = timezone.now() + timedelta(hours=1)

        self.contract.pause(reason="Incident #123", resume_at=resume_at)
        self.contract.refresh_from_db()

        self.assertTrue(self.contract.is_paused)
        self.assertIsNotNone(self.contract.paused_at)
        self.assertEqual(self.contract.pause_reason, "Incident #123")
        self.assertEqual(self.contract.resume_at, resume_at)
        mock_notify.assert_called_once_with(
            self.contract.contract_id, "paused", reason="Incident #123"
        )

    @patch("soroscan.ingest.tasks.notify_contract_pause_state.delay")
    def test_resume_clears_fields_and_notifies(self, mock_notify):
        self.contract.pause(reason="maintenance")
        mock_notify.reset_mock()

        self.contract.resume()
        self.contract.refresh_from_db()

        self.assertFalse(self.contract.is_paused)
        self.assertIsNone(self.contract.paused_at)
        self.assertEqual(self.contract.pause_reason, "")
        self.assertIsNone(self.contract.resume_at)
        mock_notify.assert_called_once_with(self.contract.contract_id, "resumed")

    @patch("soroscan.ingest.tasks.notify_contract_pause_state.delay")
    def test_resume_on_non_paused_contract_does_not_notify(self, mock_notify):
        self.contract.resume()
        mock_notify.assert_not_called()

    def test_pause_preserves_historical_events(self):
        from soroscan.ingest.tests.factories import ContractEventFactory

        event = ContractEventFactory(contract=self.contract)
        self.contract.pause(reason="test")

        self.assertTrue(
            self.contract.events.filter(pk=event.pk).exists(),
            "Historical events must remain queryable after pausing.",
        )


class AutoResumeTaskTests(TestCase):
    def setUp(self):
        self.contract = TrackedContractFactory()

    @patch("soroscan.ingest.tasks.notify_contract_pause_state.delay")
    def test_resumes_contracts_past_resume_at(self, mock_notify):
        self.contract.pause(
            reason="scheduled maintenance",
            resume_at=timezone.now() - timedelta(minutes=1),
        )

        resumed_count = auto_resume_paused_contracts()

        self.contract.refresh_from_db()
        self.assertEqual(resumed_count, 1)
        self.assertFalse(self.contract.is_paused)

    @patch("soroscan.ingest.tasks.notify_contract_pause_state.delay")
    def test_does_not_resume_contracts_scheduled_in_future(self, mock_notify):
        self.contract.pause(
            reason="scheduled maintenance",
            resume_at=timezone.now() + timedelta(hours=1),
        )

        resumed_count = auto_resume_paused_contracts()

        self.contract.refresh_from_db()
        self.assertEqual(resumed_count, 0)
        self.assertTrue(self.contract.is_paused)

    @patch("soroscan.ingest.tasks.notify_contract_pause_state.delay")
    def test_does_not_resume_contracts_paused_indefinitely(self, mock_notify):
        """A paused contract with no resume_at stays paused until manually resumed."""
        self.contract.pause(reason="indefinite pause")

        resumed_count = auto_resume_paused_contracts()

        self.contract.refresh_from_db()
        self.assertEqual(resumed_count, 0)
        self.assertTrue(self.contract.is_paused)


class NotifyContractPauseStateTaskTests(TestCase):
    def setUp(self):
        self.contract = TrackedContractFactory()

    @patch("soroscan.ingest.tasks.requests.post")
    def test_notifies_active_webhooks_regardless_of_event_type_filter(self, mock_post):
        mock_post.return_value.status_code = 200
        webhook = WebhookSubscriptionFactory(
            contract=self.contract,
            event_type="transfer",  # notification is unrelated to this filter
            is_active=True,
            status=WebhookSubscription.STATUS_ACTIVE,
        )

        notified = notify_contract_pause_state(
            self.contract.contract_id, "paused", reason="x"
        )

        self.assertEqual(notified, 1)
        mock_post.assert_called_once()
        args, kwargs = mock_post.call_args
        self.assertEqual(args[0], webhook.target_url)
        self.assertEqual(kwargs["headers"]["X-SoroScan-Event"], "contract.paused")

    @patch("soroscan.ingest.tasks.requests.post")
    def test_skips_inactive_webhooks(self, mock_post):
        WebhookSubscriptionFactory(
            contract=self.contract,
            is_active=False,
        )

        notified = notify_contract_pause_state(self.contract.contract_id, "paused")

        self.assertEqual(notified, 0)
        mock_post.assert_not_called()

    @patch("soroscan.ingest.tasks.requests.post", side_effect=Exception("boom"))
    def test_failed_delivery_does_not_raise(self, mock_post):
        import requests

        mock_post.side_effect = requests.RequestException("connection failed")
        WebhookSubscriptionFactory(contract=self.contract)

        notified = notify_contract_pause_state(self.contract.contract_id, "paused")

        self.assertEqual(notified, 0)


class IngestionGateTests(TestCase):
    """
    Verify ingest_latest_events excludes paused contract_ids from the RPC
    query, the same way TestIngestionBlacklistSkip verifies it for
    BlacklistedContract (see test_blacklisted_contract.py).
    """

    def test_paused_contract_excluded_from_rpc_query(self):
        from unittest.mock import MagicMock

        from soroscan.ingest.tasks import ingest_latest_events

        active = TrackedContractFactory(is_active=True, is_paused=False)
        paused = TrackedContractFactory(is_active=True, is_paused=True)

        mock_server = MagicMock()
        mock_server.get_events.return_value = MagicMock(events=[])

        with patch(
            "soroscan.ingest.tasks.SorobanServer", return_value=mock_server
        ), patch(
            "soroscan.ingest.tasks.IndexerState.objects.get_or_create",
            return_value=(MagicMock(value="100"), True),
        ):
            ingest_latest_events()

        call_kwargs = mock_server.get_events.call_args
        filters = call_kwargs[1].get("filters") if call_kwargs else None
        queried_ids = filters[0]["contractIds"] if filters else []

        self.assertIn(active.contract_id, queried_ids)
        self.assertNotIn(paused.contract_id, queried_ids)


class ContractPauseResumeAPITests(TestCase):
    def setUp(self):
        from django.contrib.auth import get_user_model

        self.user = get_user_model().objects.create_user(
            username="owner", password="pw"
        )
        self.contract = TrackedContractFactory(owner=self.user)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    @patch("soroscan.ingest.tasks.notify_contract_pause_state.delay")
    def test_pause_endpoint(self, mock_notify):
        url = f"/api/ingest/contracts/{self.contract.id}/pause/"
        response = self.client.post(url, {"reason": "incident"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.contract.refresh_from_db()
        self.assertTrue(self.contract.is_paused)
        self.assertEqual(self.contract.pause_reason, "incident")

    @patch("soroscan.ingest.tasks.notify_contract_pause_state.delay")
    def test_resume_endpoint(self, mock_notify):
        self.contract.pause(reason="incident")
        url = f"/api/ingest/contracts/{self.contract.id}/resume/"
        response = self.client.post(url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.contract.refresh_from_db()
        self.assertFalse(self.contract.is_paused)

    @patch("soroscan.ingest.tasks.notify_contract_pause_state.delay")
    def test_pause_endpoint_rejects_invalid_resume_at(self, mock_notify):
        url = f"/api/ingest/contracts/{self.contract.id}/pause/"
        response = self.client.post(
            url, {"reason": "x", "resume_at": "not-a-date"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TrackedContractAdminActionTests(TestCase):
    def setUp(self):
        self.site = AdminSite()
        self.admin = TrackedContractAdmin(TrackedContract, self.site)
        self.rf = RequestFactory()
        self.contract = TrackedContractFactory()

    def _request(self, post_data=None):
        request = self.rf.post("/admin/ingest/trackedcontract/", post_data or {})
        request.user = type(
            "User",
            (),
            {
                "is_staff": True,
                "is_active": True,
                "is_authenticated": True,
                "has_perm": lambda self, *a, **kw: True,
            },
        )()
        return request

    @patch("soroscan.ingest.admin.TrackedContractAdmin.message_user")
    @patch("soroscan.ingest.tasks.notify_contract_pause_state.delay")
    def test_pause_contracts_action(self, mock_notify, mock_message_user):
        request = self._request({"pause_reason": "incident #1"})
        queryset = TrackedContract.objects.filter(pk=self.contract.pk)

        self.admin.pause_contracts(request, queryset)

        self.contract.refresh_from_db()
        self.assertTrue(self.contract.is_paused)
        self.assertEqual(self.contract.pause_reason, "incident #1")
        mock_message_user.assert_called_once()

    @patch("soroscan.ingest.admin.TrackedContractAdmin.message_user")
    @patch("soroscan.ingest.tasks.notify_contract_pause_state.delay")
    def test_resume_contracts_action(self, mock_notify, mock_message_user):
        self.contract.pause(reason="test")
        request = self._request({})
        queryset = TrackedContract.objects.filter(pk=self.contract.pk)

        self.admin.resume_contracts(request, queryset)

        self.contract.refresh_from_db()
        self.assertFalse(self.contract.is_paused)
        mock_message_user.assert_called_once()

    @patch("soroscan.ingest.admin.TrackedContractAdmin.message_user")
    @patch("soroscan.ingest.tasks.notify_contract_pause_state.delay")
    def test_pause_contracts_action_parses_resume_at(
        self, mock_notify, mock_message_user
    ):
        request = self._request(
            {"pause_reason": "scheduled", "resume_at": "2030-01-01T00:00:00Z"}
        )
        queryset = TrackedContract.objects.filter(pk=self.contract.pk)

        self.admin.pause_contracts(request, queryset)

        self.contract.refresh_from_db()
        self.assertIsNotNone(self.contract.resume_at)
        self.assertEqual(self.contract.resume_at.year, 2030)
