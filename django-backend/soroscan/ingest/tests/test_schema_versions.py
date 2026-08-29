"""
Tests for the supported event schema (ABI) versions endpoint.
"""
import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestSchemaVersionsEndpoint:
    """Test GET /api/schema/versions/."""

    def test_endpoint_returns_200(self):
        client = APIClient()
        response = client.get("/api/schema/versions/")
        assert response.status_code == 200

    def test_response_structure(self):
        client = APIClient()
        response = client.get("/api/schema/versions/")

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        assert "versions" in data
        assert "latest" in data
        assert "count" in data

    def test_versions_is_a_list_of_entries(self):
        client = APIClient()
        response = client.get("/api/schema/versions/")

        data = response.json()
        assert isinstance(data["versions"], list)
        assert len(data["versions"]) >= 1
        for entry in data["versions"]:
            assert set(entry.keys()) == {"version", "name", "description", "status"}
            assert isinstance(entry["version"], int)
            assert isinstance(entry["name"], str)
            assert isinstance(entry["description"], str)
            assert isinstance(entry["status"], str)

    def test_latest_matches_max_version(self):
        client = APIClient()
        response = client.get("/api/schema/versions/")

        data = response.json()
        versions = [entry["version"] for entry in data["versions"]]
        assert data["latest"] == max(versions)

    def test_count_matches_versions_length(self):
        client = APIClient()
        response = client.get("/api/schema/versions/")

        data = response.json()
        assert data["count"] == len(data["versions"])

    def test_endpoint_is_publicly_accessible(self):
        client = APIClient()
        response = client.get("/api/schema/versions/")
        assert response.status_code == 200

    def test_endpoint_supports_get_only(self):
        client = APIClient()
        assert client.post("/api/schema/versions/", {}).status_code == 405
        assert client.put("/api/schema/versions/", {}).status_code == 405
        assert client.delete("/api/schema/versions/").status_code == 405

    def test_returns_json_content_type(self):
        client = APIClient()
        response = client.get("/api/schema/versions/")
        assert response["Content-Type"] == "application/json"
