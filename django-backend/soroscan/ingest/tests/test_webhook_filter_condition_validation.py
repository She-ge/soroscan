from django.test import TestCase
from rest_framework.exceptions import ValidationError

from soroscan.ingest.serializers import WebhookSubscriptionSerializer
from soroscan.ingest.tests.factories import TrackedContractFactory


class WebhookFilterConditionValidationTests(TestCase):
    """
    Regression tests for filter_condition handling in WebhookSubscriptionSerializer.

    validate_filter_condition() previously fell through without returning the
    validated value on the success path, so DRF silently replaced any valid
    filter_condition with None before save (Issue #834).
    """

    def setUp(self):
        self.contract = TrackedContractFactory()

    def _data(self, filter_condition):
        return {
            "contract": self.contract.id,
            "target_url": "https://example.com/webhook",
            "secret": "testsecret123",
            "filter_condition": filter_condition,
        }

    def test_valid_condition_is_preserved_not_nulled(self):
        condition = {"op": "gte", "field": "decodedPayload.amount", "value": 1000}
        serializer = WebhookSubscriptionSerializer(data=self._data(condition))

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["filter_condition"], condition)

    def test_valid_nested_condition_is_preserved(self):
        condition = {
            "op": "and",
            "conditions": [
                {"op": "gte", "field": "decodedPayload.amount", "value": 1000},
                {"op": "eq", "field": "event_type", "value": "transfer"},
            ],
        }
        serializer = WebhookSubscriptionSerializer(data=self._data(condition))

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["filter_condition"], condition)

    def test_none_and_empty_dict_pass_through(self):
        for value in (None, {}):
            serializer = WebhookSubscriptionSerializer(data=self._data(value))
            self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_unknown_operator_rejected(self):
        serializer = WebhookSubscriptionSerializer(
            data=self._data({"op": "gtt", "field": "amount", "value": 1000})
        )

        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)

    def test_missing_field_rejected(self):
        serializer = WebhookSubscriptionSerializer(
            data=self._data({"op": "eq", "value": "transfer"})
        )

        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)

    def test_and_without_conditions_list_rejected(self):
        serializer = WebhookSubscriptionSerializer(
            data=self._data({"op": "and", "conditions": []})
        )

        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)

    def test_not_requires_nested_condition(self):
        serializer = WebhookSubscriptionSerializer(data=self._data({"op": "not"}))

        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)

    def test_non_object_condition_rejected(self):
        serializer = WebhookSubscriptionSerializer(data=self._data("not-an-object"))

        with self.assertRaises(ValidationError):
            serializer.is_valid(raise_exception=True)
