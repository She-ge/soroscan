/**
 * Tests for GraphQL Code Generator setup (#769)
 *
 * These tests verify:
 * - Generated types exist and have correct shapes (no `any`)
 * - Apollo hooks are generated for all queries, mutations, and subscriptions
 * - Type safety: variables and result types are fully typed
 * - Example usage patterns compile and work correctly
 */

// ── Generated type imports ─────────────────────────────────────────────────
import type {
  // Schema types
  Event,
  EventConnection,
  EventEdge,
  ContractEvent,
  AuthPayload,
  User,
  SystemMetrics,
  ErrorLog,
  // Query types
  GetEventsQuery,
  GetEventsQueryVariables,
  GetSystemMetricsQuery,
  GetSystemMetricsQueryVariables,
  // Mutation types
  LoginMutation,
  LoginMutationVariables,
  RefreshTokenMutation,
  RefreshTokenMutationVariables,
  // Subscription types
  OnContractEventSubscription,
  OnContractEventSubscriptionVariables,
  // Utility types
  Maybe,
  Scalars,
} from '../src/generated/graphql';

// ── Apollo hook imports ────────────────────────────────────────────────────
import {
  // Query hooks
  useGetEventsQuery,
  useGetEventsLazyQuery,
  useGetSystemMetricsQuery,
  useGetSystemMetricsLazyQuery,
  // Mutation hooks
  useLoginMutation,
  useRefreshTokenMutation,
  // Subscription hook
  useOnContractEventSubscription,
  // Document nodes
  GetEventsDocument,
  GetSystemMetricsDocument,
  LoginDocument,
  RefreshTokenDocument,
  OnContractEventDocument,
  // Return type aliases
  type GetEventsQueryHookResult,
  type GetEventsLazyQueryHookResult,
  type GetSystemMetricsQueryHookResult,
  type LoginMutationHookResult,
  type RefreshTokenMutationHookResult,
  type OnContractEventSubscriptionHookResult,
} from '../src/generated/apollo-hooks';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Schema type structure
// ─────────────────────────────────────────────────────────────────────────────

describe('Generated schema types', () => {
  it('Event type has all required fields', () => {
    const event: Event = {
      __typename: 'Event',
      id: 'evt-1',
      contractId: 'contract-abc',
      eventType: 'transfer',
      data: '{}',
      createdAt: '2024-01-01T00:00:00Z',
    };
    expect(event.id).toBe('evt-1');
    expect(event.contractId).toBe('contract-abc');
    expect(event.eventType).toBe('transfer');
    expect(event.data).toBe('{}');
    expect(event.createdAt).toBe('2024-01-01T00:00:00Z');
  });

  it('ContractEvent type has all required fields', () => {
    const ce: ContractEvent = {
      __typename: 'ContractEvent',
      id: 'ce-1',
      eventType: 'mint',
      ledgerSequence: 100,
      timestamp: '2024-01-01T00:00:00Z',
      payload: '{"amount":100}',
    };
    expect(ce.ledgerSequence).toBe(100);
  });

  it('AuthPayload type has access, refresh, and user', () => {
    const payload: AuthPayload = {
      __typename: 'AuthPayload',
      access: 'access-token',
      refresh: 'refresh-token',
      user: { __typename: 'User', id: 'u-1', email: 'test@example.com' },
    };
    expect(payload.access).toBe('access-token');
    expect(payload.user.email).toBe('test@example.com');
  });

  it('User type has id and email', () => {
    const user: User = { __typename: 'User', id: 'u-1', email: 'a@b.com' };
    expect(user.id).toBe('u-1');
  });

  it('SystemMetrics type has all numeric and string fields', () => {
    const metrics: SystemMetrics = {
      __typename: 'SystemMetrics',
      eventsIndexedToday: 42,
      eventsIndexedTotal: 1000,
      webhookSuccessRate: 0.99,
      avgWebhookDeliveryTime: 120,
      activeContracts: 5,
      lastSynced: '2024-01-01T00:00:00Z',
      dbStatus: 'ok',
      redisStatus: 'ok',
    };
    expect(metrics.eventsIndexedToday).toBe(42);
  });

  it('ErrorLog type has optional context field', () => {
    const withContext: ErrorLog = {
      __typename: 'ErrorLog',
      id: 'e-1',
      timestamp: '2024-01-01T00:00:00Z',
      level: 'error',
      message: 'Something failed',
      context: 'extra info',
    };
    const withoutContext: ErrorLog = {
      __typename: 'ErrorLog',
      id: 'e-2',
      timestamp: '2024-01-01T00:00:00Z',
      level: 'warn',
      message: 'Warning',
      context: null,
    };
    expect(withContext.context).toBe('extra info');
    expect(withoutContext.context).toBeNull();
  });

  it('Maybe<T> allows null values', () => {
    const nullable: Maybe<string> = null;
    expect(nullable).toBeNull();
  });

  it('Scalars map ID to string', () => {
    const id: Scalars['ID']['output'] = 'some-id';
    expect(typeof id).toBe('string');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Query types
// ─────────────────────────────────────────────────────────────────────────────

describe('GetEvents query types', () => {
  it('GetEventsQueryVariables requires contractId and first', () => {
    const vars: GetEventsQueryVariables = { contractId: 'c-1', first: 10 };
    expect(vars.contractId).toBe('c-1');
    expect(vars.first).toBe(10);
  });

  it('GetEventsQuery result shape is fully typed', () => {
    const result: GetEventsQuery = {
      events: {
        __typename: 'EventConnection',
        edges: [
          {
            __typename: 'EventEdge',
            node: {
              __typename: 'Event',
              id: 'e-1',
              contractId: 'c-1',
              eventType: 'transfer',
              data: '{}',
              createdAt: '2024-01-01T00:00:00Z',
            },
          },
        ],
      },
    };
    expect(result.events.edges[0].node.id).toBe('e-1');
  });

  it('GetEventsQuery edges can be empty array', () => {
    const empty: GetEventsQuery = {
      events: { __typename: 'EventConnection', edges: [] },
    };
    expect(empty.events.edges).toHaveLength(0);
  });
});

describe('GetSystemMetrics query types', () => {
  it('GetSystemMetricsQueryVariables accepts no variables', () => {
    const vars: GetSystemMetricsQueryVariables = {};
    expect(vars).toEqual({});
  });

  it('GetSystemMetricsQuery result has systemMetrics and recentErrors', () => {
    const result: GetSystemMetricsQuery = {
      systemMetrics: {
        __typename: 'SystemMetrics',
        eventsIndexedToday: 10,
        eventsIndexedTotal: 500,
        webhookSuccessRate: 0.95,
        avgWebhookDeliveryTime: 100,
        activeContracts: 3,
        lastSynced: null,
        dbStatus: 'ok',
        redisStatus: 'ok',
      },
      recentErrors: [],
    };
    expect(result.systemMetrics.dbStatus).toBe('ok');
    expect(result.recentErrors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Mutation types
// ─────────────────────────────────────────────────────────────────────────────

describe('Login mutation types', () => {
  it('LoginMutationVariables requires email and password', () => {
    const vars: LoginMutationVariables = {
      email: 'user@example.com',
      password: 'secret',
    };
    expect(vars.email).toBe('user@example.com');
  });

  it('LoginMutation result has access, refresh, and user', () => {
    const result: LoginMutation = {
      login: {
        __typename: 'AuthPayload',
        access: 'acc',
        refresh: 'ref',
        user: { __typename: 'User', id: 'u-1', email: 'user@example.com' },
      },
    };
    expect(result.login.access).toBe('acc');
    expect(result.login.user.id).toBe('u-1');
  });
});

describe('RefreshToken mutation types', () => {
  it('RefreshTokenMutationVariables requires refresh token', () => {
    const vars: RefreshTokenMutationVariables = { refresh: 'my-refresh-token' };
    expect(vars.refresh).toBe('my-refresh-token');
  });

  it('RefreshTokenMutation result has access and refresh', () => {
    const result: RefreshTokenMutation = {
      refreshToken: {
        __typename: 'AuthPayload',
        access: 'new-acc',
        refresh: 'new-ref',
      },
    };
    expect(result.refreshToken.access).toBe('new-acc');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Subscription types
// ─────────────────────────────────────────────────────────────────────────────

describe('OnContractEvent subscription types', () => {
  it('OnContractEventSubscriptionVariables requires contractId', () => {
    const vars: OnContractEventSubscriptionVariables = { contractId: 'c-1' };
    expect(vars.contractId).toBe('c-1');
  });

  it('OnContractEventSubscription result has contractEvent fields', () => {
    const result: OnContractEventSubscription = {
      contractEvent: {
        __typename: 'ContractEvent',
        id: 'ce-1',
        eventType: 'transfer',
        ledgerSequence: 200,
        timestamp: '2024-01-01T00:00:00Z',
        payload: '{}',
      },
    };
    expect(result.contractEvent.ledgerSequence).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Apollo hooks are exported functions
// ─────────────────────────────────────────────────────────────────────────────

describe('Apollo hooks are exported as functions', () => {
  it('useGetEventsQuery is a function', () => {
    expect(typeof useGetEventsQuery).toBe('function');
  });

  it('useGetEventsLazyQuery is a function', () => {
    expect(typeof useGetEventsLazyQuery).toBe('function');
  });

  it('useGetSystemMetricsQuery is a function', () => {
    expect(typeof useGetSystemMetricsQuery).toBe('function');
  });

  it('useGetSystemMetricsLazyQuery is a function', () => {
    expect(typeof useGetSystemMetricsLazyQuery).toBe('function');
  });

  it('useLoginMutation is a function', () => {
    expect(typeof useLoginMutation).toBe('function');
  });

  it('useRefreshTokenMutation is a function', () => {
    expect(typeof useRefreshTokenMutation).toBe('function');
  });

  it('useOnContractEventSubscription is a function', () => {
    expect(typeof useOnContractEventSubscription).toBe('function');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Document nodes are exported objects
// ─────────────────────────────────────────────────────────────────────────────

describe('GraphQL document nodes are exported', () => {
  it('GetEventsDocument is defined', () => {
    expect(GetEventsDocument).toBeDefined();
  });

  it('GetSystemMetricsDocument is defined', () => {
    expect(GetSystemMetricsDocument).toBeDefined();
  });

  it('LoginDocument is defined', () => {
    expect(LoginDocument).toBeDefined();
  });

  it('RefreshTokenDocument is defined', () => {
    expect(RefreshTokenDocument).toBeDefined();
  });

  it('OnContractEventDocument is defined', () => {
    expect(OnContractEventDocument).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Type alias exports exist (return types of hooks)
// ─────────────────────────────────────────────────────────────────────────────

describe('Hook return type aliases are exported', () => {
  it('GetEventsQueryHookResult type alias is usable', () => {
    // If this compiles, the type export exists.
    // We use a cast to exercise the type without needing a real Apollo provider.
    const result = {} as GetEventsQueryHookResult;
    expect(result).toBeDefined();
  });

  it('GetEventsLazyQueryHookResult type alias is usable', () => {
    const result = {} as GetEventsLazyQueryHookResult;
    expect(result).toBeDefined();
  });

  it('GetSystemMetricsQueryHookResult type alias is usable', () => {
    const result = {} as GetSystemMetricsQueryHookResult;
    expect(result).toBeDefined();
  });

  it('LoginMutationHookResult type alias is usable', () => {
    const result = {} as LoginMutationHookResult;
    expect(result).toBeDefined();
  });

  it('RefreshTokenMutationHookResult type alias is usable', () => {
    const result = {} as RefreshTokenMutationHookResult;
    expect(result).toBeDefined();
  });

  it('OnContractEventSubscriptionHookResult type alias is usable', () => {
    const result = {} as OnContractEventSubscriptionHookResult;
    expect(result).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. codegen.ts configuration shape
// ─────────────────────────────────────────────────────────────────────────────

describe('codegen.ts configuration', () => {
  it('exports a valid codegen config object', async () => {
    const mod = await import('../codegen');
    const config = mod.default;
    expect(config).toBeDefined();
    expect(typeof config).toBe('object');
  });

  it('config has a schema field', async () => {
    const mod = await import('../codegen');
    expect(mod.default.schema).toBeDefined();
  });

  it('config has a documents field', async () => {
    const mod = await import('../codegen');
    expect(mod.default.documents).toBeDefined();
  });

  it('config generates output to src/generated/', async () => {
    const mod = await import('../codegen');
    const generates = mod.default.generates as Record<string, unknown>;
    expect(generates['./src/generated/']).toBeDefined();
  });

  it('config generates apollo-hooks.ts with typescript-react-apollo', async () => {
    const mod = await import('../codegen');
    const generates = mod.default.generates as Record<string, { plugins?: string[] }>;
    const apolloTarget = generates['./src/generated/apollo-hooks.ts'];
    expect(apolloTarget).toBeDefined();
    expect(apolloTarget.plugins).toContain('typescript-react-apollo');
  });

  it('config generates legacy-types.ts with typescript and typescript-operations', async () => {
    const mod = await import('../codegen');
    const generates = mod.default.generates as Record<string, { plugins?: string[] }>;
    const legacyTarget = generates['./src/generated/legacy-types.ts'];
    expect(legacyTarget).toBeDefined();
    expect(legacyTarget.plugins).toContain('typescript');
    expect(legacyTarget.plugins).toContain('typescript-operations');
  });
});
