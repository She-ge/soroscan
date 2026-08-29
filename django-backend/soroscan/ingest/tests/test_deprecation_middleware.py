import pytest
from django.test import RequestFactory, override_settings
from django.http import HttpResponse

from soroscan.middleware import ApiDeprecationMiddleware


DEPRECATED_CONFIG = {
    "/api/audit-trail/": {
        "sunset": "2026-12-31",
        "replacement": "/graphql/",
    }
}


@pytest.fixture
def rf():
    return RequestFactory()


@pytest.fixture
def get_response():
    return lambda req: HttpResponse("OK")


@override_settings(DEPRECATED_ENDPOINTS=DEPRECATED_CONFIG)
def test_deprecated_endpoint_injects_headers(rf, get_response):
    request = rf.get("/api/audit-trail/")
    response = ApiDeprecationMiddleware(get_response)(request)

    assert response["Deprecation"] == "true"
    assert response["Sunset"] == "2026-12-31"
    assert response["Link"] == '</graphql/>; rel="alternate"'


@override_settings(DEPRECATED_ENDPOINTS=DEPRECATED_CONFIG)
def test_non_deprecated_endpoint_has_no_deprecation_headers(rf, get_response):
    request = rf.get("/api/ingest/events/")
    response = ApiDeprecationMiddleware(get_response)(request)

    assert "Deprecation" not in response
    assert "Sunset" not in response
    assert "Link" not in response


@override_settings(DEPRECATED_ENDPOINTS={})
def test_empty_deprecated_endpoints_no_headers(rf, get_response):
    request = rf.get("/api/audit-trail/")
    response = ApiDeprecationMiddleware(get_response)(request)

    assert "Deprecation" not in response


@override_settings(DEPRECATED_ENDPOINTS=DEPRECATED_CONFIG)
def test_path_matching_is_slash_tolerant(rf, get_response):
    """Paths with or without trailing slashes should still match."""
    request = rf.get("/api/audit-trail")
    response = ApiDeprecationMiddleware(get_response)(request)

    assert response["Deprecation"] == "true"


@override_settings(DEPRECATED_ENDPOINTS=DEPRECATED_CONFIG)
def test_response_body_is_unaffected(rf, get_response):
    request = rf.get("/api/audit-trail/")
    response = ApiDeprecationMiddleware(get_response)(request)

    assert response.status_code == 200
    assert response.content == b"OK"
