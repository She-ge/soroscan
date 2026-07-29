"""
Log context for structured logging: request_id (HTTP) and task_id (Celery).
Ingest code should pass contract_id, ledger_sequence in logger extra=,
or call set_contract_id()/set_ledger_sequence() to inject them globally
into the current async/thread context for the duration of a request/task.
"""
import logging
from contextvars import ContextVar

# Correlation ID for the current request or Celery task (no PII).
log_context_var: ContextVar[dict] = ContextVar("log_context", default={})

# ---------------------------------------------------------------------------
# Setter helpers — call these from middleware, task signals, or ingest code
# to attach context that will appear in every log record for the current scope.
# ---------------------------------------------------------------------------


def set_request_id(request_id: str) -> None:
    """Set request_id in context (e.g. from middleware)."""
    ctx = dict(log_context_var.get())
    ctx["request_id"] = request_id
    log_context_var.set(ctx)


def set_task_id(task_id: str) -> None:
    """Set task_id in context (e.g. from Celery task)."""
    ctx = dict(log_context_var.get())
    ctx["task_id"] = task_id
    log_context_var.set(ctx)


def set_contract_id(contract_id: str) -> None:
    """Inject contract_id into the current log context (Issue #763).

    Propagates to all log records emitted in the current async/thread context,
    including those in called functions, without requiring explicit extra= passing.
    """
    ctx = dict(log_context_var.get())
    ctx["contract_id"] = contract_id
    log_context_var.set(ctx)


def set_ledger_sequence(ledger_sequence: int | str) -> None:
    """Inject ledger_sequence into the current log context (Issue #763).

    Call this at the start of ledger processing so every subsequent log record
    carries the ledger number without extra= boilerplate.
    """
    ctx = dict(log_context_var.get())
    ctx["ledger_sequence"] = str(ledger_sequence)
    log_context_var.set(ctx)


def get_log_extra() -> dict:
    """Return current context for logger extra= (no PII)."""
    ctx = log_context_var.get()
    return dict(ctx) if ctx else {}


# All keys that the JSON formatter expects (Issue #763).
# Providing defaults here ensures no KeyError even when a field was never set.
_LOG_CONTEXT_DEFAULTS: dict[str, str] = {
    "request_id": "",
    "task_id": "",
    "contract_id": "",
    "ledger_sequence": "",
}


class LogContextFilter(logging.Filter):
    """Add request_id, task_id, contract_id, and ledger_sequence from context to each LogRecord."""

    def filter(self, record: logging.LogRecord) -> bool:
        # Apply defaults first so the JSON formatter always finds the keys
        for key, default in _LOG_CONTEXT_DEFAULTS.items():
            if not hasattr(record, key):
                setattr(record, key, default)

        # Then overlay any values actually set in the current context
        ctx = log_context_var.get()
        if ctx:
            for key, value in ctx.items():
                if value is not None:
                    setattr(record, key, value)
        return True
