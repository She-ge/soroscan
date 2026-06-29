"""Low-cardinality HTTP error metrics for SLA alerting."""

from __future__ import annotations

from prometheus_client import Counter

http_responses_total = Counter(
    "soroscan_http_responses_total",
    "HTTP responses used to calculate service error rates",
    ["service", "status_class", "view", "error_type"],
)


class ErrorRateMetricsMiddleware:
    """Count responses with service and bounded root-cause labels."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        status_code = response.status_code
        match = getattr(request, "resolver_match", None)
        view = (match.view_name if match else None) or "unresolved"
        error_type = ""
        if status_code >= 400:
            data = getattr(response, "data", None)
            if isinstance(data, dict):
                error_type = str(data.get("code") or data.get("detail") or "")
            if not error_type:
                error_type = f"http_{status_code}"
            error_type = error_type[:80]
        http_responses_total.labels(
            service="soroscan-backend",
            status_class=f"{status_code // 100}xx",
            view=view,
            error_type=error_type,
        ).inc()
        return response
