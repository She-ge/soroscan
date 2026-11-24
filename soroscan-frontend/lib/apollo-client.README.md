# Apollo Client Setup

This directory contains the Apollo Client configuration for consuming the Django Strawberry GraphQL endpoint.

## Overview

Apollo Client is configured with:

- **HTTP Link**: Connects to the backend GraphQL endpoint
- **Auth Link**: Automatically adds JWT tokens to request headers
- **Error Link**: Handles and logs GraphQL and network errors
- **Retry Link**: Retries failed requests with exponential backoff
- **InMemoryCache**: Caches query results for optimal performance

## Configuration

### Environment Variables

Create a `.env.local` file in the frontend root:

```env
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:8000/graphql/
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production:

```env
NEXT_PUBLIC_GRAPHQL_URL=https://api.soroscan.io/graphql/
NEXT_PUBLIC_API_URL=https://api.soroscan.io
```

### Authentication

The Apollo Client automatically:

1. Reads JWT token from `localStorage.getItem('access_token')`
1. Adds it to the `Authorization` header as `Bearer <token>`
1. Handles token expiration by clearing invalid tokens
1. Supports token refresh (to be implemented with backend Issue #2)

## Usage

### Basic Query Example

```typescript
import { gql, useQuery } from '@apollo/client';

const GET_EVENTS = gql`
  query GetEvents($limit: Int) {
    events(limit: $limit) {
      id
      contractId
      eventType
      timestamp
    }
  }
`;

function EventsList() {
  const { data, loading, error } = useQuery(GET_EVENTS, {
    variables: { limit: 10 }
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data.events.map(event => (
        <li key={event.id}>{event.eventType}</li>
      ))}
    </ul>
  );
}
```

### Using Custom Hooks

```typescript
import { useGraphQLQuery } from '@/lib/hooks/useGraphQL';
import { gql } from '@apollo/client';

const GET_EVENTS = gql`
  query GetEvents {
    events {
      id
      eventType
    }
  }
`;

function EventsList() {
  const { data, isLoading, isError, error } = useGraphQLQuery(GET_EVENTS);

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error?.message}</div>;

  return <div>{/* render events */}</div>;
}
```

### Mutation Example

```typescript
import { gql, useMutation } from '@apollo/client';

const CREATE_WEBHOOK = gql`
  mutation CreateWebhook($input: WebhookInput!) {
    createWebhook(input: $input) {
      id
      url
      isActive
    }
  }
`;

function CreateWebhookForm() {
  const [createWebhook, { loading, error }] = useMutation(CREATE_WEBHOOK);

  const handleSubmit = async (formData) => {
    try {
      const { data } = await createWebhook({
        variables: { input: formData }
      });
      console.log('Webhook created:', data.createWebhook);
    } catch (err) {
      console.error('Failed to create webhook:', err);
    }
  };

  return <form onSubmit={handleSubmit}>{/* form fields */}</form>;
}
```

## Features

### Error Handling

The client automatically:

- Logs all GraphQL errors with location and path information
- Logs network errors with status codes
- Clears invalid authentication tokens
- Provides user-friendly error messages

### Retry Logic

Failed requests are automatically retried:

- Initial delay: 300ms
- Maximum delay: 3000ms
- Maximum attempts: 3
- Only retries network errors (not GraphQL errors)
- Uses jitter to prevent thundering herd

### Caching

InMemoryCache is configured with:

- Type policies for pagination
- Cache-and-network fetch policy for real-time data
- Automatic cache updates on mutations

### DevTools

Apollo DevTools are enabled in development mode:

1. Install
   [Apollo Client DevTools](https://chrome.google.com/webstore/detail/apollo-client-devtools/jdkknkkbebbapilgoeccciglkfbmbnfm)
   browser extension
1. Open browser DevTools
1. Navigate to "Apollo" tab
1. Inspect queries, mutations, and cache

## CORS Configuration

Ensure the Django backend has CORS enabled for the frontend origin:

```python
# django-backend/soroscan/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://soroscan.io",
]
CORS_ALLOW_CREDENTIALS = True
```

## Testing

To test the Apollo Client connection:

1. Start the Django backend:

   ```bash
   cd django-backend
   python manage.py runserver
   ```

1. Start the frontend:

   ```bash
   cd soroscan-frontend
   npm run dev
   ```

1. Open browser DevTools → Apollo tab
1. Execute a test query
1. Verify the request appears in Network tab

## Troubleshooting

### "Network error: Failed to fetch"

- Check that backend is running on `http://localhost:8000`
- Verify CORS is configured correctly
- Check browser console for CORS errors

### "Authentication token invalid"

- Token may be expired
- Check `localStorage.getItem('access_token')`
- Implement token refresh logic

### Queries not updating

- Check cache configuration
- Use `refetchQueries` option in mutations
- Consider using `fetchPolicy: 'network-only'`

## Next Steps

- [ ] Implement token refresh logic (backend Issue #2)
- [ ] Add GraphQL type generation (FE-5)
- [ ] Create reusable query/mutation hooks
- [ ] Add optimistic UI updates
- [ ] Implement subscription support for real-time events
