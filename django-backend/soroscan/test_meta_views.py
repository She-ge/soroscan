import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def standard_user(db):
    return User.objects.create_user(username="testuser", password="password")

@pytest.fixture
def admin_user(db):
    return User.objects.create_user(username="adminuser", password="password", is_staff=True)

class TestDbPoolStatsView:
    def test_unauthenticated_access_denied(self, api_client):
        response = api_client.get("/api/meta/db-pool/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_non_admin_access_denied(self, api_client, standard_user):
        api_client.force_authenticate(user=standard_user)
        response = api_client.get("/api/meta/db-pool/")
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.json().get("detail") == "Admin access required."

    def test_admin_access_allowed_and_returns_stats(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        response = api_client.get("/api/meta/db-pool/")
        assert response.status_code == status.HTTP_200_OK
        
        data = response.json()
        
        # Verify all expected keys are present
        assert "total" in data
        assert "active" in data
        assert "idle" in data
        assert "wait_queue" in data
        
        # Verify the values are integers
        assert isinstance(data["total"], int)
        assert isinstance(data["active"], int)
        assert isinstance(data["idle"], int)
        assert isinstance(data["wait_queue"], int)
