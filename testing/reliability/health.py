"""HTTP health-probe helpers used by failover and chaos runners."""

from __future__ import annotations

from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from testing.reliability.wait import wait_until


def probe_url(url: str, timeout_seconds: float = 5.0) -> int:
    try:
        request = Request(url, method="GET")
        with urlopen(request, timeout=timeout_seconds) as response:
            return int(response.status)
    except HTTPError as exc:
        return int(exc.code)
    except URLError:
        raise


def wait_for_http_status(
    url: str,
    expected: int | tuple[int, ...],
    *,
    timeout_seconds: float,
    interval_seconds: float = 1.0,
) -> int:
    wanted = expected if isinstance(expected, tuple) else (expected,)

    def _check() -> int | None:
        try:
            status = probe_url(url)
        except URLError:
            return None
        return status if status in wanted else None

    return int(
        wait_until(
            _check,
            timeout_seconds=timeout_seconds,
            interval_seconds=interval_seconds,
            description=f"{url} in {wanted}",
        )
    )
