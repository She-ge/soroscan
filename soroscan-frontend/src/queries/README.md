# GraphQL Queries

This directory contains GraphQL query and mutation definitions.

## Usage

1. Create `.graphql` files with your queries/mutations
1. Run `pnpm run codegen` to generate TypeScript types
1. Import generated types from `src/generated/graphql.ts`

## Example

```graphql
# GetEvents.graphql
query GetEvents($contractId: String!, $first: Int!) {
  events(contractId: $contractId, first: $first) {
    edges {
      node {
        id
        contractId
        eventType
      }
    }
  }
}
```

Generated types will be available in `src/generated/graphql.ts`:

- `GetEventsQuery` - Query result type
- `GetEventsQueryVariables` - Query variables type

## Commands

- `pnpm run codegen` - Generate types once
- `pnpm run codegen:watch` - Watch mode for development
