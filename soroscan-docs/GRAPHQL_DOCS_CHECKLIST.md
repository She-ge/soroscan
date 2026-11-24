# Issue #614: GraphQL API Documentation Site - Implementation Checklist

**Status**: Not Started  
**Estimated Completion**: 2-3 days  
**Owner**: [Assign team member]

**Philosophy**: Leverage existing Docusaurus infrastructure. Don't build custom GraphQL explorer—use Apollo Sandbox iframe.

---

## MVP Deliverables

### 1. API Documentation Structure

- [ ] Create `/soroscan-docs/docs/api/` directory
- [ ] Create `/soroscan-docs/docs/api/index.md` (landing page with overview)
- [ ] Create `/soroscan-docs/docs/api/overview.md` (authentication, rate limits, best practices)
- [ ] Create `/soroscan-docs/docs/api/queries/` subdirectory
- [ ] Create `/soroscan-docs/docs/api/mutations/` subdirectory
- [ ] Create `/soroscan-docs/docs/api/examples/` subdirectory
- [ ] Update `sidebars.ts` to add API docs section

### 2. Auto-Generated Schema Docs

- [ ] Determine schema docs generation method:
  - Option A: Use `graphql-codegen` (if already in project)
  - Option B: Introspection query → generate markdown programmatically
  - Option C: Hand-write top 20 queries (fastest for MVP)
- [ ] Generate or write docs for:
  - [ ] Top 10 queries (most commonly used)
  - [ ] Top 10 mutations
  - [ ] Key types/enums (Contract, Event, Webhook, etc.)

### 3. Interactive GraphQL Playground

- [ ] Embed Apollo Sandbox iframe in at least 3 pages:
  - [ ] `/api/overview.md`
  - [ ] A queries example page
  - [ ] A mutations example page
- [ ] Apollo Sandbox URL format:

  ```
  https://www.apollographql.com/studio/sandbox/?document=<INTROSPECTION_JSON>&endpoint=<GRAPHQL_ENDPOINT>
  ```

- [ ] Alternative: GraphiQL embed (simpler, but less features)

### 4. Query Documentation Template

Each query doc should include:

- [ ] Query name (as h1 heading)
- [ ] Description (1-2 sentences)
- [ ] Arguments table: name, type, required, description
- [ ] Returns section: return type description
- [ ] Example query (with syntax highlight)
- [ ] Example response (with syntax highlight)
- [ ] Use cases / when to use
- [ ] Performance notes (if slow query, warn user)

**Template file**: `QUERY_TEMPLATE.md`

```markdown
# Query: getContractEvents

Get all events emitted by a smart contract.

## Arguments

| Name | Type | Required | Description |
|------|------|----------|-------------|
| contractId | ID | Yes | Contract identifier |
| limit | Int | No | Max results (default: 25) |
| offset | Int | No | Pagination offset |
| fromDate | DateTime | No | Filter events after date |

## Returns

Array of Event objects with: id, type, timestamp, payload, status.

## Example

\`\`\`graphql
{
  contractEvents(contractId: "abc123", limit: 10) {
    id
    type
    timestamp
  }
}
\`\`\`

## Response

\`\`\`json
{
  "data": {
    "contractEvents": [
      { "id": "evt1", "type": "Transfer", "timestamp": "2024-05-30T..." }
    ]
  }
}
\`\`\`
```

### 5. Code Examples

- [ ] Create `/docs/api/examples/` with real-world examples:
  - [ ] `list-contracts.md` - query all contracts
  - [ ] `get-contract-events.md` - fetch events with filtering
  - [ ] `create-webhook.md` - mutation to add webhook
  - [ ] `subscribe-events.md` - subscription example (if supported)
- [ ] Use multiple languages: JavaScript/TypeScript, Python (match SDK languages)
- [ ] Include error handling examples

### 6. Schema Explorer Sidebar

- [ ] Update `soroscan-docs/sidebars.ts` to add API section:

  ```typescript
  {
    label: 'API Reference',
    items: [
      'api/index',
      'api/overview',
      {
        label: 'Queries',
        items: [
          'api/queries/get-contracts',
          'api/queries/get-contract-events',
          // ...
        ]
      },
      {
        label: 'Mutations',
        items: [
          'api/mutations/create-webhook',
          // ...
        ]
      }
    ]
  }
  ```

### 7. Search Integration

- [ ] Verify Algolia/Docusaurus search picks up API docs (usually automatic)
- [ ] Test search for: "contract", "event", "webhook" → returns API docs
- [ ] (Optional) Add search index metadata to critical pages

### 8. Dark Mode

- [ ] Test all markdown in dark mode (Docusaurus default theme handles this)
- [ ] Code blocks readable in dark theme
- [ ] Apollo Sandbox iframe respects dark mode (usually does)

### 9. Mobile Layout

- [ ] On mobile (< 768px): sidebar collapses, docs readable
- [ ] Code blocks scrollable (don't overflow)
- [ ] Playground link prominent (Apollo Sandbox responsive)

---

## Files to Create

```
soroscan-docs/docs/api/
├── index.md 📝 NEW (landing, feature showcase)
├── overview.md 📝 NEW (auth, rate limits, pagination)
├── queries/
│   ├── index.md 📝 NEW
│   ├── get-contracts.md 📝 NEW
│   ├── get-contract-detail.md 📝 NEW
│   ├── get-contract-events.md 📝 NEW
│   ├── get-event-type-stats.md 📝 NEW
│   ├── search-events.md 📝 NEW
│   ├── [other queries] 📝
│   └── ...
├── mutations/
│   ├── index.md 📝 NEW
│   ├── create-webhook.md 📝 NEW
│   ├── update-webhook.md 📝 NEW
│   ├── delete-webhook.md 📝 NEW
│   ├── [other mutations] 📝
│   └── ...
└── examples/
    ├── list-contracts.md 📝 NEW
    ├── get-contract-events.md 📝 NEW
    ├── create-webhook.md 📝 NEW
    ├── [other examples] 📝
    └── ...

soroscan-docs/
└── sidebars.ts (MODIFY to add API section)
```

---

## Acceptance Tests

### Content

- [ ] All 20+ API endpoints documented
- [ ] Each query/mutation has: description, arguments, example, response
- [ ] Examples are valid and tested (no typos)
- [ ] Queries organized logically (by entity: contracts, events, webhooks)

### Functionality

- [ ] Docusaurus builds without errors: `pnpm build`
- [ ] Apollo Sandbox iframe loads and works
- [ ] Search finds API docs (test searching "webhook")
- [ ] Sidebar navigation works (click links → load pages)
- [ ] Code syntax highlighting works (check `getContractEvents` example)

### Visual/UX

- [ ] Dark mode: code blocks readable
- [ ] Mobile: no horizontal scroll, sidebar accessible
- [ ] Breadcrumbs or navigation shows current section
- [ ] "Copy" button for code examples (if available in theme)

---

## Fastest Approach for MVP

**Don't aim for perfection.** Do this in order:

1. **Day 1**:
   - Create `/docs/api/index.md` and `/overview.md` (overview, auth, pagination)
   - Write 10 most-used queries (use existing GraphQL schema)
   - Write 5 most-used mutations
   - Update `sidebars.ts`

1. **Day 2**:
   - Create 5-10 code examples (copy from existing SDK examples if available)
   - Embed Apollo Sandbox in 2-3 pages
   - Test docs build and search

1. **Optional Day 3**:
   - Add more examples
   - Add subscription docs (if applicable)
   - Add troubleshooting / FAQ section

---

## GraphQL Introspection (For Reference)

To auto-generate docs from schema:

```bash
# Get schema introspection
curl -X POST https://api.soroscan.xyz/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { types { name description fields { name description type { name } } } } }"}'
```

Then use `graphql-codegen` or write a script to generate markdown from introspection.

---

## Apollo Sandbox Embedding

Example iframe:

```html
<iframe 
  src="https://www.apollographql.com/studio/sandbox/?document=YOUR_INTROSPECTION_JSON&endpoint=https://api.soroscan.xyz/graphql"
  style="width: 100%; height: 600px; border: none;"
/>
```

Or simpler: just link to Apollo Studio for your endpoint.

---

## Questions for Backend Team

- [ ] What's the public GraphQL endpoint URL?
- [ ] Is introspection enabled (can we get schema from `__schema`)?
- [ ] Which 20 queries/mutations are most important to document?
- [ ] Are there any rate-limiting docs or auth headers needed?
- [ ] Do you have existing SDK docs we can reference?

---

## References

- Docusaurus docs: <https://docusaurus.io/>
- Apollo Sandbox docs: <https://www.apollographql.com/docs/studio/sandbox/>
- Example: GitHub GraphQL API docs (good reference for structure)
- Example: Stripe API docs (good reference for query organization)
