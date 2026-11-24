# Structured Logging Standard

This document defines the canonical structured logging format used across the
SoroScan backend (Django) and the Node/Next.js services. It complements the
[Logging Standards](../../docs/contributing/LOGGING_STANDARDS.md) and the
[Observability Guide](./index.md). Following it lets us aggregate logs in Loki /
Elasticsearch, correlate them with metrics and traces, and build reliable alerts.

## 1. Always emit structured records

Never log plain-text interpolation for anything beyond a single static message.

- **Python (Django / Celery):** use `logging.getLogger(__name__)` and pass
  context as keyword arguments. The JSON formatter (see `settings.py` logging
  config) serializes these as top-level fields.

  ```python
  logger.info("Event ingestion completed", contract_id=contract_id, ledger_seq=ledger, events=count)
  ```

- **TypeScript / Node:** use the configured `pino` logger with an object payload.

  ```ts
  logger.info({ contractId, ledgerSeq, events: count }, "Event ingestion completed");
  ```

String formatting (`logger.info(f"...")`) is forbidden for dynamic data because
it prevents field extraction and can leak secrets into the message body.

## 2. Canonical field naming

Use `snake_case` for all custom fields. The following fields are reserved and
must carry the documented meaning:

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | string (ISO-8601, UTC) | Emit time. |
| `level` | string | `DEBUG` / `INFO` / `WARNING` / `ERROR` / `CRITICAL`. |
| `service` | string | `django-api`, `celery-worker`, `nextjs-frontend`, `celery-beat`. |
| `request_id` | string | Injected by `RequestIdMiddleware` for every HTTP request. |
| `trace_id` | string | OpenTelemetry trace id when tracing is enabled. |
| `span_id` | string | OpenTelemetry span id when tracing is enabled. |
| `contract_id` | string | Soroban contract identifier. |
| `tx_hash` | string | Stellar transaction hash. |
| `ledger_seq` | int | Ledger sequence number. |
| `webhook_id` | int/string | Webhook subscription identifier. |
| `event_id` | int | Internal `ContractEvent` id. |
| `user_id` | int/string | Authenticated principal. |
| `latency_ms` | number | Operation duration in milliseconds. |

`request_id` and `trace_id` are added automatically by middleware / the tracing
setup, so handlers should **not** set them manually.

## 3. Log levels

| Level | Use for |
|-------|---------|
| `DEBUG` | Verbose local diagnostics; never enabled in production by default. |
| `INFO` | Normal lifecycle events: startup, ledger processed, delivery succeeded. |
| `WARNING` | Recoverable or expected-failure conditions: retries, rate limits, deprecated usage. |
| `ERROR` | An operation failed but the process continues: webhook exhausted retries, RPC error, DB timeout. |
| `CRITICAL` | Unrecoverable subsystem failure: lost DB connectivity, OOM. |

When catching an exception to recover, downgrade to `WARNING` and include the
exception via `logger.exception(...)` or `exc_info=True` so the traceback is
captured.

## 4. Error logging requirements

Every `ERROR` log must be actionable without reproducing locally:

1. Include the exception traceback (`logger.exception` or `exc_info=True`).
1. Include the state that produced it — at minimum the `contract_id` /
   `tx_hash` / `webhook_id` in scope.
1. Use stable error categories in a `error_type` field when helpful
   (e.g. `rpc_error`, `db_timeout`, `signature_invalid`).
1. Never swallow exceptions silently.

```python
try:
    response = client.get_ledger_entries(...)
except Exception:
    logger.exception(
        "Failed to fetch contract state",
        extra={"contract_id": contract_id, "error_type": "rpc_error"},
    )
    raise
```

## 5. Sensitive data masking

Logs MUST never contain secrets or PII.

- **Never** log: passwords, session tokens, JWTs, API keys, seed phrases,
  full financial account details.
- The HTTP layer scrubs `authorization` / `cookie` headers before they reach
  the logger.
- When debugging requires an identifier, log only the last 4 characters:
  `sk_...1a2b`.
- The backend JSON formatter masks known secret keys (`password`, `token`,
  `secret`, `authorization`, `api_key`) by replacing their values with
  `[REDACTED]`.

## 6. Correlating logs with traces and metrics

- `request_id` (HTTP) and `trace_id`/`span_id` (OpenTelemetry) let you jump
  from a slow request in Grafana to the exact log lines and spans.
- Business-critical operations emit OpenTelemetry spans (see
  `soroscan/ingest/telemetry.py`) with the same `contract_id` / `event_id` /
  `webhook_id` attributes used in logs, so a trace and a log line describe the
  same entity.
- Latency is exported as the `soroscan_request_latency_seconds` histogram and
  error rates as `soroscan_http_responses_total`; annotate logs with
  `latency_ms` using the same units.

## 7. Examples

### INFO

```json
{
  "timestamp": "2026-08-29T12:00:00Z",
  "level": "INFO",
  "service": "celery-worker",
  "request_id": "req-abc123",
  "trace_id": "4bf9...",
  "message": "Event ingestion completed",
  "contract_id": "CC...123",
  "ledger_seq": 105678,
  "events": 42,
  "latency_ms": 135
}
```

### ERROR

```json
{
  "timestamp": "2026-08-29T12:05:12Z",
  "level": "ERROR",
  "service": "django-api",
  "request_id": "req-xyz789",
  "trace_id": "7c2e...",
  "message": "Failed to fetch contract state",
  "contract_id": "CC...123",
  "error_type": "rpc_error",
  "traceback": "Traceback (most recent call last):\n  ..."
}
```

## 8. Checklist for new code

- [ ] Uses the configured logger, not `print` / `console.log`.
- [ ] Dynamic data passed as structured fields, not f-strings.
- [ ] `ERROR` logs carry `exc_info`/traceback + entity ids.
- [ ] No secrets or PII in the payload.
- [ ] Reuses canonical field names from section 2.
