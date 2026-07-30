"use client"

import * as React from "react"
import { ResponsiveTable, ColumnDefinition } from "../ResponsiveTable"
import { 
  User, 
  Calendar, 
  DollarSign, 
  Activity,
  Hash,
  Mail,
  Phone,
  MapPin 
} from "lucide-react"

// Sample data types
interface UserData {
  id: number
  name: string
  email: string
  phone: string
  status: "active" | "inactive" | "pending"
  joinDate: string
  revenue: number
  location: string
}

interface TransactionData {
  id: string
  amount: number
  type: "credit" | "debit"
  date: string
  description: string
  status: "completed" | "pending" | "failed"
}

// Sample data
const sampleUsers: UserData[] = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    phone: "+1 (555) 123-4567",
    status: "active",
    joinDate: "2024-01-15",
    revenue: 1250.50,
    location: "New York, NY"
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob@example.com",
    phone: "+1 (555) 987-6543",
    status: "inactive",
    joinDate: "2023-12-03",
    revenue: 875.25,
    location: "Los Angeles, CA"
  },
  {
    id: 3,
    name: "Carol Davis",
    email: "carol@example.com",
    phone: "+1 (555) 456-7890",
    status: "pending",
    joinDate: "2024-01-20",
    revenue: 0,
    location: "Chicago, IL"
  }
]

const sampleTransactions: TransactionData[] = [
  {
    id: "tx_001",
    amount: 250.00,
    type: "credit",
    date: "2024-01-20T10:30:00Z",
    description: "Payment received",
    status: "completed"
  },
  {
    id: "tx_002", 
    amount: -89.99,
    type: "debit",
    date: "2024-01-19T14:25:00Z",
    description: "Subscription renewal",
    status: "pending"
  },
  {
    id: "tx_003",
    amount: 1200.00,
    type: "credit", 
    date: "2024-01-18T09:15:00Z",
    description: "Invoice #12345",
    status: "failed"
  }
]

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const colors = {
    active: "bg-terminal-green/20 text-terminal-green border-terminal-green",
    inactive: "bg-terminal-gray/20 text-terminal-gray border-terminal-gray",
    pending: "bg-terminal-warning/20 text-terminal-warning border-terminal-warning",
    completed: "bg-terminal-green/20 text-terminal-green border-terminal-green",
    failed: "bg-terminal-danger/20 text-terminal-danger border-terminal-danger",
  }
  
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-terminal-mono rounded border uppercase ${colors[status as keyof typeof colors]}`}>
      {status}
    </span>
  )
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount)
}

// Format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short", 
    day: "numeric"
  })
}

export function ResponsiveTableDemo() {
  const [userSort, setUserSort] = React.useState<{key: string, direction: "asc" | "desc"}>()
  const [transactionSort, setTransactionSort] = React.useState<{key: string, direction: "asc" | "desc"}>()
  const [loading, setLoading] = React.useState(false)

  // User table columns
  const userColumns: ColumnDefinition<UserData>[] = [
    {
      key: "id",
      label: "ID",
      icon: Hash,
      sortable: true,
      className: "w-16",
    },
    {
      key: "name", 
      label: "Name",
      icon: User,
      sortable: true,
      render: (user) => (
        <div className="font-medium">{user.name}</div>
      )
    },
    {
      key: "email",
      label: "Email", 
      icon: Mail,
      sortable: true,
      cellClassName: "font-terminal-mono text-xs",
    },
    {
      key: "phone",
      label: "Phone",
      icon: Phone,
      cellClassName: "font-terminal-mono text-xs",
    },
    {
      key: "status",
      label: "Status",
      icon: Activity,
      sortable: true,
      render: (user) => <StatusBadge status={user.status} />
    },
    {
      key: "joinDate",
      label: "Join Date",
      icon: Calendar,
      sortable: true,
      render: (user) => formatDate(user.joinDate)
    },
    {
      key: "revenue",
      label: "Revenue",
      icon: DollarSign,
      sortable: true,
      render: (user) => (
        <span className="font-terminal-mono font-bold">
          {formatCurrency(user.revenue)}
        </span>
      )
    },
    {
      key: "location",
      label: "Location",
      icon: MapPin,
    }
  ]

  // Transaction table columns
  const transactionColumns: ColumnDefinition<TransactionData>[] = [
    {
      key: "id",
      label: "Transaction ID",
      icon: Hash,
      cellClassName: "font-terminal-mono text-xs",
    },
    {
      key: "amount",
      label: "Amount",
      icon: DollarSign,
      sortable: true,
      render: (tx) => (
        <span className={`font-terminal-mono font-bold ${
          tx.amount >= 0 ? "text-terminal-green" : "text-terminal-danger"
        }`}>
          {formatCurrency(Math.abs(tx.amount))}
        </span>
      )
    },
    {
      key: "type",
      label: "Type", 
      icon: Activity,
      sortable: true,
      render: (tx) => (
        <span className={`uppercase text-xs font-bold ${
          tx.type === "credit" ? "text-terminal-green" : "text-terminal-danger"
        }`}>
          {tx.type}
        </span>
      )
    },
    {
      key: "date",
      label: "Date",
      icon: Calendar,
      sortable: true,
      render: (tx) => formatDate(tx.date)
    },
    {
      key: "description",
      label: "Description",
      render: (tx) => (
        <span className="text-terminal-cyan">{tx.description}</span>
      )
    },
    {
      key: "status",
      label: "Status",
      icon: Activity,
      sortable: true,
      render: (tx) => <StatusBadge status={tx.status} />
    }
  ]

  const handleLoadingDemo = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-terminal-green font-terminal-mono">
          ResponsiveTable Demo
        </h2>
        <p className="text-terminal-gray">
          Resize your browser window to see the table transform into cards on mobile devices (< 768px).
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleLoadingDemo}
            className="px-4 py-2 bg-terminal-green/20 text-terminal-green border border-terminal-green hover:bg-terminal-green/30 transition-colors font-terminal-mono text-sm"
          >
            Demo Loading State
          </button>
        </div>
      </div>

      {/* User Table */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-terminal-cyan font-terminal-mono">
            Users Table
          </h3>
          <p className="text-sm text-terminal-gray">
            Sortable user data with status badges and formatted values
          </p>
        </div>
        
        <ResponsiveTable
          data={sampleUsers}
          columns={userColumns}
          sort={userSort}
          onSortChange={(key, direction) => setUserSort({ key, direction })}
          loading={loading}
          caption="User management table showing user information and status"
          emptyMessage="No users found"
        />
      </section>

      {/* Transaction Table */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-terminal-cyan font-terminal-mono">
            Transactions Table
          </h3>
          <p className="text-sm text-terminal-gray">
            Financial transaction data with color-coded amounts
          </p>
        </div>
        
        <ResponsiveTable
          data={sampleTransactions}
          columns={transactionColumns}
          sort={transactionSort}
          onSortChange={(key, direction) => setTransactionSort({ key, direction })}
          loading={loading}
          caption="Transaction history showing credits, debits, and status information"
          emptyMessage="No transactions found"
          cardClassName="hover:border-terminal-cyan"
        />
      </section>

      {/* Empty State Demo */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-terminal-cyan font-terminal-mono">
            Empty State
          </h3>
          <p className="text-sm text-terminal-gray">
            How the table looks with no data
          </p>
        </div>
        
        <ResponsiveTable
          data={[]}
          columns={userColumns}
          emptyMessage="No data to display"
        />
      </section>

      {/* Usage Instructions */}
      <section className="space-y-4 border-t border-terminal-green pt-6">
        <h3 className="text-lg font-bold text-terminal-cyan font-terminal-mono">
          Usage Instructions
        </h3>
        <div className="space-y-4 text-sm text-terminal-gray font-terminal-mono">
          <div>
            <h4 className="text-terminal-green font-bold mb-2">Desktop (≥768px):</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Full table layout with sortable columns</li>
              <li>Click column headers to sort (when sortable)</li>
              <li>Hover effects on rows and sortable headers</li>
              <li>Keyboard navigation support (Tab + Enter/Space)</li>
            </ul>
          </div>
          <div>
            <h4 className="text-terminal-green font-bold mb-2">Mobile (<768px):</h4>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Card-based layout for better readability</li>
              <li>Icon + Label + Value stacking pattern</li>
              <li>Empty values are automatically hidden</li>
              <li>Maintains terminal styling and hover effects</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ResponsiveTableDemo