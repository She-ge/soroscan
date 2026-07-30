import hashlib
import hmac

import pytest
from django.http import HttpRequest, JsonResponse
from django.test import RequestFactory, override_settings

from soroscan.ingest.decorators import validate_webhook_signature


SECRET = "test-webhook-secret-1234"
FACTORY = RequestFactory()


def _sign(body: bytes, secret: str = SECRET, algorithm: str = "sha256") -> str:
    digestmod = hashlib.sha256 if algorithm == "sha256" else hashlib.sha1
    sig = hmac.new(secret.encode("utf-8"), msg=body, digestmod=digestmod).hexdigest()
    return f"{algorithm}={sig}"


def _view(request):
    return JsonResponse({"ok": True})


class TestValidateWebhookSignature:
    def test_valid_sha256_signature(self):
        decorated = validate_webhook_signature(SECRET)(_view)
        body = b'{"event": "test"}'
        sig = _sign(body)
        request = FACTORY.post("/hook", data=body, content_type="application/json")
        request.META["HTTP_X_SCOROSCAN_SIGNATURE"] = sig
        response = decorated(request)
        assert response.status_code == 200

    def test_valid_sha1_signature(self):
        decorated = validate_webhook_signature(SECRET)(_view)
        body = b'{"event": "test"}'
        sig = _sign(body, algorithm="sha1")
        request = FACTORY.post("/hook", data=body, content_type="application/json")
        request.META["HTTP_X_SCOROSCAN_SIGNATURE"] = sig
        response = decorated(request)
        assert response.status_code == 200

    def test_missing_signature_header_returns_401(self):
        decorated = validate_webhook_signature(SECRET)(_view)
        request = FACTORY.post("/hook", data=b"{}", content_type="application/json")
        response = decorated(request)
        assert response.status_code == 401

    def test_invalid_signature_returns_401(self):
        decorated = validate_webhook_signature(SECRET)(_view)
        request = FACTORY.post("/hook", data=b'{"event": "test"}', content_type="application/json")
        request.META["HTTP_X_SCOROSCAN_SIGNATURE"] = "sha256=0000000000000000000000000000000000000000000000000000000000000000"
        response = decorated(request)
        assert response.status_code == 401

    def test_malformed_signature_returns_401(self):
        decorated = validate_webhook_signature(SECRET)(_view)
        request = FACTORY.post("/hook", data=b"{}", content_type="application/json")
        request.META["HTTP_X_SCOROSCAN_SIGNATURE"] = "no-equals-sign"
        response = decorated(request)
        assert response.status_code == 401

    def test_unsupported_algorithm_returns_401(self):
        decorated = validate_webhook_signature(SECRET)(_view)
        request = FACTORY.post("/hook", data=b"{}", content_type="application/json")
        request.META["HTTP_X_SCOROSCAN_SIGNATURE"] = "sha512=abcdef"
        response = decorated(request)
        assert response.status_code == 401

    def test_empty_secret_skips_validation(self):
        decorated = validate_webhook_signature("")(_view)
        request = FACTORY.post("/hook", data=b"{}", content_type="application/json")
        response = decorated(request)
        assert response.status_code == 200

    def test_callable_secret(self):
        def get_secret(request):
            return SECRET

        decorated = validate_webhook_signature(get_secret)(_view)
        body = b'{"data": 1}'
        sig = _sign(body)
        request = FACTORY.post("/hook", data=body, content_type="application/json")
        request.META["HTTP_X_SCOROSCAN_SIGNATURE"] = sig
        response = decorated(request)
        assert response.status_code == 200

    def test_callable_secret_returning_empty_skips_validation(self):
        decorated = validate_webhook_signature(lambda r: "")(_view)
        request = FACTORY.post("/hook", data=b"{}", content_type="application/json")
        response = decorated(request)
        assert response.status_code == 200

    def test_custom_header_name(self):
        decorated = validate_webhook_signature(SECRET, header="X-Custom-Sig")(_view)
        body = b"test"
        sig = _sign(body)
        request = FACTORY.post("/hook", data=body, content_type="text/plain")
        request.META["HTTP_X_CUSTOM_SIG"] = sig
        response = decorated(request)
        assert response.status_code == 200

    def test_custom_header_name_missing_returns_401(self):
        decorated = validate_webhook_signature(SECRET, header="X-Custom-Sig")(_view)
        request = FACTORY.post("/hook", data=b"test", content_type="text/plain")
        response = decorated(request)
        assert response.status_code == 401

    def test_preserves_view_function_name(self):
        decorated = validate_webhook_signature(SECRET)(_view)
        assert decorated.__name__ == "_view"

    def test_empty_body(self):
        decorated = validate_webhook_signature(SECRET)(_view)
        body = b""
        sig = _sign(body)
        request = FACTORY.post("/hook", data=body, content_type="application/octet-stream")
        request.META["HTTP_X_SCOROSCAN_SIGNATURE"] = sig
        response = decorated(request)
        assert response.status_code == 200

    def test_signature_with_whitespace_in_algorithm(self):
        decorated = validate_webhook_signature(SECRET)(_view)
        body = b"test"
        sig = _sign(body)
        request = FACTORY.post("/hook", data=body, content_type="text/plain")
        request.META["HTTP_X_SCOROSCAN_SIGNATURE"] = f"  sha256  ={sig.split('=', 1)[1]}"
        response = decorated(request)
        assert response.status_code == 200
