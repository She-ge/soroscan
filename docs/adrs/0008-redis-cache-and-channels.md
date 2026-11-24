# ADR 0008: Redis as Shared Cache and Channel Layer

## Status

Accepted

This ADR records an architecture decision that was already implemented in SoroScan. It was migrated from the inline
decision set previously maintained in `docs/architecture/adr.md` (former "ADR 005") during the ADR consolidation (see
issue #1685).

## Context

SoroScan needs a low-latency shared store for ephemeral data and cross-process coordination. Several subsystems require
such a store:

- Celery needs a broker for asynchronous task dispatch (event ingestion, webhook delivery) and a result backend.
- The Django web layer needs a shared cache for repeated query patterns and rate-limit counters.
- Real-time GraphQL subscriptions and Django Channels need a pub/sub channel layer that multiple processes/replicas can
  share.

A single, well-supported in-memory datastore can satisfy all three needs without introducing multiple new dependencies.

## Decision

SoroScan will use Redis as the single shared store for caching, rate limiting, the Celery broker/result backend, and the
Django Channels pub/sub layer.

## Rationale

### Centralised operational footprint

Using one datastore for cache, broker, and channels keeps the dependency graph small. Operators manage a single Redis
deployment rather than separate cache, queue, and pub/sub services.

### Celery integration

Celery has first-class Redis support for both the broker and the result backend. Event ingestion and webhook delivery
(see [ADR 0004](0004-webhook-delivery-system.md)) already rely on Celery, so Redis as the broker is a natural fit.

### Cache and rate limiting

Django's cache framework supports Redis directly. Shared rate-limit counters and query caches work consistently across
all backend replicas because every replica talks to the same Redis instance, which is important for the multi-tenant API
(see [ADR 0005](0005-multi-tenancy-design.md)).

### Channels and pub/sub

Django Channels can use Redis as its channel layer, enabling WebSocket-based GraphQL subscriptions and other real-time
features to scale across replicas without a custom pub/sub implementation.

### Performance

Redis provides the low latency required for cache lookups, rate-limit checks, and Celery task hand-off on the hot
ingestion and request paths.

## Alternatives Considered

### Separate cache broker and channel backends

Using, for example, RabbitMQ as the Celery broker, Memcached as the cache, and a separate pub/sub service would avoid
making Redis a single point of dependency. However, it triples the number of datastores to operate and offers little
benefit given Redis satisfies all three requirements well.

### Memcached for caching only

Memcached is a capable cache but is not suitable as a Celery broker or a Channels layer, so adopting it would still
require Redis (or another store) alongside it.

### Database-backed broker and cache

Using PostgreSQL for both caching and as a Celery broker would avoid a new dependency, but it would add significant load
to the primary database and sacrifice the latency characteristics that motivated separating ephemeral data from durable
event storage (see [ADR 0003](0003-database-schema-rationale.md)).

## Consequences

### Positive

- Centralised rate-limit counters and query caches shared across replicas.
- A single dependency serves Celery, Channels, and the cache.
- Significant performance gains for repeated query patterns.

### Negative

- Redis becomes a critical operational dependency; its availability affects caching, task dispatch, and real-time
  subscriptions simultaneously.
- Requires careful sizing and configuration of persistence and eviction policies so that cache and queue workloads do
  not evict each other.

### Neutral

- Redis is treated as ephemeral state; durable data continues to live in PostgreSQL.

## Implementation Notes

- Django cache backend configured in `django-backend/soroscan/settings.py`.
- Channels layer uses Redis configured in the same settings file.
- Celery broker and result backend also point at Redis.
- Cache utilities in `django-backend/soroscan/ingest/cache_utils.py`.

## Related Decisions

- [ADR 0004](0004-webhook-delivery-system.md): Webhook Delivery System (uses Celery + Redis)
- [ADR 0003](0003-database-schema-rationale.md): Database Schema Rationale (PostgreSQL holds durable state; Redis holds
  ephemeral state)
- [ADR 0005](0005-multi-tenancy-design.md): Multi-Tenancy Design (shared rate limiting relies on this shared cache)

## References

- [ADR Index](README.md)
- `django-backend/soroscan/settings.py`
- `django-backend/soroscan/ingest/cache_utils.py`
- `django-backend/soroscan/celery.py`
