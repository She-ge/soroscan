# Using the SoroScan GraphQL API with Apollo Client

This guide explains how to query the SoroScan GraphQL API from React applications using Apollo Client. It covers client
setup, querying contracts and events, working with invocation data, generating TypeScript types, pagination,
authentication, and error handling.

## Prerequisites

Before following this guide, you should have:

- Node.js installed;
- a React or Next.js application;
- access to a running SoroScan backend;
- basic familiarity with GraphQL queries;
- `pnpm` installed when working inside the SoroScan frontend.

For local SoroScan development, the GraphQL endpoint is:

```text
http://localhost:8000/graphql/
```

The SoroScan frontend reads the endpoint from the `NEXT_PUBLIC_GRAPHQL_URL` environment variable and falls back to the
local endpoint above when the variable is not set.

## Apollo Client in the SoroScan Frontend

The SoroScan frontend already includes Apollo Client.

The main client configuration is located at:

```text
soroscan-frontend/lib/apollo-client.ts
```

The application-level provider is located at:

```text
soroscan-frontend/providers/ApolloProvider.tsx
```

The existing client provides:

- an HTTP connection to the GraphQL API;
- JWT authentication headers;
- session cookie support;
- centralized GraphQL and network error handling;
- token refresh handling for authentication failures;
- retries for transient network failures;
- Apollo `InMemoryCache`;
- WebSocket support for GraphQL subscriptions when configured;
- Apollo DevTools in development.

When contributing to the existing SoroScan frontend, reuse this client instead of creating another `ApolloClient`
instance.

## Environment Configuration

Create or update `soroscan-frontend/.env.local`:

```env
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:8000/graphql/
NEXT_PUBLIC_API_URL=http://localhost:8000
```

If subscriptions are required, also configure the WebSocket endpoint used by the frontend:

```env
NEXT_PUBLIC_WS_URL=ws://localhost:8000/graphql/
```

Do not commit secrets, JWTs, API keys, or other credentials to `.env.local` or source-controlled files.

## Installing Apollo Client in Another React Application

If you are integrating SoroScan into a separate React application, install Apollo Client and GraphQL:

```bash
pnpm add @apollo/client graphql
```

With npm:

```bash
npm install @apollo/client graphql
```

A minimal client can be configured as follows:

```tsx
import { ApolloClient, ApolloProvider, HttpLink, InMemoryCache } from "@apollo/client";
import type { ReactNode } from "react";

const client = new ApolloClient({
  link: new HttpLink({
    uri: "http://localhost:8000/graphql/",
    credentials: "include",
  }),
  cache: new InMemoryCache(),
});

export function GraphQLProvider({ children }: { children: ReactNode }) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
```

For the SoroScan repository itself, use the existing client in `soroscan-frontend/lib/apollo-client.ts` rather than
copying this minimal configuration.

## Querying Events

SoroScan exposes an `events` GraphQL query with cursor-based pagination and filters such as contract ID, event type,
signature status, ledger range, and timestamp range.

A basic query for contract events is:

```graphql
query GetEvents($contractId: String, $first: Int!, $after: String) {
  events(contractId: $contractId, first: $first, after: $after) {
    totalCount
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      cursor
      node {
        id
        contractId
        contractName
        eventType
        ledger
        eventIndex
        timestamp
        txHash
        payload
        decodedPayload
        decodingStatus
        validationStatus
        signatureStatus
      }
    }
  }
}
```

Example variables:

```json
{
  "contractId": "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM",
  "first": 20,
  "after": null
}
```

You can add event filters when required:

```graphql
query GetFilteredEvents($contractId: String, $eventType: String, $fromLedger: Int, $toLedger: Int, $first: Int!) {
  events(contractId: $contractId, eventType: $eventType, fromLedger: $fromLedger, toLedger: $toLedger, first: $first) {
    totalCount
    edges {
      node {
        id
        contractId
        eventType
        ledger
        timestamp
        txHash
        payload
      }
    }
  }
}
```

When using ledger filtering, provide both `fromLedger` and `toLedger`. The backend validates the range and rejects a
range where `fromLedger` is greater than `toLedger`.

### Using the Events Query in React

```tsx
"use client";

import { gql, useQuery } from "@apollo/client";

const GET_EVENTS = gql`
  query GetEvents($contractId: String, $first: Int!, $after: String) {
    events(contractId: $contractId, first: $first, after: $after) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          contractId
          contractName
          eventType
          ledger
          timestamp
          txHash
          payload
        }
      }
    }
  }
`;

export function ContractEvents({ contractId }: { contractId: string }) {
  const { data, loading, error, refetch } = useQuery(GET_EVENTS, {
    variables: {
      contractId,
      first: 20,
      after: null,
    },
  });

  if (loading && !data) {
    return <p>Loading events...</p>;
  }

  if (error && !data) {
    return (
      <div role="alert">
        <p>Unable to load events.</p>
        <button type="button" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <ul>
      {data?.events.edges.map(({ node }: any) => (
        <li key={node.id}>
          {node.eventType} — ledger {node.ledger}
        </li>
      ))}
    </ul>
  );
}
```

For production code in the SoroScan frontend, prefer generated TypeScript types rather than using `any`. Type generation
is covered later in this guide.

## Cursor-Based Pagination

The `events` query returns:

- `totalCount` — total number of matching events;
- `pageInfo.hasNextPage` — whether another page is available;
- `pageInfo.endCursor` — cursor to send as the next `after` value;
- an `edges` array containing each result and its cursor.

A simple pagination flow is:

1. Query events with an initial `first` value.
1. Read `pageInfo.endCursor`.
1. If `hasNextPage` is `true`, send the cursor as the next `after` variable.
1. Continue until `hasNextPage` becomes `false`.

Example:

```tsx
const { data, fetchMore } = useQuery(GET_EVENTS, {
  variables: {
    contractId,
    first: 20,
    after: null,
  },
});

async function loadMore() {
  const pageInfo = data?.events.pageInfo;

  if (!pageInfo?.hasNextPage || !pageInfo.endCursor) {
    return;
  }

  await fetchMore({
    variables: {
      contractId,
      first: 20,
      after: pageInfo.endCursor,
    },
  });
}
```

The SoroScan Apollo cache already contains a merge policy for the `events` field. Reuse the existing application client
when working within the repository so pagination follows the application's configured cache behavior.

## Querying Contracts

The SoroScan GraphQL API exposes both `contracts` and `contract`.

Use `contracts` to retrieve tracked contracts:

```graphql
query GetContracts($isActive: Boolean, $alias: String) {
  contracts(isActive: $isActive, alias: $alias) {
    id
    contractId
    name
    alias
    description
    isActive
    lastEventAt
    createdAt
    eventCount
    verificationStatus
    teamId
    organizationId
  }
}
```

Example variables:

```json
{
  "isActive": true,
  "alias": null
}
```

Use `contract` when you know the Soroban contract ID:

```graphql
query GetContract($contractId: String!) {
  contract(contractId: $contractId) {
    id
    contractId
    name
    alias
    description
    isActive
    lastEventAt
    createdAt
    eventCount
    verificationStatus
  }
}
```

Example variables:

```json
{
  "contractId": "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM"
}
```

### Using the Contracts Query in React

```tsx
"use client";

import { gql, useQuery } from "@apollo/client";

const GET_CONTRACTS = gql`
  query GetContracts($isActive: Boolean) {
    contracts(isActive: $isActive) {
      id
      contractId
      name
      alias
      isActive
      eventCount
    }
  }
`;

export function ContractList() {
  const { data, loading, error, refetch } = useQuery(GET_CONTRACTS, {
    variables: {
      isActive: true,
    },
  });

  if (loading && !data) {
    return <p>Loading contracts...</p>;
  }

  if (error && !data) {
    return (
      <div role="alert">
        <p>Unable to load contracts.</p>
        <button type="button" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <ul>
      {data?.contracts.map((contract: any) => (
        <li key={contract.id}>{contract.alias || contract.name || contract.contractId}</li>
      ))}
    </ul>
  );
}
```

## Working with Contract Invocations

The backend currently defines GraphQL types for contract invocation data, including:

- invocation ID;
- contract ID;
- contract name;
- transaction hash;
- caller;
- function name;
- parameters;
- result;
- ledger sequence;
- creation timestamp;
- events associated with an invocation.

The invocation GraphQL type has the following query shape when exposed through an invocation connection:

```graphql
query GetInvocations($contractId: String!, $first: Int!, $after: String) {
  invocations(contractId: $contractId, first: $first, after: $after) {
    totalCount
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      cursor
      node {
        id
        contractId
        contractName
        txHash
        caller
        functionName
        parameters
        result
        ledgerSequence
        createdAt
        events {
          id
          contractId
          eventType
          ledger
          timestamp
          txHash
          payload
        }
      }
    }
  }
}
```

> **Current schema note:** The SoroScan backend defines `InvocationType`, `InvocationEdge`, and `InvocationConnection`,
> but the current `Query` root does not expose an `invocations` resolver. The query above documents the invocation query
> shape expected when that resolver is available. Check the running GraphQL schema before adding this operation to
> code-generated frontend documents. Do not add or modify a backend resolver solely as part of this guide.

GraphQL Code Generator validates operations against the selected schema. Therefore, an invocation operation must not be
added to a `.graphql` file used by code generation until the active schema exposes the corresponding root query.

You can inspect the running schema through the SoroScan GraphQL endpoint to determine which invocation operations are
currently available.

## TypeScript Type Generation

The SoroScan frontend uses GraphQL Code Generator to create TypeScript types and Apollo hooks.

The configuration is located at:

```text
soroscan-frontend/codegen.ts
```

GraphQL documents are discovered from:

```text
src/**/*.graphql
app/**/*.graphql
components/**/*.graphql
```

Generated files are written under:

```text
soroscan-frontend/src/generated/
```

### 1. Install Frontend Dependencies

From the repository root:

```bash
cd soroscan-frontend
pnpm install
```

### 2. Create a GraphQL Operation

For example:

```text
soroscan-frontend/src/queries/GetContractEvents.graphql
```

```graphql
query GetContractEvents($contractId: String, $first: Int!, $after: String) {
  events(contractId: $contractId, first: $first, after: $after) {
    totalCount
    pageInfo {
      hasNextPage
      endCursor
    }
    edges {
      node {
        id
        contractId
        contractName
        eventType
        ledger
        timestamp
        txHash
        payload
      }
    }
  }
}
```

### 3. Generate Types Using the Local Schema

The codegen configuration uses:

```text
src/schema.graphql
```

by default.

Run:

```bash
pnpm run codegen
```

For continuous generation while editing GraphQL documents:

```bash
pnpm run codegen:watch
```

### 4. Generate Types from a Running Backend

The local `src/schema.graphql` file is intended to support development when a backend is unavailable and may not always
contain every field available in the current backend.

When the backend is running, prefer generating against the live schema.

On Bash, Git Bash, Linux, or macOS:

```bash
GRAPHQL_ENDPOINT=http://localhost:8000/graphql/ pnpm run codegen
```

On PowerShell:

```powershell
$env:GRAPHQL_ENDPOINT="http://localhost:8000/graphql/"
pnpm run codegen
```

This validates GraphQL operations against the schema served by the running SoroScan backend.

### 5. Generated Output

The current configuration generates:

```text
src/generated/
src/generated/legacy-types.ts
src/generated/apollo-hooks.ts
```

The generated output includes:

- schema TypeScript types;
- operation result types;
- operation variable types;
- typed GraphQL documents;
- generated Apollo React hooks.

Do not manually edit generated files. Change the schema or GraphQL operation and run codegen again.

### 6. Use a Generated Hook

After creating an operation and running codegen, generated Apollo hooks can be used instead of manually typing the
response.

For an operation named `GetContractEvents`, the generated hook can be imported from the generated Apollo hooks file:

```tsx
"use client";

import { useGetContractEventsQuery } from "@/src/generated/apollo-hooks";

export function ContractEvents({ contractId }: { contractId: string }) {
  const { data, loading, error, refetch } = useGetContractEventsQuery({
    variables: {
      contractId,
      first: 20,
      after: null,
    },
  });

  if (loading && !data) {
    return <p>Loading events...</p>;
  }

  if (error && !data) {
    return (
      <div role="alert">
        <p>Unable to load events.</p>
        <button type="button" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <ul>
      {data?.events.edges.map(({ node }) => (
        <li key={node.id}>
          {node.eventType} — ledger {node.ledger}
        </li>
      ))}
    </ul>
  );
}
```

Always run code generation again after changing:

- GraphQL operations;
- fragments;
- backend GraphQL fields;
- GraphQL argument types;
- schema types.

The frontend build also runs code generation before the Next.js build.

## Authentication

The SoroScan frontend's existing Apollo client reads the current access token and adds it to GraphQL requests as a
bearer token:

```text
Authorization: Bearer <token>
```

It also sends cookies with requests.

When the backend reports an authentication failure, the existing client attempts to refresh the access token. If refresh
fails, stored authentication tokens are cleared and browser users are redirected to the login page.

When working inside SoroScan, use this existing authentication flow rather than manually adding authorization headers to
each query.

For an external React application, authentication headers can be added with an Apollo Link:

```tsx
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, from } from "@apollo/client";

const httpLink = new HttpLink({
  uri: "http://localhost:8000/graphql/",
  credentials: "include",
});

const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem("access_token");

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      ...(token
        ? {
            authorization: `Bearer ${token}`,
          }
        : {}),
    },
  }));

  return forward(operation);
});

export const client = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
});
```

Never log authentication tokens or include them in committed examples.

## Error Handling Best Practices

GraphQL applications need to account for both GraphQL errors and transport-level network errors.

The SoroScan Apollo client already provides centralized handling through an Apollo error link and a retry link.
Components should still provide useful user-facing states.

### Handle Loading, Error, and Data States

Do not assume that `error` means that no usable data was returned.

The SoroScan client uses an `errorPolicy` that can allow partial data to be returned together with GraphQL errors.

Prefer:

```tsx
const { data, loading, error, refetch } = useQuery(GET_EVENTS, {
  variables,
});

if (loading && !data) {
  return <p>Loading events...</p>;
}

if (error && !data) {
  return (
    <div role="alert">
      <p>Unable to load events.</p>
      <button type="button" onClick={() => refetch()}>
        Try again
      </button>
    </div>
  );
}
```

If partial data is safe and useful, render it while separately showing an appropriate warning.

### Distinguish GraphQL Errors from Network Failures

A GraphQL request can reach the server successfully but still return GraphQL errors, for example because of:

- an invalid query;
- invalid variables;
- authentication or authorization failures;
- resolver validation;
- unavailable fields.

Network errors include cases such as:

- the API server being unavailable;
- DNS or connectivity failures;
- connection timeouts;
- proxy failures.

Do not retry invalid GraphQL operations repeatedly. Fix the operation or input instead.

### Retry Only Transient Failures

The SoroScan client uses `RetryLink` for transient network failures.

Its retry configuration uses:

- an initial delay;
- exponential-style delay growth with jitter;
- a maximum delay;
- a limited number of attempts.

Avoid adding component-level automatic retry loops on top of the global retry behavior. This can generate duplicate
requests and unnecessary backend load.

A manual **Try again** action is appropriate when a user should decide whether to retry.

### Handle Authentication Centrally

Do not implement separate token-refresh logic in individual React components.

The existing SoroScan Apollo client handles authentication failures centrally and attempts token refresh before
replaying the request.

Keeping authentication handling in one place prevents inconsistent behavior across components.

### Show Safe Error Messages

Avoid displaying raw backend error details directly to end users when they may contain implementation information.

Prefer a user-facing message such as:

```text
Unable to load contract events. Please try again.
```

Detailed errors can be logged for development or observability where appropriate.

Never log:

- access tokens;
- refresh tokens;
- API keys;
- secrets;
- sensitive request headers.

Be careful when logging event payloads because contract data may contain application-specific information.

### Validate Variables Before Sending Requests

Validate required values before executing queries.

For example, avoid requesting a contract-specific query when the contract ID is empty:

```tsx
const { data, loading, error } = useQuery(GET_CONTRACT, {
  variables: {
    contractId,
  },
  skip: !contractId,
});
```

For event ledger filtering, send both ends of the range and ensure the lower ledger is not greater than the upper
ledger.

### Keep Queries Focused

GraphQL allows clients to request deeply nested data, but that does not mean every component should request everything.

Select only fields required by the component.

Smaller operations:

- reduce response size;
- make generated types easier to understand;
- reduce unnecessary backend work;
- make caching behavior easier to reason about.

The backend also includes GraphQL query-complexity and N+1 detection protections, so clients should avoid unnecessarily
complex operations.

## Recommended Development Workflow

For a new React feature using SoroScan GraphQL:

1. Confirm the required field exists in the running GraphQL schema.
1. Create or update a `.graphql` operation under a directory scanned by `codegen.ts`.
1. Keep the query limited to the fields required by the feature.
1. Run GraphQL Code Generator.
1. Use the generated TypeScript types or Apollo hooks.
1. Implement loading, partial-data, empty, and error states.
1. Test authentication-dependent queries with the correct user session.
1. Test pagination when querying collections.
1. Run frontend linting and tests before opening a pull request.

Useful commands from `soroscan-frontend/` are:

```bash
pnpm run codegen
pnpm run lint
pnpm run test
pnpm run build
```

## Troubleshooting

### `Failed to fetch`

Check that:

- the Django backend is running;
- `NEXT_PUBLIC_GRAPHQL_URL` points to the correct endpoint;
- the GraphQL endpoint includes `/graphql/`;
- CORS configuration allows the frontend origin;
- the browser can reach the backend.

### GraphQL Code Generator Reports an Unknown Field

The operation and selected schema do not match.

If the backend is running, generate against the live endpoint:

```bash
GRAPHQL_ENDPOINT=http://localhost:8000/graphql/ pnpm run codegen
```

If you intentionally use the local schema, update `src/schema.graphql` so it reflects the fields required by your
operation.

Do not bypass schema validation by weakening generated types.

### `Cannot query field "invocations" on type "Query"`

The current backend defines invocation GraphQL types but does not currently expose an `invocations` field on the root
`Query`.

Confirm the active schema before using the invocation sample in an executable `.graphql` document.

### Authentication Errors

Check that:

- the user is signed in;
- the access token is valid;
- the backend authentication service is available;
- refresh-token handling is succeeding.

Inside the SoroScan frontend, allow the existing Apollo error link to perform token refresh instead of duplicating the
refresh logic in the component.

### Stale Data

The existing SoroScan Apollo client uses configured fetch policies and an `InMemoryCache`.

If data appears stale:

1. confirm that the backend response has changed;
1. inspect Apollo Client DevTools during development;
1. use `refetch()` when a user explicitly needs fresh data;
1. avoid clearing the entire cache unless there is a specific reason.

## Related Files

The following repository files provide additional implementation details:

```text
soroscan-frontend/lib/apollo-client.ts
soroscan-frontend/providers/ApolloProvider.tsx
soroscan-frontend/codegen.ts
soroscan-frontend/GRAPHQL_CODEGEN_SETUP.md
soroscan-frontend/README_APOLLO.md
soroscan-frontend/src/queries/
soroscan-frontend/src/generated/
django-backend/soroscan/ingest/schema.py
```

Use the running GraphQL schema as the source of truth when an example or local development schema differs from the
backend.
