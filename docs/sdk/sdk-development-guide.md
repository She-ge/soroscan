# SDK & Library Development Guide

This guide covers best practices for developing and maintaining the SoroScan SDKs in Python and TypeScript.

## SDK Design Principles

- Keep APIs consistent across languages.
- Prefer clear error handling and typed responses.
- Use async/await patterns for asynchronous operations.
- Provide strong type hints and documentation.

## Python SDK Development

### Project structure
Document the core project layout:
- `sdk/python/pyproject.toml`
- `sdk/python/soroscan/`
- `sdk/python/tests/`
- `sdk/python/.github/workflows/ci.yml`

### Type hints coverage
- Use `typing` and `pydantic` models for API payloads.
- Document return types and exception types.

### Testing strategies
- Unit tests for serialization, errors, and helpers.
- Integration tests for API workflows.
- Use `pytest` and isolate external calls with mocks.

### Documentation generation
- Use `README.md` and developer docs in `sdk/python/`.
- Keep usage examples current.

### Release to PyPI
- Build packages with `hatch build`.
- Publish with `pypa/gh-action-pypi-publish`.

## TypeScript SDK Development

### Project structure
Document the SDK layout:
- `sdk/typescript/package.json`
- `sdk/typescript/src/`
- `sdk/typescript/tests/`
- `sdk/typescript/README.md`

### Type generation from GraphQL
- Generate types from GraphQL schemas where possible.
- Keep generated types in sync with API changes.

### Async/Promise patterns
- Use async/await for network calls.
- Return typed promises and propagate errors clearly.

### Testing with Jest
- Test request serialization, error handling, and SDK behavior.
- Mock HTTP clients to decouple from backend responses.

### Release to npm
- Publish package using `npm` or `pnpm` workflows.
- Keep `package.json` version aligned with git tags.

## SDK Examples

### Authentication workflow
- Show API key usage and token management.

### Event querying
- Example request for event list and filters.

### Real-time subscriptions
- Demonstrate websocket or webhook-based event handling.

### Webhook management
- Show create/update/delete webhook patterns.

### Error handling examples
- Catch and inspect SDK-specific exception classes.

## SDK Versioning & Releases

### Semantic versioning
- Use `MAJOR.MINOR.PATCH`.
- Release breaking changes only on major version updates.

### Changelog maintenance
- Keep a changelog for SDK releases.
- Document notable changes and migration notes.

### Breaking changes policy
- Document why a breaking change is required.
- Provide upgrade instructions.

### Release checklist
- Update version
- Update changelog
- Run tests
- Verify package build

## SDK Integration Tests

### Live API testing
- Use end-to-end tests against a staging API.

### Mock server testing
- Mock HTTP responses to validate SDK behavior.

### End-to-end examples
- Provide workflows that cover auth, query, and events.
