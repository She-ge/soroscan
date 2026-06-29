"""Tests for gzip compression middleware (issue #487)."""
import zlib

from django.test import RequestFactory, TestCase


class GZipCompressionTest(TestCase):
    """Verify Django's GZipMiddleware compresses API responses correctly."""

    def setUp(self):
        self.factory = RequestFactory()

    def test_gzip_middleware_enabled_in_settings(self):
        from django.conf import settings

        self.assertIn("django.middleware.gzip.GZipMiddleware", settings.MIDDLEWARE)

    def test_gzip_positioned_after_common_middleware(self):
        from django.conf import settings

        mw = settings.MIDDLEWARE
        gzip_idx = mw.index("django.middleware.gzip.GZipMiddleware")
        common_idx = mw.index("django.middleware.common.CommonMiddleware")
        self.assertGreater(gzip_idx, common_idx)

    def test_response_compressed_when_accept_encoding_gzip(self):
        from django.http import HttpResponse

        from django.middleware.gzip import GZipMiddleware

        content = "x" * 2048
        def get_response(request):
            return HttpResponse(content, content_type="application/json")
        middleware = GZipMiddleware(get_response)

        request = self.factory.get(
            "/api/test/",
            HTTP_ACCEPT_ENCODING="gzip",
        )
        response = middleware(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get("Content-Encoding"), "gzip")
        self.assertEqual(response.get("Vary"), "Accept-Encoding")

        decompressed = zlib.decompress(response.content, zlib.MAX_WBITS | 16)
        self.assertEqual(decompressed.decode("utf-8"), content)

    def test_response_not_compressed_when_no_accept_encoding(self):
        from django.http import HttpResponse

        from django.middleware.gzip import GZipMiddleware

        content = "x" * 2048
        def get_response(request):
            return HttpResponse(content, content_type="application/json")
        middleware = GZipMiddleware(get_response)

        request = self.factory.get("/api/test/")
        response = middleware(request)

        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(response.get("Content-Encoding"), "gzip")

    def test_small_response_not_compressed(self):
        from django.http import HttpResponse

        from django.middleware.gzip import GZipMiddleware

        content = "small"
        def get_response(request):
            return HttpResponse(content, content_type="application/json")
        middleware = GZipMiddleware(get_response)

        request = self.factory.get(
            "/api/test/",
            HTTP_ACCEPT_ENCODING="gzip",
        )
        response = middleware(request)

        self.assertEqual(response.status_code, 200)
        self.assertNotEqual(response.get("Content-Encoding"), "gzip")

    def test_accept_encoding_gzip_honored(self):
        from django.http import HttpResponse

        from django.middleware.gzip import GZipMiddleware

        content = "y" * 5000
        def get_response(request):
            return HttpResponse(content, content_type="application/json")
        middleware = GZipMiddleware(get_response)

        request = self.factory.get(
            "/api/test/",
            HTTP_ACCEPT_ENCODING="gzip, deflate, br",
        )
        response = middleware(request)

        self.assertEqual(response.get("Content-Encoding"), "gzip")

    def test_already_compressed_response_not_double_compressed(self):
        from django.http import HttpResponse

        from django.middleware.gzip import GZipMiddleware

        content = "z" * 5000
        def get_response(request):
            return HttpResponse(
                    content, content_type="application/json"
                )
        middleware = GZipMiddleware(get_response)

        request = self.factory.get(
            "/api/test/",
            HTTP_ACCEPT_ENCODING="gzip",
        )

        response = middleware(request)
        first_encoding = response.get("Content-Encoding")

        # Run through middleware again - should not double-compress
        response2 = middleware(request)
        self.assertEqual(response2.get("Content-Encoding"), first_encoding)

    def test_json_api_response_compressed(self):
        from django.http import HttpResponse

        from django.middleware.gzip import GZipMiddleware

        import json

        large_payload = json.dumps({"data": list(range(1000))})
        def get_response(request):
            return HttpResponse(
                    large_payload, content_type="application/json"
                )
        middleware = GZipMiddleware(get_response)

        request = self.factory.get(
            "/api/contracts/",
            HTTP_ACCEPT_ENCODING="gzip",
        )
        response = middleware(request)

        self.assertEqual(response.get("Content-Encoding"), "gzip")
        decompressed = zlib.decompress(response.content, zlib.MAX_WBITS | 16)
        import json as json_mod

        self.assertEqual(json_mod.loads(decompressed.decode()), json.loads(large_payload))
