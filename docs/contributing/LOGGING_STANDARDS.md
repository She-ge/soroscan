# SoroScan Logging Standards

This document outlines the structured logging format and conventions used throughout the SoroScan codebase. Following these standards ensures that our logs are easily searchable, monitorable, and secure.

## 1. Field Naming Conventions

All logs should be structured as JSON (in production) or key-value pairs (in development) using consistent field names. Do not use plain text strings for complex data.

### Standard Fields
Every log entry MUST contain these fields automatically injected by the logger:
* `timestamp` (ISO-8601 format, e.g., `2023-10-12T15:00:00Z`)
* `level` (e.g., `INFO`, `ERROR`)
* `service` (e.g., `django-api`, `celery-worker`, `nextjs-frontend`)
* `trace_id` (For distributed tracing, if applicable)

### Contextual Fields
When adding custom fields, use snake_case and standard terminology:
* `contract_id`: The Soroban smart contract identifier.
* `tx_hash`: The transaction hash on the Stellar network.
* `ledger_seq`: The ledger sequence number.
* `user_id`: The ID of the authenticated user.
* `webhook_url`: The destination URL for webhook dispatches.
* `latency_ms`: Execution time in milliseconds.

## 2. Log Level Usage Guidelines

Choose the appropriate log level based on the actionable nature of the event:

* **DEBUG**: Highly detailed information used strictly for local development or diagnosing complex issues. Examples: Dumping variable states, HTTP request bodies (sanitized).
* **INFO**: General system operation events that confirm things are working as expected. Examples: Service startup, job completion, successful database migrations.
* **WARNING**: Unexpected events that do not halt the application but might require investigation later. Examples: Deprecated API usage, retrying a transient network failure, rate-limiting a user.
* **ERROR**: An operation failed, but the application continues running. Examples: Unhandled exceptions in an API endpoint, failed webhook deliveries after max retries, database connection timeouts.
* **CRITICAL**: The application or a core subsystem has crashed or is in an unrecoverable state requiring immediate paging. Examples: Complete loss of database connectivity, out of memory errors.

## 3. Error Logging Standards

When logging errors, always include actionable context to facilitate debugging without needing to reproduce the issue locally.

* **Always log the exception traceback** alongside the error message.
* **Include the state** that led to the error (e.g., the `contract_id` and `tx_hash` being processed).
* **Never swallow exceptions silently**. If catching an exception to recover, log it as a `WARNING`.
* **Use error codes** or consistent error categories if applicable.

## 4. Sensitive Data Masking Rules

Security is paramount. You MUST NEVER log Personally Identifiable Information (PII) or secrets.

### Data that MUST NOT be logged:
* Passwords, session tokens, or JWTs.
* API Keys, Secret Keys, or Seed Phrases.
* Financial account details (unless explicitly authorized and masked).

### Masking Rules:
* If logging an API Key or Token for debugging purposes, only log the last 4 characters: `sk_...1a2b`.
* Authorization headers must be scrubbed automatically by the HTTP middleware before reaching the logger.
* Use our custom `MaskingFormatter` (available in the Python backend) or `pino-redact` (in the Node frontend) to ensure fields like `password`, `token`, and `authorization` are replaced with `[REDACTED]`.

---

## 5. Examples for Each Log Type

### DEBUG
```json
{
  "timestamp": "2023-10-12T15:01:23Z",
  "level": "DEBUG",
  "service": "django-api",
  "message": "Calculated pagination offset",
  "offset": 50,
  "limit": 25,
  "query_params": {"contract_id": "CC...123"}
}
```

### INFO
```json
{
  "timestamp": "2023-10-12T15:02:00Z",
  "level": "INFO",
  "service": "celery-worker",
  "message": "Successfully ingested ledger",
  "ledger_seq": 105678,
  "events_processed": 42,
  "latency_ms": 135
}
```

### WARNING
```json
{
  "timestamp": "2023-10-12T15:05:12Z",
  "level": "WARNING",
  "service": "webhook-dispatcher",
  "message": "Webhook delivery failed, scheduling retry",
  "webhook_id": "wh_890",
  "webhook_url": "https://example.com/hook",
  "attempt_number": 2,
  "status_code": 503
}
```

### ERROR
```json
{
  "timestamp": "2023-10-12T15:10:45Z",
  "level": "ERROR",
  "service": "django-api",
  "message": "Database query timeout while fetching events",
  "contract_id": "CC...123",
  "traceback": "Traceback (most recent call last):\n  File \"views.py\"...",
  "trace_id": "req-xyz-123"
}
```

---

## 6. Guidelines for New Code

1. **Use the configured logger instance**: Never use `print()` or `console.log()` in production code.
   - Python: Use `logging.getLogger(__name__)` or the `structlog` instance.
   - TypeScript/Node: Use the configured `pino` or `winston` logger.
2. **Pass context as kwargs/objects**: Do not use string formatting for dynamic data. Let the structured logger handle serialization.
   - ❌ Bad: `logger.info(f"User {user_id} logged in")`
   - ✅ Good: `logger.info("User logged in", user_id=user_id)`
3. **Review PRs for logging hygiene**: Maintainers will review Pull Requests to ensure error states are adequately logged and no sensitive data is leaked.
