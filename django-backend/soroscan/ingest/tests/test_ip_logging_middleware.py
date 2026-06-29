"""
Tests for ClientIPLoggingMiddleware (issue #426).
"""
import logging

from django.test import RequestFactory

from soroscan.middleware import ClientIPLoggingMiddleware


def _make_response():
    from django.http import HttpResponse
    return HttpResponse("ok")


def _noop(request):
    return _make_response()


class TestClientIPLoggingMiddleware:
    def setup_method(self):
        self.factory = RequestFactory()
        self.middleware = ClientIPLoggingMiddleware(_noop)

    def test_logs_method_path_and_ip(self, caplog):
        request = self.factory.get("/api/ingest/contracts/")
        request.META["REMOTE_ADDR"] = "203.0.113.42"
        with caplog.at_level(logging.INFO, logger="soroscan.ip_access"):
            self.middleware(request)
        assert any(
            "203.0.113.42" in r.message and "GET" in r.message and "/api/ingest/contracts/" in r.message
            for r in caplog.records
        )

    def test_logs_post_request(self, caplog):
        request = self.factory.post("/api/ingest/record/", data={})
        request.META["REMOTE_ADDR"] = "10.0.0.1"
        with caplog.at_level(logging.INFO, logger="soroscan.ip_access"):
            self.middleware(request)
        assert any("POST" in r.message and "10.0.0.1" in r.message for r in caplog.records)

    def test_static_files_not_logged(self, caplog):
        for path in ("/static/app.js", "/media/image.png", "/favicon.ico"):
            request = self.factory.get(path)
            request.META["REMOTE_ADDR"] = "1.2.3.4"
            with caplog.at_level(logging.INFO, logger="soroscan.ip_access"):
                self.middleware(request)
        assert not any(r.name == "soroscan.ip_access" for r in caplog.records)

    def test_unknown_ip_fallback(self, caplog):
        request = self.factory.get("/api/health/")
        request.META.pop("REMOTE_ADDR", None)
        with caplog.at_level(logging.INFO, logger="soroscan.ip_access"):
            self.middleware(request)
        assert any("unknown" in r.message for r in caplog.records)

    def test_extra_fields_attached(self, caplog):
        request = self.factory.get("/api/ingest/events/")
        request.META["REMOTE_ADDR"] = "192.168.1.5"
        with caplog.at_level(logging.INFO, logger="soroscan.ip_access"):
            self.middleware(request)
        record = next(r for r in caplog.records if r.name == "soroscan.ip_access")
        assert record.client_ip == "192.168.1.5"
        assert record.method == "GET"
        assert record.path == "/api/ingest/events/"

    def test_proxy_ip_used_after_remote_addr_override(self, caplog):
        """Simulate ReverseProxyFixedIPMiddleware having already set REMOTE_ADDR."""
        request = self.factory.get("/api/ingest/contracts/")
        request.META["REMOTE_ADDR"] = "185.220.101.1"  # already resolved from X-Forwarded-For
        with caplog.at_level(logging.INFO, logger="soroscan.ip_access"):
            self.middleware(request)
        assert any("185.220.101.1" in r.message for r in caplog.records)
