"""
Per-organization CORS middleware for SoroScan.

django-cors-headers exposes a ``CORS_ALLOWED_ORIGINS_REGEXES`` hook and a
``CORS_ORIGIN_ALLOW_ALL`` boolean, but its origin-check logic is baked inside
``CorsMiddleware`` and runs *before* authentication.  We therefore take a
different approach:

    1. This middleware runs *after* ``corsheaders.middleware.CorsMiddleware``
       in the stack (see settings.py).  CorsHeaders has already set the CORS
       response headers using the global ``CORS_ALLOWED_ORIGINS`` list.

    2. When the ``Origin`` header is NOT in the global allow-list (meaning
       CorsHeaders declined to add ``Access-Control-Allow-Origin``), this
       middleware looks up all per-org ``cors_origins`` lists and, if the
       origin is found in any of them, injects the appropriate CORS headers
       itself so the browser accepts the response.

    3. To keep the DB hit small we load the full set of org-level origins
       once per process and cache it in memory (invalidated every
       ``ORG_CORS_CACHE_TTL`` seconds).  The cache is a simple module-level
       dict – good enough for a single-process server; for multi-worker
       deployments the worst case is a single stale TTL window.

The middleware is intentionally placed *after* CorsHeaders in the middleware
stack so that:
  - Requests allowed by the global list are handled completely by CorsHeaders.
  - Only requests whose origin is not in the global list need the per-org path.

Usage
-----
Add to MIDDLEWARE *after* ``corsheaders.middleware.CorsMiddleware``::

    "corsheaders.middleware.CorsMiddleware",
    "soroscan.cors_middleware.OrgCorsMiddleware",
"""

import logging
import time
from typing import Optional

from django.conf import settings
from django.http import HttpRequest, HttpResponse

logger = logging.getLogger(__name__)

# How long (seconds) to cache the union of all org cors_origins before
# re-reading from the DB.
ORG_CORS_CACHE_TTL: int = 60

# Module-level cache: maps origin -> True for fast membership tests.
_org_origins_cache: dict[str, bool] = {}
_org_origins_cache_loaded_at: float = 0.0


def _load_org_origins() -> dict[str, bool]:
    """
    Read cors_origins from every Organization row and return a set-like dict.
    Falls back to an empty dict on any DB error so the middleware never breaks
    a request.
    """
    try:
        from soroscan.ingest.models import Organization  # avoid circular import

        origins: dict[str, bool] = {}
        for row in Organization.objects.values_list("cors_origins", flat=True):
            if isinstance(row, list):
                for origin in row:
                    if isinstance(origin, str) and origin:
                        origins[origin.rstrip("/")] = True
        return origins
    except Exception:
        logger.exception("OrgCorsMiddleware: failed to load org CORS origins from DB")
        return {}


def _get_org_origins() -> dict[str, bool]:
    """Return cached org origins, refreshing when the TTL has elapsed."""
    global _org_origins_cache, _org_origins_cache_loaded_at

    now = time.monotonic()
    if now - _org_origins_cache_loaded_at > ORG_CORS_CACHE_TTL:
        _org_origins_cache = _load_org_origins()
        _org_origins_cache_loaded_at = now
    return _org_origins_cache


def _is_global_origin_allowed(origin: str) -> bool:
    """Return True if the origin is permitted by the global CORS settings."""
    if getattr(settings, "CORS_ALLOW_ALL_ORIGINS", False):
        return True
    global_origins = getattr(settings, "CORS_ALLOWED_ORIGINS", [])
    return origin in global_origins


def _apply_cors_headers(response: HttpResponse, origin: str, is_preflight: bool) -> None:
    """Set the ACAO and related headers on *response* for *origin*."""
    response["Access-Control-Allow-Origin"] = origin
    if getattr(settings, "CORS_ALLOW_CREDENTIALS", False):
        response["Access-Control-Allow-Credentials"] = "true"
    # Vary must include Origin so caches don't serve the wrong response.
    existing_vary = response.get("Vary", "")
    if "Origin" not in existing_vary:
        response["Vary"] = f"{existing_vary}, Origin".lstrip(", ")
    if is_preflight:
        # Echo back the requested method / headers so the browser proceeds.
        requested_method = response.get("Access-Control-Request-Method", "")
        requested_headers = response.get("Access-Control-Request-Headers", "")
        if requested_method:
            response["Access-Control-Allow-Methods"] = requested_method
        if requested_headers:
            response["Access-Control-Allow-Headers"] = requested_headers
        response["Access-Control-Max-Age"] = "86400"


class OrgCorsMiddleware:
    """
    Supplement django-cors-headers with per-organization allowed origins.

    Only activates when:
    - The request carries an ``Origin`` header (i.e. a cross-origin request).
    - The origin is NOT already handled by the global CORS_ALLOWED_ORIGINS.
    - The origin IS present in at least one Organization.cors_origins list.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        origin: Optional[str] = request.META.get("HTTP_ORIGIN")

        # Fast path: no Origin header means same-origin or non-browser request.
        if not origin:
            return self.get_response(request)

        origin = origin.rstrip("/")
        is_preflight = request.method == "OPTIONS"

        # If the global settings already cover this origin, let CorsHeaders
        # deal with it entirely – we have nothing to add.
        if _is_global_origin_allowed(origin):
            return self.get_response(request)

        # Check per-org origins.
        org_origins = _get_org_origins()
        if origin not in org_origins:
            # Not in any org's list either; proceed normally (CORS will be
            # rejected by the browser, which is the correct behaviour).
            return self.get_response(request)

        # The origin is org-approved.  Handle preflights immediately without
        # calling down the chain to avoid touching the DB / auth unnecessarily.
        if is_preflight:
            response = HttpResponse(status=200)
            _apply_cors_headers(response, origin, is_preflight=True)
            return response

        response = self.get_response(request)
        _apply_cors_headers(response, origin, is_preflight=False)
        return response


def invalidate_org_cors_cache() -> None:
    """
    Force the next request to reload org origins from the DB.

    Call this after saving an Organization instance to keep the cache fresh
    without waiting for the TTL to expire.
    """
    global _org_origins_cache_loaded_at
    _org_origins_cache_loaded_at = 0.0
