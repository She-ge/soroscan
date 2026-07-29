# Apollo Client Integration - Quick Start

## 🚀 Quick Start

Apollo Client is now integrated and ready to use!

### 1. Environment Setup

Create `.env.local`:
```env
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:8000/graphql/
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Basic Usage

```typescript
import { gql, useQuery } from '@apollo/client';

const GET_DATA = gql`
  query GetData {
    contracts {
      id
      name
    }
  }
`;

function MyComponent() {
  const { data, loading, error } = useQuery(GET_DATA);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{/* render data */}</div>;
}
```

### 3. Authentication

```typescript
// After login
localStorage.setItem('access_token', yourJwtToken);

// Apollo Client automatically adds it to all requests
```

## 📚 Documentation

- **Technical Details**: `lib/apollo-client.README.md`
- **Integration Guide**: `APOLLO_INTEGRATION.md`
- **Implementation Summary**: `../docs/architecture/frontend/APOLLO_CLIENT_IMPLEMENTATION.md`

## ✅ Status

- All CI checks passing
- 38 tests passing
- Production build successful
- Ready for use

## 🧪 Test Connection

Add this to any page to test:

```typescript
import { ApolloTestComponent } from '@/components/apollo/ApolloTestComponent';

export default function TestPage() {
  return <ApolloTestComponent />;
}
```

## 🔧 Custom Hooks

```typescript
import { useGraphQLQuery } from '@/lib/hooks/useGraphQL';

const { data, isLoading, isError } = useGraphQLQuery(MY_QUERY);
```

## 📦 What's Included

- ✅ Apollo Client with caching
- ✅ JWT authentication
- ✅ Error handling & retry logic
- ✅ DevTools integration
- ✅ Type-safe hooks
- ✅ CORS configured

## 🎯 Next Steps

1. Create your GraphQL queries in `src/queries/`
2. Use `useQuery` and `useMutation` hooks
3. Check Apollo DevTools in browser
4. See full docs for advanced usage

## 🐛 Troubleshooting

**Connection Error?**
- Check backend is running: `http://localhost:8000/graphql/`
- Verify CORS in Django settings
- Check `.env.local` configuration

**Auth Error?**
- Verify token: `localStorage.getItem('access_token')`
- Check token format (should be JWT)

For more help, see `APOLLO_INTEGRATION.md`
