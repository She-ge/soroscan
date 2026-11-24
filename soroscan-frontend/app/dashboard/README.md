# Event Explorer Dashboard

The Event Explorer Dashboard is the primary user interface for SoroScan, allowing users to browse, filter, and analyze
indexed contract events.

## Features

### Core Functionality

- **Event Table**: Displays contract events with key information (Contract ID, Event Type, Ledger, Time, Transaction)
- **Filtering**: Filter by contract, event type, and date range
- **Search**: Real-time client-side search across event data
- **Pagination**: Cursor-based pagination with First/Previous/Next/Last controls
- **Event Details**: Modal view with complete event information
- **Export**: Download events as CSV or JSON

### Terminal Styling

- Glowing rows on hover with color-coded event types
- Retro terminal aesthetic with cyan/green color scheme
- Responsive design that converts to card view on mobile

### User Experience

- Copy buttons for Contract IDs and Transaction hashes
- Loading states with spinners
- Error states with helpful messages
- Relative timestamps (e.g., "2h ago")
- Truncated hashes with full copy functionality

## Usage

Navigate to `/dashboard` to access the Event Explorer Dashboard.

### Workflow

1. Select a contract from the dropdown
1. Optionally filter by event type, date range, or search query
1. Click "Apply Filters" to load events
1. Click on any event row to view full details
1. Use pagination controls to navigate through results
1. Export filtered results as CSV or JSON

## Components

- `EventExplorerDashboard.tsx` - Main dashboard container with state management
- `EventTable.tsx` - Event table with hover effects and copy buttons
- `FilterBar.tsx` - Filter controls and export buttons
- `PaginationControls.tsx` - Cursor-based pagination UI
- `EventDetailModal.tsx` - Modal for viewing complete event details

## API Integration

The dashboard uses GraphQL queries defined in `components/ingest/graphql.ts`:

- `fetchAllContracts()` - Load contract list for dropdown
- `fetchEventTypes(contractId)` - Load event types for selected contract
- `fetchExplorerEvents(variables)` - Load paginated events with filters

## Styling

Uses the terminal theme from `components/ingest/ingest-terminal.module.css` with:

- Dark background with gradient overlays
- Cyan (#00d4ff) and green (#00ff9c) accent colors
- Monospace font (JetBrains Mono, Fira Code, IBM Plex Mono)
- Glow effects on hover
- Scanline overlay effect

## Future Enhancements

- Real-time WebSocket updates (depends on backend Issue #11)
- Advanced analytics and visualizations
- Bulk operations on events
- Saved filter presets
- Event comparison view
