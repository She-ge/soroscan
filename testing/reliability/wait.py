"""Bounded polling helpers. Prefer these over arbitrary sleep() assertions."""

from __future__ import annotations

import time
from collections.abc import Callable
from typing import TypeVar

T = TypeVar("T")


class WaitTimeout(TimeoutError):
    """Raised when a polled condition does not become true in time."""


def wait_until(
    predicate: Callable[[], T | None | bool],
    *,
    timeout_seconds: float,
    interval_seconds: float = 0.5,
    description: str = "condition",
) -> T | bool:
    """Poll *predicate* until it returns a truthy value or the timeout expires."""
    deadline = time.monotonic() + timeout_seconds
    last: T | None | bool = None
    while time.monotonic() < deadline:
        last = predicate()
        if last:
            return last
        time.sleep(interval_seconds)
    raise WaitTimeout(f"Timed out waiting for {description} after {timeout_seconds}s (last={last!r})")
