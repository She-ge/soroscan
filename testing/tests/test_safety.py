"""Unit tests for shared production-safety and wait helpers."""

from __future__ import annotations

import pytest

from testing.reliability.safety import (
    SafetyError,
    assert_safe_chaos_environment,
    assert_safe_failover_environment,
    assert_safe_load_target,
    is_production_url,
)
from testing.reliability.wait import WaitTimeout, wait_until


def test_localhost_is_not_production():
    assert is_production_url("http://127.0.0.1:8000") is False
    assert is_production_url("http://localhost:8000/ready/") is False


def test_known_production_hosts_are_blocked():
    assert is_production_url("https://api.soroscan.io") is True
    assert is_production_url("https://soroscan.io/graphql") is True


def test_prod_dns_label_is_treated_as_production():
    assert is_production_url("https://indexer.prod.example.com") is True


def test_load_guard_blocks_production_without_override(monkeypatch):
    monkeypatch.delenv("ALLOW_PRODUCTION_LOAD", raising=False)
    with pytest.raises(SafetyError, match="ALLOW_PRODUCTION_LOAD"):
        assert_safe_load_target("https://api.soroscan.io")


def test_load_guard_allows_explicit_override(monkeypatch):
    monkeypatch.setenv("ALLOW_PRODUCTION_LOAD", "true")
    assert_safe_load_target("https://api.soroscan.io")


def test_failover_execute_requires_flag(monkeypatch):
    monkeypatch.delenv("SOROSCAN_FAILOVER_RUN", raising=False)
    with pytest.raises(SafetyError, match="SOROSCAN_FAILOVER_RUN"):
        assert_safe_failover_environment("http://127.0.0.1:8000", execute=True)


def test_failover_blocks_production_url(monkeypatch):
    monkeypatch.setenv("SOROSCAN_FAILOVER_RUN", "1")
    monkeypatch.delenv("ALLOW_PRODUCTION_FAILOVER", raising=False)
    with pytest.raises(SafetyError, match="production URL"):
        assert_safe_failover_environment("https://api.soroscan.io", execute=True)


def test_chaos_blocks_production_environment(monkeypatch):
    monkeypatch.setenv("SOROSCAN_CHAOS_RUN", "1")
    monkeypatch.setenv("SOROSCAN_ENVIRONMENT", "production")
    with pytest.raises(SafetyError, match="production"):
        assert_safe_chaos_environment("chaos-testing", execute=True)


def test_chaos_blocks_unknown_namespace(monkeypatch):
    monkeypatch.setenv("SOROSCAN_CHAOS_RUN", "1")
    monkeypatch.setenv("SOROSCAN_ENVIRONMENT", "staging")
    with pytest.raises(SafetyError, match="allow-list"):
        assert_safe_chaos_environment("kube-system", execute=True)


def test_chaos_allows_designated_namespace(monkeypatch):
    monkeypatch.setenv("SOROSCAN_CHAOS_RUN", "1")
    monkeypatch.setenv("SOROSCAN_ENVIRONMENT", "chaos")
    assert_safe_chaos_environment("chaos-testing", execute=True) is None


def test_wait_until_returns_on_first_truthy_value():
    calls = {"n": 0}

    def ready():
        calls["n"] += 1
        return calls["n"] >= 2

    assert wait_until(ready, timeout_seconds=2, interval_seconds=0.01) is True
    assert calls["n"] == 2


def test_wait_until_times_out():
    with pytest.raises(WaitTimeout):
        wait_until(lambda: False, timeout_seconds=0.05, interval_seconds=0.01)
