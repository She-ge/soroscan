# GraphQL Code Generator Setup

This project uses GraphQL Code Generator to provide end-to-end type safety from the backend schema to the frontend components.

## What's Installed

- `@graphql-codegen/cli` - Core CLI tool
- `@graphql-codegen/typescript` - Generates TypeScript types from schema
- `@graphql-codegen/typescript-operations` - Generates types for queries/mutations
- `@graphql-codegen/client-preset` - Modern preset with best practices
- `graphql` - GraphQL core library

## Configuration

The setup is configured in `codegen.ts`:

- **Schema Source**: Uses `src/schema.graphql` by default (for development without backend)
- **Documents**: Scans `src/**/*.graphql`, `app/**/*.graphql`, `components/**/*.graphql`
- **Output**: Generates types in `src/generated/` directory

### Using Remote Backend

To generate types from your running backend, set the `GRAPHQL_ENDPOINT` environment variable:

```bash
GRAPHQL_ENDPOINT=http://localhost:8000/graphql/ pnpm run codegen
```

Or update `codegen.ts` to use the remote endpoint by default.

## Available Scripts

```bash
# Generate types once
pnpm run codegen

# Watch mode - regenerate on file changes
pnpm run codegen:watch

# Build (automatically runs codegen first)
pnpm run build
```

## Usage Example

### 1. Create a GraphQL query file

```graphql
# src/queries/GetEvents.graphql
query GetEvents($contractId: String!, $first: Int!) {
  events(contractId: $contractId, first: $first) {
    edges {
      node {
        id
        contractId
        eventType
        data
        createdAt
      }
    }
  }
}
```

### 2. Run codegen

```bash
pnpm run codegen
```

### 3. Use generated types

```typescript
import type { GetEventsQuery, GetEventsQueryVariables } from '@/generated/graphql';

// Fully typed variables
const variables: GetEventsQueryVariables = {
  contractId: 'contract-123',
  first: 10,
};

// Fully typed response handler
function handleData(data: GetEventsQuery) {
  data.events.edges.forEach((edge) => {
    console.log(edge.node.id); // TypeScript knows all properties
  });
}
```

## Generated Files

After running `pnpm run codegen`, you'll find:

- `src/generated/graphql.ts` - All TypeScript types and interfaces
- `src/generated/gql.ts` - Tagged template literal helper
- `src/generated/index.ts` - Main export file
- `src/generated/fragment-masking.ts` - Fragment masking utilities

## Type Safety Benefits

✅ No `any` types - everything is fully typed
✅ Autocomplete for all GraphQL fields
✅ Compile-time errors for invalid queries
✅ Refactoring safety - rename fields in schema, get TypeScript errors
✅ Documentation via types - hover to see field descriptions

## Workflow

1. Write GraphQL queries in `.graphql` files
1. Run `pnpm run codegen` to generate types
1. Import and use types in your components
1. TypeScript will catch any mismatches between queries and usage

## Updating Schema

When the backend schema changes:

1. Update `src/schema.graphql` (if using local schema)
1. Or run codegen with `GRAPHQL_ENDPOINT` pointing to backend
1. Run `pnpm run codegen`
1. Fix any TypeScript errors in your code

## IDE Support

The `.graphqlrc.yml` file provides IDE support for:

- Syntax highlighting in `.graphql` files
- Autocomplete for GraphQL queries
- Schema validation

Install the GraphQL extension for your IDE for the best experience.
