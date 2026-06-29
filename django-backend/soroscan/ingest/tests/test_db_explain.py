"""Tests for EXPLAIN ANALYZE endpoint (issue #491)."""
import json

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from soroscan.ingest.views import db_explain_view


class DBExplainViewTest(TestCase):
    """Verify the /api/admin/db/explain/ endpoint."""

    def setUp(self):
        self.factory = APIRequestFactory()
        self.admin_user = User.objects.create_superuser(
            username="admin", password="pass", email="admin@test.com"
        )
        self.regular_user = User.objects.create_user(
            username="regular", password="pass", email="regular@test.com"
        )

    def test_admin_can_explain_simple_select(self):
        request = self.factory.post(
            "/api/admin/db/explain/",
            data=json.dumps({"query": "SELECT 1"}),
            content_type="application/json",
        )
        force_authenticate(request, user=self.admin_user)
        response = db_explain_view(request)

        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertIn("query_plan", data)
        self.assertIsInstance(data["query_plan"], str)

    def test_admin_can_explain_analyze(self):
        request = self.factory.post(
            "/api/admin/db/explain/",
            data=json.dumps({"query": "SELECT 1", "analyze": True}),
            content_type="application/json",
        )
        force_authenticate(request, user=self.admin_user)
        response = db_explain_view(request)

        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertIn("query_plan", data)

    def test_regular_user_rejected(self):
        request = self.factory.post(
            "/api/admin/db/explain/",
            data=json.dumps({"query": "SELECT 1"}),
            content_type="application/json",
        )
        force_authenticate(request, user=self.regular_user)
        response = db_explain_view(request)

        self.assertEqual(response.status_code, 403)

    def test_anonymous_user_rejected(self):
        request = self.factory.post(
            "/api/admin/db/explain/",
            data=json.dumps({"query": "SELECT 1"}),
            content_type="application/json",
        )
        response = db_explain_view(request)

        self.assertIn(response.status_code, [401, 403])

    def test_missing_query_returns_400(self):
        request = self.factory.post(
            "/api/admin/db/explain/",
            data=json.dumps({}),
            content_type="application/json",
        )
        force_authenticate(request, user=self.admin_user)
        response = db_explain_view(request)

        self.assertEqual(response.status_code, 400)

    def test_rejects_non_select_statements(self):
        dangerous_queries = [
            "DROP TABLE ingest_trackedcontract;",
            "DELETE FROM ingest_contractevent;",
            "UPDATE ingest_trackedcontract SET name='hacked';",
            "INSERT INTO ingest_contractevent (event_type) VALUES ('evil');",
            "TRUNCATE TABLE ingest_contractevent;",
            "ALTER TABLE ingest_trackedcontract ADD COLUMN evil BOOL;",
            "CREATE TABLE evil (id INT);",
            "GRANT ALL ON ALL TABLES IN SCHEMA public TO public;",
        ]
        for sql in dangerous_queries:
            request = self.factory.post(
                "/api/admin/db/explain/",
                data=json.dumps({"query": sql}),
                content_type="application/json",
            )
            force_authenticate(request, user=self.admin_user)
            response = db_explain_view(request)
            self.assertEqual(
                response.status_code,
                400,
                f"Should reject: {sql[:40]}",
            )

    def test_rejects_empty_string_query(self):
        request = self.factory.post(
            "/api/admin/db/explain/",
            data=json.dumps({"query": ""}),
            content_type="application/json",
        )
        force_authenticate(request, user=self.admin_user)
        response = db_explain_view(request)
        self.assertEqual(response.status_code, 400)

    def test_select_with_rejects_mixed(self):
        request = self.factory.post(
            "/api/admin/db/explain/",
            data=json.dumps({"query": "SELECT 1; DROP TABLE foo"}),
            content_type="application/json",
        )
        force_authenticate(request, user=self.admin_user)
        response = db_explain_view(request)
        self.assertEqual(response.status_code, 400)

    def test_with_clause_allowed(self):
        request = self.factory.post(
            "/api/admin/db/explain/",
            data=json.dumps({"query": "WITH cte AS (SELECT 1) SELECT * FROM cte"}),
            content_type="application/json",
        )
        force_authenticate(request, user=self.admin_user)
        response = db_explain_view(request)
        self.assertEqual(response.status_code, 200)
