# GraphQL Advanced Queries

## Goal

Use GraphQL to fetch specifically shaped data, combining events and contract details in a single request.

## Prerequisites

- An HTTP client or GraphQL client (like Apollo).
- A valid SoroScan API key.

## Code

```typescript
const query = `
  query GetContractWithEvents($id: String!) {
    contract(id: $id) {
      name
      stats {
        totalEvents
      }
      events(first: 5) {
        edges {
          node {
            type
            ledger
          }
        }
      }
    }
  }
`;

const res = await fetch("https://api.soroscan.io/graphql/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer your_api_key",
  },
  body: JSON.stringify({ query, variables: { id: "CCAAA..." } }),
});
const data = await res.json();
console.log(data);
```

## Expected Output

```json
{
  "data": {
    "contract": {
      "name": "MyToken",
      "stats": { "totalEvents": 1200 },
      "events": {
        "edges": [{ "node": { "type": "transfer", "ledger": 123456 } }]
      }
    }
  }
}
```

## Error Handling

If a query is malformed, GraphQL returns a `200 OK` status with an `errors` array in the JSON response. Always check
`if (data.errors)` before using the data.
