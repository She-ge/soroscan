"""Tests for query result caching layer (issue #488)."""

from django.core.cache import cache
from django.test import RequestFactory, TestCase, override_settings
from rest_framework.test import APIClient

from soroscan.ingest.cache_utils import (
    cache_result,
    get_or_set_json,
    invalidate_contract_query_cache,
    invalidate_event_count_cache,
    query_cache_ttl,
    stable_cache_key,
)
from soroscan.ingest.tests.factories import (
    TrackedContractFactory,
    UserFactory,
)


class CacheUtilsTest(TestCase):
    """Test cache utility functions."""

    def setUp(self):
        cache.clear()

    def test_stable_cache_key_is_deterministic(self):
        key1 = stable_cache_key("test", {"a": 1, "b": 2})
        key2 = stable_cache_key("test", {"b": 2, "a": 1})
        self.assertEqual(key1, key2)

    def test_stable_cache_key_differs_by_prefix(self):
        key1 = stable_cache_key("prefix1", {"a": 1})
        key2 = stable_cache_key("prefix2", {"a": 1})
        self.assertNotEqual(key1, key2)

    def test_get_or_set_json_returns_factory_value(self):
        key = stable_cache_key("test_get_set", {"x": 1})
        result = get_or_set_json(key, 60, lambda: {"value": 42})
        self.assertEqual(result, {"value": 42})

    def test_get_or_set_json_returns_cached_value(self):
        key = stable_cache_key("test_get_set", {"x": 1})
        # First call creates
        get_or_set_json(key, 60, lambda: {"value": 42})
        # Second call returns cached
        result = get_or_set_json(key, 60, lambda: {"value": 99})
        self.assertEqual(result, {"value": 42})

    def test_get_or_set_json_caches_none(self):
        key = stable_cache_key("test_none", {"x": 1})
        result1 = get_or_set_json(key, 60, lambda: None)
        self.assertIsNone(result1)
        # Should return cached None, not call factory again
        call_count = [0]

        def factory():
            call_count[0] += 1
            return "should not be called"

        result2 = get_or_set_json(key, 60, factory)
        self.assertIsNone(result2)
        self.assertEqual(call_count[0], 0)

    def test_query_cache_ttl_returns_default(self):
        with override_settings(QUERY_CACHE_TTL_SECONDS=120):
            self.assertEqual(query_cache_ttl(), 120)

    def test_query_cache_ttl_fallback(self):
        with self.settings():
            if hasattr(self.settings, "QUERY_CACHE_TTL_SECONDS"):
                pass
            self.assertEqual(query_cache_ttl(), 60)

    def test_invalidate_contract_query_cache(self):
        key = stable_cache_key("contract_stats", {"contract_id": "CABC123"})
        cache.set(key, {"data": "cached"})
        self.assertIsNotNone(cache.get(key))
        invalidate_contract_query_cache("CABC123")
        self.assertIsNone(cache.get(key))

    def test_invalidate_event_count_cache(self):
        cache.set("event_count:CABC123", 100)
        self.assertEqual(cache.get("event_count:CABC123"), 100)
        invalidate_event_count_cache("CABC123")
        self.assertIsNone(cache.get("event_count:CABC123"))


class CacheResultDecoratorTest(TestCase):
    """Test the @cache_result decorator."""

    def setUp(self):
        self.factory = RequestFactory()
        cache.clear()

    def test_caches_successful_response(self):
        call_count = [0]

        @cache_result(ttl=60)
        def my_view(request):
            call_count[0] += 1
            from rest_framework.response import Response

            return Response({"count": call_count[0]})

        request = self.factory.get("/api/test/")
        request.user = None

        response1 = my_view(request)
        self.assertEqual(response1.data["count"], 1)

        response2 = my_view(request)
        self.assertEqual(response2.data["count"], 1)  # cached
        self.assertEqual(call_count[0], 1)

    def test_does_not_cache_error_responses(self):
        call_count = [0]

        @cache_result(ttl=60)
        def my_view(request):
            call_count[0] += 1
            from rest_framework.response import Response

            return Response({"error": "bad"}, status=400)

        request = self.factory.get("/api/test/")
        request.user = None

        my_view(request)
        my_view(request)
        self.assertEqual(call_count[0], 2)  # not cached


@override_settings(CACHES={
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
})
class CacheStatsEndpointTest(TestCase):
    """Test the cache stats endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)

    def test_cache_stats_returns_ok(self):
        response = self.client.get("/api/cache/stats/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "ok")
        self.assertIn("backend", response.data)
        self.assertIn("default_ttl", response.data)

    def test_cache_stats_unauthenticated(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/cache/stats/")
        self.assertIn(response.status_code, [401, 403])


@override_settings(CACHES={
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
})
class ContractsListCachingTest(TestCase):
    """Test that the contracts list endpoint uses caching."""

    def setUp(self):
        self.client = APIClient()
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)
        cache.clear()

    def test_contracts_list_is_cached(self):
        contract = TrackedContractFactory(owner=self.user)

        # First call hits DB
        response1 = self.client.get("/api/ingest/contracts/")
        self.assertEqual(response1.status_code, 200)
        self.assertGreater(len(response1.data.get("results", [])), 0)

        # Delete the contract
        contract.delete()

        # Second call should return cached result (with contract still present)
        response2 = self.client.get("/api/ingest/contracts/")
        self.assertEqual(response2.status_code, 200)
        # Contract should still appear in cached response
        self.assertGreater(len(response2.data.get("results", [])), 0)
