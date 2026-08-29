# SDK Development Guide

This guide explains how to develop and maintain SoroScan SDKs for Python and TypeScript.

## Architecture Overview

SoroScan SDKs share the same API contract and follow the same design goals:

- Thin API clients over stable REST endpoints.
- Typed request/response models generated from API schemas when possible.
- Shared behavior across SDKs: auth, retries, pagination, and error mapping.
- Backward-compatible public interfaces for minor and patch releases.

Repository layout:

- `sdk/python/`: Python package source, tests, and packaging metadata.
- `sdk/typescript/`: TypeScript package source, build config, and tests.
- `docs/sdk-python.md` and `docs/sdk-typescript.md`: consumer-facing usage docs.

## Local Development Setup

### Python SDK

```bash
cd sdk/python
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
pytest
```

### TypeScript SDK

```bash
cd sdk/typescript
pnpm install
pnpm test
pnpm build
```

## How To Add a New API Method

Use this workflow for both SDKs.

1. Confirm the endpoint contract.
- Verify path, method, auth requirements, query parameters, request body, and response shape.
- Check whether pagination/cursor fields are involved.

2. Add types/models.
- Python: add/update dataclasses or pydantic models used by the new method.
- TypeScript: add/update exported interfaces and type aliases.

3. Implement the client method.
- Keep naming resource-centric and consistent with existing methods.
- Validate inputs early and keep HTTP concerns in a shared transport layer.
- Return strongly typed objects instead of untyped maps where feasible.

4. Add tests.
- Happy path response mapping.
- Error path mapping (4xx/5xx).
- Edge behavior (pagination, optional fields, nullables).

5. Update docs and changelog.
- Add method usage snippets in SDK docs.
- Record compatibility impact.

Example naming pattern:

- REST endpoint: `GET /api/ingest/contracts/{id}/stats/`
- Python method: `get_contract_stats(contract_id: str)`
- TypeScript method: `getContractStats({ contractId }: { contractId: string })`

## Type Generation Workflow

When backend schema changes, regenerate types before SDK updates.

### Source of truth

- OpenAPI artifacts in `docs/api-reference/`.
- Backend schema generation scripts in `django-backend/soroscan/management/commands/`.

### Regeneration steps

1. Regenerate backend API docs/schemas.
2. Regenerate TypeScript GraphQL/REST types where applicable.
3. Update Python typed models from schema updates.
4. Diff generated artifacts and verify only intended contract changes.

Frontend note:

```bash
cd soroscan-frontend
pnpm run codegen
```

Run codegen whenever GraphQL schema changes, even if SDK work is REST-focused.

## Testing Requirements

Every SDK change should include automated tests at the right level.

Minimum test matrix:

- Unit tests for request building and response parsing.
- Error mapping tests for `401`, `404`, `429`, `500`.
- Pagination tests for list endpoints.
- Serialization tests for optional and nested fields.

Recommended checks before merge:

```bash
# Python
cd sdk/python && pytest

# TypeScript
cd sdk/typescript && pnpm test && pnpm build
```

## Release Process

Use semantic versioning for both SDKs.

1. Decide version bump.
- Patch: bug fixes only.
- Minor: backward-compatible new methods/fields.
- Major: breaking API or behavior changes.

2. Prepare release notes.
- Added methods.
- Fixed bugs.
- Deprecations or migrations.

3. Tag and publish.
- Python: build and publish to PyPI.
- TypeScript: publish to npm.

4. Post-release validation.
- Install from registry in a clean environment.
- Run a smoke test against production-like API.

## Pull Request Checklist

- New methods include typed request/response definitions.
- Tests cover success and failure paths.
- Public docs updated.
- Changelog updated.
- Compatibility impact documented.
