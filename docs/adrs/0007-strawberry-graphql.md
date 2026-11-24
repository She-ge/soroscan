# ADR 0007: Strawberry GraphQL for the SoroScan GraphQL API

## Status

Accepted

This ADR records an architecture decision that was already implemented in SoroScan. It was migrated from the former
`docs/architecture/adr_002_strawberry_graphql.md` during the ADR consolidation (see issue #1685).

## Context

SoroScan provides developers with access to indexed Soroban contract data, including contracts, events, invocation
information, statistics, timelines, and related platform data.

REST endpoints remain useful for resource-oriented operations (see [ADR 0002](0002-graphql-vs-rest.md) for the decision
to expose both API styles), but some consumers need to:

- request only the fields required by a frontend view;
- query related contract and event information through a typed schema;
- perform flexible filtering and pagination;
- use GraphQL subscriptions for real-time functionality;
- generate TypeScript types and client-side GraphQL helpers from the schema.

SoroScan therefore requires a GraphQL implementation that integrates well with its Django backend and Python data model.

## Decision

SoroScan will use Strawberry GraphQL as the GraphQL framework for the Django backend.

The GraphQL schema is defined primarily in `django-backend/soroscan/ingest/schema.py`.

Strawberry and Strawberry Django are used to define GraphQL object types, inputs, queries, mutations, and subscriptions.

The application exposes its GraphQL schema through the Django backend while the Next.js frontend can consume the API
using Apollo Client and GraphQL Code Generator.

## Rationale

### Python type-driven schema definitions

Strawberry uses Python type annotations and decorators to define GraphQL schemas. This matches SoroScan's typed Python
backend and makes GraphQL types readable alongside the application's domain models. Examples in the current schema
include types representing contracts, events, and contract invocations.

### Django integration

SoroScan already uses Django as its backend framework (see [ADR 0006](0006-django-backend.md)).
`strawberry-graphql-django` provides integration between Strawberry and Django models, reducing unnecessary duplication
between database models and GraphQL types. This allows SoroScan to expose Django-backed data while retaining control
over resolvers and GraphQL-specific behavior.

### Flexible API queries

Contract event data can have different consumers with different field requirements. GraphQL allows callers to select the
fields required for a particular application rather than relying exclusively on fixed REST response representations.
This is useful for dashboard views, developer tooling, event exploration, and other frontend features.

### Frontend tooling

The SoroScan frontend already contains Apollo Client and GraphQL Code Generator tooling. A GraphQL schema can be used to
generate TypeScript types for frontend operations, helping reduce mismatches between client queries and the backend
schema.

### Queries, mutations, and subscriptions

Strawberry supports the major GraphQL operation types required by SoroScan: queries for retrieving indexed data,
mutations for supported write operations, and subscriptions for real-time event delivery. The current schema is created
with `strawberry.Schema` using query, mutation, and subscription roots.

## Alternatives Considered

### Graphene-Django

Graphene-Django is an established GraphQL integration for Django. It could provide the required GraphQL functionality,
but Strawberry offers a type-annotation-focused development model that aligns well with modern typed Python code. Using
Strawberry also matches the GraphQL implementation already present throughout the SoroScan backend.

### REST-only API

SoroScan already exposes REST APIs and could rely exclusively on them. A REST-only approach would simplify the number of
API technologies used by the project, but it would reduce client flexibility for nested data selection and would not
provide the same GraphQL schema and code-generation workflow used by the frontend. REST remains part of SoroScan for
resource-oriented operations, while GraphQL provides a complementary query interface.

### Custom GraphQL implementation

Building GraphQL handling directly on top of lower-level GraphQL libraries would provide maximum control. However, it
would require SoroScan to maintain additional schema, resolver, validation, and framework integration code that
Strawberry already provides.

## Consequences

### Positive

- GraphQL types can be expressed using Python type annotations.
- Strawberry integrates with SoroScan's Django models.
- Clients can request the fields needed for each use case.
- The schema supports frontend TypeScript type generation.
- Queries, mutations, and subscriptions can share a consistent GraphQL implementation.
- Apollo Client can consume the API naturally from React and Next.js applications.

### Negative

- Contributors must understand GraphQL concepts in addition to the REST API.
- Schema changes can affect generated frontend types and GraphQL operations.
- Complex queries require controls to prevent excessive backend work.

### Neutral

- REST remains supported alongside GraphQL rather than being replaced by it.
- GraphQL-specific concerns such as query complexity, rate limiting, logging, and N+1 query detection require dedicated
  backend handling.

## Implementation Notes

The primary GraphQL schema is located at:

- `django-backend/soroscan/ingest/schema.py`

GraphQL request handling and supporting functionality include:

- `django-backend/soroscan/graphql_views.py`
- `django-backend/soroscan/graphql_complexity.py`
- `django-backend/soroscan/graphql_extensions.py`
- `django-backend/soroscan/graphql_n1_detector.py`

The frontend GraphQL integration includes:

- `soroscan-frontend/lib/apollo-client.ts`
- `soroscan-frontend/providers/ApolloProvider.tsx`
- `soroscan-frontend/codegen.ts`
- `soroscan-frontend/src/queries/`
- `soroscan-frontend/src/generated/`

## Related Decisions

- [ADR 0006](0006-django-backend.md): Use Django for the SoroScan Backend
- [ADR 0002](0002-graphql-vs-rest.md): GraphQL vs REST API Tradeoffs

## References

- [ADR Index](README.md)
- `django-backend/requirements.txt`
- `django-backend/soroscan/ingest/schema.py`
- `soroscan-frontend/codegen.ts`
