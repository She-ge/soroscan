# GraphQL N+1 Query Detection

> **Issue #1290** — `feat: add N+1 query detection and warning in GraphQL resolvers`

SoroScan includes a Strawberry GraphQL extension that automatically detects N+1 query patterns during development and
logs actionable warnings, with **zero overhead in production** when detection is disabled.

---

## What is an N+1 Query?

An N+1 query occurs when resolving a list of N objects triggers one additional DB query per object, for a total of N+1
queries:

```graphql
query {
  contracts {
    # 1 query to fetch contracts
    events {
      # N queries — one per contract!
      id
    }
  }
}
```

For a list of 50 contracts this fires 51 queries instead of 2. With `select_related` / `prefetch_related` it can be
reduced to 2 regardless of list size.

---

## How It Works

`N1QueryDetectorExtension` is a [Strawberry SchemaExtension](https://strawberry.rocks/docs/guides/extensions) registered
on the schema in `soroscan/ingest/schema.py`.

For each resolver call it:

1. Records `len(connection.queries)` before and after the resolver executes.
1. Measures wall-clock duration.
1. If the query delta exceeds the configured threshold, emits a `WARNING` log with the field name, parent type, query
   count, and duration.

**Nested resolvers are instrumented**, not just top-level `Query` / `Mutation` fields — that is where N+1 problems
actually originate. Introspection meta-types (`__Schema`, `__Type`, etc.) are skipped to prevent noise.

---

## Configuration

| Environment variable             | Type | Default                            | Description                                 |
| -------------------------------- | ---- | ---------------------------------- | ------------------------------------------- |
| `GRAPHQL_N1_DETECTION_ENABLED`   | bool | `True` in DEBUG, `False` otherwise | Enable/disable the extension                |
| `GRAPHQL_N1_DETECTION_THRESHOLD` | int  | `5`                                | Queries per resolver before a warning fires |

Both settings are also available in `django-backend/.env.example`.

```bash
# .env
GRAPHQL_N1_DETECTION_ENABLED=True
GRAPHQL_N1_DETECTION_THRESHOLD=5
```

Django settings equivalent:

```python
GRAPHQL_N1_DETECTION_ENABLED = True   # active in dev / DEBUG mode by default
GRAPHQL_N1_DETECTION_THRESHOLD = 5    # warn when a resolver fires more than 5 queries
```

---

## Warning Format

```
WARNING soroscan.graphql.n1_detection:
  Potential N+1 query detected in GraphQL resolver 'events' on type 'ContractType':
  12 queries executed in 34.7ms (threshold: 5).
  Consider using select_related/prefetch_related or batching.
```

The `extra` dict on each warning record contains structured fields for log aggregation:

| Field         | Description                                             |
| ------------- | ------------------------------------------------------- |
| `field_name`  | Resolver field name (e.g. `events`)                     |
| `parent_type` | GraphQL type the field belongs to (e.g. `ContractType`) |
| `query_count` | Number of DB queries fired by this resolver invocation  |
| `duration_ms` | Wall-clock duration in milliseconds                     |
| `threshold`   | Configured threshold at the time of the warning         |

---

## Production Safety

Detection is controlled by `GRAPHQL_N1_DETECTION_ENABLED`. The default is `settings.DEBUG`, so it is:

- **Active** in development (`DEBUG=True`) and any environment that explicitly enables it.
- **Silent** in production (`DEBUG=False`) — the `resolve()` method returns immediately after the enabled check, adding
  no measurable overhead.

To force-enable in a staging environment while `DEBUG=False`:

```bash
GRAPHQL_N1_DETECTION_ENABLED=True
```

---

## Fixing an N+1 Warning

### Use `prefetch_related` in the resolver

```python
# schema.py
@strawberry.field
def contracts(self) -> list[ContractType]:
    return TrackedContract.objects.prefetch_related("contractevent_set").all()
```

### Use `select_related` for FK traversals

```python
ContractEvent.objects.select_related("contract").filter(contract__is_active=True)
```

### Tune the threshold for known multi-query resolvers

If a resolver legitimately executes several queries (e.g. an aggregation pipeline), raise the threshold rather than
disabling detection entirely:

```bash
GRAPHQL_N1_DETECTION_THRESHOLD=10
```

---

## Skipped Types

The following introspection types are never instrumented:

- `__Schema`
- `__Type`
- `__Field`
- `__InputValue`
- `__EnumValue`
- `__Directive`
- `PageInfo`

---

## Testing

The extension is covered by `soroscan/ingest/tests/test_n1_detector.py`. Run with:

```bash
cd django-backend
pytest soroscan/ingest/tests/test_n1_detector.py -v
```

Key test classes:

| Class                              | What it covers                                           |
| ---------------------------------- | -------------------------------------------------------- |
| `GetThresholdTests`                | `_get_threshold()` with valid/invalid/edge-case settings |
| `N1QueryDetectorLifecycleTests`    | Enabled/disabled flags                                   |
| `N1DetectorDisabledTests`          | Zero-overhead path and no spurious logging               |
| `N1DetectorTopLevelTests`          | Query/Mutation level detection                           |
| `N1DetectorNestedResolverTests`    | Nested object type detection (primary N+1 case)          |
| `N1DetectorIntrospectionSkipTests` | Introspection types are skipped                          |
| `N1DetectorThresholdTests`         | Configurable threshold sensitivity                       |
| `N1DetectorLogStructureTests`      | Warning log field structure                              |

---

## Source Files

| File                                        | Purpose                                                          |
| ------------------------------------------- | ---------------------------------------------------------------- |
| `soroscan/graphql_n1_detector.py`           | Extension implementation                                         |
| `soroscan/ingest/schema.py`                 | Schema registration (`extensions=[N1QueryDetectorExtension]`)    |
| `soroscan/settings.py`                      | `GRAPHQL_N1_DETECTION_ENABLED`, `GRAPHQL_N1_DETECTION_THRESHOLD` |
| `soroscan/ingest/tests/test_n1_detector.py` | Test suite                                                       |
