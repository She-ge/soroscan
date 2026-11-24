# Event Explorer Dashboard - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                        │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │           EventExplorerDashboard.tsx                  │ │
│  │              (State Management)                       │ │
│  │                                                       │ │
│  │  State:                                               │ │
│  │  - contracts: ContractInfo[]                          │ │
│  │  - filters: Filters                                   │ │
│  │  - events: EventRecord[]                              │ │
│  │  - filteredEvents: EventRecord[]                      │ │
│  │  - currentPage: number                                │ │
│  │  - hasNext: boolean                                   │ │
│  │  - loading: boolean                                   │ │
│  │  - error: string | null                               │ │
│  │  - selectedEvent: EventRecord | null                  │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                 │
│         ┌─────────────────┼─────────────────┐              │
│         │                 │                 │              │
│         ▼                 ▼                 ▼              │
│  ┌──────────┐      ┌──────────┐     ┌──────────┐         │
│  │ FilterBar│      │EventTable│     │Pagination│         │
│  └──────────┘      └──────────┘     └──────────┘         │
│         │                 │                                │
│         │                 └──────────┐                     │
│         │                            ▼                     │
│         │                   ┌──────────────┐              │
│         │                   │EventDetailModal              │
│         │                   └──────────────┘              │
│         │                                                  │
└─────────┼──────────────────────────────────────────────────┘
          │
          │ GraphQL Queries
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    GraphQL API Layer                        │
│                  (/api/graphql/route.ts)                    │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Services                         │
│              (Database, Event Indexer, etc.)                │
└─────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
app/dashboard/
│
├── page.tsx
│   └── <EventExplorerDashboard />
│
└── components/
    │
    ├── EventExplorerDashboard.tsx (Container)
    │   │
    │   ├── <FilterBar />
    │   │   ├── Contract Dropdown
    │   │   ├── Event Type Dropdown
    │   │   ├── Date Range Inputs
    │   │   ├── Search Input
    │   │   └── Export Buttons
    │   │
    │   ├── <EventTable />
    │   │   ├── Table Headers
    │   │   ├── Event Rows
    │   │   │   ├── Contract Cell (with copy)
    │   │   │   ├── Event Type Cell (color-coded)
    │   │   │   ├── Ledger Cell (clickable)
    │   │   │   ├── Time Cell
    │   │   │   ├── Transaction Cell (with copy)
    │   │   │   └── Actions Cell (View button)
    │   │   └── Empty State
    │   │
    │   ├── <PaginationControls />
    │   │   ├── First Button
    │   │   ├── Previous Button
    │   │   ├── Page Indicator
    │   │   ├── Count Display
    │   │   ├── Next Button
    │   │   └── Last Button
    │   │
    │   └── <EventDetailModal /> (conditional)
    │       ├── Modal Header
    │       ├── Event Details
    │       │   ├── Event ID
    │       │   ├── Contract Info
    │       │   ├── Event Type
    │       │   ├── Ledger Info
    │       │   ├── Timestamp
    │       │   ├── Transaction Hash
    │       │   └── Payload (JSON)
    │       └── Modal Actions
```

## Data Flow

### 1. Initial Load

```
User navigates to /dashboard
    ↓
page.tsx renders
    ↓
EventExplorerDashboard mounts
    ↓
useEffect: fetchAllContracts()
    ↓
GraphQL: AllContracts query
    ↓
State: setContracts(contractList)
    ↓
FilterBar renders with contract options
```

### 2. Contract Selection

```
User selects contract from dropdown
    ↓
FilterBar: onChange handler
    ↓
EventExplorerDashboard: handleFilterChange()
    ↓
State: setFilters({ contractId: "..." })
    ↓
useEffect: fetchEventTypes(contractId)
    ↓
GraphQL: EventTypes query
    ↓
State: setEventTypes(types)
    ↓
FilterBar: Event type dropdown populates
```

### 3. Loading Events

```
User clicks "Apply Filters"
    ↓
FilterBar: handleApply()
    ↓
EventExplorerDashboard: handleFilterChange()
    ↓
State: setFilters({ ...newFilters })
    ↓
useEffect: fetchExplorerEvents()
    ↓
GraphQL: ExplorerEvents query
    ↓
State: setEvents(eventList)
    ↓
EventTable renders with events
```

### 4. Real-Time Search

```
User types in search box
    ↓
FilterBar: onChange handler
    ↓
EventExplorerDashboard: handleFilterChange()
    ↓
State: setFilters({ searchQuery: "..." })
    ↓
useEffect: client-side filtering
    ↓
State: setFilteredEvents(filtered)
    ↓
EventTable re-renders with filtered events
```

### 5. Pagination

```
User clicks "Next"
    ↓
PaginationControls: onClick handler
    ↓
EventExplorerDashboard: setCurrentPage(page + 1)
    ↓
useEffect: fetchExplorerEvents() with new offset
    ↓
GraphQL: ExplorerEvents query (offset: page * PAGE_SIZE)
    ↓
State: setEvents(eventList)
    ↓
EventTable re-renders with new page
```

### 6. View Event Details

```
User clicks "View" button
    ↓
EventTable: onEventClick(event)
    ↓
EventExplorerDashboard: setSelectedEvent(event)
    ↓
EventDetailModal renders (conditional)
    ↓
User views details, copies data
    ↓
User clicks "Close" or clicks outside
    ↓
EventExplorerDashboard: setSelectedEvent(null)
    ↓
EventDetailModal unmounts
```

### 7. Export Data

```
User clicks "Export CSV"
    ↓
FilterBar: onExport("csv")
    ↓
EventExplorerDashboard: handleExport()
    ↓
Generate CSV from filteredEvents
    ↓
Create Blob and download link
    ↓
Trigger download
    ↓
Cleanup Blob URL
```

## State Management Strategy

### Local State (useState)

- **contracts**: List of all contracts (loaded once)
- **filters**: Current filter values (contract, type, dates, search)
- **events**: Current page of events from API
- **filteredEvents**: Events after client-side search
- **currentPage**: Current pagination page
- **hasNext**: Whether more pages exist
- **loading**: Loading state for API calls
- **error**: Error message if API fails
- **selectedEvent**: Currently selected event for modal

### Derived State

- **startIndex**: Calculated from currentPage and PAGE_SIZE
- **endIndex**: Calculated from startIndex and filteredEvents.length
- **totalCount**: Estimated from offset + events.length

### Side Effects (useEffect)

1. **Load contracts on mount**
   - Dependency: []
   - Runs once

1. **Load event types when contract changes**
   - Dependency: [filters.contractId]
   - Runs when contract selected

1. **Load events when filters/page changes**
   - Dependency: [filters.contractId, filters.eventType, filters.since, filters.until, currentPage]
   - Runs when any filter or page changes

1. **Filter events when search changes**
   - Dependency: [events, filters.searchQuery]
   - Runs when events or search query changes

## API Integration

### GraphQL Queries

#### 1. AllContracts

```graphql
query AllContracts {
  contracts {
    contractId
    name
  }
}
```

- **When**: Component mount
- **Purpose**: Populate contract dropdown
- **Caching**: Could be cached (contracts rarely change)

#### 2. EventTypes

```graphql
query EventTypes($contractId: String!) {
  eventTypes(contractId: $contractId)
}
```

- **When**: Contract selected
- **Purpose**: Populate event type dropdown
- **Caching**: Could be cached per contract

#### 3. ExplorerEvents

```graphql
query ExplorerEvents(
  $contractId: String!
  $eventType: String
  $limit: Int!
  $offset: Int!
  $since: DateTime
  $until: DateTime
) {
  events(...) {
    id
    eventType
    ledger
    eventIndex
    timestamp
    txHash
    payload
    contractId
    contractName
  }
}
```

- **When**: Filters applied or page changed
- **Purpose**: Load events for display
- **Caching**: Should not be cached (data changes frequently)

### Request Flow

```
Component → graphqlRequest() → fetch(/api/graphql) → Backend
                                                          ↓
Component ← parseResponse() ← Response ← Backend
```

### Error Handling

```
try {
  const data = await fetchExplorerEvents(...)
  setEvents(data)
} catch (err) {
  setError(err.message)
  setEvents([])
}
```

## Performance Optimizations

### 1. Pagination

- Fetch PAGE_SIZE + 1 items
- Display PAGE_SIZE items
- Use extra item to determine hasNext
- Avoids expensive COUNT queries

### 2. Client-Side Search

- Filter events in browser
- No API calls for search
- Instant feedback
- Reduces server load

### 3. Lazy Loading

- Event types loaded only when contract selected
- Reduces initial load time
- Improves perceived performance

### 4. Memoization Opportunities

```typescript
// Could use useMemo for expensive computations
const filteredEvents = useMemo(() => {
  return events.filter(/* search logic */)
}, [events, filters.searchQuery])

// Could use useCallback for stable function references
const handleFilterChange = useCallback((newFilters) => {
  setFilters(prev => ({ ...prev, ...newFilters }))
}, [])
```

### 5. Debouncing (Future Enhancement)

```typescript
// Could debounce search input
const debouncedSearch = useMemo(
  () => debounce((query) => {
    setFilters(prev => ({ ...prev, searchQuery: query }))
  }, 300),
  []
)
```

## Styling Architecture

### CSS Modules

- Uses `ingest-terminal.module.css`
- Scoped styles prevent conflicts
- Terminal theme consistency

### Inline Styles

- Dynamic colors for event types
- Hover effects with JavaScript
- Component-specific styling

### Responsive Design

```css
@media (max-width: 768px) {
  .hidden-mobile {
    display: none;
  }
}
```

### Theme Variables

```css
--color-terminal-green: #00ff9c
--color-terminal-cyan: #00d4ff
--color-terminal-gray: #7ba8b5
```

## Security Considerations

### XSS Prevention

- React escapes by default
- No dangerouslySetInnerHTML
- No eval() or Function()

### API Security

- GraphQL with parameterized queries
- No SQL injection risk
- Server-side validation

### Data Privacy

- No sensitive data in URLs
- No localStorage for sensitive data
- Clipboard API requires user interaction

## Testing Strategy

### Unit Tests

- Component rendering
- Button states
- Click handlers
- Edge cases

### Integration Tests (Future)

- API mocking
- Filter combinations
- Pagination flow
- Export functionality

### E2E Tests (Future)

- Full user workflows
- Cross-browser testing
- Mobile responsiveness
- Performance testing

## Deployment Considerations

### Build Optimization

```bash
npm run build
# Next.js optimizes:
# - Code splitting
# - Tree shaking
# - Minification
# - Image optimization
```

### Environment Variables

- None required for dashboard
- API endpoint from Next.js config

### CDN Strategy

- Static assets served from CDN
- API calls to same origin
- No CORS issues

## Monitoring & Analytics

### Performance Metrics

- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)

### User Analytics

- Page views
- Filter usage
- Export frequency
- Error rates

### Error Tracking

- API errors
- Client-side errors
- Network failures
- Browser compatibility issues

## Future Architecture Improvements

### 1. State Management Library

- Redux or Zustand for complex state
- Better debugging tools
- Time-travel debugging

### 2. GraphQL Client

- Apollo Client or urql
- Automatic caching
- Optimistic updates
- Subscriptions for real-time

### 3. Virtual Scrolling

- React Window or React Virtual
- Handle thousands of events
- Improved performance

### 4. Web Workers

- Offload search to worker
- Non-blocking UI
- Better performance

### 5. Service Worker

- Offline support
- Background sync
- Push notifications

## Conclusion

The Event Explorer Dashboard follows a clean, maintainable architecture with:

- Clear separation of concerns
- Unidirectional data flow
- Proper error handling
- Performance optimizations
- Security best practices
- Comprehensive documentation
