"""
N+1 query detection for GraphQL resolvers (issue #490).

Logs warnings when a resolver executes more DB queries than expected,
helping developers identify lazy-loading issues during development.
Zero overhead in production when N1_DETECTION_ENABLED is False.
"""
import logging
import time
from typing import Any, Callable

from django.conf import settings
from django.db import connection
from strawberry.extensions import SchemaExtension

logger = logging.getLogger("soroscan.graphql.n1_detection")


class N1QueryDetectorExtension(SchemaExtension):
    """
    Strawberry extension that counts DB queries per resolver and warns
    when a pattern suggests N+1 query behavior.

    Enabled only when GRAPHQL_N1_DETECTION_ENABLED=True (default: False in prod,
    True in DEBUG mode).
    """

    def _is_enabled(self) -> bool:
        return getattr(settings, "GRAPHQL_N1_DETECTION_ENABLED", settings.DEBUG)

    def resolve(
        self,
        _next: Callable,
        root: Any,
        info: Any,
        *args: Any,
        **kwargs: Any,
    ) -> Any:
        if not self._is_enabled():
            return _next(root, info, *args, **kwargs)

        # Only instrument list resolvers or fields that commonly trigger N+1
        if info.parent_type.name not in ("Query", "Mutation"):
            return _next(root, info, *args, **kwargs)

        queries_before = len(connection.queries)
        start = time.perf_counter()

        result = _next(root, info, *args, **kwargs)

        queries_after = len(connection.queries)
        duration_ms = (time.perf_counter() - start) * 1000
        query_count = queries_after - queries_before

        if query_count > 5:
            logger.warning(
                "Potential N+1 query detected in GraphQL resolver '%s': "
                "%d queries executed in %.1fms. "
                "Consider using select_related/prefetch_related or batching.",
                info.field_name,
                query_count,
                duration_ms,
                extra={
                    "field_name": info.field_name,
                    "parent_type": info.parent_type.name,
                    "query_count": query_count,
                    "duration_ms": round(duration_ms, 2),
                },
            )

        return result
