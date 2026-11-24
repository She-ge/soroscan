# GraphQL Schema Migration Guide

This guide explains how to evolve SoroScan's GraphQL schema (`django-backend/soroscan/ingest/schema.py`, built with
[Strawberry](https://strawberry.rocks/)) without breaking existing clients — the Next.js frontend (`soroscan-frontend`,
via `graphql-codegen` and Apollo Client), the published SDKs (`sdk/`), and any third-party integrations hitting
`POST /graphql/` directly.

See [ADR 0002: GraphQL vs REST API Tradeoffs](../adrs/0002-graphql-vs-rest.md) for why GraphQL exists alongside REST in
this project. This document covers the day-to-day mechanics of changing the schema safely once it's in production.

## How SoroScan serves GraphQL today

A few facts about the current setup that shape everything below:

- There is exactly **one** GraphQL endpoint: `POST /graphql/`, served by `ThrottledGraphQLView`
  (`django-backend/soroscan/graphql_views.py`) and backed by a single
  `strawberry.Schema(query=Query, mutation=Mutation, subscription=Subscription, ...)` defined at the bottom of
  `schema.py`. There is no `/graphql/v2/` and no per-client schema variant.
- REST, by contrast, has an experimental `v1/` URL prefix (`django-backend/soroscan/v1/urls.py`) and a REST-only
  `ApiDeprecationMiddleware` that adds a `Deprecation: true` header to paths listed in `settings.DEPRECATED_ENDPOINTS`.
  **Neither of these applies to GraphQL** — the middleware operates on URL paths, and a single GraphQL endpoint has no
  per-field routing to hook into. GraphQL deprecation has to happen _inside_ the schema itself, via
  `deprecation_reason`.
- Introspection can be disabled in production (`GRAPHQL_INTROSPECTION_ENABLED=False`, enforced in
  `ThrottledGraphQLView.dispatch`). This means clients generally get their type information from a checked-in schema
  file (`soroscan-frontend/src/schema.graphql`, used by `graphql-codegen`) or from a staging/dev environment where
  introspection is on — not from querying prod directly. Keep that schema file in sync when you change the live schema.

Given this, SoroScan's versioning strategy for GraphQL is **evolve one schema**, not **run versioned endpoints**. The
rest of this guide is about doing that evolution safely.

## Additive changes (safe, no process required)

These changes are backwards compatible by construction — existing queries keep working exactly as before, because
nothing existing was touched:

- **New field on an existing type.** Example: adding a `favorite_count: int` field to `ContractType` in `schema.py`. Old
  clients that don't select it are unaffected; new clients can start using it immediately.
- **New top-level query, mutation, or subscription.** Example: `Query.recent_errors` and
  `Mutation.clear_all_notifications` were both added this way — they didn't require changing any other resolver.
- **New optional argument with a default**, e.g. `Query.events(..., since: Optional[datetime] = None)`. Because the new
  argument has a default, existing queries that don't pass it behave exactly as before.
- **New value added to an existing enum**, e.g. adding another `TimelineBucketSize` member. This is _usually_ safe for
  readers, but be aware that some strict client-side codegen (Apollo's exhaustive `switch` typing) can force consumers
  to update a `switch`/`match` when a new enum member appears. Call it out in the changelog even though the schema
  change itself is additive.
- **New optional input field** on an input type such as `EventSearchQuery`. Adding `Optional[str] = None` fields is
  safe; existing callers simply don't send it.

No deprecation window is needed for additive changes — ship them and mention them in `docs/changelog.md`.

## Breaking changes and how to avoid them

These are **not** safe to ship directly, because an existing client query can start failing or silently changing
behavior:

| Change                                                                                                                      | Why it breaks clients                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Removing a field or argument                                                                                                | Any query still selecting it gets a validation error at the GraphQL layer.                                                                                                                                                                                                                                |
| Renaming a field, type, argument, or enum value                                                                             | GraphQL has no native rename — from the client's perspective this _is_ a remove + add.                                                                                                                                                                                                                    |
| Making an optional argument required, or removing its default                                                               | Existing queries that omit the argument start failing validation.                                                                                                                                                                                                                                         |
| Changing a field's return type (e.g. `String` → `Int`, or `String` → `Optional[String]` non-null → nullable and vice versa) | Breaks client-side type assumptions and generated types; nullability changes in particular silently change runtime behavior.                                                                                                                                                                              |
| Changing the shape of a JSON-scalar field (`strawberry.scalars.JSON`)                                                       | Not enforced by GraphQL's type system at all, so it's easy to do by accident — treat payload-shape changes on fields like `ContractType.metadata`, `EventType.payload`, or `EventSearchQuery.filters` as a breaking change to the _implicit contract_, even though the schema technically doesn't change. |

For all of these, use the **deprecate → alias → remove** pattern below instead of changing or deleting the field
outright.

## Deprecating a field: `deprecation_reason`

Strawberry supports GraphQL's native `@deprecated` directive via the `deprecation_reason` argument to
`strawberry.field`. Deprecated fields still work and still return data — they just show up flagged in introspection and
in GraphQL-aware editors/IDEs, giving consumers a signal to migrate before removal.

A real example from `schema.py`: `Query.contract_metadata` is a top-level field that duplicates functionality already
available through `Query.contract(contractId).metadata`. If we wanted to steer clients toward the nested field, we would
_not_ delete `contract_metadata` — we'd deprecate it first:

**Before:**

```python
@strawberry.field
def contract_metadata(self, contract_id: str) -> Optional[ContractMetadataType]:
    """Get metadata for a specific contract by contract ID, or null if none exists."""
    try:
        m = ContractMetadata.objects.select_related("contract").get(contract__contract_id=contract_id)
        return ContractMetadataType(...)
    except ContractMetadata.DoesNotExist:
        return None
```

**After:**

```python
@strawberry.field(
    deprecation_reason=(
        "Use `contract(contractId: ...) { metadata { ... } }` instead. "
        "`contractMetadata` will be removed after 2026-12-31."
    )
)
def contract_metadata(self, contract_id: str) -> Optional[ContractMetadataType]:
    """Get metadata for a specific contract by contract ID, or null if none exists."""
    try:
        m = ContractMetadata.objects.select_related("contract").get(contract__contract_id=contract_id)
        return ContractMetadataType(...)
    except ContractMetadata.DoesNotExist:
        return None
```

The resolver body doesn't need to change at all — only the decorator. The field keeps returning correct data for
existing clients throughout the deprecation window; only the metadata visible to introspection changes.

Rules for a deprecation reason string:

- Always say **what to use instead** (a concrete field/query path), not just "deprecated."
- Always include a **concrete removal date or version**, not "eventually" — this project favors a fixed calendar date
  (mirroring the `sunset` key already used in `settings.DEPRECATED_ENDPOINTS` for REST, e.g. `"sunset": "2026-12-31"`).
- Keep the removal window at **least 90 days** from when the deprecation ships to production, matching the REST
  convention.

The same `deprecation_reason=...` kwarg works on `strawberry.mutation` and on individual arguments
(`strawberry.argument(deprecation_reason=...)`), and on enum values via
`strawberry.enum_value(..., deprecation_reason=...)`.

## Renaming types and fields (deprecate → alias → remove)

GraphQL has no rename primitive. If you want the public name of something to change, you go through three steps, never a
direct edit:

**Step 1 — add the new name alongside the old one.** You can do this either by adding a genuinely new resolver, or — for
the common case of "the Python attribute name is fine, only the public GraphQL name should change" — by using
Strawberry's `name=` alias, the same mechanism already used in this codebase for `EventFieldFilter.in_list`:

```python
in_list: Optional[list[str]] = strawberry.field(
    name="in", default=None, description="Value must be one of these"
)
```

Here the Python attribute is `in_list` (a valid identifier — `in` is a reserved word in Python) but the GraphQL field
name clients see is `in`. The same `name=` argument is the tool to reach for when a field's _public_ name needs to
change but you don't want to touch the underlying Python code.

For a full field rename where both the old and new public names need to keep working during the transition — e.g.
renaming `ContractType.alias` to `displayName` — add the new field and turn the old one into a thin, deprecated
pass-through:

```python
@strawberry_django.type(TrackedContract)
class ContractType:
    id: auto
    contract_id: auto
    # ... existing fields, "alias: auto" removed from the auto-mapped block ...

    @strawberry.field(
        deprecation_reason="Renamed to `displayName`. `alias` will be removed after 2026-12-31."
    )
    def alias(self) -> str:
        return self.display_name

    @strawberry.field
    def display_name(self) -> str:
        return self.alias  # underlying model/column name is unchanged
```

**Step 2 — update internal consumers first.** Update `soroscan-frontend` queries (`.graphql` files under `src/queries/`,
`app/**/queries/`, `components/**/*.graphql`) and any first-party SDK code (`sdk/`) to use the new name, run
`pnpm run codegen` in `soroscan-frontend/` to regenerate `src/generated/`, and land that alongside the schema change so
first-party consumers never depend on the deprecated name.

**Step 3 — remove the old name only after the deprecation window has passed** (see the Backwards Compatibility Rules
checklist below for what "passed" requires).

The same pattern applies to renaming a whole type: introduce the new type, have resolvers that used to return the old
type return the new one where possible, and if the old type name must keep resolving for existing clients, keep a
deprecated type/field pair around until the window closes rather than renaming in place.

## Versioning strategy: evolve the schema, don't version the endpoint

SoroScan intentionally does **not** run multiple GraphQL schema versions behind different URLs (unlike the `v1/` REST
prefix). A single continuously-evolving schema is the norm for GraphQL for good reasons that apply here specifically:

- The frontend's Apollo cache and generated types (`soroscan-frontend/src/generated/`) are built against one schema;
  supporting N schema versions would mean N sets of generated types and N Apollo configurations client-side.
- Clients only pay for the fields they query. Unlike REST, adding fields doesn't force a version bump for existing
  consumers — this is most of GraphQL's whole value proposition per ADR 0002.

Reach for a genuinely separate endpoint/schema only for a change too large for field-level deprecation to express safely
— e.g. a full auth-model rewrite of `Query`/`Mutation`. That should go through its own ADR (see `docs/adrs/README.md`)
rather than being decided ad hoc in a PR.

## Client migration path / checklist

When you deprecate or plan to remove something, follow this sequence:

1. **Ship the deprecation**, not the removal. Add `deprecation_reason` (or the alias-field pattern above) in the same PR
   that introduces the replacement, so there's never a gap where neither the old nor the new field works.
1. **Regenerate and update the frontend.** In `soroscan-frontend/`, run `pnpm run codegen` (uses `codegen.ts`, reading
   `src/schema.graphql` locally or `GRAPHQL_ENDPOINT` against a live server) and migrate any `.graphql` documents and
   `useGraphQLExample`/Apollo-hook call sites off the deprecated field. Commit the regenerated `src/generated/` output —
   see `soroscan-frontend/GRAPHQL_CODEGEN_SETUP.md`.
1. **Update the checked-in schema snapshot** at `soroscan-frontend/src/schema.graphql` so codegen and IDE tooling
   reflect the deprecation immediately, even before a full regen.
1. **Note it in `docs/changelog.md`** with the field name, replacement, and removal date, so both internal teams and
   external API consumers relying on introspection/docs see it in one place.
1. **Update `sdk/` and `docs/sdk-python.md` / `docs/sdk-typescript.md`** if the SDKs wrap the deprecated field directly.
1. **Hold the deprecation window** (minimum 90 days, longer for widely-used fields like anything under `ContractType` or
   `EventType`) before deleting anything.
1. **Remove the field** only after confirming (via `GraphQLResolverLoggingExtension` / access logs, if usage tracking is
   wired up) that production traffic against the deprecated field has dropped to zero or is limited to consumers who
   were directly notified.

## Backwards compatibility rules (checklist)

**Do:**

- Add new fields, types, queries, mutations, and enum values freely — these are always safe.
- Add new optional arguments with defaults.
- Deprecate with `deprecation_reason`, always naming the replacement and a removal date.
- Keep a deprecated field's resolver fully functional (same data, same behavior) until it's actually removed.
- Regenerate and update `soroscan-frontend` codegen output in the same change that touches the schema.
- Give JSON-scalar fields (`strawberry.scalars.JSON`) the same deprecation discipline as typed fields when their _shape_
  changes, even though the type system won't catch it for you.

**Don't:**

- Don't remove or rename a field/type/argument in place — always go through deprecate → alias → remove.
- Don't make an optional argument required, or flip a nullable return type to non-null (or vice versa) without a
  deprecation window — both silently break existing clients.
- Don't rely on `ApiDeprecationMiddleware` or `DEPRECATED_ENDPOINTS` for GraphQL — those only affect REST URL paths, not
  GraphQL fields.
- Don't ship a schema change and a frontend/SDK migration in separate, unsequenced PRs — land the replacement before or
  alongside the deprecation, never after.
- Don't stand up a second GraphQL endpoint/schema version as a substitute for proper field-level deprecation; reserve
  that for changes large enough to warrant their own ADR.

## Related reading

- [ADR 0002: GraphQL vs REST API Tradeoffs](../adrs/0002-graphql-vs-rest.md)
- [API Overview](../api-overview.md)
- `soroscan-frontend/GRAPHQL_CODEGEN_SETUP.md` — frontend codegen workflow
- `django-backend/soroscan/ingest/schema.py` — the schema itself
- `django-backend/soroscan/middleware.py` (`ApiDeprecationMiddleware`) — the REST-only analogue; not applicable to
  GraphQL fields
