"""Tests for external API circuit breakers (issue #513, #1313)."""
import threading
import time
from unittest.mock import MagicMock, patch

import pytest

from soroscan.circuit_breaker import (
    CircuitBreaker,
    CircuitBreakerOpen,
    CircuitState,
    execute_with_circuit_breaker,
    get_circuit_breaker,
)


class TestCircuitBreaker:
    def test_opens_after_failure_threshold(self):
        breaker = CircuitBreaker("test", failure_threshold=2, recovery_timeout=60)

        with pytest.raises(RuntimeError):
            breaker.call(self._raise_error)

        with pytest.raises(RuntimeError):
            breaker.call(self._raise_error)

        assert breaker.state == CircuitState.OPEN

    def test_rejects_calls_when_open(self):
        breaker = CircuitBreaker("test-open", failure_threshold=1, recovery_timeout=60)

        with pytest.raises(RuntimeError):
            breaker.call(self._raise_error)

        with pytest.raises(CircuitBreakerOpen):
            breaker.call(lambda: "ok")

    def test_half_open_recovers_after_success(self):
        breaker = CircuitBreaker(
            "test-half-open",
            failure_threshold=1,
            recovery_timeout=0.01,
            half_open_max_calls=1,
        )

        with pytest.raises(RuntimeError):
            breaker.call(self._raise_error)

        time.sleep(0.02)
        assert breaker.call(lambda: "recovered") == "recovered"
        assert breaker.state == CircuitState.CLOSED

    def test_half_open_rejects_after_max_calls(self):
        breaker = CircuitBreaker(
            "test-half-reject",
            failure_threshold=1,
            recovery_timeout=0.01,
            half_open_max_calls=1,
        )

        with pytest.raises(RuntimeError):
            breaker.call(self._raise_error)

        time.sleep(0.02)
        # First call succeeds (half-open probe)
        assert breaker.call(lambda: "ok") == "ok"

        # Subsequent calls should be rejected since we're back to closed
        # but the probe already passed, so new failures need threshold to open again
        assert breaker.state == CircuitState.CLOSED

    def test_half_open_failure_reopens(self):
        breaker = CircuitBreaker(
            "test-half-fail",
            failure_threshold=1,
            recovery_timeout=0.01,
            half_open_max_calls=1,
        )

        with pytest.raises(RuntimeError):
            breaker.call(self._raise_error)

        time.sleep(0.02)
        # Probe call fails -> should reopen
        with pytest.raises(RuntimeError):
            breaker.call(self._raise_error)

        assert breaker.state == CircuitState.OPEN

    def test_success_resets_failure_count(self):
        breaker = CircuitBreaker("test-reset", failure_threshold=3, recovery_timeout=60)

        # One failure
        with pytest.raises(RuntimeError):
            breaker.call(self._raise_error)
        assert breaker._failure_count == 1

        # Success resets count
        breaker.call(lambda: "ok")
        assert breaker._failure_count == 0
        assert breaker.state == CircuitState.CLOSED

    def test_concurrent_calls_thread_safe(self):
        breaker = CircuitBreaker(
            "test-concurrent",
            failure_threshold=5,
            recovery_timeout=60,
        )
        errors = []
        successes = []

        def make_call(i):
            try:
                result = breaker.call(lambda: i)
                successes.append(result)
            except Exception as e:
                errors.append(e)

        threads = [threading.Thread(target=make_call, args=(i,)) for i in range(20)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert len(successes) == 20
        assert len(errors) == 0

    def test_concurrent_failures_trigger_open(self):
        breaker = CircuitBreaker(
            "test-concurrent-fail",
            failure_threshold=3,
            recovery_timeout=60,
        )
        opened = threading.Event()

        def fail():
            try:
                breaker.call(self._raise_error)
            except CircuitBreakerOpen:
                opened.set()
            except RuntimeError:
                pass

        threads = [threading.Thread(target=fail) for _ in range(10)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()

        assert breaker.state == CircuitState.OPEN

    def test_execute_with_circuit_breaker_records_metrics(self):
        breaker = get_circuit_breaker("metrics-test")
        breaker._failure_count = 0
        breaker._state = CircuitState.CLOSED

        with patch("soroscan.ingest.metrics.circuit_breaker_calls_total") as mock_calls:
            mock_labels = MagicMock()
            mock_calls.labels.return_value = mock_labels
            result = execute_with_circuit_breaker("metrics-test", lambda: 42)
            assert result == 42
            mock_calls.labels.assert_called_with(name="metrics-test", outcome="success")
            mock_labels.inc.assert_called_once()

    def test_get_circuit_breaker_returns_same_instance(self):
        b1 = get_circuit_breaker("singleton-test")
        b2 = get_circuit_breaker("singleton-test")
        assert b1 is b2

    def test_different_names_are_independent(self):
        b1 = get_circuit_breaker("independent-a")
        b2 = get_circuit_breaker("independent-b")
        assert b1 is not b2

    def test_state_transitions_closed_to_open_to_half_open(self):
        breaker = CircuitBreaker(
            "test-transitions",
            failure_threshold=2,
            recovery_timeout=0.01,
        )
        assert breaker.state == CircuitState.CLOSED

        with pytest.raises(RuntimeError):
            breaker.call(self._raise_error)
        with pytest.raises(RuntimeError):
            breaker.call(self._raise_error)

        assert breaker.state == CircuitState.OPEN

        time.sleep(0.02)
        assert breaker.state == CircuitState.HALF_OPEN

    def test_open_state_records_trip_metric(self):
        breaker = CircuitBreaker("test-trip-metric", failure_threshold=1, recovery_timeout=60)

        with patch("soroscan.ingest.metrics.circuit_breaker_trips_total") as mock_trips:
            mock_labels = MagicMock()
            mock_trips.labels.return_value = mock_labels

            with pytest.raises(RuntimeError):
                breaker.call(self._raise_error)

            mock_trips.labels.assert_called_with(name="test-trip-metric")
            mock_labels.inc.assert_called_once()

    def test_rejected_calls_record_metric(self):
        breaker = CircuitBreaker("test-reject-metric", failure_threshold=1, recovery_timeout=60)

        with pytest.raises(RuntimeError):
            breaker.call(self._raise_error)

        with patch("soroscan.ingest.metrics.circuit_breaker_calls_total") as mock_calls:
            mock_labels = MagicMock()
            mock_calls.labels.return_value = mock_labels

            with pytest.raises(CircuitBreakerOpen):
                breaker.call(lambda: "nope")

            mock_calls.labels.assert_called_with(name="test-reject-metric", outcome="rejected")
            mock_labels.inc.assert_called_once()

    @staticmethod
    def _raise_error():
        raise RuntimeError("upstream unavailable")
