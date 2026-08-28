# ResponsiveTable Component

A responsive data table component that automatically switches between table layout (desktop) and card layout (mobile) based on screen size. Built with SoroScan's terminal theme styling.

## Features

- 🖥️ **Desktop**: Full table layout with sortable columns
- 📱 **Mobile**: Card-based layout with icon + label + value stacking
- 🎨 **Terminal Styling**: Consistent with SoroScan's terminal theme
- ♿ **Accessible**: ARIA labels, keyboard navigation, focus management
- 🔄 **Sortable**: Optional column sorting with visual indicators
- ⚡ **Loading States**: Built-in loading skeletons for both layouts
- 🎭 **Empty States**: Customizable empty state messages
- 🎯 **TypeScript**: Full type safety with generic data support

## Breakpoint

The component switches from table to card layout at **768px** (Tailwind's `md` breakpoint).

## Basic Usage

```tsx
import { ResponsiveTable, ColumnDefinition } from "@/components/terminal/ResponsiveTable"
import { User, DollarSign } from "lucide-react"

interface MyData {
  id: number
  name: string
  amount: number
}

const data: MyData[] = [
  { id: 1, name: "John", amount: 100 },
  { id: 2, name: "Jane", amount: 200 },
]

const columns: ColumnDefinition<MyData>[] = [
  {
    key: "id",
    label: "ID", 
    icon: User,
    sortable: true,
  },
  {
    key: "name",
    label: "Name",
    icon: User,
    sortable: true,
  },
  {
    key: "amount",
    label: "Amount",
    icon: DollarSign,
    sortable: true,
    render: (item) => `$${item.amount.toFixed(2)}`,
  },
]

function MyComponent() {
  const [sort, setSort] = useState<{key: string, direction: "asc" | "desc"}>()
  
  return (
    <ResponsiveTable
      data={data}
      columns={columns}
      sort={sort}
      onSortChange={(key, direction) => setSort({ key, direction })}
    />
  )
}
```

## Props

### ResponsiveTableProps<T>

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | **required** | Array of data items to display |
| `columns` | `ColumnDefinition<T>[]` | **required** | Column configuration array |
| `sort` | `{key: string, direction: "asc" \| "desc"}` | `undefined` | Current sort state |
| `onSortChange` | `(key: string, direction: "asc" \| "desc") => void` | `undefined` | Sort change handler |
| `className` | `string` | `undefined` | Additional CSS classes for container |
| `cardClassName` | `string` | `undefined` | Additional CSS classes for mobile cards |
| `loading` | `boolean` | `false` | Show loading skeleton |
| `emptyMessage` | `string` | `"No data available"` | Message when no data |
| `caption` | `string` | `undefined` | Accessible table caption |

### ColumnDefinition<T>

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `key` | `string` | **required** | Unique column identifier (maps to data property) |
| `label` | `string` | **required** | Display label for column header |
| `icon` | `React.ComponentType<{className?: string}>` | `undefined` | Icon component (shown in card view) |
| `render` | `(item: T, value: any) => React.ReactNode` | `undefined` | Custom cell renderer |
| `sortable` | `boolean` | `false` | Enable sorting for this column |
| `className` | `string` | `undefined` | CSS classes for column header |
| `cellClassName` | `string` | `undefined` | CSS classes for cell content |

## Advanced Usage

### Custom Rendering

```tsx
const columns: ColumnDefinition<User>[] = [
  {
    key: "status",
    label: "Status",
    icon: Activity,
    sortable: true,
    render: (user) => (
      <span className={`px-2 py-1 text-xs rounded ${
        user.status === "active" 
          ? "bg-terminal-green/20 text-terminal-green" 
          : "bg-terminal-gray/20 text-terminal-gray"
      }`}>
        {user.status.toUpperCase()}
      </span>
    ),
  },
  {
    key: "user",
    label: "User Info", 
    icon: User,
    render: (item) => (
      <div>
        <div className="font-medium">{item.name}</div>
        <div className="text-xs text-terminal-gray">{item.email}</div>
      </div>
    ),
  },
]
```

### Loading State

```tsx
const [loading, setLoading] = useState(false)

const handleRefresh = async () => {
  setLoading(true)
  await fetchData()
  setLoading(false)
}

<ResponsiveTable
  data={data}
  columns={columns}
  loading={loading}
  emptyMessage="No users found"
/>
```

### Sorting Implementation

```tsx
const [sort, setSort] = useState<{key: string, direction: "asc" | "desc"}>()
const [data, setData] = useState(originalData)

const handleSort = (key: string, direction: "asc" | "desc") => {
  setSort({ key, direction })
  
  const sortedData = [...data].sort((a, b) => {
    const aVal = a[key as keyof typeof a]
    const bVal = b[key as keyof typeof b]
    
    if (aVal < bVal) return direction === "asc" ? -1 : 1
    if (aVal > bVal) return direction === "asc" ? 1 : -1
    return 0
  })
  
  setData(sortedData)
}

<ResponsiveTable
  data={data}
  columns={columns}
  sort={sort}
  onSortChange={handleSort}
/>
```

## Layout Behavior

### Desktop (≥768px)
- Renders as standard HTML table
- Sortable column headers with click/keyboard interaction
- Hover effects on rows and headers
- Full accessibility with ARIA attributes

### Mobile (<768px)
- Renders as stacked cards
- Each card shows icon + label + value
- Empty/null values are automatically hidden
- Maintains hover effects and terminal styling

## Styling

The component uses SoroScan's terminal theme:

- **Colors**: `terminal-green`, `terminal-cyan`, `terminal-black`, `terminal-gray`
- **Fonts**: `font-terminal-mono` for monospace text
- **Effects**: `shadow-glow-green` for hover states
- **Borders**: `border-terminal` with green borders

### Custom Styling

```tsx
<ResponsiveTable
  className="my-custom-container"
  cardClassName="my-custom-cards border-terminal-cyan"
  columns={[
    {
      key: "amount",
      label: "Amount",
      cellClassName: "text-right font-bold text-terminal-green",
      className: "w-32", // Column width
    }
  ]}
/>
```

## Accessibility

- Semantic HTML table structure on desktop
- ARIA `sort` attributes on sortable columns
- Keyboard navigation (Tab + Enter/Space for sorting)
- Screen reader support with `sr-only` table captions
- Focus visible rings following WCAG guidelines
- Proper heading hierarchy in card view

## Browser Support

- All modern browsers
- Responsive design works in IE11+ 
- Touch-friendly on mobile devices
- Keyboard accessible

## Performance Notes

- Efficient rendering with React.forwardRef
- No unnecessary re-renders with proper memoization
- Lightweight CSS with Tailwind utility classes
- Smooth transitions between layouts

## Examples

See the following files for complete examples:
- `examples/ResponsiveTableDemo.tsx` - Comprehensive demo with multiple data types
- `examples/ResponsiveTableUsage.tsx` - Basic and advanced usage patterns