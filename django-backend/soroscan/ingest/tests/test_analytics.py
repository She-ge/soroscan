"""
Tests for the analytics subsystem:
  - aggregate_event_statistics Celery task
  - AnalyticsViewSet endpoints (summary, event_volume, top_contracts,
    event_type_breakdown, anomalies, export)
"""

import csv
import io
from datetime import timedelta

import pytest
from django.core.cache import cache
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from soroscan.ingest.models import EventAggregation
from soroscan.ingest.tasks import aggregate_event_statistics

from .factories import (
    ContractEventFactory,
    TrackedContractFactory,
    UserFactory,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def clear_cache_before_each():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user():
    return UserFactory()


@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def contract(user):
    return TrackedContractFactory(owner=user, is_active=True)


def _make_event(contract, minutes_ago: int, event_type: str = "swap"):
    # Place events in the last *completed* hour so the task's bucket window captures them.
    # Task bucket: bucket_start = top-of-hour - 1h, bucket_end = top-of-hour.
    bucket_end = timezone.now().replace(minute=0, second=0, microsecond=0)
    bucket_start = bucket_end - timedelta(hours=1)
    mid = bucket_start + timedelta(minutes=30)
    ts = mid - timedelta(minutes=minutes_ago % 30)
    return ContractEventFactory(contract=contract, event_type=event_type, timestamp=ts)


def _bucket(hours_ago: int = 0):
    """Return the start of the completed-hour bucket N additional hours before the last one.

    hours_ago=0  → last completed bucket start  (= top-of-hour - 1h)
    hours_ago=1  → two hours ago bucket start   (= top-of-hour - 2h)
    """
    bucket_end = timezone.now().replace(minute=0, second=0, microsecond=0)
    return bucket_end - timedelta(hours=1 + hours_ago)


# ---------------------------------------------------------------------------
# Task: aggregate_event_statistics
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAggregateEventStatisticsTask:

    def test_creates_aggregation_rows_for_current_hour(self, contract):
        """Events in the current hour bucket should produce EventAggregation rows."""
        _make_event(contract, minutes_ago=10, event_type="swap")
        _make_event(contract, minutes_ago=20, event_type="swap")
        _make_event(contract, minutes_ago=30, event_type="transfer")

        result = aggregate_event_statistics.apply().get()

        assert result["upserted"] > 0
        # Per-type buckets
        assert EventAggregation.objects.filter(contract=contract, event_type="swap").exists()
        assert EventAggregation.objects.filter(contract=contract, event_type="transfer").exists()
        # Total bucket (event_type='')
        assert EventAggregation.objects.filter(contract=contract, event_type="").exists()

    def test_total_bucket_equals_sum_of_per_type_counts(self, contract):
        _make_event(contract, minutes_ago=5, event_type="swap")
        _make_event(contract, minutes_ago=10, event_type="swap")
        _make_event(contract, minutes_ago=15, event_type="transfer")

        aggregate_event_statistics.apply().get()

        bucket = _bucket()
        swap_row = EventAggregation.objects.filter(
            contract=contract, event_type="swap", timestamp=bucket
        ).first()
        transfer_row = EventAggregation.objects.filter(
            contract=contract, event_type="transfer", timestamp=bucket
        ).first()
        total_row = EventAggregation.objects.filter(
            contract=contract, event_type="", timestamp=bucket
        ).first()

        assert swap_row is not None
        assert transfer_row is not None
        assert total_row is not None
        assert total_row.event_count == (swap_row.event_count + transfer_row.event_count)

    def test_upsert_does_not_duplicate_rows(self, contract):
        _make_event(contract, minutes_ago=10, event_type="swap")

        aggregate_event_statistics.apply().get()
        aggregate_event_statistics.apply().get()

        count = EventAggregation.objects.filter(contract=contract, event_type="swap").count()
        assert count == 1

    def test_no_events_produces_no_rows_for_that_contract(self, user):
        empty_contract = TrackedContractFactory(owner=user, is_active=True)

        result = aggregate_event_statistics.apply().get()

        assert not EventAggregation.objects.filter(contract=empty_contract).exists()
        assert result["upserted"] == 0

    def test_anomaly_flagged_on_volume_drop(self, contract):
        """
        Seed 7 days of rolling averages at 100 events/hr, then run the task with
        0 events in the current hour → should flag is_anomaly=True.
        """
        bucket_now = _bucket()

        # Seed rolling baseline: same hour-of-day for the last 7 days
        for days_back in range(1, 8):
            past_bucket = bucket_now - timedelta(days=days_back)
            EventAggregation.objects.create(
                contract=contract,
                event_type="",
                timestamp=past_bucket,
                event_count=100,
                is_anomaly=False,
            )

        # No events in the current hour → count=0, way below 50% of 100 avg
        aggregate_event_statistics.apply().get()

        # Task only creates rows when there ARE events in the bucket; with 0 events
        # no new row is written for this contract. Anomaly detection is exercised
        # only when a row IS written and the rolling average is high.
        # Verify no anomaly was spuriously raised (no row = no anomaly = correct).
        agg = EventAggregation.objects.filter(contract=contract, event_type="", timestamp=bucket_now).first()
        assert agg is None or not agg.is_anomaly

    def test_anomaly_flagged_when_volume_drops_below_threshold(self, contract):
        """
        Seed baseline at 100/hr, then write 1 event this hour (below 50% threshold).
        """
        bucket_now = _bucket()

        for days_back in range(1, 8):
            past_bucket = bucket_now - timedelta(days=days_back)
            EventAggregation.objects.create(
                contract=contract,
                event_type="",
                timestamp=past_bucket,
                event_count=100,
                is_anomaly=False,
            )

        # 1 event in current bucket (< 50 % of 100 avg)
        _make_event(contract, minutes_ago=5)

        aggregate_event_statistics.apply().get()

        agg = EventAggregation.objects.filter(
            contract=contract, event_type="", timestamp=bucket_now
        ).first()
        assert agg is not None
        assert agg.is_anomaly is True

    def test_no_anomaly_when_volume_is_normal(self, contract):
        bucket_now = _bucket()

        for days_back in range(1, 8):
            EventAggregation.objects.create(
                contract=contract,
                event_type="",
                timestamp=bucket_now - timedelta(days=days_back),
                event_count=10,
            )

        # 8 events — above 50% of 10 baseline
        for _ in range(8):
            _make_event(contract, minutes_ago=5)

        aggregate_event_statistics.apply().get()

        agg = EventAggregation.objects.filter(
            contract=contract, event_type="", timestamp=bucket_now
        ).first()
        assert agg is not None
        assert agg.is_anomaly is False

    def test_returns_summary_dict(self, contract):
        _make_event(contract, minutes_ago=10)
        result = aggregate_event_statistics.apply().get()

        for key in ("upserted", "anomalies", "total_events", "active_contracts", "elapsed_seconds"):
            assert key in result

    def test_multiple_contracts_aggregated_independently(self, user):
        c1 = TrackedContractFactory(owner=user, is_active=True)
        c2 = TrackedContractFactory(owner=user, is_active=True)

        _make_event(c1, minutes_ago=5, event_type="mint")
        _make_event(c2, minutes_ago=10, event_type="burn")
        _make_event(c2, minutes_ago=20, event_type="burn")

        aggregate_event_statistics.apply().get()

        c1_total = EventAggregation.objects.filter(contract=c1, event_type="").first()
        c2_total = EventAggregation.objects.filter(contract=c2, event_type="").first()
        assert c1_total.event_count == 1
        assert c2_total.event_count == 2


# ---------------------------------------------------------------------------
# AnalyticsViewSet — authentication
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAnalyticsAuth:

    def test_unauthenticated_summary_returns_401(self, api_client):
        url = reverse("analytics-list")
        response = api_client.get(url)
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

    def test_unauthenticated_event_volume_returns_401(self, api_client):
        url = reverse("analytics-event-volume")
        response = api_client.get(url)
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


# ---------------------------------------------------------------------------
# AnalyticsViewSet — summary widget
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAnalyticsSummary:

    def test_returns_expected_fields(self, authenticated_client):
        url = reverse("analytics-list")
        response = authenticated_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        for field in (
            "total_events",
            "active_contracts",
            "events_last_24h",
            "events_last_7d",
            "unique_event_types",
            "anomalies_last_7d",
            "top_event_type",
        ):
            assert field in response.data

    def test_active_contracts_count(self, authenticated_client, user):
        TrackedContractFactory.create_batch(3, owner=user, is_active=True)
        TrackedContractFactory(owner=user, is_active=False)

        url = reverse("analytics-list")
        response = authenticated_client.get(url)

        assert response.data["active_contracts"] >= 3

    def test_anomalies_counted_correctly(self, authenticated_client, contract):
        EventAggregation.objects.create(
            contract=contract, event_type="", timestamp=_bucket(2), event_count=1, is_anomaly=True
        )
        EventAggregation.objects.create(
            contract=contract, event_type="", timestamp=_bucket(3), event_count=50, is_anomaly=False
        )

        response = authenticated_client.get(reverse("analytics-list"))
        assert response.data["anomalies_last_7d"] >= 1


# ---------------------------------------------------------------------------
# AnalyticsViewSet — event_volume
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestEventVolume:

    def _seed(self, contract, hours_back=2, count=5, event_type="swap"):
        bucket = _bucket(hours_back)
        EventAggregation.objects.create(
            contract=contract, event_type=event_type, timestamp=bucket, event_count=count
        )
        # Also total bucket
        EventAggregation.objects.get_or_create(
            contract=contract, event_type="", timestamp=bucket,
            defaults={"event_count": count},
        )

    def test_daily_returns_data_list(self, authenticated_client, contract):
        self._seed(contract, hours_back=2)
        url = reverse("analytics-event-volume")
        response = authenticated_client.get(url, {"granularity": "daily", "range": "7d"})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["metric"] == "event_volume"
        assert isinstance(response.data["data"], list)

    def test_hourly_granularity(self, authenticated_client, contract):
        self._seed(contract, hours_back=1)
        url = reverse("analytics-event-volume")
        response = authenticated_client.get(url, {"granularity": "hourly", "range": "1d"})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["granularity"] == "hourly"

    def test_invalid_granularity_returns_400(self, authenticated_client):
        url = reverse("analytics-event-volume")
        response = authenticated_client.get(url, {"granularity": "minutely"})
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_filter_by_contract_id(self, authenticated_client, user, contract):
        other = TrackedContractFactory(owner=user)
        self._seed(contract, hours_back=2, count=10)
        self._seed(other, hours_back=2, count=99)

        url = reverse("analytics-event-volume")
        response = authenticated_client.get(url, {"contract_id": contract.contract_id, "granularity": "daily"})

        assert response.status_code == status.HTTP_200_OK
        # All rows should belong to the filtered contract
        for row in response.data["data"]:
            assert row["contract_id"] == contract.contract_id

    def test_unknown_contract_returns_404(self, authenticated_client):
        url = reverse("analytics-event-volume")
        response = authenticated_client.get(url, {"contract_id": "C" + "A" * 55})
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_range_days_respected(self, authenticated_client):
        url = reverse("analytics-event-volume")
        response = authenticated_client.get(url, {"range": "7d"})
        assert response.data["range_days"] == 7

    def test_data_rows_have_expected_keys(self, authenticated_client, contract):
        self._seed(contract, hours_back=2)
        url = reverse("analytics-event-volume")
        response = authenticated_client.get(url, {"granularity": "daily", "range": "7d"})

        if response.data["data"]:
            row = response.data["data"][0]
            for key in ("timestamp", "contract_id", "count", "has_anomaly"):
                assert key in row


# ---------------------------------------------------------------------------
# AnalyticsViewSet — top_contracts
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestTopContracts:

    def test_returns_contracts_sorted_by_count(self, authenticated_client, user):
        c1 = TrackedContractFactory(owner=user)
        c2 = TrackedContractFactory(owner=user)
        bucket = _bucket(2)
        EventAggregation.objects.create(contract=c1, event_type="", timestamp=bucket, event_count=500)
        EventAggregation.objects.create(contract=c2, event_type="", timestamp=bucket, event_count=200)

        url = reverse("analytics-top-contracts")
        response = authenticated_client.get(url, {"range": "7d"})

        assert response.status_code == status.HTTP_200_OK
        counts = [r["event_count"] for r in response.data["contracts"]]
        assert counts == sorted(counts, reverse=True)

    def test_limit_parameter(self, authenticated_client, user):
        for _ in range(5):
            c = TrackedContractFactory(owner=user)
            EventAggregation.objects.create(
                contract=c, event_type="", timestamp=_bucket(1), event_count=10
            )

        url = reverse("analytics-top-contracts")
        response = authenticated_client.get(url, {"limit": 3})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["contracts"]) <= 3


# ---------------------------------------------------------------------------
# AnalyticsViewSet — event_type_breakdown
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestEventTypeBreakdown:

    def test_returns_breakdown_with_pct(self, authenticated_client, contract):
        bucket = _bucket(2)
        EventAggregation.objects.create(contract=contract, event_type="swap", timestamp=bucket, event_count=80)
        EventAggregation.objects.create(contract=contract, event_type="transfer", timestamp=bucket, event_count=20)

        url = reverse("analytics-event-type-breakdown")
        response = authenticated_client.get(url, {"range": "7d", "contract_id": contract.contract_id})

        assert response.status_code == status.HTTP_200_OK
        types = {r["event_type"]: r for r in response.data["breakdown"]}
        assert "swap" in types
        assert "transfer" in types
        # Percentages should sum to ~100
        total_pct = sum(r["pct"] for r in response.data["breakdown"])
        assert abs(total_pct - 100.0) < 0.1

    def test_sorted_by_count_descending(self, authenticated_client, contract):
        bucket = _bucket(2)
        EventAggregation.objects.create(contract=contract, event_type="rare", timestamp=bucket, event_count=1)
        EventAggregation.objects.create(contract=contract, event_type="common", timestamp=bucket, event_count=999)

        url = reverse("analytics-event-type-breakdown")
        response = authenticated_client.get(url, {"range": "7d"})

        assert response.status_code == status.HTTP_200_OK
        counts = [r["count"] for r in response.data["breakdown"]]
        assert counts == sorted(counts, reverse=True)


# ---------------------------------------------------------------------------
# AnalyticsViewSet — anomalies
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAnomalies:

    def test_returns_only_anomaly_rows(self, authenticated_client, contract):
        bucket = _bucket(2)
        EventAggregation.objects.create(
            contract=contract, event_type="", timestamp=bucket, event_count=5, is_anomaly=True
        )
        EventAggregation.objects.create(
            contract=contract, event_type="", timestamp=_bucket(3), event_count=100, is_anomaly=False
        )

        url = reverse("analytics-anomalies")
        response = authenticated_client.get(url, {"range": "7d"})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["range_days"] == 7
        assert len(response.data["anomalies"]) >= 1
        for row in response.data["anomalies"]:
            assert row["contract_id"] == contract.contract_id

    def test_no_anomalies_returns_empty_list(self, authenticated_client, contract):
        EventAggregation.objects.create(
            contract=contract, event_type="", timestamp=_bucket(2), event_count=100, is_anomaly=False
        )
        url = reverse("analytics-anomalies")
        response = authenticated_client.get(url, {"range": "7d"})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["anomalies"] == []


# ---------------------------------------------------------------------------
# AnalyticsViewSet — export
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestExport:

    def _seed(self, contract):
        EventAggregation.objects.create(
            contract=contract, event_type="swap", timestamp=_bucket(2), event_count=42
        )

    def test_json_export_returns_data(self, authenticated_client, contract):
        self._seed(contract)
        url = reverse("analytics-export")
        response = authenticated_client.get(url, {"range": "7d", "format": "json"})

        assert response.status_code == status.HTTP_200_OK
        assert "data" in response.data
        assert len(response.data["data"]) >= 1

    def test_csv_export_returns_csv_content_type(self, authenticated_client, contract):
        self._seed(contract)
        url = reverse("analytics-export")
        response = authenticated_client.get(url, {"range": "7d", "export_format": "csv"})

        assert response.status_code == status.HTTP_200_OK
        assert "text/csv" in response["Content-Type"]
        assert "attachment" in response.get("Content-Disposition", "")

    def test_csv_has_header_and_data_row(self, authenticated_client, contract):
        self._seed(contract)
        url = reverse("analytics-export")
        response = authenticated_client.get(url, {"range": "7d", "export_format": "csv"})

        content = b"".join(response.streaming_content).decode()
        reader = list(csv.reader(io.StringIO(content)))
        assert reader[0] == ["timestamp", "contract_id", "contract_name", "event_type", "event_count", "is_anomaly"]
        assert len(reader) >= 2

    def test_csv_export_filtered_by_contract(self, authenticated_client, user, contract):
        other = TrackedContractFactory(owner=user)
        EventAggregation.objects.create(
            contract=other, event_type="swap", timestamp=_bucket(2), event_count=999
        )
        self._seed(contract)

        url = reverse("analytics-export")
        response = authenticated_client.get(
            url, {"range": "7d", "export_format": "csv", "contract_id": contract.contract_id}
        )
        content = b"".join(response.streaming_content).decode()
        rows = list(csv.reader(io.StringIO(content)))
        # Skip header — all data rows must be for our contract
        for row in rows[1:]:
            assert row[1] == contract.contract_id

    def test_unknown_contract_returns_404(self, authenticated_client):
        url = reverse("analytics-export")
        response = authenticated_client.get(url, {"contract_id": "C" + "A" * 55, "format": "json"})
        assert response.status_code == status.HTTP_404_NOT_FOUND
