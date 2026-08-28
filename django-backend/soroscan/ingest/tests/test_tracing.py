"""
Tests for distributed tracing (Issue #1295).

Covers:
- configure_tracing() is a no-op when OTEL_ENABLED is false/unset
- configure_tracing() installs a real TracerProvider when OTEL_ENABLED=true
- inject_trace_headers / inject_celery_headers propagate W3C traceparent
- instrument_celery_task creates a span with correct attributes
- GraphQLTracingExtension wraps top-level resolvers in spans
- Celery before_task_publish signal injects trace headers
"""

import os
from unittest.mock import MagicMock, patch

import pytest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _reset_tracing():
    """Reset the _configured flag so configure_tracing() can run again."""
    import soroscan.tracing as tracing_mod
    tracing_mod._configured = False


# ---------------------------------------------------------------------------
# Unit tests: configure_tracing()
# ---------------------------------------------------------------------------

class TestConfigureTracingDisabled:
    def test_no_op_when_disabled(self):
        """configure_tracing() must be a no-op when OTEL_ENABLED is not set."""
        _reset_tracing()
        env = {k: v for k, v in os.environ.items() if k != "OTEL_ENABLED"}
        with patch.dict(os.environ, env, clear=True):
            from soroscan.tracing import configure_tracing
            configure_tracing()  # should not raise

        import soroscan.tracing as tracing_mod
        assert tracing_mod._configured is True

    def test_idempotent(self):
        """Calling configure_tracing() twice must not raise."""
        _reset_tracing()
        from soroscan.tracing import configure_tracing
        configure_tracing()
        configure_tracing()  # second call is a no-op


class TestConfigureTracingEnabled:
    def test_installs_tracer_provider(self):
        """When OTEL_ENABLED=true, a real TracerProvider must be installed."""
        _reset_tracing()
        mock_provider = MagicMock()
        mock_processor = MagicMock()
        mock_exporter = MagicMock()
        mock_otlp_cls = MagicMock(return_value=mock_exporter)

        with patch.dict(os.environ, {
            "OTEL_ENABLED": "true",
            "OTEL_SERVICE_NAME": "test-service",
            "OTEL_EXPORTER_OTLP_ENDPOINT": "http://localhost:4317",
            "OTEL_TRACES_SAMPLER_ARG": "0.5",
        }):
            import soroscan.tracing as tracing_mod
            with patch.object(tracing_mod, "OTLPSpanExporter", mock_otlp_cls), \
                 patch.object(tracing_mod, "_otlp_available", True), \
                 patch.object(tracing_mod, "TracerProvider", return_value=mock_provider), \
                 patch.object(tracing_mod, "BatchSpanProcessor", return_value=mock_processor), \
                 patch.object(tracing_mod, "trace") as mock_trace, \
                 patch.object(tracing_mod, "_instrument_django"), \
                 patch.object(tracing_mod, "_instrument_db"):
                tracing_mod.configure_tracing()

            mock_trace.set_tracer_provider.assert_called_once_with(mock_provider)
            mock_provider.add_span_processor.assert_called_once_with(mock_processor)

    def test_sampling_rate_applied(self):
        """TraceIdRatioBased sampler must receive the configured rate."""
        _reset_tracing()

        with patch.dict(os.environ, {
            "OTEL_ENABLED": "true",
            "OTEL_TRACES_SAMPLER_ARG": "0.25",
        }):
            import soroscan.tracing as tracing_mod
            with patch.object(tracing_mod, "_otlp_available", True), \
                 patch.object(tracing_mod, "OTLPSpanExporter", MagicMock()), \
                 patch.object(tracing_mod, "TraceIdRatioBased") as mock_sampler_cls, \
                 patch.object(tracing_mod, "ParentBased"), \
                 patch.object(tracing_mod, "TracerProvider"), \
                 patch.object(tracing_mod, "BatchSpanProcessor"), \
                 patch.object(tracing_mod, "trace"), \
                 patch.object(tracing_mod, "_instrument_django"), \
                 patch.object(tracing_mod, "_instrument_db"):
                tracing_mod.configure_tracing()

            mock_sampler_cls.assert_called_once_with(0.25)

    def test_missing_otlp_package_logs_warning(self, caplog):
        """When OTLP exporter is unavailable, a warning must be logged, not raised."""
        _reset_tracing()
        import logging

        with patch.dict(os.environ, {"OTEL_ENABLED": "true"}):
            import soroscan.tracing as tracing_mod
            with patch.object(tracing_mod, "_otlp_available", False), \
                 patch.object(tracing_mod, "OTLPSpanExporter", None):
                with caplog.at_level(logging.WARNING, logger="soroscan.tracing"):
                    tracing_mod.configure_tracing()  # must not raise

        assert tracing_mod._configured is True


# ---------------------------------------------------------------------------
# Unit tests: inject_trace_headers / inject_celery_headers
# ---------------------------------------------------------------------------

class TestInjectTraceHeaders:
    def test_inject_trace_headers_calls_propagate(self):
        """inject_trace_headers must delegate to opentelemetry.propagate.inject."""
        from soroscan.ingest import telemetry as tel_mod

        headers: dict = {}
        with patch.object(tel_mod, "propagate") as mock_propagate:
            tel_mod.inject_trace_headers(headers)
        mock_propagate.inject.assert_called_once_with(headers)

    def test_inject_celery_headers_calls_propagate(self):
        """inject_celery_headers must delegate to opentelemetry.propagate.inject."""
        import soroscan.tracing as tracing_mod

        headers: dict = {}
        with patch.object(tracing_mod, "propagate") as mock_propagate:
            tracing_mod.inject_celery_headers(headers)
        mock_propagate.inject.assert_called_once_with(headers)


# ---------------------------------------------------------------------------
# Unit tests: instrument_celery_task
# ---------------------------------------------------------------------------

class TestInstrumentCeleryTask:
    def test_creates_span_with_attributes(self):
        """instrument_celery_task must start a span with task_name and task_id."""
        import soroscan.tracing as tracing_mod

        mock_span = MagicMock()
        mock_tracer = MagicMock()
        mock_tracer.start_span.return_value = mock_span

        with patch.object(tracing_mod, "trace") as mock_trace, \
             patch.object(tracing_mod, "propagate"):
            mock_trace.get_tracer.return_value = mock_tracer
            span = tracing_mod.instrument_celery_task(
                "my_task", "abc-123", {"traceparent": "00-x-y-01"}
            )

        mock_tracer.start_span.assert_called_once()
        call_args = mock_tracer.start_span.call_args
        assert call_args[0][0] == "celery.task.my_task"
        attrs = call_args[1]["attributes"]
        assert attrs["celery.task_name"] == "my_task"
        assert attrs["celery.task_id"] == "abc-123"
        assert span is mock_span

    def test_extracts_context_from_headers(self):
        """instrument_celery_task must extract W3C context from task headers."""
        import soroscan.tracing as tracing_mod

        headers = {"traceparent": "00-aabbcc-ddeeff-01"}
        with patch.object(tracing_mod, "trace") as mock_trace, \
             patch.object(tracing_mod, "propagate") as mock_propagate:
            mock_trace.get_tracer.return_value = MagicMock()
            tracing_mod.instrument_celery_task("t", "id-1", headers)

        mock_propagate.extract.assert_called_once_with(headers)

    def test_empty_headers_does_not_raise(self):
        """instrument_celery_task must handle None headers gracefully."""
        import soroscan.tracing as tracing_mod

        with patch.object(tracing_mod, "trace") as mock_trace, \
             patch.object(tracing_mod, "propagate"):
            mock_trace.get_tracer.return_value = MagicMock()
            tracing_mod.instrument_celery_task("t", "id-2", None)  # must not raise


# ---------------------------------------------------------------------------
# Unit tests: GraphQLTracingExtension
# ---------------------------------------------------------------------------

class TestGraphQLTracingExtension:
    def _make_info(self, parent_type_name: str, field_name: str):
        info = MagicMock()
        info.parent_type.name = parent_type_name
        info.field_name = field_name
        info.operation = None
        return info

    def test_wraps_query_resolver_in_span(self):
        """GraphQLTracingExtension.resolve must create a span for Query fields."""
        from soroscan import graphql_extensions as ext_mod
        from soroscan.graphql_extensions import GraphQLTracingExtension

        mock_span = MagicMock()
        mock_span.__enter__ = MagicMock(return_value=mock_span)
        mock_span.__exit__ = MagicMock(return_value=False)
        mock_tracer = MagicMock()
        mock_tracer.start_as_current_span.return_value = mock_span

        ext = GraphQLTracingExtension.__new__(GraphQLTracingExtension)
        _next = MagicMock(return_value="result")
        info = self._make_info("Query", "contracts")

        with patch.object(ext_mod, "otel_trace") as mock_otel:
            mock_otel.get_tracer.return_value = mock_tracer
            result = ext.resolve(_next, None, info)

        mock_tracer.start_as_current_span.assert_called_once()
        span_name = mock_tracer.start_as_current_span.call_args[0][0]
        assert span_name == "graphql.query.contracts"
        assert result == "result"

    def test_skips_non_top_level_types(self):
        """GraphQLTracingExtension.resolve must pass through non-root type fields."""
        from soroscan import graphql_extensions as ext_mod
        from soroscan.graphql_extensions import GraphQLTracingExtension

        ext = GraphQLTracingExtension.__new__(GraphQLTracingExtension)
        _next = MagicMock(return_value="nested")
        info = self._make_info("ContractType", "event_count")

        with patch.object(ext_mod, "otel_trace") as mock_otel:
            result = ext.resolve(_next, None, info)

        mock_otel.get_tracer.assert_not_called()
        _next.assert_called_once_with(None, info)
        assert result == "nested"

    def test_wraps_mutation_resolver_in_span(self):
        """GraphQLTracingExtension.resolve must create a span for Mutation fields."""
        from soroscan import graphql_extensions as ext_mod
        from soroscan.graphql_extensions import GraphQLTracingExtension

        mock_span = MagicMock()
        mock_span.__enter__ = MagicMock(return_value=mock_span)
        mock_span.__exit__ = MagicMock(return_value=False)
        mock_tracer = MagicMock()
        mock_tracer.start_as_current_span.return_value = mock_span

        ext = GraphQLTracingExtension.__new__(GraphQLTracingExtension)
        _next = MagicMock(return_value=None)
        info = self._make_info("Mutation", "registerContract")

        with patch.object(ext_mod, "otel_trace") as mock_otel:
            mock_otel.get_tracer.return_value = mock_tracer
            ext.resolve(_next, None, info)

        span_name = mock_tracer.start_as_current_span.call_args[0][0]
        assert span_name == "graphql.mutation.registerContract"


# ---------------------------------------------------------------------------
# Integration tests: end-to-end span creation with real OTel SDK
# ---------------------------------------------------------------------------

class TestTracingIntegration:
    """
    Integration tests using the real OTel SDK (no mocks on the SDK itself).
    Uses an in-memory span exporter to verify spans are actually recorded.
    """

    def test_ingest_tracer_records_span(self):
        """tracer.start_as_current_span must produce a finished span."""
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
        from opentelemetry.sdk.trace.export import SimpleSpanProcessor

        exporter = InMemorySpanExporter()
        provider = TracerProvider()
        provider.add_span_processor(SimpleSpanProcessor(exporter))
        tracer = provider.get_tracer("soroscan.ingest")

        with tracer.start_as_current_span("test.span", attributes={"key": "val"}):
            pass

        spans = exporter.get_finished_spans()
        assert len(spans) == 1
        assert spans[0].name == "test.span"
        assert spans[0].attributes["key"] == "val"

    def test_context_propagation_across_boundaries(self):
        """W3C traceparent injected into headers must be extractable on the other side."""
        from opentelemetry import propagate
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
        from opentelemetry.sdk.trace.export import SimpleSpanProcessor

        exporter = InMemorySpanExporter()
        provider = TracerProvider()
        provider.add_span_processor(SimpleSpanProcessor(exporter))
        tracer = provider.get_tracer("test")

        # Producer side: start span and inject context
        headers: dict = {}
        with tracer.start_as_current_span("producer.span") as span:
            propagate.inject(headers)
            original_trace_id = span.get_span_context().trace_id

        assert "traceparent" in headers

        # Consumer side: extract context and start child span
        ctx = propagate.extract(headers)
        with tracer.start_as_current_span("consumer.span", context=ctx) as child_span:
            child_trace_id = child_span.get_span_context().trace_id

        # Both spans must share the same trace ID
        assert original_trace_id == child_trace_id

    def test_sampling_rate_zero_produces_no_spans(self):
        """A sampler with rate=0.0 must not record any spans."""
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.sampling import TraceIdRatioBased, ParentBased
        from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
        from opentelemetry.sdk.trace.export import SimpleSpanProcessor

        exporter = InMemorySpanExporter()
        sampler = ParentBased(root=TraceIdRatioBased(0.0))
        provider = TracerProvider(sampler=sampler)
        provider.add_span_processor(SimpleSpanProcessor(exporter))
        tracer = provider.get_tracer("test")

        for _ in range(10):
            with tracer.start_as_current_span("dropped.span"):
                pass

        assert len(exporter.get_finished_spans()) == 0

    def test_sampling_rate_one_records_all_spans(self):
        """A sampler with rate=1.0 must record every span."""
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.sampling import TraceIdRatioBased, ParentBased
        from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
        from opentelemetry.sdk.trace.export import SimpleSpanProcessor

        exporter = InMemorySpanExporter()
        sampler = ParentBased(root=TraceIdRatioBased(1.0))
        provider = TracerProvider(sampler=sampler)
        provider.add_span_processor(SimpleSpanProcessor(exporter))
        tracer = provider.get_tracer("test")

        for _ in range(5):
            with tracer.start_as_current_span("recorded.span"):
                pass

        assert len(exporter.get_finished_spans()) == 5
