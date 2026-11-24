---
title: SDK Development Guide
description: Architecture, adding API methods, type generation, testing, and release process for SoroScan SDKs
sidebar_label: SDK Development
---

## SDK Development Guide

This guide covers best practices for developing and maintaining the SoroScan SDKs in Python and TypeScript. For the
contributor-focused checklist and workflow, see the
[Contributing SDK Development Guide](../contributing/sdk-development.md).

## Architecture Overview

SoroScan SDKs share the same API contract and follow a thin-client design:

- **Thin API clients** over stable REST endpoints (`/api/contracts/`, `/api/events/`, `/api/webhooks/`, etc.).
- **Typed request/response models** generated from API schemas when possible (Pydantic v2 in Python, TypeScript
  interfaces).
- **Shared behavior** across SDKs: auth, retries, pagination, and error mapping.
- **Backward-compatible public interfaces** for minor and patch releases; breaking changes only on major bumps.

Repository layout:

- `sdk/python/`: Python package source (`soroscan/client.py`, `soroscan/builder.py`, `soroscan/models.py`), tests, and
  packaging metadata (`pyproject.toml`).
- `sdk/typescript/`: TypeScript package source (`src/`), build config (`package.json`, `tsconfig.json`), and tests.
- `docs/sdk-python.md` and `docs/sdk-typescript.md`: consumer-facing usage docs (these link here).
- `docs/api-reference/`: OpenAPI artifacts — source of truth for type generation.

Design principles:

- Keep APIs consistent across languages (same resource naming, same parameter order).
- Prefer clear error handling and typed responses over raw maps.
- Use async/await patterns for asynchronous operations in both SDKs.
- Provide strong type hints and documentation with examples.

## How To Add a New API Method

Use this step-by-step workflow for both SDKs when a new backend endpoint ships.

### 1. Confirm the endpoint contract

- Verify path, HTTP method, auth requirements, query parameters, request body, and response shape from
  `django-backend/soroscan/ingest/views.py` or OpenAPI schema.
- Check whether pagination/cursor fields are involved and whether the endpoint is JSON or binary.

### 2. Add types/models

- **Python:** add/update Pydantic models in `sdk/python/soroscan/models.py` (e.g., `GetAdminResponse`, `ContractStats`).
  Export new models in `soroscan/__init__.py`.
- **TypeScript:** add/update exported interfaces in `sdk/typescript/src/types.ts` and ensure they are re-exported from
  the entry point.

Example naming pattern:

- REST endpoint: `GET /api/ingest/contracts/{id}/stats/`
- Python method: `get_contract_stats(contract_id: str) -> ContractStats`
- TypeScript method: `getContractStats({ contractId }: { contractId: string }): Promise<ContractStats>`

### 3. Implement the client method

Keep naming resource-centric and consistent with existing methods (see `soroscan/client.py` and TypeScript
`src/client.ts`):

```python
# Python — synchronous
def get_contract_stats(self, contract_id: str) -> ContractStats:
    url = urljoin(self.base_url, f"/api/contracts/{contract_id}/stats/")
    response = self._client.get(url, headers=self._get_headers())
    data = self._handle_response(response)
    return ContractStats.model_validate(data)

# Python — fluent builder (issue #1281)
events = (client.events()
    .filter_by_contract("ABC123")
    .filter_by_event_type("transfer")
    .paginate(limit=50, offset=0)
    .execute())
```

```typescript
// TypeScript
async getContractStats({ contractId }: { contractId: string }): Promise<ContractStats> {
  const res = await fetch(`${this.baseUrl}/api/contracts/${contractId}/stats/`, {
    headers: this.getHeaders(),
  });
  return this.handleResponse(res) as Promise<ContractStats>;
}
```

- Validate inputs early and keep HTTP concerns in a shared transport layer (`_get_headers`, `_handle_response`).
- Return strongly typed objects instead of untyped maps where feasible.

### 4. Add tests

Cover at minimum:

- Happy-path response mapping
- Error-path mapping (4xx/5xx → `SoroScanValidationError`, `SoroScanNotFoundError`, `SoroScanRateLimitError`)
- Edge behavior (pagination, optional fields, nullables)

```python
# tests/test_builder.py or test_client.py
builder = EventQueryBuilder(client).filter_by_contract("CCAAA").filter_by_event_type("transfer")
params = builder.build()
assert params["contract_id"] == "CCAAA"
```

### 5. Update docs and changelog

- Add method usage snippets in `docs/sdk-python.md` and `docs/sdk-typescript.md`.
- Update `sdk/python/CHANGELOG.md` and `sdk/typescript/CHANGELOG.md` with compatibility impact.
- Add entry to `docs/changelog.md` if the endpoint is user-visible.

## Type Generation Workflow

When backend schema changes, regenerate types before SDK updates.

### Source of truth

- OpenAPI artifacts in `docs/api-reference/` (generated via `drf-spectacular` at `GET /api/schema/`).
- Backend schema generation scripts in `django-backend/soroscan/management/commands/`.

### Regeneration steps

1. Regenerate backend API docs/schemas:

   ```bash
   cd django-backend
   python manage.py spectacular --file ../docs/api-reference/schema.yaml
   ```

1. Regenerate TypeScript GraphQL/REST types where applicable:

   ```bash
   cd sdk/typescript
   pnpm run generate:types   # or pnpm run codegen if using GraphQL
   ```

1. Update Python typed models from schema updates in `sdk/python/soroscan/models.py`.
1. Diff generated artifacts and verify only intended contract changes:

   ```bash
   git diff docs/api-reference/ sdk/typescript/src/generated/
   ```

Frontend note — always run codegen when GraphQL schema changes, even if SDK work is REST-focused:

```bash
cd soroscan-frontend
pnpm run codegen
```

Keep generated types in sync with API changes and commit the updated schema file alongside SDK changes so CI can detect
drift.

## Testing Requirements

Every SDK change should include automated tests at the right level.

### Minimum test matrix

| Area             | What to test                                                                             | Example tooling                         |
| ---------------- | ---------------------------------------------------------------------------------------- | --------------------------------------- |
| Request building | Filter → query param mapping, builder chaining                                           | `pytest` + `Mock` (`test_builder.py`)   |
| Response parsing | JSON → Pydantic/TS interface                                                             | `pydantic.TypeAdapter`, snapshot tests  |
| Error mapping    | `401→SoroScanAuthError`, `404→SoroScanNotFoundError`, `429→RateLimit`, `500→ServerError` | `pytest.raises`, Jest mock fetch        |
| Pagination       | `page`/`page_size`, `limit`/`offset` conversion                                          | builder `paginate(limit, offset)` tests |
| Serialization    | Optional and nested fields, nullable strings                                             | parametrized tests                      |

Recommended checks before merge:

```bash
# Python
cd sdk/python && pytest -v
mypy soroscan --strict
ruff check soroscan/

# TypeScript
cd sdk/typescript && pnpm test && pnpm build
pnpm run typecheck
```

Integration levels:

- **Unit tests** for serialization, errors, and helpers (fast, mocked).
- **Integration tests** for API workflows (stage API or pact mock).
- **Live API testing** against staging for smoke validation.

## Release Process

Use semantic versioning (`MAJOR.MINOR.PATCH`) for both SDKs.

### 1. Decide version bump

- **Patch:** bug fixes only, no new fields.
- **Minor:** backward-compatible new methods/fields.
- **Major:** breaking API or behavior changes (rename, remove, change required param).

### 2. Prepare release notes

Document:

- Added methods (`get_admin`, `record_tagged_event`, builder `webhooks()`).
- Fixed bugs.
- Deprecations or migrations with before/after code snippets.

### 3. Tag and publish

**Python (PyPI):**

```bash
# Update version in sdk/python/pyproject.toml and sdk/python/soroscan/__init__.py
hatch build
# GitHub Action: pypa/gh-action-pypi-publish on tag push
git tag sdk/python-v0.2.1 && git push origin sdk/python-v0.2.1
```

**TypeScript (npm):**

```bash
# Update version in sdk/typescript/package.json
pnpm build
npm publish --access public
git tag sdk/typescript-v0.2.1 && git push origin sdk/typescript-v0.2.1
```

Keep `package.json` version aligned with git tags.

### 4. Post-release validation

- Install from registry in a clean environment:

  ```bash
  pip install soroscan-sdk==0.2.1 --no-cache-dir
  npm install @soroscan/sdk@0.2.1
  ```

- Run a smoke test against production-like API:

  ```python
  from soroscan import SoroScanClient
  c = SoroScanClient(base_url="https://api.soroscan.io")
  print(c.get_events(page_size=1))
  ```

### Release checklist

- [ ] Version bumped in manifest (`pyproject.toml` / `package.json`) and `__init__.py` where applicable
- [ ] Changelog updated
- [ ] Tests pass (`pytest`, `pnpm test`, `pnpm build`)
- [ ] Package builds cleanly (`hatch build`, `pnpm pack`)
- [ ] Docs updated (`docs/sdk-python.md`, `docs/sdk-typescript.md`)
- [ ] Git tag created and pushed
- [ ] Published to registry verified

## SDK Examples

### Authentication workflow

```python
from soroscan import SoroScanClient

client = SoroScanClient(
    base_url="https://api.soroscan.io",
    api_key="your-api-key"
)
# Or via environment: SOROSCAN_API_KEY / SOROSCAN_BASE_URL with CLI
```

### Fluent Builder Querying (Python)

```python
from soroscan import SoroScanClient

client = SoroScanClient(base_url="https://api.soroscan.io", api_key="...")

# Build without executing (inspect params)
query = (client.events()
    .filter_by_contract("ABC123")
    .filter_by_event_type("transfer")
    .filter_by_ledger_range(min=1000, max=2000)
    .order_by("-timestamp")
    .paginate(limit=50, offset=0)
    .build())
# {'contract_id': 'ABC123', 'event_type': 'transfer', 'ledger_min': 1000, 'ledger_max': 2000, 'ordering': '-timestamp', 'page': 1, 'page_size': 50}

# Execute with pagination
events = (client.events()
    .filter_by_contract("ABC123")
    .filter_by_event_type("transfer")
    .paginate(limit=50, offset=0)
    .execute())
for e in events.results:
    print(e.ledger, e.event_type)

# Contracts
contracts = (client.contracts()
    .filter_by_active(True)
    .search("token")
    .page(1, 20)
    .execute())

# Webhooks
webhooks = (client.webhooks()
    .filter_by_active(True)
    .filter_by_event_type("transfer")
    .paginate(limit=20, offset=0)
    .execute())
```

### TypeScript Event Querying

```typescript
import { SoroScanClient } from "@soroscan/sdk";

const client = new SoroScanClient({ baseUrl: "https://api.soroscan.io", apiKey: "..." });
const events = await client.getEvents({ contractId: "CCAAA...", eventType: "transfer", first: 50 });
```

### Webhook Management

```python
webhook = client.create_webhook(contract_id=1, target_url="https://myapp.com/hook", event_type="transfer")
client.update_webhook(webhook.id, is_active=False)
client.test_webhook(webhook.id)
```

### Error Handling

```python
from soroscan import SoroScanNotFoundError, SoroScanValidationError

try:
    client.get_contract("INVALID")
except SoroScanNotFoundError as e:
    print(f"Not found: {e.resource_id}")
except SoroScanValidationError as e:
    print(f"Validation failed: {e.errors}")
```

## SDK Integration Tests

### Live API testing

Use end-to-end tests against a staging API:

```bash
SOROSCAN_BASE_URL=https://staging.soroscan.io pytest tests/test_integration.py -v
```

### Mock server testing

Mock HTTP responses to validate SDK behavior without network:

```python
from unittest.mock import Mock
from soroscan.builder import EventQueryBuilder

mock_client = Mock()
builder = EventQueryBuilder(mock_client).filter_by_contract("CCAAA")
builder.execute()
mock_client.get_events.assert_called_once()
```

### End-to-end examples

Provide workflows that cover auth, query, and webhook:

```python
with SoroScanClient(base_url="https://api.soroscan.io", api_key="...") as client:
    contracts = client.get_contracts(is_active=True)
    for c in contracts.results:
        health = client.get_contract_health(c.contract_id)
        print(c.name, health.status)
```

---

## Pull Request Checklist

- [ ] New methods include typed request/response definitions with type hints
- [ ] Tests cover success and failure paths (including 401/404/429)
- [ ] Public docs (`docs/sdk-python.md`, `docs/sdk-typescript.md`) updated with snippets
- [ ] Changelog updated with compatibility impact
- [ ] Sidebar navigation updated if new doc added
- [ ] `pnpm run codegen` run if GraphQL schema changed

_See also the concise contributor checklist in `docs/contributing/sdk-development.md`._
