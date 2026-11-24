# Event Explorer Dashboard - Quick Start Guide

## Getting Started

### 1. Access the Dashboard

Navigate to `/dashboard` in your browser:

```
http://localhost:3000/dashboard
```

### 2. Select a Contract

1. Click the "Contract" dropdown in the Filters section
1. Select a contract from the list
1. The event types dropdown will populate automatically

### 3. Apply Filters (Optional)

- **Event Type**: Filter by specific event types
- **From/To**: Set date range for events
- **Search**: Type to search across all event data in real-time

### 4. Browse Events

- Events display in a table with key information
- Hover over rows to see the glow effect
- Click "View" to see full event details

### 5. Navigate Pages

- Use pagination controls at the bottom
- First (◄◄), Previous (◄), Next (►), Last (►►) buttons
- Current page and count displayed

### 6. Copy Data

- Click 📋 buttons next to Contract IDs and Transaction hashes
- ✓ appears when copied successfully

### 7. Export Data

- Click "Export CSV" or "Export JSON" in the Filters section
- Downloads filtered results to your computer

## Component Architecture

```
EventExplorerDashboard (State Management)
├── FilterBar (Filters & Export)
│   ├── Contract Dropdown
│   ├── Event Type Dropdown
│   ├── Date Range Inputs
│   ├── Search Input
│   └── Export Buttons
├── EventTable (Event List)
│   ├── Table Headers
│   ├── Event Rows (with hover effects)
│   └── Copy Buttons
├── PaginationControls (Navigation)
│   ├── First/Prev/Next/Last Buttons
│   └── Page Info Display
└── EventDetailModal (Details View)
    ├── Event Metadata
    ├── Payload Display
    └── Copy Buttons
```

## Key Features

### Real-Time Search

Type in the search box to filter events instantly without making API calls. Searches across:

- Event types
- Contract IDs
- Transaction hashes
- Event payloads

### Color-Coded Event Types

Each event type gets a unique color with a glowing effect on hover:

- Green tones
- Cyan tones
- Orange tones
- Purple tones

### Cursor-Based Pagination

- No offset issues at scale
- Efficient database queries
- Accurate page navigation

### Export Functionality

**CSV Format:**

- Headers: Contract ID, Event Type, Ledger, Timestamp, Transaction, Payload
- Properly escaped values
- Opens in Excel/Google Sheets

**JSON Format:**

- Pretty-printed with 2-space indentation
- Complete event objects
- Easy to parse programmatically

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Navigate between filters |
| Enter | Apply filters (when in input) |
| Escape | Close modal |
| Arrow Keys | Navigate table (browser default) |

## Mobile Usage

On mobile devices (< 768px):

- Time and Transaction columns are hidden
- Filters stack vertically
- Touch-friendly button sizes
- Scrollable table

## Troubleshooting

### No Events Showing

1. Make sure a contract is selected
1. Check if filters are too restrictive
1. Try clearing filters with "Clear" button

### Export Not Working

1. Check browser allows downloads
1. Ensure events are loaded
1. Try a different format (CSV vs JSON)

### Copy Not Working

1. Browser must support Clipboard API
1. Page must be served over HTTPS (or localhost)
1. User must interact with page first

### Slow Loading

1. Reduce date range
1. Select specific event type
1. Check network connection

## API Requirements

The dashboard requires these GraphQL queries to be available:

```graphql
# Load all contracts
query AllContracts {
  contracts {
    contractId
    name
  }
}

# Load event types for a contract
query EventTypes($contractId: String!) {
  eventTypes(contractId: $contractId)
}

# Load events with filters
query ExplorerEvents(
  $contractId: String!
  $eventType: String
  $limit: Int!
  $offset: Int!
  $since: DateTime
  $until: DateTime
) {
  events(
    contractId: $contractId
    eventType: $eventType
    limit: $limit
    offset: $offset
    since: $since
    until: $until
  ) {
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

## Development

### Running Locally

```bash
npm run dev
```

### Running Tests

```bash
npm test -- __tests__/dashboard-components.test.tsx
```

### Building for Production

```bash
npm run build
npm start
```

## Customization

### Changing Page Size

Edit `PAGE_SIZE` constant in `EventExplorerDashboard.tsx`:

```typescript
const PAGE_SIZE = 20; // Change to desired size
```

### Modifying Colors

Event type colors are defined in `EventTable.tsx`:

```typescript
const colors = [
  "rgba(0, 255, 156, 0.8)",  // Green
  "rgba(0, 212, 255, 0.8)",  // Cyan
  "rgba(255, 170, 0, 0.8)",  // Orange
  "rgba(255, 102, 255, 0.8)", // Purple
];
```

### Adding New Filters

1. Add state to `EventExplorerDashboard.tsx`
1. Add UI control to `FilterBar.tsx`
1. Update `fetchExplorerEvents` call with new parameter
1. Update GraphQL query if needed

## Best Practices

### Performance

- Keep page size reasonable (20-50 items)
- Use specific filters to reduce data
- Export in batches for large datasets

### User Experience

- Always select a contract first
- Use search for quick filtering
- Check event details before exporting
- Clear filters when switching contracts

### Data Management

- Export regularly for backup
- Use JSON for programmatic processing
- Use CSV for spreadsheet analysis
- Copy individual IDs for investigation

## Support

For issues or questions:

1. Check this guide first
1. Review the README.md
1. Check the IMPLEMENTATION.md for technical details
1. Open an issue on GitHub

## Next Steps

After mastering the basics:

1. Explore different contracts
1. Try various filter combinations
1. Export data for analysis
1. Integrate with other tools
1. Provide feedback for improvements
