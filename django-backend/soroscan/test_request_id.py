import pytest
from django.urls import path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import exceptions
from rest_framework.test import APIClient
import logging
from soroscan.log_context import LogContextFilter

logger = logging.getLogger(__name__)

@api_view(["GET"])
@permission_classes([AllowAny])
def dummy_success_view(request):
    logger.info("Handling dummy success view")
    return Response({"status": "ok"})

@api_view(["GET"])
@permission_classes([AllowAny])
def dummy_error_view(request):
    raise exceptions.ValidationError({"detail": "Bad Request"})

urlpatterns = [
    path("test-success/", dummy_success_view),
    path("test-error/", dummy_error_view),
]

@pytest.mark.urls(__name__)
class TestRequestIdTracking:
    def setup_method(self):
        self.client = APIClient()

    def test_request_id_generated_when_not_provided(self):
        response = self.client.get("/test-success/")
        assert response.status_code == 200
        # Check header
        request_id = response.headers.get("X-Request-ID")
        assert request_id is not None
        # It's generated as uuid.uuid4().hex, let's check it's length 32
        assert len(request_id) == 32

    def test_request_id_preserved_when_provided(self):
        custom_id = "custom-req-id-123"
        response = self.client.get("/test-success/", HTTP_X_REQUEST_ID=custom_id)
        assert response.status_code == 200
        assert response.headers.get("X-Request-ID") == custom_id

    def test_error_response_contains_request_id(self):
        response = self.client.get("/test-error/")
        assert response.status_code == 400
        data = response.json()
        assert "request_id" in data
        assert response.headers.get("X-Request-ID") == data["request_id"]
        assert len(data["request_id"]) == 32

    def test_error_response_preserves_provided_request_id(self):
        custom_id = "custom-req-id-error"
        response = self.client.get("/test-error/", HTTP_X_REQUEST_ID=custom_id)
        assert response.status_code == 400
        data = response.json()
        assert data.get("request_id") == custom_id
        assert response.headers.get("X-Request-ID") == custom_id

    def test_request_id_in_logs(self, caplog):
        caplog.handler.addFilter(LogContextFilter())
        with caplog.at_level(logging.INFO):
            custom_id = "log-req-id-123"
            response = self.client.get("/test-success/", HTTP_X_REQUEST_ID=custom_id)
            assert response.status_code == 200
            
            # Find the log record
            log_record = next((r for r in caplog.records if r.message == "Handling dummy success view"), None)
            assert log_record is not None
            assert hasattr(log_record, "request_id")
            assert log_record.request_id == custom_id

