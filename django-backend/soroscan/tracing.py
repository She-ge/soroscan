"""
OpenTelemetry + Jaeger distributed tracing setup for SoroScan.

Call configure_tracing() once at application startup (settings import time).
It is idempotent — repeated calls are no-ops once the provider is installed.
"""

from __future__ import annotations

import logging
import os

from opentelemetry import propagate, trace
from opentelemetry.sdk.resources import Resource, SERVICE_NAME
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.trace.sampling import TraceIdRatioBased, ParentBased

logger = logging.getLogger(__name__)

_configured = False

try:
    from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
    _otlp_available = True
except ImportError:
    OTLPSpanExporter = None  # type: ignore[assignment,misc]
    _otlp_available = False


def configure_tracing() -> None:
    """
    Configure the OpenTelemetry SDK with a Jaeger OTLP exporter.

    Reads configuration from environment variables:
      OTEL_ENABLED            — "true" to activate (default: false)
      OTEL_SERVICE_NAME       — service name tag (default: soroscan-backend)
      OTEL_EXPORTER_OTLP_ENDPOINT — OTLP/gRPC collector endpoint
                                    (default: http://jaeger:4317)
      OTEL_TRACES_SAMPLER_ARG — head-based sampling rate 0.0–1.0 (default: 1.0)
    """
    global _configured
    if _configured:
        return

    enabled = os.environ.get("OTEL_ENABLED", "false").lower() in ("1", "true", "yes")
    if not enabled:
        _configured = True
        return

    try:
        if not _otlp_available or OTLPSpanExporter is None:
            raise ImportError("opentelemetry-exporter-otlp-proto-grpc is not installed")

        service_name = os.environ.get("OTEL_SERVICE_NAME", "soroscan-backend")
        endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "http://jaeger:4317")
        sample_rate = float(os.environ.get("OTEL_TRACES_SAMPLER_ARG", "1.0"))

        resource = Resource.create({SERVICE_NAME: service_name})
        sampler = ParentBased(root=TraceIdRatioBased(sample_rate))
        provider = TracerProvider(resource=resource, sampler=sampler)

        exporter = OTLPSpanExporter(endpoint=endpoint, insecure=True)
        provider.add_span_processor(BatchSpanProcessor(exporter))

        trace.set_tracer_provider(provider)

        _instrument_django()
        _instrument_db()

        logger.info(
            "OpenTelemetry tracing configured: service=%s endpoint=%s sample_rate=%.2f",
            service_name,
            endpoint,
            sample_rate,
        )
    except ImportError as exc:
        logger.warning("OpenTelemetry packages not available — tracing disabled: %s", exc)
    except Exception as exc:
        logger.warning("Failed to configure OpenTelemetry tracing: %s", exc)

    _configured = True


def _instrument_django() -> None:
    """Auto-instrument Django HTTP requests."""
    try:
        from opentelemetry.instrumentation.django import DjangoInstrumentor
        DjangoInstrumentor().instrument()
    except ImportError:
        logger.debug("opentelemetry-instrumentation-django not installed — skipping")


def _instrument_db() -> None:
    """Auto-instrument Django ORM / psycopg2 database calls."""
    try:
        from opentelemetry.instrumentation.psycopg2 import Psycopg2Instrumentor
        Psycopg2Instrumentor().instrument()
    except ImportError:
        logger.debug("opentelemetry-instrumentation-psycopg2 not installed — skipping")


def instrument_celery_task(task_name: str, task_id: str, headers: dict | None = None) -> object:
    """
    Start a new OTel span for a Celery task, extracting W3C trace context
    from the task headers when present (context propagation across the broker).

    Returns the started span (caller must end it).
    """
    tracer = trace.get_tracer("soroscan.celery")
    ctx = propagate.extract(headers or {})
    span = tracer.start_span(
        f"celery.task.{task_name}",
        context=ctx,
        attributes={"celery.task_name": task_name, "celery.task_id": task_id},
    )
    return span


def inject_celery_headers(headers: dict) -> None:
    """Inject the current trace context into Celery task headers (before publish)."""
    propagate.inject(headers)
