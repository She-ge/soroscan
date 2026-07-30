import pytest
from django.urls import reverse
from rest_framework import status

from .factories import UserFactory, WebhookDeliveryLogFactory


@pytest.fixture
def api_client():
    from rest_framework.test import APIClient

    return APIClient()


@pytest.fixture
def authenticated_client(api_client):
    user = UserFactory()
    api_client.force_authenticate(user=user)
    return api_client


@pytest.mark.django_db
class TestWebhookDeliveryMetrics:
    def test_requires_authentication(self, api_client):
        url = reverse("webhook-delivery-metrics")
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_returns_metrics_and_recent_deliveries(self, authenticated_client):
        # Create deliveries: two successes and one failure
        WebhookDeliveryLogFactory(success=True, status_code=200, latency_ms=120)
        WebhookDeliveryLogFactory(success=True, status_code=201, latency_ms=80)
        WebhookDeliveryLogFactory(success=False, status_code=500, error="timeout")

        url = reverse("webhook-delivery-metrics")
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert data["total_deliveries"] == 3
        assert data["success_count"] == 2
        assert data["success_rate_percent"] == pytest.approx((2 / 3) * 100.0)
        assert isinstance(data["avg_latency_ms"], float) or isinstance(data["avg_latency_ms"], int)
        assert len(data["recent_deliveries"]) >= 3
        # ensure failure breakdown includes the 500 status
        codes = {item["code"] for item in data["failure_breakdown"]}
        assert "500" in codes
