# Contract Management Interface

This module provides a complete UI for managing tracked contracts in Soroscan.

## Features

- **Contract List Page** (`/contracts`) - View all tracked contracts with status indicators
- **Register Contract Modal** - Form to add new contracts with validation
- **Contract Detail Page** (`/contracts/[id]`) - View and edit contract details
- **Delete Confirmation** - Safe deletion with confirmation dialog
- **Backfill Trigger** - Launch background tasks to backfill contract events

## File Structure

```
app/contracts/
├── page.tsx                          # Contract list page
├── [id]/
│   ├── page.tsx                      # Contract detail page
│   └── components/
│       ├── ContractForm.tsx          # Edit form component
│       └── BackfillModal.tsx         # Backfill task status modal
└── components/
    ├── ContractTable.tsx             # Contract list table
    ├── RegisterModal.tsx             # Registration form modal
    └── DeleteConfirmModal.tsx        # Delete confirmation dialog

components/ingest/
├── contract-types.ts                 # TypeScript interfaces
└── contract-graphql.ts               # GraphQL queries and mutations
```

## GraphQL Operations

The following GraphQL operations need to be implemented in the backend:

### Queries

- `contracts` - List all tracked contracts
- `contract(id: String!)` - Get single contract by ID

### Mutations

- `registerContract(input: ContractInput!)` - Register new contract
- `updateContract(id: String!, input: ContractInput!)` - Update contract details
- `deleteContract(id: String!)` - Delete contract
- `triggerBackfill(contractId: String!)` - Trigger backfill task

### Types

```graphql
type Contract {
  id: String!
  contractId: String!
  name: String!
  description: String
  tags: [String!]
  status: String!
  eventCount: Int!
  createdAt: String!
  updatedAt: String!
}

input ContractInput {
  contractId: String!
  name: String!
  description: String
  tags: [String!]
  status: String!
}

type BackfillTask {
  taskId: String!
  contractId: String!
  status: String!
  progress: Int
  message: String
}
```

## Usage

### Navigate to Contract List

```
http://localhost:3000/contracts
```

### Register a New Contract

1. Click "Register Contract" button
1. Fill in Contract ID (required)
1. Fill in Name (required)
1. Optionally add Description, Tags, and set Status
1. Click "REGISTER"

### View Contract Details

Click on any row in the contract table to view details.

### Edit Contract

1. Navigate to contract detail page
1. Click "Edit Contract"
1. Modify fields
1. Click "SAVE CHANGES"

### Trigger Backfill

1. Navigate to contract detail page
1. Click "Trigger Backfill"
1. View task status in modal

### Delete Contract

1. Click "Delete" button in contract table
1. Confirm deletion in modal

## Styling

All components use the terminal UI system with:

- Terminal green (`#00ff41`) for primary actions
- Terminal cyan (`#00d4ff`) for labels and accents
- Terminal danger (`#ff3366`) for delete actions
- JetBrains Mono font for terminal aesthetic
- Glow effects on hover
- Box-drawing corners on cards and modals

## Acceptance Criteria

✅ Contract list displays all tracked contracts  
✅ Event count shown per contract  
✅ "Register Contract" form validates input  
✅ Edit form updates contract details  
✅ Delete shows confirmation dialog  
✅ Backfill button triggers task, shows task ID  
✅ Status indicator shows if contract is active  
✅ Terminal styling applied throughout
