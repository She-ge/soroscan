"use client"

import * as React from "react"
import { ResponsiveTable, ColumnDefinition } from "../ResponsiveTable"
import { User, Calendar, DollarSign, Activity } from "lucide-react"

// Example: Basic usage with minimal setup
interface SimpleData {
  id: number
  name: string
  status: string
  amount: number
  date: string
}

const simpleData: SimpleData[] = [
  { id: 1, name: "John Doe", status: "active", amount: 100, date: "2024-01-20" },
  { id: 2, name: "Jane Smith", status: "pending", amount: 250, date: "2024-01-19" },
  { id: 3, name: "Bob Johnson", status: "inactive", amount: 75, date: "2024-01-18" },
]

export function BasicResponsiveTableExample() {
  const columns: ColumnDefinition<SimpleData>[] = [
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
      key: "status",
      label: "Status",
      icon: Activity,
      sortable: true,
    },
    {
      key: "amount",
      label: "Amount",
      icon: DollarSign,
      sortable: true,
      render: (item) => `$${item.amount.toFixed(2)}`,
    },
    {
      key: "date",
      label: "Date",
      icon: Calendar,
      sortable: true,
      render: (item) => new Date(item.date).toLocaleDateString(),
    },
  ]

  const [sort, setSort] = React.useState<{key: string, direction: "asc" | "desc"}>()

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-terminal-green font-terminal-mono mb-4">
        Basic ResponsiveTable Usage
      </h2>
      
      <ResponsiveTable
        data={simpleData}
        columns={columns}
        sort={sort}
        onSortChange={(key, direction) => setSort({ key, direction })}
        caption="Simple data table example"
      />
    </div>
  )
}

// Example: Advanced usage with custom rendering
interface AdvancedData {
  id: string
  user: {
    name: string
    email: string
    avatar?: string
  }
  transaction: {
    amount: number
    type: "credit" | "debit"
    currency: string
  }
  metadata: {
    createdAt: string
    updatedAt: string
    status: "completed" | "pending" | "failed"
  }
}

const advancedData: AdvancedData[] = [
  {
    id: "tx_001",
    user: {
      name: "Alice Cooper",
      email: "alice@example.com",
    },
    transaction: {
      amount: 150.75,
      type: "credit",
      currency: "USD",
    },
    metadata: {
      createdAt: "2024-01-20T10:30:00Z",
      updatedAt: "2024-01-20T10:35:00Z",
      status: "completed",
    },
  },
  {
    id: "tx_002",
    user: {
      name: "Bob Williams", 
      email: "bob@example.com",
    },
    transaction: {
      amount: 89.99,
      type: "debit",
      currency: "USD",
    },
    metadata: {
      createdAt: "2024-01-19T14:25:00Z",
      updatedAt: "2024-01-19T14:25:00Z", 
      status: "pending",
    },
  },
]

export function AdvancedResponsiveTableExample() {
  const columns: ColumnDefinition<AdvancedData>[] = [
    {
      key: "id",
      label: "Transaction ID",
      icon: User,
      cellClassName: "font-terminal-mono text-xs",
    },
    {
      key: "user",
      label: "User",
      icon: User,
      render: (item) => (
        <div>
          <div className="font-medium">{item.user.name}</div>
          <div className="text-xs text-terminal-gray">{item.user.email}</div>
        </div>
      ),
    },
    {
      key: "transaction",
      label: "Amount",
      icon: DollarSign,
      sortable: true,
      render: (item) => (
        <div className={`font-terminal-mono font-bold ${
          item.transaction.type === "credit" ? "text-terminal-green" : "text-terminal-danger"
        }`}>
          {item.transaction.type === "credit" ? "+" : "-"}
          ${item.transaction.amount.toFixed(2)}
        </div>
      ),
    },
    {
      key: "metadata",
      label: "Status",
      icon: Activity,
      sortable: true,
      render: (item) => {
        const colors = {
          completed: "bg-terminal-green/20 text-terminal-green border-terminal-green",
          pending: "bg-terminal-warning/20 text-terminal-warning border-terminal-warning",
          failed: "bg-terminal-danger/20 text-terminal-danger border-terminal-danger",
        }
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-terminal-mono rounded border uppercase ${
            colors[item.metadata.status]
          }`}>
            {item.metadata.status}
          </span>
        )
      },
    },
    {
      key: "createdAt",
      label: "Created",
      icon: Calendar,
      sortable: true,
      render: (item) => new Date(item.metadata.createdAt).toLocaleDateString(),
    },
  ]

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-terminal-green font-terminal-mono mb-4">
        Advanced ResponsiveTable Usage
      </h2>
      
      <ResponsiveTable
        data={advancedData}
        columns={columns}
        caption="Advanced transaction data with nested objects and custom rendering"
      />
    </div>
  )
}

// Export both examples
export default function ResponsiveTableUsageExamples() {
  return (
    <div className="space-y-8">
      <BasicResponsiveTableExample />
      <AdvancedResponsiveTableExample />
    </div>
  )
}