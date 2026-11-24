# Developer Documentation

Internal documentation for SoroScan SDK developers.

## Project Structure

```
sdk/python/
├── soroscan/              # Main package
│   ├── __init__.py       # Public API exports
│   ├── client.py         # Sync/async clients
│   ├── models.py         # Pydantic models
│   └── exceptions.py     # Exception classes
├── tests/                # Test suite
│   ├── conftest.py       # Pytest fixtures
│   ├── test_client.py    # Sync client tests
│   ├── test_async_client.py  # Async client tests
│   ├── test_models.py    # Model validation tests
│   └── test_integration.py   # Integration tests
├── examples/             # Usage examples
├── pyproject.toml        # Package metadata
├── mypy.ini             # Type checker config
└── README.md            # User documentation
```

## Architecture

### Client Layer (`client.py`)

Two client implementations sharing the same interface:

- `SoroScanClient`: Synchronous using `httpx.Client`
- `AsyncSoroScanClient`: Asynchronous using `httpx.AsyncClient`

Both clients:

- Handle authentication via Bearer tokens
- Provide error handling with specific exceptions
- Support context managers for cleanup
- Use Pydantic for response validation

### Models Layer (`models.py`)

Pydantic v2 models for:

- Request validation (`RecordEventRequest`)
- Response parsing (all other models)
- Type safety throughout the SDK

Key models:

- `TrackedContract`: Contract metadata
- `ContractEvent`: Event data
- `WebhookSubscription`: Webhook config
- `PaginatedResponse[T]`: Generic pagination wrapper

### Exception Layer (`exceptions.py`)

Exception hierarchy:

```
SoroScanError (base)
└── SoroScanAPIError
    ├── SoroScanAuthError (401/403)
    ├── SoroScanNotFoundError (404)
    ├── SoroScanRateLimitError (429)
    └── SoroScanValidationError (400)
```

## Design Decisions

### Why httpx?

- Native async/sync support
- Modern API similar to requests
- HTTP/2 support
- Excellent type hints

### Why Pydantic v2?

- Runtime validation
- Automatic type coercion
- JSON schema generation
- Performance improvements over v1

### Why strict mypy?

- Catch bugs at development time
- Better IDE support
- Self-documenting code
- No `Any` types in public API

## Testing Strategy

### Unit Tests

- Mock all HTTP calls with `pytest-httpx`
- Test success and error paths
- Verify model validation
- Check exception handling

### Integration Tests

- Test complete workflows
- Verify pagination logic
- Test concurrent operations (async)

### Type Tests

- Run mypy in strict mode
- Verify no `Any` in return types
- Check all public APIs have hints

## Adding New Features

1. Update models in `models.py`
1. Add client methods in `client.py` (both sync and async)
1. Export from `__init__.py`
1. Add tests in `tests/`
1. Update README with examples
1. Run all checks: `python run_tests.py`

## Performance Considerations

- Use connection pooling (httpx default)
- Batch operations with async client
- Implement client-side caching if needed
- Consider pagination for large result sets

## Security

- API keys in headers, never in URLs
- HTTPS only (enforced by httpx)
- No sensitive data in logs
- Validate all inputs with Pydantic

## Future Enhancements

- WebSocket support (Phase 2)
- Response caching layer
- Retry logic with exponential backoff
- Rate limit handling with automatic retry
- CLI wrapper
- GraphQL client
