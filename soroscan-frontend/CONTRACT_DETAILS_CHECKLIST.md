# Issue #615: Contract Details Page - Implementation Checklist

**Status**: Not Started  
**Estimated Completion**: 3 days  
**Owner**: [Assign team member]

---

## MVP Deliverables

### 1. Contract Header

- [ ] Create `soroscan-frontend/app/contracts/[id]/components/ContractHeader.tsx`
- [ ] Display: contract name, address (with copy button), network badge, verified status badge
- [ ] Copy address to clipboard on click/button press
- [ ] Show network (Mainnet/Testnet) as badge color (blue/orange)
- [ ] Verified status: checkmark icon if verified, else gray icon
- [ ] Responsive: stack on mobile (name on line 1, address + badges on line 2)

**GraphQL Query Needed**:

```graphql
query getContractHeader($id: ID!) {
  contract(id: $id) {
    id
    name
    address
    network      # 'mainnet' | 'testnet'
    isVerified
  }
}
```

### 2. Contract Stats Cards

- [ ] Create `soroscan-frontend/app/contracts/[id]/components/ContractStats.tsx`
- [ ] Cards: "Total Events", "Event Types", "Last Event", "Avg Event Size"
- [ ] Layout: 4 cards in row (responsive: 2x2 on tablet, 1 column on mobile)
- [ ] Each card shows: label, large number, optional trend (e.g., "↑ 12% last week" in gray)
- [ ] Card styling: Use `Card.tsx` component, light border, hover shadow effect
- [ ] Last Event card: timestamp relative to now (e.g., "2 hours ago")

**GraphQL Query Needed**:

```graphql
query getContractStats($id: ID!) {
  contract(id: $id) {
    stats {
      totalEvents: Int
      uniqueEventTypes: Int
      lastEventTimestamp: DateTime
      averageEventSize: Int      # bytes
    }
  }
}
```

### 3. Event Type Breakdown Chart

- [ ] Create `soroscan-frontend/app/contracts/[id]/components/EventTypeChart.tsx`
- [ ] Use existing `PieChart.tsx` or `BarChart.tsx` (reuse from `admin/app/components/`)
- [ ] Show: pie chart (top 5 event types) or bar chart (all types sorted by count)
- [ ] Legend: type name + count
- [ ] Responsive: chart resizes on mobile, legend stacks below
- [ ] Colors: use distinct palette (auto-assign colors per type)
- [ ] Hover: tooltip shows percentage

**GraphQL Query Needed**:

```graphql
query getEventTypeStats($contractId: ID!) {
  contract(id: $contractId) {
    eventTypeStats {
      type: String
      count: Int
    }
  }
}
```

### 4. Event Timeline

- [ ] Create `soroscan-frontend/app/contracts/[id]/components/EventTimeline.tsx`
- [ ] Display: list of recent events (last 20) with vertical timeline
- [ ] Per event: timestamp (absolute), event type (colored badge), status, brief description
- [ ] Clickable: click event → expand to show full payload
- [ ] Timestamps: consistent format (e.g., "May 30, 2024 at 2:45 PM UTC")
- [ ] Pagination: "Load More" button or infinite scroll (your choice)

**GraphQL Query Needed**:

```graphql
query getContractEvents($contractId: ID!, $limit: Int, $offset: Int) {
  contractEvents(contractId: $contractId, limit: $limit, offset: $offset) {
    id
    type
    timestamp
    status
    payload     # or abbreviated payload
    blockNumber
  }
}
```

### 5. Event Types List

- [ ] Create `soroscan-frontend/app/contracts/[id]/components/EventTypesList.tsx`
- [ ] Table/List: type name, event count, avg size, first seen, last seen
- [ ] Sortable columns: click header to sort
- [ ] Mobile: collapse to cards (type name + count prominent)
- [ ] Paging: 25 types per page

**GraphQL Query Needed** (reuse from #3 or extend):

```graphql
query getEventTypesDetail($contractId: ID!) {
  contract(id: $contractId) {
    eventTypes {
      name: String
      count: Int
      avgSize: Int
      firstSeenAt: DateTime
      lastSeenAt: DateTime
    }
  }
}
```

### 6. Contract Code/ABI Viewer

- [ ] Create `soroscan-frontend/app/contracts/[id]/components/AbiViewer.tsx`
- [ ] Display: contract ABI (JSON), syntax highlighted
- [ ] Copy button: copy full ABI to clipboard
- [ ] Read-only (no edit mode needed for MVP)
- [ ] Expand/collapse per contract function
- [ ] Dark mode: use atom-one-dark syntax theme

**GraphQL Query Needed**:

```graphql
query getContractAbi($id: ID!) {
  contract(id: $id) {
    abi        # JSON string
  }
}
```

**Syntax Highlight Library**: Check `pnpm list react-syntax-highlighter` or use `<Highlight>` if available.

### 7. Related Contracts Section

- [ ] Create `soroscan-frontend/app/contracts/[id]/components/RelatedContracts.tsx`
- [ ] Show: 5-10 similar contracts (same creator, or same event types)
- [ ] Layout: horizontal scrollable cards or 2-column grid
- [ ] Per card: name, address (truncated), event count, "View" button
- [ ] Mobile: full-width stack

**GraphQL Query Needed**:

```graphql
query getRelatedContracts($contractId: ID!, $limit: Int) {
  relatedContracts(contractId: $contractId, limit: $limit) {
    id
    name
    address
    eventCount: Int
  }
}
```

---

## Files to Create

```
soroscan-frontend/app/contracts/[id]/
├── page.tsx 📝 NEW (layout orchestrating all sub-components)
├── components/
│   ├── ContractHeader.tsx 📝 NEW
│   ├── ContractStats.tsx 📝 NEW
│   ├── EventTypeChart.tsx 📝 NEW
│   ├── EventTimeline.tsx 📝 NEW
│   ├── EventTypesList.tsx 📝 NEW
│   ├── AbiViewer.tsx 📝 NEW
│   └── RelatedContracts.tsx 📝 NEW
```

---

## Layout Structure (page.tsx)

```typescript
export default function ContractDetailPage({ params }) {
  return (
    <div className="space-y-6 p-4">
      <ContractHeader contractId={params.id} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stats cards */}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EventTypeChart contractId={params.id} />
        </div>
        <div>
          <RelatedContracts contractId={params.id} />
        </div>
      </div>
      
      <EventTimeline contractId={params.id} />
      <EventTypesList contractId={params.id} />
      <AbiViewer contractId={params.id} />
    </div>
  );
}
```

---

## Acceptance Tests

### Functional

- [ ] Load contract detail page → all data loads within 3s
- [ ] Chart displays correct event type breakdown
- [ ] Timeline shows events in reverse chronological order
- [ ] Copy buttons work (URL, ABI, address)
- [ ] Click event in timeline → expands to show full payload
- [ ] "Load More" pagination works
- [ ] Related contracts show clickable links

### Visual

- [ ] All 7 components visible in viewport (no important content cut off)
- [ ] Stats cards have good visual hierarchy (large numbers, small labels)
- [ ] Chart legend readable and accurate
- [ ] Timestamps consistent format throughout
- [ ] Mobile: no horizontal scroll, content stacks vertically
- [ ] Dark mode: all text readable, colors distinct

### Performance

- [ ] Lighthouse Performance > 70
- [ ] Initial data loads < 3s
- [ ] Images/icons load without layout shift

### Accessibility

- [ ] Tab navigation through all components
- [ ] Chart has alt text or ARIA description
- [ ] Verified badge has tooltip explaining meaning
- [ ] Color alone doesn't convey status (include text or icons)

---

## Questions for Backend Team

- [ ] Is there a contract detail GraphQL query, or do we build from multiple queries?
- [ ] Does database store ABI for all contracts?
- [ ] Do we have event count stats pre-calculated, or calculate on query?
- [ ] Related contracts: how are they determined? (creator match, event type overlap?)
- [ ] Event payload: full or truncated? Size limit for response?

---

## Design Notes

- **Color scheme**: Use existing app colors (check globals.css, theme config)
- **Spacing**: 4px base unit (Tailwind: p-4, gap-6, space-y-6)
- **Fonts**: Assume sans-serif default, monospace for code blocks
- **Dark mode**: Ensure all cards have `bg-zinc-900` or `bg-zinc-950` backgrounds
- **Responsive breakpoints**:
  - Mobile: < 768px (single column)
  - Tablet: 768px-1024px (2 columns)
  - Desktop: > 1024px (3+ columns)

---

## References

- Chart components: `admin/app/components/BarChart.tsx`, `PieChart.tsx`
- Card component: `admin/app/components/` or `soroscan-frontend/components/ui/`
- Badges: Check existing badge patterns (e.g., `SubscriptionStatusBadge.tsx`)
- Timeline pattern: Can use simple vertical layout (divs with border-left line)
