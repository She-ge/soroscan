"""
Security audit signals — logs successful and failed admin login attempts.
Hooks into Django's user_logged_in and user_login_failed signals.
"""
import logging

from django.contrib.auth.signals import user_logged_in, user_login_failed
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .cache_utils import invalidate_cached_contract
from .models import TrackedContract, Organization

logger = logging.getLogger("soroscan.security_audit")


def _get_client_ip(request) -> str:
    """Extract the real client IP, respecting X-Forwarded-For if present."""
    if request is None:
        return "unknown"
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


@receiver(user_logged_in)
def on_user_logged_in(sender, request, user, **kwargs):
    ip = _get_client_ip(request)
    logger.info(
        "LOGIN_SUCCESS username=%s ip=%s",
        getattr(user, "username", str(user)),
        ip,
    )


@receiver(user_login_failed)
def on_user_login_failed(sender, credentials, request, **kwargs):
    ip = _get_client_ip(request)
    username = credentials.get("username", "unknown")
    logger.warning(
        "LOGIN_FAILED username=%s ip=%s",
        username,
        ip,
    )


@receiver([post_save, post_delete], sender=TrackedContract)
def invalidate_contract_on_update(sender, instance, **kwargs):
    """Invalidate the Redis cache for a TrackedContract when it is modified or deleted."""
    if instance.contract_id:
        invalidate_cached_contract(instance.contract_id)


@receiver([post_save, post_delete], sender=Organization)
def invalidate_org_cors_cache_on_change(sender, instance, **kwargs):
    """Bust the in-process org CORS origins cache whenever an Organization is saved or deleted."""
    try:
        from soroscan.cors_middleware import invalidate_org_cors_cache

        invalidate_org_cors_cache()
    except Exception:
        # Never let a signal handler break the save.
        pass
