# Testing & Quality Assurance

This guide documents SoroScan's testing strategy across the backend, frontend, contracts, and end-to-end workflows.

## Testing Strategy Overview

- Testing pyramid: unit tests for fast validation, integration tests for subsystem behavior, end-to-end tests for full workflows.
- Coverage goals: use targeted coverage metrics for critical business logic and key API surfaces.
- Test data management: prefer fixtures, factories, and isolated database state.
- Mocking and stubbing: mock external services and blockchain RPC responses while keeping contract and integration tests realistic.

## Backend Testing Guide (Django)

- Unit tests for models, views, serializers, helpers, and custom validators.
- Integration tests for database-backed behavior and REST/GraphQL endpoints.
- Celery task testing for webhook dispatch, retry behavior, and background ingestion.
- `pytest` fixtures for reusable database state, authentication, and API clients.

Example `pytest` unit test:

```python
from django.urls import reverse
from rest_framework import status

from soroscan.ingest.models import Event


def test_event_serializer_creates_event(api_client, event_data):
    url = reverse('event-list')
    response = api_client.post(url, event_data)

    assert response.status_code == status.HTTP_201_CREATED
    assert Event.objects.filter(tx_hash=event_data['tx_hash']).exists()
```

Example fixture structure:

```python
import pytest
from django.contrib.auth.models import User

@pytest.fixture
def api_client(client, django_user_model):
    user = django_user_model.objects.create_user('tester', 'tester@example.com', 'pass')
    client.force_login(user)
    return client
```

## Frontend Testing Guide (Next.js / React)

- Component testing with React Testing Library.
- Hook testing for custom hooks and Apollo Client integration.
- Page-level integration testing for component interactions and navigation.
- MSW setup for mocking GraphQL and REST requests.
- Jest configuration for snapshot testing and code coverage.

Example component test:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EventCard from '@/components/EventCard';

it('renders event fields and responds to click', async () => {
  render(<EventCard event={{ id: '1', name: 'Transfer', block: 123 }} />);

  expect(screen.getByText('Transfer')).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /details/i }));
  expect(screen.getByText(/block 123/i)).toBeVisible();
});
```

## Contract Testing Guide (Rust)

- Soroban contract unit tests for business logic and edge cases.
- Contract integration tests that simulate transactions and external state.
- Use the Soroban testing harness to verify emitted events and contract behavior.

Example command:

```bash
cd soroban-contracts/soroscan_core
cargo test
```

## End-to-End Testing Guide

- Use Playwright to validate user workflows and API interactions.
- Test scenarios for event ingestion, webhook delivery, and dashboard behavior.
- Run full-stack E2E tests in CI to cover critical customer journeys.

Example command:

```bash
pnpm exec playwright test
```

## Performance Testing

- Load testing with `k6` or similar tools.
- Baseline performance metrics for API throughput, latency, and ingestion.
- Regression testing on key endpoints to detect performance drift.

## Chaos Engineering

- Scenario definitions live in `chaos-tests/scenarios.yaml`.
- CI validates chaos scenarios in dry-run mode.
- Destructive Kubernetes failure injection requires `SOROSCAN_CHAOS_RUN=1`.
- See `docs/testing/chaos-engineering.md` for pod termination, latency,
  memory pressure, and CPU throttling workflows.

## Cross-Team Notes

- Reference existing backend tests in `django-backend/`.
- Reference frontend tests in `soroscan-frontend/__tests__/`.
- Reference Soroban contract tests in `soroban-contracts/soroscan_core/`.
