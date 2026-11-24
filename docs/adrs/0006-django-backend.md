# ADR 0006: Django for the SoroScan Backend

## Status

Accepted

This ADR records an architecture decision that was already implemented in SoroScan. It was migrated from the former
`docs/architecture/adr_001_django_backend.md` during the ADR consolidation (see issue #1685).

## Context

SoroScan requires a backend capable of supporting several related responsibilities:

- ingesting and persisting Soroban contract events;
- exposing REST and GraphQL APIs;
- managing tracked contracts, events, invocations, webhooks, organizations, and related data;
- performing authenticated and authorized operations;
- running database migrations;
- supporting administrative workflows;
- integrating asynchronous background processing;
- supporting PostgreSQL and Redis;
- providing a foundation for monitoring, testing, and operational tooling.

The backend therefore needs a mature application framework with strong database tooling and an ecosystem that supports
the rest of SoroScan's architecture.

The existing backend is located in `django-backend/` and is implemented using Django.

## Decision

SoroScan will use Django as the primary backend application framework.

Django provides the application, persistence, routing, authentication, migration, and administrative foundation for the
backend.

REST functionality is supported through Django REST Framework, while GraphQL functionality is integrated through
Strawberry GraphQL (see [ADR 0007](0007-strawberry-graphql.md)).

Asynchronous work such as event processing and webhook delivery is handled separately through Celery while remaining
integrated with the Django application and models.

## Rationale

Django fits SoroScan's requirements because it provides a mature, convention-based framework for building data-intensive
Python applications.

### ORM and database migrations

SoroScan maintains a significant relational data model for contracts, events, invocations, webhook subscriptions,
delivery logs, organizations, teams, and other operational data.

Django's ORM provides a consistent interface for these models, while Django migrations provide version-controlled schema
evolution.

The migration files under `django-backend/soroscan/ingest/migrations/` act as the application's database schema history.

### PostgreSQL integration

SoroScan uses PostgreSQL as its persistent data store (see [ADR 0003](0003-database-schema-rationale.md)). Django
provides mature PostgreSQL support and allows the application to combine relational data with flexible JSON-based event
payloads.

### API integration

SoroScan exposes both REST and GraphQL interfaces.

Django integrates with:

- Django REST Framework for REST APIs;
- Strawberry GraphQL for the GraphQL schema;
- authentication and authorization components used across the backend.

This allows both API styles to share the same application models and business logic.

### Background processing

SoroScan performs asynchronous work including event processing and webhook delivery.

Django integrates cleanly with Celery, allowing background workers to operate against the same application configuration
and data model.

### Maintainability

Django provides established conventions for models, migrations, settings, routing, middleware, testing, authentication,
and administration. Using these conventions reduces custom infrastructure code and makes the backend easier for Python
contributors to navigate.

## Alternatives Considered

### FastAPI

FastAPI provides a lightweight asynchronous API framework with strong Python type support. It could have been suitable
for an API-focused service, but SoroScan also depends heavily on relational models, migrations, administration,
authentication, and other application-framework functionality that Django provides as an integrated platform. Choosing
FastAPI would require selecting and maintaining additional libraries for several capabilities already provided by the
Django ecosystem.

### Flask

Flask provides a minimal and flexible Python web framework. Its smaller core can be beneficial for simple services, but
SoroScan requires substantial database, authentication, migration, API, and administrative functionality. Implementing
those capabilities with Flask would require more framework assembly and project-specific conventions.

### Node.js backend framework

A Node.js backend could provide a shared language with the React/Next.js frontend. However, the existing SoroScan
backend, data model, ingestion logic, operational tooling, and tests are Python-based. Moving the backend to a Node.js
framework would introduce significant migration cost without a clear benefit for the current architecture.

## Consequences

### Positive

- SoroScan has a mature ORM for its relational data model.
- Database schema changes are managed through Django migrations.
- REST and GraphQL APIs can share the same application models.
- Django integrates with PostgreSQL, Redis, Celery, and the existing authentication system.
- Contributors can follow established Django project conventions.
- Administrative and operational functionality can use Django's existing ecosystem.

### Negative

- Django is a comparatively large framework for services that only require lightweight HTTP endpoints.
- Some asynchronous or real-time workflows require additional components such as Celery, Channels, and Redis.
- Contributors working primarily with the frontend must understand a separate Python/Django backend stack.

### Neutral

- The frontend remains a separate Next.js application and communicates with the Django backend through API interfaces.
- Asynchronous processing remains the responsibility of Celery rather than Django request handlers.

## Implementation Notes

The primary Django implementation is located in:

- `django-backend/manage.py`
- `django-backend/soroscan/settings.py`
- `django-backend/soroscan/urls.py`
- `django-backend/soroscan/ingest/models.py`
- `django-backend/soroscan/ingest/views.py`
- `django-backend/soroscan/ingest/schema.py`
- `django-backend/soroscan/ingest/migrations/`

Background processing is integrated through:

- `django-backend/soroscan/celery.py`
- `django-backend/soroscan/ingest/tasks.py`

## Related Decisions

- [ADR 0007](0007-strawberry-graphql.md): Use Strawberry GraphQL for the GraphQL API
- [ADR 0003](0003-database-schema-rationale.md): Database Schema Rationale (PostgreSQL + JSONB)

## References

- [ADR Index](README.md)
- `django-backend/requirements.txt`
- `django-backend/soroscan/settings.py`
- `django-backend/soroscan/ingest/models.py`
