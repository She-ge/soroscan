"""Reusable decorators for webhook endpoint security."""
from __future__ import annotations

import hashlib
import hmac
import logging
from functools import wraps
from typing import Callable

from django.http import JsonResponse

logger = logging.getLogger(__name__)

_DEFAULT_HEADER = "X-SoroScan-Signature"


def validate_webhook_signature(
    secret: str | Callable[..., str],
    *,
    header: str = _DEFAULT_HEADER,
):
    """
    View decorator that validates an HMAC-SHA256 (or SHA-1) webhook signature.

    The signature is expected in *header* using the format
    ``{algorithm}={hex_digest}`` (e.g. ``sha256=abcdef…``).

    Parameters
    ----------
    secret:
        The HMAC shared secret.  Pass a string for a static secret or a
        callable ``(request) -> str`` for per-request secrets (e.g. when
        looking up a secret from the database).
    header:
        HTTP header name that carries the signature (default
        ``X-SoroScan-Signature``).
    """

    def decorator(view_func):
        @wraps(view_func)
        def _wrapped(request, *args, **kwargs):
            secret_value = secret(request) if callable(secret) else secret

            if not secret_value:
                return view_func(request, *args, **kwargs)

            meta_key = f"HTTP_{header.upper().replace('-', '_')}"
            sig_header = request.META.get(meta_key, "")

            if not sig_header:
                logger.debug("Webhook signature header %s is missing", header)
                return JsonResponse(
                    {"detail": "Missing signature header."},
                    status=401,
                )

            try:
                algorithm_name, expected_hex = sig_header.split("=", 1)
            except ValueError:
                return JsonResponse(
                    {"detail": "Invalid signature format."},
                    status=401,
                )

            algorithm_name = algorithm_name.lower().strip()
            if algorithm_name == "sha256":
                digestmod = hashlib.sha256
            elif algorithm_name == "sha1":
                digestmod = hashlib.sha1
            else:
                return JsonResponse(
                    {"detail": "Unsupported signature algorithm."},
                    status=401,
                )

            body = request.body

            computed = hmac.new(
                secret_value.encode("utf-8"),
                msg=body,
                digestmod=digestmod,
            ).hexdigest()

            if not hmac.compare_digest(computed, expected_hex.strip()):
                logger.warning("Webhook signature mismatch")
                return JsonResponse(
                    {"detail": "Invalid signature."},
                    status=401,
                )

            return view_func(request, *args, **kwargs)

        return _wrapped

    return decorator
