# Migrate from REST to GraphQL

## Goal

Transition a data-fetching workflow from making multiple REST API calls to a single GraphQL query for improved
efficiency.

## Prerequisites

- Existing REST implementation.
- Basic understanding of GraphQL schemas.

## Code

**Old REST Approach:**

```typescript
// 1. Fetch Contract
const contract = await client.getContract("CCAAA...");
// 2. Fetch Stats
const stats = await client.getContractStats("CCAAA...");
// 3. Fetch Events
const events = await client.getEvents({ contractId: "CCAAA..." });
```

**New GraphQL Approach:**

```graphql
query MigrateRestToGql {
  contract(id: "CCAAA...") {
    id
    name
    stats {
      totalEvents
    }
    events(first: 50) {
      edges {
        node {
          ledger
          type
        }
      }
    }
  }
}
```

## Expected Output

Both approaches yield the same data, but the GraphQL approach requires exactly 1 network roundtrip instead of 3,
drastically reducing latency on mobile networks.

## Error Handling

GraphQL structural errors are returned in an `errors` array in the response body. If you misspell a field, the server
will tell you the valid fields available on that type.
