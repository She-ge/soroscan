# Architecture Decision Records (ADRs)

This directory is the **canonical home** for SoroScan's Architecture Decision
Records. We use ADRs to capture the context, rationale, and consequences of
significant technical choices so future developers understand *why* the system
is built the way it is.

## Index

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](0001-event-ingestion-architecture.md) | Event Ingestion Architecture | Accepted |
| [0002](0002-graphql-vs-rest.md) | GraphQL vs REST API Tradeoffs | Accepted |
| [0003](0003-database-schema-rationale.md) | Database Schema Rationale (PostgreSQL + JSONB) | Accepted |
| [0004](0004-webhook-delivery-system.md) | Webhook Delivery System | Accepted |
| [0005](0005-multi-tenancy-design.md) | Multi-Tenancy Design | Accepted |
| [0006](0006-django-backend.md) | Django for the SoroScan Backend | Accepted |
| [0007](0007-strawberry-graphql.md) | Strawberry GraphQL for the GraphQL API | Accepted |
| [0008](0008-redis-cache-and-channels.md) | Redis as Shared Cache and Channel Layer | Accepted |

## Creating a new ADR

1. Copy [`template.md`](template.md).
1. Assign the next available four-digit ADR number (e.g. `0009`).
1. Name the file `NNNN-short-topic-name.md`.
1. Document the context, decision, rationale, alternatives, and consequences.
1. Set the initial status to `Proposed`.
1. Add a row to the index table above.
1. Open a PR for review.

An ADR should focus on a significant architectural decision rather than
routine implementation details.

### ADR statuses

- **Proposed** — under discussion, not yet accepted.
- **Accepted** — approved and should guide implementation.
- **Deprecated** — no longer recommended but kept for historical context.
- **Superseded** — a newer ADR replaces this decision; link to the replacement.

Accepted ADRs should not normally be rewritten to describe a different
decision. If an architecture choice changes substantially, create a new ADR and
mark the previous one as superseded.

---

## Consolidation history (issue #1685)

Previously, architecture decisions were recorded in **two** parallel schemes
and neither was authoritative:

1. This `docs/adrs/` directory (numbered `0001`–`0005` + `README.md`).
1. A separate set in `docs/architecture/` — a single `adr.md` file containing six
   inline decisions ("ADR 001"–"ADR 006"), plus standalone `adr_001_django_backend.md`,
   `adr_002_strawberry_graphql.md`, an `adr_index.md`, and an `adr_template.md`.

As of issue #1685, `docs/adrs/` is the **single canonical** ADR location and
numbering scheme. The consolidation proceeded as follows:

- The existing `0001`–`0005` were kept as-is (they already covered the event
  ingestion architecture, the GraphQL-vs-REST decision, the database schema,
  webhook delivery, and multi-tenancy).
- Decisions that existed **only** in the `docs/architecture/` set were migrated
  here as new ADRs:
  - `0006-django-backend.md` — from `docs/architecture/adr_001_django_backend.md`
    and "ADR 006" of `adr.md`.
  - `0007-strawberry-graphql.md` — from `docs/architecture/adr_002_strawberry_graphql.md`
    and "ADR 003" of `adr.md`.
  - `0008-redis-cache-and-channels.md` — from "ADR 005" of `adr.md` (no prior
    equivalent existed in `docs/adrs/`).
- The remaining inline decisions in `docs/architecture/adr.md` overlapped with
  ADRs already present here. The mapping is:

  | `docs/architecture/adr.md` section | Canonical ADR |
  | --- | --- |
  | ADR 001: Soroban RPC vs Horizon-only ingestion | [ADR 0001](0001-event-ingestion-architecture.md) |
  | ADR 002: PostgreSQL for event storage | [ADR 0003](0003-database-schema-rationale.md) |
  | ADR 003: Strawberry GraphQL | [ADR 0007](0007-strawberry-graphql.md) |
  | ADR 004: Exponential backoff for webhook retries | [ADR 0004](0004-webhook-delivery-system.md) |
  | ADR 005: Redis as shared cache and channel layer | [ADR 0008](0008-redis-cache-and-channels.md) |
  | ADR 006: Django + Next.js application stack | [ADR 0006](0006-django-backend.md) |

- The retired `docs/architecture/adr*.md` files have been replaced with short
  redirect notices pointing back to this directory.
- `template.md` in this directory supersedes `docs/architecture/adr_template.md`.

If you are proposing a major architecture change, please open a PR adding a new
ADR to **this** directory for review.
