# ResponsiveTable Integration Guide

Quick guide to integrate the ResponsiveTable component into your SoroScan application.

## Step 1: Import the Component

```tsx
import { ResponsiveTable, ColumnDefinition } from "@/components/terminal/ResponsiveTable"
import { User, DollarSign, Calendar } from "lucide-react"
```

## Step 2: Define Your Data Type

```tsx
interface EventData {
  id: string
  contractId: string
  eventType: string
  timestamp: string
  blockHeight: number
  value: number
}
```

## Step 3: Create Column Definitions

```tsx
const columns: ColumnDefinition<EventData>[] = [
  {
    key: "id",
    label: "Event ID",
    icon: User,
    cellClassName: "font-terminal-mono text-xs",
  },
  {
    key: "contractId",
    label: "Contract",
    icon: User,
    sortable: true,
    cellClassName: "font-terminal-mono text-xs",
  },
  {
    key: "eventType", 
    label: "Type",
    icon: User,
    sortable: true,
  },
  {
    key: "value",
    label: "Value",
    icon: DollarSign,
    sortable: true,
    render: (event) => (
      <span className="font-terminal-mono font-bold text-terminal-green">
        {event.value.toLocaleString()}
      </span>
    ),
  },
  {
    key: "timestamp",
    label: "Time",
    icon: Calendar,
    sortable: true,
    render: (event) => new Date(event.timestamp).toLocaleString(),
  },
  {
    key: "blockHeight",
    label: "Block",
    icon: User,
    sortable: true,
    cellClassName: "font-terminal-mono",
  },
]
```

## Step 4: Add State Management

```tsx
const [sort, setSort] = useState<{key: string, direction: "asc" | "desc"}>()
const [loading, setLoading] = useState(false)
```

## Step 5: Render the Component

```tsx
<ResponsiveTable
  data={events}
  columns={columns}
  sort={sort}
  onSortChange={(key, direction) => setSort({ key, direction })}
  loading={loading}
  caption="Soroban contract events table"
  emptyMessage="No events found for this contract"
/>
```

## Complete Example - Event Explorer

```tsx
"use client"

import { useState, useEffect } from "react"
import { ResponsiveTable, ColumnDefinition } from "@/components/terminal/ResponsiveTable"
import { Hash, Calendar, Activity, Code, TrendingUp } from "lucide-react"

interface ContractEvent {
  id: string
  contractId: string
  eventType: string
  timestamp: string
  blockHeight: number
  transactionHash: string
  value: number
}

export default function EventExplorer() {
  const [events, setEvents] = useState<ContractEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<{key: string, direction: "asc" | "desc"}>()

  const columns: ColumnDefinition<ContractEvent>[] = [
    {
      key: "id",
      label: "Event ID", 
      icon: Hash,
      cellClassName: "font-terminal-mono text-xs",
    },
    {
      key: "contractId",
      label: "Contract",
      icon: Code,
      sortable: true,
      cellClassName: "font-terminal-mono text-xs",
      render: (event) => (
        <span title={event.contractId}>
          {event.contractId.slice(0, 8)}...{event.contractId.slice(-8)}
        </span>
      ),
    },
    {
      key: "eventType",
      label: "Event Type",
      icon: Activity,
      sortable: true,
      render: (event) => (
        <span className="text-terminal-cyan font-terminal-mono">
          {event.eventType}
        </span>
      ),
    },
    {
      key: "value",
      label: "Value",
      icon: TrendingUp,
      sortable: true,
      render: (event) => (
        <span className="font-terminal-mono font-bold text-terminal-green">
          {event.value.toLocaleString()}
        </span>
      ),
    },
    {
      key: "timestamp",
      label: "Timestamp",
      icon: Calendar,
      sortable: true,
      render: (event) => new Date(event.timestamp).toLocaleString(),
    },
    {
      key: "blockHeight",
      label: "Block",
      icon: Hash,
      sortable: true,
      cellClassName: "font-terminal-mono font-bold",
    },
  ]

  useEffect(() => {
    // Simulate API call
    const fetchEvents = async () => {
      setLoading(true)
      
      // Replace with actual API call
      const mockEvents: ContractEvent[] = [
        {
          id: "evt_001",
          contractId: "CB64D3G7SM2RTH6JSGG34DDTFTQ5CFDKVWZJN4WXK2CKZQH5YYC5V5K",
          eventType: "transfer",
          timestamp: new Date().toISOString(),
          blockHeight: 12345,
          transactionHash: "hash123",
          value: 1000000,
        },
        // ... more events
      ]
      
      setTimeout(() => {
        setEvents(mockEvents)
        setLoading(false)
      }, 1000)
    }

    fetchEvents()
  }, [])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-terminal-green font-terminal-mono">
          Contract Events
        </h1>
        <p className="text-terminal-gray">
          Real-time Soroban contract events. Resize window to see responsive behavior.
        </p>
      </div>

      <ResponsiveTable
        data={events}
        columns={columns}
        sort={sort}
        onSortChange={(key, direction) => setSort({ key, direction })}
        loading={loading}
        caption="Soroban smart contract events with transaction details"
        emptyMessage="No contract events found"
      />
    </div>
  )
}
```

## Integration with GraphQL

For GraphQL integration with Apollo Client:

```tsx
import { useQuery } from "@apollo/client"
import { GET_CONTRACT_EVENTS } from "@/graphql/queries"

function ContractEventsTable({ contractId }: { contractId: string }) {
  const { data, loading, error } = useQuery(GET_CONTRACT_EVENTS, {
    variables: { contractId },
  })

  if (error) {
    return <div className="text-terminal-danger">Error: {error.message}</div>
  }

  return (
    <ResponsiveTable
      data={data?.contractEvents || []}
      columns={columns}
      loading={loading}
      emptyMessage={`No events found for contract ${contractId}`}
    />
  )
}
```

## Testing the Component

Create a test page in your app to verify the responsive behavior:

```tsx
// app/test/responsive-table/page.tsx
import { ResponsiveTableDemo } from "@/components/terminal/examples/ResponsiveTableDemo"

export default function TestResponsiveTablePage() {
  return <ResponsiveTableDemo />
}
```

Then visit `/test/responsive-table` in your browser and resize the window to test the responsive behavior.

## Next Steps

1. **Add to your page**: Copy the integration example above
2. **Customize columns**: Modify the column definitions for your data
3. **Connect to API**: Replace mock data with real API calls
4. **Style customization**: Add custom CSS classes via `className` and `cardClassName` props
5. **Add interactions**: Implement row click handlers, selection, or other interactive features