# Design Issues Implementation Guide (#612, #614, #615, #618)

**Status**: Pragmatic approach for engineering-focused implementation  
**Last Updated**: May 2026

---

## Overview

Four interconnected design issues covering:
- **#612**: Webhook Tester Dashboard (partially implemented)
- **#614**: GraphQL API Documentation Site (not started)
- **#615**: Contract Details Page (partially implemented)
- **#618**: Error States & Validation (foundational, low priority)

**Philosophy**: Incremental, not exhaustive. Use existing component library. Focus on UX gaps, not perfection.

---

## Current State Assessment

### ✅ Webhook Tester (#612) - 60% Done

**Location**: `admin/app/webhook-tester/`

**What exists**:
- Page layout (sidebar + editor split)
- WebhookSelector component
- PayloadEditor component
- ResponseViewer component
- HistoryPanel component
- Context provider for state management

**What's missing**:
- [ ] Delivery log list view (timestamp, status ✓/✗/⏳, response time)
- [ ] Webhook detail view (configs, headers, payload template)
- [ ] Test form with payload override (separate from editor)
- [ ] Real-time log streaming
- [ ] Mobile responsive layout fixes
- [ ] Error state UI (failed delivery, retry options)
- [ ] Dark mode verification
- [ ] Accessibility: ARIA labels, keyboard nav

**Next Steps**:
1. Create `DeliveryLogList.tsx` - table showing webhook dispatch history
2. Add `WebhookDetailView.tsx` - configuration panel
3. Implement `TestWebhookForm.tsx` - isolated test interface
4. Add responsive Tailwind grid for mobile (currently fixed widths)
5. Polish error states with consistent toast/banner patterns

---

### ❌ GraphQL API Documentation Site (#614) - 0% Done

**Location**: `soroscan-docs/` (Docusaurus site)

**Strategy**: Leverage existing Docusaurus infrastructure, don't build custom GraphQL explorer.

**Approach**:
1. Create `/docs/api/` directory structure
2. Add auto-generated schema docs (use GraphQL Codegen or Apollo doc plugin)
3. Embed GraphQL playground via Apollo Sandbox or GraphiQL
4. Document top 20 queries/mutations with examples
5. Add schema explorer sidebar (Docusaurus sidebar config)

**What to build** (pragmatic scope):
- [ ] `/docs/api/overview.md` - API concepts, authentication, rate limits
- [ ] `/docs/api/queries/` - folder with individual query docs
- [ ] `/docs/api/mutations/` - folder with mutation docs
- [ ] `/docs/api/examples/` - real-world code examples
- [ ] Embedded Apollo Sandbox iframe in key pages
- [ ] Search integration (Docusaurus algolia)
- [ ] Schema visualization (optional: use graphql-voyager)

**Don't do**:
- Don't build custom GraphQL explorer from scratch (use Apollo Sandbox)
- Don't hand-write entire schema docs (auto-generate with introspection)

**Timeline**: 2-3 days (not 5-6)

---

### 🟡 Contract Details Page (#615) - 30% Done

**Location**: `soroscan-frontend/app/contracts/[id]/`

**What exists**:
- Contracts list page with filtering
- Route structure for `/contracts/[id]`
- Component folders ready

**What's missing**:
- [ ] Contract header with address (copyable), network, verified badge
- [ ] Stats cards: total events, unique types, last event, avg size
- [ ] Event type breakdown chart (pie/bar)
- [ ] Event timeline with recent events
- [ ] Event types list table
- [ ] Contract code/ABI viewer (syntax highlighting)
- [ ] Related contracts section
- [ ] Mobile responsive layout
- [ ] Dark mode verification

**Component Breakdown**:
```
[id]/
├── page.tsx (main layout)
├── components/
│   ├── ContractHeader.tsx (address, network, badge)
│   ├── ContractStats.tsx (stats cards)
│   ├── EventTypeChart.tsx (pie/bar using existing Chart.tsx)
│   ├── EventTimeline.tsx (timeline component)
│   ├── EventTypesList.tsx (table)
│   ├── AbiViewer.tsx (syntax-highlighted code)
│   └── RelatedContracts.tsx (carousel/grid)
```

**UI Components Available**:
- `Chart.tsx`, `PieChart.tsx`, `BarChart.tsx` → use for breakdown
- `SubscriptionStatusBadge.tsx` → reference for badge pattern
- `Card.tsx` → wrap stats
- Tailwind for responsive grid

**Timeline**: 3 days

---

### 🔵 Error States & Validation (#618) - Foundational, Low Priority

**Location**: Can be scattered across components

**Approach**: Document patterns, don't create a separate component library. Use Shadcn/Tailwind conventions.

**Documentation only** (create `ERROR_PATTERNS.md`):
- [ ] Inline validation: red border + error text below input
- [ ] Toast patterns: success (green), error (red), info (blue)
- [ ] Form validation: empty → valid (checkmark) → invalid
- [ ] 404/500 pages (single template, reuse)
- [ ] Rate limit 429 with countdown timer
- [ ] Network error with retry button
- [ ] Loading states: skeleton vs spinner
- [ ] Dark mode color palette

**Implementation**: 
- Create error boundary for 500s
- Add 404.tsx, 500.tsx pages to both `admin/` and `soroscan-frontend/`
- Add toast component to providers if not exists
- Document in PR template

**Timeline**: 1 day (mostly docs + copy-paste patterns)

---

## Recommended Priority Order

1. **#612 Webhook Tester**: 2-3 days (highest value for devs, partially done)
2. **#615 Contract Details**: 3 days (core user journey, good scope)
3. **#614 GraphQL Docs**: 2-3 days (essential documentation, not complex code)
4. **#618 Error States**: 1 day (foundational patterns, low effort)

**Total**: ~10 days of engineering work (not 18-20)

---

## Design System / Component Conventions

### Colors & Dark Mode
- Dark theme base: `bg-zinc-950` (seen in webhook-tester)
- Primary action: `blue-500` (assume shadcn default)
- Danger: `red-500`
- Success: `green-500`
- Warning: `amber-500`
- Neutral text: `zinc-400` (light), `zinc-600` (muted)

### Layout Patterns
- **Responsive**: Tailwind `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- **Sidebar + Main**: `flex h-screen` with `flex-shrink-0`
- **Cards**: Use existing `Card.tsx` component
- **Charts**: Use `Chart.tsx`, `PieChart.tsx`, `BarChart.tsx` (already in admin)

### Accessibility Baseline
- All interactive elements: `aria-label` or visible label
- Forms: `<label htmlFor="">` connected to input
- Status icons: `aria-label="success"` or tooltip
- Navigation: logical tab order, skip-to-content link

### Code/JSON Display
- Use `react-syntax-highlighter` or Prism (check `package.json`)
- Dark mode: `atom-one-dark` theme
- Features: line numbers, copy button, expand/collapse

---

## File Structure Checklist

### Webhook Tester (#612)
```
admin/app/webhook-tester/
├── page.tsx ✅
├── context.tsx ✅
├── types.ts (ensure webhook/delivery types exist)
├── components/
│   ├── WebhookSelector.tsx ✅
│   ├── PayloadEditor.tsx ✅
│   ├── ResponseViewer.tsx ✅
│   ├── HistoryPanel.tsx ✅
│   ├── DeliveryLogList.tsx 📝 (new)
│   ├── WebhookDetailView.tsx 📝 (new)
│   └── TestWebhookForm.tsx 📝 (new)
```

### Contract Details (#615)
```
soroscan-frontend/app/contracts/[id]/
├── page.tsx 📝 (main layout)
├── components/
│   ├── ContractHeader.tsx 📝
│   ├── ContractStats.tsx 📝
│   ├── EventTypeChart.tsx 📝
│   ├── EventTimeline.tsx 📝
│   ├── EventTypesList.tsx 📝
│   ├── AbiViewer.tsx 📝
│   └── RelatedContracts.tsx 📝
```

### GraphQL Docs (#614)
```
soroscan-docs/docs/api/
├── index.md 📝
├── overview.md 📝
├── authentication.md 📝
├── queries/
│   ├── index.md
│   └── [individual query docs] 📝
├── mutations/
│   └── [individual mutation docs] 📝
└── examples/
    └── [code examples] 📝
```

### Error Patterns (#618)
```
docs/
└── ERROR_PATTERNS.md 📝 (guide for devs)

soroscan-frontend/app/
├── not-found.tsx 📝
└── error.tsx 📝

admin/app/
├── not-found.tsx 📝
└── error.tsx 📝
```

---

## GraphQL Queries/Mutations Needed

### For Contract Details
- `getContractById(id: ID!)` → Contract (header info)
- `getContractEvents(contractId: ID!, limit: Int)` → [Event] (timeline)
- `getEventTypeStats(contractId: ID!)` → [EventTypeStats] (chart data)
- `getRelatedContracts(contractId: ID!)` → [Contract] (similar contracts)

### For Webhook Tester
- `listWebhooks()` → [Webhook]
- `getWebhookDeliveries(webhookId: ID!)` → [Delivery] (log)
- `testWebhook(webhookId: ID!, payload: JSON)` → TestResult

**Action**: Verify these queries exist in backend GraphQL schema. If missing, file backend issue separately.

---

## Testing Strategy

### #612 Webhook Tester
- [ ] Test on mobile (iPad, iPhone 12)
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Error state: failed delivery message, retry
- [ ] Real-time updates (if using subscriptions)

### #615 Contract Details
- [ ] Load contract with 0 events
- [ ] Load contract with 1000+ events (pagination needed?)
- [ ] Mobile: stats stack vertically
- [ ] Charts responsive on small screens

### #614 GraphQL Docs
- [ ] Schema introspection works
- [ ] Apollo Sandbox embeds without CORS issues
- [ ] Docusaurus build succeeds
- [ ] Search indexes all pages

---

## Technical Debt / Assumptions

1. **Component library**: Assuming Shadcn/Tailwind pattern (verify with `components/` inspection)
2. **Chart library**: Admin already uses custom `Chart.tsx`, `PieChart.tsx` (reuse for contract detail)
3. **Form library**: Assuming React Hook Form (check `package.json`)
4. **HTTP client**: Graphql-request or Apollo Client (verify)
5. **Syntax highlighting**: Need to verify if `react-syntax-highlighter` or Prism installed

**Action**: Run `pnpm list <package>` to verify key dependencies before coding.

---

## Success Criteria

### Webhook Tester Done When:
- [ ] All 7 sub-deliverables implemented
- [ ] Mobile layout tested (< 768px width)
- [ ] Dark mode looks correct
- [ ] Copy buttons work, expand/collapse works
- [ ] Error states display correctly
- [ ] No console errors

### Contract Details Done When:
- [ ] Header, stats, chart, timeline, types list, ABI viewer all visible
- [ ] Responsive on mobile
- [ ] Data loads from GraphQL
- [ ] Charts render correctly

### GraphQL Docs Done When:
- [ ] Docs build successfully
- [ ] At least 20 top queries documented with examples
- [ ] Apollo Sandbox loads in iframe
- [ ] Search works
- [ ] Mobile layout stacks

### Error Patterns Done When:
- [ ] Pattern guide written (2 pages max)
- [ ] 404 and 500 pages exist in both apps
- [ ] Toast component available
- [ ] Validation example in form

---

## Notes for PRs

Each issue gets its own PR:
1. **PR for #612**: "feat: enhance webhook tester UI with delivery logs, detail view, test form"
2. **PR for #615**: "feat: create contract details page with stats, timeline, charts"
3. **PR for #614**: "docs: add interactive GraphQL API documentation"
4. **PR for #618**: "docs/refactor: add error state patterns and fix error pages"

Each PR should:
- Link to GitHub issue
- Include mobile screenshot (if UI change)
- Test on light + dark mode
- Verify accessibility (axe or manual)
