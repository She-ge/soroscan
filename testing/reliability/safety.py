"""Production-safety guards for destructive and load-generating tests.

These checks exist so failover, chaos, and load runners cannot accidentally
target production. Override is explicit and opt-in via environment variables.
"""

from __future__ import annotations

import os
from urllib.parse import urlparse

PRODUCTION_ENVIRONMENTS = frozenset({"production", "prod"})
DEFAULT_PRODUCTION_HOSTS = frozenset(
    {
        "soroscan.io",
        "www.soroscan.io",
        "api.soroscan.io",
        "indexer.soroscan.io",
    }
)
BLOCKED_CHAOS_NAMESPACES = frozenset({"production", "prod", "soroscan-prod"})
DEFAULT_ALLOWED_CHAOS_NAMESPACES = frozenset(
    {
        "chaos-testing",
        "soroscan-chaos",
        "soroscan",
    }
)


class SafetyError(RuntimeError):
    """Raised when a destructive or load test would target an unsafe environment."""


def _env_flag(name: str) -> bool:
    return os.getenv(name, "").strip().lower() in {"1", "true", "yes"}


def current_environment() -> str:
    return os.getenv("SOROSCAN_ENVIRONMENT", "").strip().lower()


def production_hosts() -> set[str]:
    extra = os.getenv("SOROSCAN_PRODUCTION_HOSTS", "")
    hosts = set(DEFAULT_PRODUCTION_HOSTS)
    for item in extra.split(","):
        host = item.strip().lower()
        if host:
            hosts.add(host)
    return hosts


def is_production_url(url: str) -> bool:
    """Return True when *url* looks like a production SoroScan endpoint."""
    if current_environment() in PRODUCTION_ENVIRONMENTS:
        return True
    parsed = urlparse(url)
    host = (parsed.hostname or "").lower()
    if not host:
        return False
    if host in {"localhost", "127.0.0.1", "0.0.0.0", "::1"}:
        return False
    if host.endswith(".localhost") or host.endswith(".local"):
        return False
    if host in production_hosts():
        return True
    labels = host.split(".")
    return "prod" in labels or "production" in labels


def assert_safe_load_target(url: str) -> None:
    if not is_production_url(url):
        return
    if _env_flag("ALLOW_PRODUCTION_LOAD"):
        return
    raise SafetyError(
        f"Refusing to send load at production target {url!r}. "
        "Use a local/staging URL, or set ALLOW_PRODUCTION_LOAD=true to override."
    )


def assert_safe_failover_environment(base_url: str, execute: bool) -> None:
    if not execute:
        return
    if os.getenv("SOROSCAN_FAILOVER_RUN") != "1":
        raise SafetyError(
            "Set SOROSCAN_FAILOVER_RUN=1 before executing live failover probes."
        )
    if is_production_url(base_url) and not _env_flag("ALLOW_PRODUCTION_FAILOVER"):
        raise SafetyError(
            f"Refusing failover execution against production URL {base_url!r}."
        )
    if current_environment() in PRODUCTION_ENVIRONMENTS and not _env_flag(
        "ALLOW_PRODUCTION_FAILOVER"
    ):
        raise SafetyError("Refusing failover execution when SOROSCAN_ENVIRONMENT is production.")


def _allowed_chaos_namespaces() -> set[str]:
    raw = os.getenv("SOROSCAN_CHAOS_ALLOWED_NAMESPACES", "")
    if raw.strip():
        return {item.strip().lower() for item in raw.split(",") if item.strip()}
    return set(DEFAULT_ALLOWED_CHAOS_NAMESPACES)


def assert_safe_chaos_environment(namespace: str, execute: bool) -> None:
    if not execute:
        return
    if os.getenv("SOROSCAN_CHAOS_RUN") != "1":
        raise SafetyError("Set SOROSCAN_CHAOS_RUN=1 before executing chaos actions.")
    if current_environment() in PRODUCTION_ENVIRONMENTS:
        raise SafetyError(
            "Refusing chaos execution when SOROSCAN_ENVIRONMENT is production."
        )
    ns = namespace.strip().lower()
    if ns in BLOCKED_CHAOS_NAMESPACES:
        raise SafetyError(f"Refusing chaos execution against blocked namespace {namespace!r}.")
    allowed = _allowed_chaos_namespaces()
    if ns not in allowed:
        raise SafetyError(
            f"Namespace {namespace!r} is not in the chaos allow-list {sorted(allowed)}. "
            "Set SOROSCAN_CHAOS_ALLOWED_NAMESPACES to extend it for staging."
        )
