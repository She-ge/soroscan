"""
Ingest-time rate limiting utilities.
"""

import logging
from django.utils import timezone
from django.core.cache import cache
from rest_framework.exceptions import Throttled

from .models import TrackedContract

logger = logging.getLogger(__name__)


def check_ingest_rate(contract: TrackedContract) -> bool:
    """
    Check if the contract has exceeded its max_events_per_minute limit.

    Uses Redis counter with 60-second TTL to track events per minute.
    Raises Throttled (HTTP 429) if the limit is exceeded.

    Args:
        contract: TrackedContract instance to check

    Returns:
        True if event should be ingested.

    Raises:
        Throttled: If rate limit exceeded.
    """
    if contract.max_events_per_minute is None:
        return True

    now = timezone.now()
    now_minute = now.strftime("%Y%m%d%H%M")
    key = f"ingest_rate:{contract.contract_id}:{now_minute}"

    try:
        # Increment counter atomically
        count = cache.get(key, 0) + 1
        cache.set(key, count, timeout=60)

        if count > contract.max_events_per_minute:
            # Calculate seconds remaining in the current minute for Retry-After
            retry_after = 60 - now.second
            raise Throttled(
                wait=retry_after,
                detail=f"Rate limit exceeded. Try again in {retry_after} seconds.",
            )

        return True
    except Throttled:
        # Re-raise the throttled exception so the view can catch it and return 429
        raise
    except Exception as exc:
        logger.warning(
            "Rate limit check failed for contract %s: %s",
            contract.contract_id,
            exc,
            extra={"contract_id": contract.contract_id},
        )
        # On error, allow the event through (fail open)
        return True
