from django.test import TestCase
from rest_framework.exceptions import ValidationError
from soroscan.ingest.serializers import WebhookSubscriptionSerializer
from soroscan.ingest.tests.factories import TrackedContractFactory

class WebhookPayloadLimitTests(TestCase):
    def setUp(self):
        self.contract = TrackedContractFactory()

    def test_oversized_payload_rejected(self):
        self.contract.metadata = {"estimated_payload_size": 1048577}
        self.contract.save()
        
        serializer = WebhookSubscriptionSerializer(data={
            "contract": self.contract.id,
            "target_url": "https://example.com/webhook",
            "secret": "testsecret123"
        })
        
        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)
            
        self.assertIn("contract", serializer.errors)
        self.assertEqual(
            serializer.errors["contract"][0],
            "Estimated payload exceeds 1MB limit."
        )

    def test_massive_events_rejected(self):
        self.contract.metadata = {"is_massive": True}
        self.contract.save()
        
        serializer = WebhookSubscriptionSerializer(data={
            "contract": self.contract.id,
            "target_url": "https://example.com/webhook",
            "secret": "testsecret123"
        })
        
        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)
            
        self.assertIn("contract", serializer.errors)
        self.assertEqual(
            serializer.errors["contract"][0],
            "Contract events are known to be massive."
        )

    def test_valid_payload_accepted(self):
        self.contract.metadata = {"estimated_payload_size": 500000}
        self.contract.save()
        
        serializer = WebhookSubscriptionSerializer(data={
            "contract": self.contract.id,
            "target_url": "https://example.com/webhook",
            "secret": "testsecret123"
        })
        
        self.assertTrue(serializer.is_valid())


class WebhookTimeoutBackoffTests(TestCase):
    def setUp(self):
        self.contract = TrackedContractFactory()

    def _subscription_data(self, **overrides):
        data = {
            "contract": self.contract.id,
            "target_url": "https://example.com/webhook",
            "secret": "testsecret123",
        }
        data.update(overrides)
        return data

    def test_timeout_and_backoff_defaults_exposed(self):
        serializer = WebhookSubscriptionSerializer(data=self._subscription_data())
        self.assertTrue(serializer.is_valid(), serializer.errors)
        subscription = serializer.save()
        self.assertEqual(subscription.timeout_seconds, 10)
        self.assertEqual(subscription.retry_backoff_strategy, "exponential")
        self.assertEqual(subscription.retry_backoff_seconds, 2)
        rendered = WebhookSubscriptionSerializer(subscription).data
        self.assertEqual(rendered["timeout_seconds"], 10)
        self.assertEqual(rendered["retry_backoff_strategy"], "exponential")
        self.assertEqual(rendered["retry_backoff_seconds"], 2)

    def test_timeout_and_backoff_round_trip(self):
        serializer = WebhookSubscriptionSerializer(data=self._subscription_data(
            timeout_seconds=25,
            retry_backoff_strategy="linear",
            retry_backoff_seconds=120,
        ))
        self.assertTrue(serializer.is_valid(), serializer.errors)
        subscription = serializer.save()
        subscription.refresh_from_db()
        self.assertEqual(subscription.timeout_seconds, 25)
        self.assertEqual(subscription.retry_backoff_strategy, "linear")
        self.assertEqual(subscription.retry_backoff_seconds, 120)
        rendered = WebhookSubscriptionSerializer(subscription).data
        self.assertEqual(rendered["timeout_seconds"], 25)
        self.assertEqual(rendered["retry_backoff_strategy"], "linear")
        self.assertEqual(rendered["retry_backoff_seconds"], 120)

    def test_timeout_bounds_rejected(self):
        for bad_value in (0, 61):
            serializer = WebhookSubscriptionSerializer(
                data=self._subscription_data(timeout_seconds=bad_value)
            )
            with self.assertRaises(ValidationError):
                serializer.is_valid(raise_exception=True)
            self.assertIn("timeout_seconds", serializer.errors)

    def test_backoff_strategy_rejected(self):
        serializer = WebhookSubscriptionSerializer(
            data=self._subscription_data(retry_backoff_strategy="quadratic")
        )
        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)
        self.assertIn("retry_backoff_strategy", serializer.errors)

    def test_backoff_seconds_bounds_rejected(self):
        for bad_value in (0, 3601):
            serializer = WebhookSubscriptionSerializer(
                data=self._subscription_data(retry_backoff_seconds=bad_value)
            )
            with self.assertRaises(ValidationError):
                serializer.is_valid(raise_exception=True)
            self.assertIn("retry_backoff_seconds", serializer.errors)
