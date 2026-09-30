"""Tests for bounds on the ``limit`` query parameter (issue #1490).

``limit`` was read three different ways across the API, and each way had a
different failure mode:

* ``analytics/top_contracts`` called ``int()`` on the raw value with no guard,
  so ``?limit=abc`` raised ``ValueError`` and ``?limit=-5`` reached Django as
  ``qs[:-5]`` and raised ``ValueError: Negative indexing is not supported.``
  Both surfaced as **500**, not 400.
* ``audit-trail`` and ``dead-letter-queue/`` clamped into range and substituted
  the default on error, so ``?limit=abc`` answered **200** with the default row
  count and ``?limit=999`` answered **200** having quietly returned fewer rows
  than were asked for.

All three now go through ``views._parse_limit``, which rejects anything outside
``1..MAX_LIMIT`` with a 400.
"""
import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from soroscan.ingest.models import EventAggregation
from soroscan.ingest.views import MAX_LIMIT

from .factories import (
    TrackedContractFactory,
    UserFactory,
    WebhookDeadLetterFactory,
)

# Values that are not a usable row count. Each one produced either a 500 or a
# silently-wrong 200 before MAX_LIMIT was enforced.
INVALID_LIMITS = ["abc", "", " ", "1.5", "1e3", "10; DROP TABLE x", "-1", "-5", "0"]
OUT_OF_RANGE_LIMITS = [str(MAX_LIMIT + 1), "999", "10000"]


def _bucket():
    """Start of the current hour, matching EventAggregation's bucketing."""
    return timezone.now().replace(minute=0, second=0, microsecond=0)


@pytest.fixture
def staff_client():
    api_client = APIClient()
    api_client.force_authenticate(user=UserFactory(is_staff=True))
    return api_client


def _seed_contracts(owner, count):
    bucket = _bucket()
    for _ in range(count):
        contract = TrackedContractFactory(owner=owner)
        EventAggregation.objects.create(
            contract=contract, event_type="", timestamp=bucket, event_count=5
        )


@pytest.fixture
def endpoint(request, api_client, user):
    """Resolve a parametrized url name to ``(url_name, client)``.

    ``dead-letter-queue/`` is staff-only while the other two accept any
    authenticated user, so the client has to depend on the endpoint under test.
    """
    if request.param == "dlq-list":
        client = APIClient()
        client.force_authenticate(user=UserFactory(is_staff=True))
        return request.param, client
    api_client.force_authenticate(user=user)
    return request.param, api_client


LIMIT_ENDPOINTS = ["analytics-top-contracts", "audit-trail", "dlq-list"]


# ---------------------------------------------------------------------------
# The shared bounds
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestLimitBounds:
    """Boundary behaviour, asserted identically for every endpoint that takes
    a ``limit``. The three endpoints differ in their default page size but
    share one ceiling, so the contract is the same for all of them."""

    @pytest.mark.parametrize("endpoint", LIMIT_ENDPOINTS, indirect=True)
    def test_ceiling_is_accepted(self, endpoint):
        """MAX_LIMIT itself is inside the allowed range."""
        url_name, client = endpoint
        response = client.get(reverse(url_name), {"limit": str(MAX_LIMIT)})
        assert response.status_code == status.HTTP_200_OK

    @pytest.mark.parametrize("endpoint", LIMIT_ENDPOINTS, indirect=True)
    @pytest.mark.parametrize("bad", OUT_OF_RANGE_LIMITS)
    def test_above_ceiling_returns_400(self, endpoint, bad):
        """Acceptance criterion: a limit above the cap is rejected, not clamped."""
        url_name, client = endpoint
        response = client.get(reverse(url_name), {"limit": bad})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.parametrize("endpoint", LIMIT_ENDPOINTS, indirect=True)
    @pytest.mark.parametrize("bad", INVALID_LIMITS)
    def test_invalid_limit_returns_400_not_500(self, endpoint, bad):
        """Non-integer, zero and negative values are 400s.

        ``top_contracts`` used to return 500 for every one of these.
        """
        url_name, client = endpoint
        response = client.get(reverse(url_name), {"limit": bad})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    @pytest.mark.parametrize("endpoint", LIMIT_ENDPOINTS, indirect=True)
    def test_error_names_the_limit_parameter(self, endpoint):
        """The 400 body points at the offending parameter, matching the
        ``page_size`` errors the pagination class already returns."""
        url_name, client = endpoint
        response = client.get(reverse(url_name), {"limit": "abc"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "limit" in response.data

    @pytest.mark.parametrize("endpoint", LIMIT_ENDPOINTS, indirect=True)
    def test_absent_limit_uses_default(self, endpoint):
        """Omitting ``limit`` is not an error and must not be validated."""
        url_name, client = endpoint
        response = client.get(reverse(url_name))
        assert response.status_code == status.HTTP_200_OK


# ---------------------------------------------------------------------------
# analytics/top_contracts — the endpoint that was returning 500
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestTopContractsLimit:
    def test_negative_limit_was_a_500_and_is_now_a_400(self, authenticated_client, user):
        """Regression guard for the reported defect.

        ``min(int(limit), 100)`` let a negative through, and slicing the
        annotated queryset as ``qs[:-1]`` raised inside the view. DRF turned
        that into a 500; it is now a 400 raised before the query is built.
        """
        _seed_contracts(user, 3)
        response = authenticated_client.get(
            reverse("analytics-top-contracts"), {"limit": -1}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_non_numeric_limit_was_a_500_and_is_now_a_400(self, authenticated_client, user):
        _seed_contracts(user, 3)
        response = authenticated_client.get(
            reverse("analytics-top-contracts"), {"limit": "ten"}
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_valid_limit_truncates_results(self, authenticated_client, user):
        _seed_contracts(user, 5)
        response = authenticated_client.get(
            reverse("analytics-top-contracts"), {"limit": 3}
        )
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["contracts"]) == 3

    def test_default_limit_is_unchanged(self, authenticated_client, user):
        """The issue excludes changing the default page size, so the default
        of 10 still applies and now bounds the result set."""
        _seed_contracts(user, 12)
        response = authenticated_client.get(reverse("analytics-top-contracts"))
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["contracts"]) == 10


# ---------------------------------------------------------------------------
# audit-trail
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAuditTrailLimit:
    def test_valid_limit_truncates_results(self, authenticated_client, user):
        from soroscan.ingest.models import AdminAction

        for _ in range(5):
            AdminAction.objects.create(
                user=user, action="update", object_type="contract", object_id="C1"
            )

        response = authenticated_client.get(reverse("audit-trail"), {"limit": 2})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2

    def test_invalid_limit_no_longer_silently_returns_the_default(self, authenticated_client, user):
        """``?limit=abc`` used to answer 200 with 100 rows, hiding the typo."""
        response = authenticated_client.get(reverse("audit-trail"), {"limit": "abc"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# dead-letter-queue
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestDlqListLimit:
    def test_requires_staff(self, authenticated_client):
        response = authenticated_client.get(reverse("dlq-list"))
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_valid_limit_truncates_results(self, staff_client):
        for _ in range(5):
            WebhookDeadLetterFactory()

        response = staff_client.get(reverse("dlq-list"), {"limit": 2})
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2

    def test_above_ceiling_returns_400(self, staff_client):
        """The old ceiling was 500; it is now the shared ``MAX_LIMIT``."""
        for _ in range(3):
            WebhookDeadLetterFactory()

        response = staff_client.get(reverse("dlq-list"), {"limit": 999})
        assert response.status_code == status.HTTP_400_BAD_REQUEST
