"""
JWT authentication acceptance-criteria tests.

Covers:
- POST /api/ingest/record/ returns 401 without a valid token
- GET /api/ingest/events/ returns 200 without authentication
- POST /api/token/ returns access + refresh tokens for valid credentials
- GraphQL mutations reject unauthenticated requests with a descriptive error
- Token secret is sourced from SECRET_KEY (signing key round-trip)
"""
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()


class JwtAuthAcceptanceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="indexer", password="securepassword123"
        )

    # ------------------------------------------------------------------
    # AC1: POST /api/ingest/record/ returns 401 without a valid token
    # ------------------------------------------------------------------
    def test_record_event_unauthenticated_returns_401(self):
        url = reverse("record-event")
        response = self.client.post(
            url,
            data={"contract_id": "CABC", "event_type": "swap", "payload_hash": "a" * 64},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    def test_record_event_invalid_token_returns_401(self):
        url = reverse("record-event")
        self.client.credentials(HTTP_AUTHORIZATION="Bearer not.a.valid.token")
        response = self.client.post(
            url,
            data={"contract_id": "CABC", "event_type": "swap", "payload_hash": "a" * 64},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    # ------------------------------------------------------------------
    # AC2: GET /api/ingest/events/ returns 200 without authentication
    # ------------------------------------------------------------------
    def test_list_events_unauthenticated_returns_200(self):
        url = reverse("event-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

    # ------------------------------------------------------------------
    # AC3: POST /api/token/ returns access + refresh for valid credentials
    # ------------------------------------------------------------------
    def test_token_obtain_returns_access_and_refresh(self):
        url = reverse("token_obtain_pair")
        response = self.client.post(
            url,
            data={"username": "indexer", "password": "securepassword123"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access", data)
        self.assertIn("refresh", data)

    def test_token_obtain_invalid_credentials_returns_401(self):
        url = reverse("token_obtain_pair")
        response = self.client.post(
            url,
            data={"username": "indexer", "password": "wrong"},
            format="json",
        )
        self.assertEqual(response.status_code, 401)

    # ------------------------------------------------------------------
    # AC4: Valid JWT allows POST /api/ingest/record/ (returns non-401)
    # ------------------------------------------------------------------
    def test_record_event_with_valid_token_not_401(self):
        """A valid JWT bypasses auth (may still 400/500 due to no Soroban client)."""
        token = AccessToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        url = reverse("record-event")
        response = self.client.post(
            url,
            data={"contract_id": "CABC", "event_type": "swap", "payload_hash": "a" * 64},
            format="json",
        )
        self.assertNotEqual(response.status_code, 401)

    # ------------------------------------------------------------------
    # AC5: Token secret sourced from SECRET_KEY (signing round-trip)
    # ------------------------------------------------------------------
    def test_token_signed_with_secret_key(self):
        """AccessToken can be decoded using the configured SECRET_KEY."""
        from rest_framework_simplejwt.backends import TokenBackend
        from rest_framework_simplejwt.settings import api_settings

        token = AccessToken.for_user(self.user)
        backend = TokenBackend(
            algorithm=api_settings.ALGORITHM,
            signing_key=settings.SECRET_KEY,
        )
        # decode raises if the key is wrong
        payload = backend.decode(str(token))
        self.assertEqual(payload["user_id"], self.user.pk)

    # ------------------------------------------------------------------
    # AC6: Token refresh endpoint works
    # ------------------------------------------------------------------
    def test_token_refresh_returns_new_access_token(self):
        obtain_url = reverse("token_obtain_pair")
        resp = self.client.post(
            obtain_url,
            data={"username": "indexer", "password": "securepassword123"},
            format="json",
        )
        refresh_token = resp.json()["refresh"]

        refresh_url = reverse("token_refresh")
        resp2 = self.client.post(
            refresh_url, data={"refresh": refresh_token}, format="json"
        )
        self.assertEqual(resp2.status_code, 200)
        self.assertIn("access", resp2.json())


class GraphQLMutationAuthTests(TestCase):
    """GraphQL mutations must reject unauthenticated requests with a descriptive error.

    The /graphql/ endpoint is excluded from the test URL config due to a GDAL
    incompatibility, so we test the permission decorator directly.
    """

    def test_register_contract_mutation_requires_auth(self):
        """permission_classes([IsAuthenticated]) raises on unauthenticated info."""
        from unittest.mock import MagicMock
        from soroscan.graphql_extensions import IsAuthenticated, permission_classes

        # Build a minimal info mock where request.user is AnonymousUser
        from django.contrib.auth.models import AnonymousUser

        request = MagicMock()
        request.user = AnonymousUser()
        info = MagicMock()
        info.context = MagicMock()
        info.context.request = request

        @permission_classes([IsAuthenticated])
        def mock_mutation(root, info, **kwargs):
            return "should_not_reach"

        with self.assertRaises(Exception) as ctx:
            mock_mutation(None, info)

        self.assertIn("Permission denied", str(ctx.exception))

    def test_register_contract_mutation_succeeds_with_auth(self):
        """permission_classes([IsAuthenticated]) passes for an authenticated user."""
        from unittest.mock import MagicMock
        from django.contrib.auth import get_user_model
        from soroscan.graphql_extensions import IsAuthenticated, permission_classes

        User = get_user_model()
        user = User.objects.create_user(username="gqluser", password="pass")

        request = MagicMock()
        request.user = user
        info = MagicMock()
        info.context = MagicMock()
        info.context.request = request

        @permission_classes([IsAuthenticated])
        def mock_mutation(root, info, **kwargs):
            return "ok"

        result = mock_mutation(None, info)
        self.assertEqual(result, "ok")
