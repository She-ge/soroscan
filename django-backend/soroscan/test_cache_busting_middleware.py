"""Tests for CacheBustingMiddleware (issue #488)."""
from django.http import HttpResponse
from django.test import TestCase, RequestFactory

from soroscan.middleware import CacheBustingMiddleware


class CacheBustingMiddlewareTest(TestCase):
    """Verify CacheBustingMiddleware sets correct Cache-Control headers."""

    def setUp(self):
        self.factory = RequestFactory()

    def _make_middleware(self):
        def get_response(request):
            return HttpResponse("ok", content_type="text/plain")

        return CacheBustingMiddleware(get_response)

    def test_api_response_has_cache_control(self):
        middleware = self._make_middleware()
        request = self.factory.get("/api/contracts/")
        response = middleware(request)

        self.assertIn("Cache-Control", response)

    def test_no_cache_header_bypasses_cache(self):
        middleware = self._make_middleware()
        request = self.factory.get(
            "/api/contracts/",
            HTTP_CACHE_CONTROL="no-cache",
        )
        response = middleware(request)

        self.assertEqual(response["Cache-Control"], "no-cache, no-store, must-revalidate")
        self.assertEqual(response["Pragma"], "no-cache")

    def test_x_cache_bust_header_bypasses_cache(self):
        middleware = self._make_middleware()
        request = self.factory.get(
            "/api/contracts/",
            HTTP_X_CACHE_BUST="1",
        )
        response = middleware(request)

        self.assertEqual(response["Cache-Control"], "no-cache, no-store, must-revalidate")

    def test_graphql_path_gets_cache_control(self):
        middleware = self._make_middleware()
        request = self.factory.post(
            "/graphql/",
            data='{"query": "{ contracts { id } }"}',
            content_type="application/json",
        )
        response = middleware(request)

        self.assertIn("Cache-Control", response)

    def test_static_paths_not_affected(self):
        middleware = self._make_middleware()
        request = self.factory.get("/static/main.js")
        response = middleware(request)

        self.assertNotIn("Cache-Control", response)

    def test_normal_request_gets_private_cache(self):
        middleware = self._make_middleware()
        request = self.factory.get("/api/contracts/")
        response = middleware(request)

        self.assertIn("private", response["Cache-Control"])
        self.assertIn("max-age=0", response["Cache-Control"])
