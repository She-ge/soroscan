// API Explorer Types

export interface Endpoint {
  path: string;
  method: HttpMethod;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses?: Record<string, ResponseSchema>;
  requiresAuth?: boolean;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface Parameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required?: boolean;
  description?: string;
  schema?: Schema;
  example?: unknown;
}

export interface RequestBody {
  description?: string;
  required?: boolean;
  content?: Record<string, MediaType>;
}

export interface MediaType {
  schema?: Schema;
  example?: unknown;
}

export interface Schema {
  type?: string;
  format?: string;
  properties?: Record<string, Schema>;
  items?: Schema;
  required?: string[];
  enum?: unknown[];
  example?: unknown;
  description?: string;
}

export interface ResponseSchema {
  description?: string;
  content?: Record<string, MediaType>;
}

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  request: RequestConfig;
  response?: ResponseData;
  error?: string;
}

export interface RequestConfig {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body?: string;
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  time: number;
}

export interface EndpointGroup {
  name: string;
  endpoints: Endpoint[];
}

// Pre-defined API endpoints based on the Django backend
export const API_ENDPOINTS: EndpointGroup[] = [
  {
    name: 'Contracts',
    endpoints: [
      {
        path: '/api/ingest/contracts/',
        method: 'GET',
        summary: 'List all tracked contracts',
        description: 'Retrieve a paginated list of all tracked Stellar contracts',
        tags: ['contracts'],
        requiresAuth: false,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' }, description: 'Page number' },
          { name: 'page_size', in: 'query', schema: { type: 'integer' }, description: 'Items per page' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name or contract_id' },
          { name: 'is_active', in: 'query', schema: { type: 'boolean' }, description: 'Filter by active status' },
          { name: 'ordering', in: 'query', schema: { type: 'string' }, description: 'Sort field (created_at, -created_at, name, -name)' },
        ],
        responses: {
          '200': { description: 'Paginated list of contracts' },
        },
      },
      {
        path: '/api/ingest/contracts/',
        method: 'POST',
        summary: 'Register a new contract',
        description: 'Add a new Stellar contract to track',
        tags: ['contracts'],
        requiresAuth: true,
        parameters: [],
        requestBody: {
          description: 'Contract details',
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  contract_id: { type: 'string', description: 'Stellar contract ID' },
                  name: { type: 'string', description: 'Display name for the contract' },
                  network: { type: 'string', enum: ['mainnet', 'testnet', 'futurenet'], description: 'Network type' },
                  abi: { type: 'object', description: 'Contract ABI specification' },
                },
                required: ['contract_id', 'name', 'network'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Contract created successfully' },
          '400': { description: 'Invalid request data' },
        },
      },
      {
        path: '/api/ingest/contracts/{id}/',
        method: 'GET',
        summary: 'Get contract details',
        description: 'Retrieve detailed information about a specific contract',
        tags: ['contracts'],
        requiresAuth: false,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Contract ID' },
        ],
        responses: {
          '200': { description: 'Contract details' },
          '404': { description: 'Contract not found' },
        },
      },
      {
        path: '/api/ingest/contracts/{id}/',
        method: 'PUT',
        summary: 'Update contract',
        description: 'Update an existing tracked contract',
        tags: ['contracts'],
        requiresAuth: true,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Contract ID' },
        ],
        requestBody: {
          description: 'Updated contract details',
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  is_active: { type: 'boolean' },
                  abi: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Contract updated' },
        },
      },
      {
        path: '/api/ingest/contracts/{id}/',
        method: 'DELETE',
        summary: 'Delete contract',
        description: 'Remove a tracked contract from the system',
        tags: ['contracts'],
        requiresAuth: true,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Contract ID' },
        ],
        responses: {
          '204': { description: 'Contract deleted' },
        },
      },
      {
        path: '/api/ingest/contracts/{id}/events/',
        method: 'GET',
        summary: 'Get contract events',
        description: 'Retrieve all events for a specific contract',
        tags: ['contracts'],
        requiresAuth: false,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Contract ID' },
        ],
        responses: {
          '200': { description: 'List of contract events' },
        },
      },
      {
        path: '/api/ingest/contracts/{id}/stats/',
        method: 'GET',
        summary: 'Get contract statistics',
        description: 'Retrieve statistics for a specific contract',
        tags: ['contracts'],
        requiresAuth: false,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Contract ID' },
        ],
        responses: {
          '200': {
            description: 'Contract statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    total_events: { type: 'integer' },
                    unique_event_types: { type: 'integer' },
                    latest_ledger: { type: 'integer' },
                    last_activity: { type: 'string', format: 'date-time' },
                    contract_id: { type: 'string' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      {
        path: '/api/ingest/contracts/{contract_id}/timeline/',
        method: 'GET',
        summary: 'Get contract timeline',
        description: 'Retrieve the timeline of events and invocations for a contract',
        tags: ['contracts'],
        requiresAuth: false,
        parameters: [
          { name: 'contract_id', in: 'path', required: true, schema: { type: 'string' }, description: 'Contract ID' },
          { name: 'start_time', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Start of time range' },
          { name: 'end_time', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'End of time range' },
          { name: 'limit', in: 'query', schema: { type: 'integer' }, description: 'Maximum number of items' },
        ],
        responses: {
          '200': { description: 'Contract timeline' },
        },
      },
    ],
  },
  {
    name: 'Events',
    endpoints: [
      {
        path: '/api/ingest/events/',
        method: 'GET',
        summary: 'List all events',
        description: 'Retrieve a paginated list of all indexed contract events',
        tags: ['events'],
        requiresAuth: false,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' }, description: 'Page number' },
          { name: 'page_size', in: 'query', schema: { type: 'integer' }, description: 'Items per page (max 1000)' },
          { name: 'contract__contract_id', in: 'query', schema: { type: 'string' }, description: 'Filter by contract ID' },
          { name: 'event_type', in: 'query', schema: { type: 'string' }, description: 'Filter by event type' },
          { name: 'ledger', in: 'query', schema: { type: 'integer' }, description: 'Filter by ledger sequence' },
          { name: 'ordering', in: 'query', schema: { type: 'string' }, description: 'Sort field (-timestamp, timestamp, -ledger, ledger)' },
        ],
        responses: {
          '200': { description: 'Paginated list of events' },
        },
      },
      {
        path: '/api/ingest/events/{id}/',
        method: 'GET',
        summary: 'Get event details',
        description: 'Retrieve detailed information about a specific event',
        tags: ['events'],
        requiresAuth: false,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Event ID' },
        ],
        responses: {
          '200': { description: 'Event details' },
          '404': { description: 'Event not found' },
        },
      },
      {
        path: '/api/ingest/events/search/',
        method: 'GET',
        summary: 'Search events',
        description: 'Full-text and field-level search on contract event payloads',
        tags: ['events'],
        requiresAuth: false,
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Free-text substring match' },
          { name: 'contract_id', in: 'query', schema: { type: 'string' }, description: 'Filter by contract ID' },
          { name: 'event_type', in: 'query', schema: { type: 'string' }, description: 'Filter by event type' },
          { name: 'payload_contains', in: 'query', schema: { type: 'string' }, description: 'JSON containment substring' },
          { name: 'payload_field', in: 'query', schema: { type: 'string' }, description: 'Dot-notation field path (e.g., decodedPayload.to)' },
          { name: 'payload_op', in: 'query', schema: { type: 'string', enum: ['eq', 'neq', 'gte', 'lte', 'gt', 'lt', 'contains', 'startswith', 'in'] }, description: 'Comparison operator' },
          { name: 'payload_value', in: 'query', schema: { type: 'string' }, description: 'Value for field comparison' },
          { name: 'page', in: 'query', schema: { type: 'integer' }, description: 'Page number' },
          { name: 'page_size', in: 'query', schema: { type: 'integer' }, description: 'Items per page' },
        ],
        responses: {
          '200': {
            description: 'Search results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    count: { type: 'integer' },
                    page: { type: 'integer' },
                    page_size: { type: 'integer' },
                    results: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
        },
      },
      {
        path: '/api/ingest/record/',
        method: 'POST',
        summary: 'Record events',
        description: 'Submit contract events for indexing (used by event ingestors)',
        tags: ['events'],
        requiresAuth: true,
        parameters: [],
        requestBody: {
          description: 'Event batch to record',
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  events: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        contract_id: { type: 'string' },
                        event_type: { type: 'string' },
                        ledger: { type: 'integer' },
                        timestamp: { type: 'string' },
                        tx_hash: { type: 'string' },
                        topic: { type: 'string' },
                        value: { type: 'object' },
                      },
                      required: ['contract_id', 'event_type', 'ledger'],
                    },
                  },
                },
                required: ['events'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Events recorded' },
          '400': { description: 'Invalid event data' },
        },
      },
    ],
  },
  {
    name: 'Invocations',
    endpoints: [
      {
        path: '/api/ingest/invocations/',
        method: 'GET',
        summary: 'List invocations',
        description: 'Retrieve a paginated list of contract invocations',
        tags: ['invocations'],
        requiresAuth: true,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' }, description: 'Page number' },
          { name: 'caller', in: 'query', schema: { type: 'string' }, description: 'Filter by caller address' },
          { name: 'function_name', in: 'query', schema: { type: 'string' }, description: 'Filter by function name' },
          { name: 'since', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'Start of time range' },
          { name: 'until', in: 'query', schema: { type: 'string', format: 'date-time' }, description: 'End of time range' },
          { name: 'include_events', in: 'query', schema: { type: 'boolean' }, description: 'Include nested events' },
        ],
        responses: {
          '200': { description: 'Paginated list of invocations' },
        },
      },
      {
        path: '/api/ingest/invocations/{id}/',
        method: 'GET',
        summary: 'Get invocation details',
        description: 'Retrieve detailed information about a specific invocation',
        tags: ['invocations'],
        requiresAuth: true,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Invocation ID' },
        ],
        responses: {
          '200': { description: 'Invocation details' },
          '404': { description: 'Invocation not found' },
        },
      },
    ],
  },
  {
    name: 'Webhooks',
    endpoints: [
      {
        path: '/api/ingest/webhooks/',
        method: 'GET',
        summary: 'List webhooks',
        description: 'Retrieve all webhook subscriptions',
        tags: ['webhooks'],
        requiresAuth: false,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' }, description: 'Page number' },
        ],
        responses: {
          '200': { description: 'List of webhooks' },
        },
      },
      {
        path: '/api/ingest/webhooks/',
        method: 'POST',
        summary: 'Create webhook',
        description: 'Create a new webhook subscription',
        tags: ['webhooks'],
        requiresAuth: true,
        parameters: [],
        requestBody: {
          description: 'Webhook configuration',
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  contract: { type: 'integer', description: 'Contract ID' },
                  target_url: { type: 'string', format: 'uri', description: 'Endpoint URL' },
                  event_types: { type: 'array', items: { type: 'string' }, description: 'Event types to subscribe' },
                  is_active: { type: 'boolean' },
                },
                required: ['contract', 'target_url'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Webhook created' },
        },
      },
      {
        path: '/api/ingest/webhooks/{id}/',
        method: 'GET',
        summary: 'Get webhook details',
        description: 'Retrieve details of a specific webhook',
        tags: ['webhooks'],
        requiresAuth: false,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Webhook ID' },
        ],
        responses: {
          '200': { description: 'Webhook details' },
        },
      },
      {
        path: '/api/ingest/webhooks/{id}/',
        method: 'PUT',
        summary: 'Update webhook',
        description: 'Update a webhook subscription',
        tags: ['webhooks'],
        requiresAuth: true,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Webhook ID' },
        ],
        requestBody: {
          description: 'Updated webhook configuration',
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  target_url: { type: 'string', format: 'uri' },
                  event_types: { type: 'array', items: { type: 'string' } },
                  is_active: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Webhook updated' },
        },
      },
      {
        path: '/api/ingest/webhooks/{id}/',
        method: 'DELETE',
        summary: 'Delete webhook',
        description: 'Remove a webhook subscription',
        tags: ['webhooks'],
        requiresAuth: true,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Webhook ID' },
        ],
        responses: {
          '204': { description: 'Webhook deleted' },
        },
      },
      {
        path: '/api/ingest/webhooks/{id}/test/',
        method: 'POST',
        summary: 'Test webhook',
        description: 'Send a test delivery to the webhook endpoint',
        tags: ['webhooks'],
        requiresAuth: true,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Webhook ID' },
        ],
        responses: {
          '200': { description: 'Test webhook sent' },
        },
      },
    ],
  },
  {
    name: 'API Keys',
    endpoints: [
      {
        path: '/api/ingest/api-keys/',
        method: 'GET',
        summary: 'List API keys',
        description: 'Retrieve all API keys for the authenticated user',
        tags: ['api-keys'],
        requiresAuth: true,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' }, description: 'Page number' },
        ],
        responses: {
          '200': { description: 'List of API keys' },
        },
      },
      {
        path: '/api/ingest/api-keys/',
        method: 'POST',
        summary: 'Create API key',
        description: 'Generate a new API key',
        tags: ['api-keys'],
        requiresAuth: true,
        parameters: [],
        requestBody: {
          description: 'API key configuration',
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Descriptive name for the key' },
                  expires_at: { type: 'string', format: 'date-time', description: 'Expiration date' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'API key created (key shown only once)' },
        },
      },
      {
        path: '/api/ingest/api-keys/{id}/',
        method: 'DELETE',
        summary: 'Revoke API key',
        description: 'Revoke and delete an API key',
        tags: ['api-keys'],
        requiresAuth: true,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'API key ID' },
        ],
        responses: {
          '204': { description: 'API key revoked' },
        },
      },
    ],
  },
  {
    name: 'Teams',
    endpoints: [
      {
        path: '/api/ingest/teams/',
        method: 'GET',
        summary: 'List teams',
        description: 'Retrieve teams the current user belongs to',
        tags: ['teams'],
        requiresAuth: true,
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' }, description: 'Page number' },
        ],
        responses: {
          '200': { description: 'List of teams' },
        },
      },
      {
        path: '/api/ingest/teams/',
        method: 'POST',
        summary: 'Create team',
        description: 'Create a new team (creator becomes admin)',
        tags: ['teams'],
        requiresAuth: true,
        parameters: [],
        requestBody: {
          description: 'Team configuration',
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Team name' },
                  description: { type: 'string', description: 'Team description' },
                },
                required: ['name'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Team created' },
        },
      },
      {
        path: '/api/ingest/teams/{id}/',
        method: 'GET',
        summary: 'Get team details',
        description: 'Retrieve details of a specific team',
        tags: ['teams'],
        requiresAuth: true,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Team ID' },
        ],
        responses: {
          '200': { description: 'Team details' },
        },
      },
      {
        path: '/api/ingest/teams/{id}/',
        method: 'PUT',
        summary: 'Update team',
        description: 'Update team settings (admin only)',
        tags: ['teams'],
        requiresAuth: true,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Team ID' },
        ],
        requestBody: {
          description: 'Updated team configuration',
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Team updated' },
        },
      },
      {
        path: '/api/ingest/teams/{id}/members/',
        method: 'POST',
        summary: 'Add team member',
        description: 'Add a user to the team (admin only)',
        tags: ['teams'],
        requiresAuth: true,
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Team ID' },
        ],
        requestBody: {
          description: 'Member to add',
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  role: { type: 'string', enum: ['admin', 'member'] },
                },
                required: ['email'],
              },
            },
          },
        },
        responses: {
          '201': { description: 'Member added' },
        },
      },
    ],
  },
  {
    name: 'Health',
    endpoints: [
      {
        path: '/api/ingest/health/',
        method: 'GET',
        summary: 'Health check',
        description: 'Check the health status of the API service',
        tags: ['health'],
        requiresAuth: false,
        parameters: [],
        responses: {
          '200': { description: 'Service is healthy' },
        },
      },
    ],
  },
  {
    name: 'Authentication',
    endpoints: [
      {
        path: '/api/token/',
        method: 'POST',
        summary: 'Obtain JWT token',
        description: 'Get JWT access and refresh tokens by providing credentials',
        tags: ['auth'],
        requiresAuth: false,
        parameters: [],
        requestBody: {
          description: 'Credentials',
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: { type: 'string' },
                  password: { type: 'string' },
                },
                required: ['username', 'password'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Tokens obtained',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    access: { type: 'string' },
                    refresh: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
      {
        path: '/api/token/refresh/',
        method: 'POST',
        summary: 'Refresh JWT token',
        description: 'Get a new access token using a refresh token',
        tags: ['auth'],
        requiresAuth: false,
        parameters: [],
        requestBody: {
          description: 'Refresh token',
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refresh: { type: 'string' },
                },
                required: ['refresh'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Token refreshed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    access: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
];
