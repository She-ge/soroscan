import inspect
import logging
import time
import traceback
from typing import Any, Callable, Dict, Optional

from strawberry.extensions import SchemaExtension
from strawberry.types import Info

logger = logging.getLogger("soroscan.graphql")


class GraphQLResolverLoggingExtension(SchemaExtension):
    """
    Strawberry extension to log all GraphQL resolver calls.

    Logs query start, completion/duration, arguments, and full stack traces for errors.
    Only logs top-level Query and Mutation fields to avoid clutter.
    """

    def resolve(
        self,
        _next: Callable,
        root: Any,
        info: Info,
        *args: Any,
        **kwargs: Any,
    ) -> Any:
        # Only log top-level Query and Mutation resolvers
        if info.parent_type.name not in ("Query", "Mutation"):
            return _next(root, info, *args, **kwargs)

        query_name = info.field_name
        start_time = time.perf_counter()

        # Log arguments (kwargs contains the GraphQL arguments)
        logger.info(
            f"GraphQL resolver started: {query_name}",
            extra={
                "query_name": query_name,
                "arguments": kwargs,
            },
        )

        try:
            result = _next(root, info, *args, **kwargs)

            # Handle async resolvers
            if inspect.isawaitable(result):

                async def wrap_awaitable(awaitable):
                    try:
                        res = await awaitable
                        self._log_completion(query_name, start_time, kwargs, "Success")
                        return res
                    except Exception as e:
                        self._log_completion(query_name, start_time, kwargs, "Error", e)
                        raise e

                return wrap_awaitable(result)

            self._log_completion(query_name, start_time, kwargs, "Success")
            return result
        except Exception as e:
            self._log_completion(query_name, start_time, kwargs, "Error", e)
            raise e

    def _log_completion(
        self,
        query_name: str,
        start_time: float,
        arguments: Dict[str, Any],
        status: str,
        error: Optional[Exception] = None,
    ) -> None:
        duration_ms = (time.perf_counter() - start_time) * 1000
        extra = {
            "query_name": query_name,
            "arguments": arguments,
            "duration_ms": round(duration_ms, 2),
            "status": status,
        }

        if error:
            extra["error"] = str(error)
            extra["stack_trace"] = traceback.format_exc()
            logger.error(
                f"GraphQL resolver failed: {query_name} in {duration_ms:.2f}ms",
                extra=extra,
            )
        else:
            logger.info(
                f"GraphQL resolver completed: {query_name} in {duration_ms:.2f}ms",
                extra=extra,
            )
