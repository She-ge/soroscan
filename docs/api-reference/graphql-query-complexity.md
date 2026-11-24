# GraphQL Query Complexity

To keep the GraphQL API responsive under deeply nested or highly paginated
queries, every operation is scored for estimated resource cost before it
reaches a resolver. Operations that exceed the configured limit are rejected
with a `400` response instead of being executed.

This document describes the scoring rules implemented in
[`soroscan.graphql_complexity`](../../django-backend/soroscan/graphql_complexity.py)
and enforced in [`ThrottledGraphQLView`](../../django-backend/soroscan/graphql_views.py),
so API consumers can predict and stay under the limit.

## How scoring works

Complexity is computed by walking the query's AST (including fragments)
before execution:

- **Base cost**: every selected field costs `1` point.
- **List multiplier**: a field with a child selection set (i.e. it returns an
  object or connection, not a scalar) multiplies the cost of everything
  nested inside it — because resolving it may fetch multiple rows.
  - If the field has an explicit list-size argument — `first`, `last`,
    `limit`, or `take` — that value is used as the multiplier.
  - If no list-size argument is given but the field still has a nested
    selection, a **default multiplier of 10** is assumed (the query could
    return an unbounded list).
- **Multipliers compound** with nesting depth: a field two levels inside two
  unlimited connections is scored at up to `10 × 10 = 100` per leaf field.
- Fragments (`...FragmentName`) and inline fragments (`... on Type`) are
  inlined into the score using their parent's multiplier — they don't let you
  bypass the cost of the fields they select.

### Worked example

```graphql
query {
  contracts(first: 5) {          # multiplier: 5
    edges {
      node {
        name                     # 1 * 5 = 5
        events(first: 20) {      # multiplier: 5 * 20 = 100
          edges {
            node {
              eventType          # 1 * 100 = 100
              ledger             # 1 * 100 = 100
            }
          }
        }
      }
    }
  }
}
```

Roughly: `contracts` selection itself (~1 × 5) + `events` selection (~1 × 100)

- two leaf fields under `events` (2 × 100) — nested pagination dominates the
score, which is intentional: it's the shape most likely to be expensive to
resolve.

## Limits and configuration

The maximum allowed score is controlled by the `GRAPHQL_MAX_COMPLEXITY`
environment variable (default: **1000**), read once per request in
`_evaluate_query_complexity`:

```bash
# django-backend/.env
GRAPHQL_MAX_COMPLEXITY=1000
```

Operators tuning this value should weigh it against the deepest legitimate
query your clients need (e.g. a dashboard fetching several paginated
connections at once) versus how expensive your resolvers actually are.

## Feedback: what a rejected query looks like

A query over the limit is rejected with HTTP `400` and never reaches a
resolver:

```json
{
  "errors": [
    {
      "message": "Query complexity 1450 exceeds the maximum allowed complexity of 1000. Reduce nested fields or lower pagination arguments such as first/limit."
    }
  ],
  "extensions": {
    "complexity": {
      "score": 1450,
      "maxAllowed": 1000
    }
  }
}
```

Every successful GraphQL response also carries the computed score, so
clients and operators can monitor headroom without waiting for a rejection:

```http
X-GraphQL-Complexity: 340
X-GraphQL-Complexity-Limit: 1000
```

## Reducing a query's complexity

- Lower `first`/`last`/`limit`/`take` arguments on connections, especially
  nested ones — the multiplier compounds, so trimming an inner connection's
  page size has an outsized effect.
- Split a single deeply-nested query into two shallower queries when you
  don't need everything in one round trip.
- Avoid selecting unbounded nested connections (no `first`/`limit` at all)
  when you only need a summary field — the default multiplier of `10`
  assumes the worst case.

## Scope

Complexity analysis runs for every `POST` request to the GraphQL endpoint
that includes a `query`, including introspection queries. It does not (yet)
account for query **depth** independent of list size, or per-field cost
overrides (e.g. marking one field as inherently more expensive than another
of the same shape) — every field currently costs the same base amount.
