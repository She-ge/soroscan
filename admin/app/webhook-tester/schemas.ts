// Webhook Payload Schemas and Validation

export interface SchemaProperty {
  type: string;
  description?: string;
  example?: any;
  required?: boolean;
  enum?: string[];
  format?: string;
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
}

export interface PayloadSchema {
  name: string;
  description: string;
  eventType: string;
  schema: {
    type: 'object';
    properties: Record<string, SchemaProperty>;
    required: string[];
  };
  example: Record<string, any>;
}

// Predefined schemas for common event types
export const WEBHOOK_SCHEMAS: PayloadSchema[] = [
  {
    name: 'Test Event',
    description: 'Simple test event for webhook validation',
    eventType: 'test',
    schema: {
      type: 'object',
      properties: {
        event_type: {
          type: 'string',
          description: 'Type of the event',
          example: 'test',
        },
        payload: {
          type: 'object',
          description: 'Event payload data',
          properties: {
            message: {
              type: 'string',
              description: 'Test message',
              example: 'This is a test webhook',
            },
          },
        },
        contract_id: {
          type: 'string',
          description: 'Contract identifier',
          example: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'Event timestamp',
          example: new Date().toISOString(),
        },
      },
      required: ['event_type', 'payload', 'contract_id', 'timestamp'],
    },
    example: {
      event_type: 'test',
      payload: { message: 'This is a test webhook' },
      contract_id: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
      timestamp: new Date().toISOString(),
    },
  },
  {
    name: 'Transfer Event',
    description: 'Token transfer event',
    eventType: 'transfer',
    schema: {
      type: 'object',
      properties: {
        event_type: {
          type: 'string',
          description: 'Type of the event',
          example: 'transfer',
        },
        payload: {
          type: 'object',
          description: 'Transfer details',
          properties: {
            from: {
              type: 'string',
              description: 'Sender address',
              example: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
            },
            to: {
              type: 'string',
              description: 'Recipient address',
              example: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWHF',
            },
            amount: {
              type: 'string',
              description: 'Transfer amount',
              example: '1000000',
            },
            asset: {
              type: 'string',
              description: 'Asset code',
              example: 'USDC',
            },
          },
        },
        contract_id: {
          type: 'string',
          description: 'Contract identifier',
          example: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'Event timestamp',
          example: new Date().toISOString(),
        },
        ledger: {
          type: 'number',
          description: 'Ledger sequence number',
          example: 12345678,
        },
        transaction_hash: {
          type: 'string',
          description: 'Transaction hash',
          example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
        },
      },
      required: ['event_type', 'payload', 'contract_id', 'timestamp'],
    },
    example: {
      event_type: 'transfer',
      payload: {
        from: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
        to: 'GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBWHF',
        amount: '1000000',
        asset: 'USDC',
      },
      contract_id: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
      timestamp: new Date().toISOString(),
      ledger: 12345678,
      transaction_hash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
    },
  },
  {
    name: 'Mint Event',
    description: 'Token minting event',
    eventType: 'mint',
    schema: {
      type: 'object',
      properties: {
        event_type: {
          type: 'string',
          description: 'Type of the event',
          example: 'mint',
        },
        payload: {
          type: 'object',
          description: 'Mint details',
          properties: {
            to: {
              type: 'string',
              description: 'Recipient address',
              example: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
            },
            amount: {
              type: 'string',
              description: 'Minted amount',
              example: '5000000',
            },
            asset: {
              type: 'string',
              description: 'Asset code',
              example: 'TOKEN',
            },
          },
        },
        contract_id: {
          type: 'string',
          description: 'Contract identifier',
          example: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'Event timestamp',
          example: new Date().toISOString(),
        },
        ledger: {
          type: 'number',
          description: 'Ledger sequence number',
          example: 12345678,
        },
      },
      required: ['event_type', 'payload', 'contract_id', 'timestamp'],
    },
    example: {
      event_type: 'mint',
      payload: {
        to: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
        amount: '5000000',
        asset: 'TOKEN',
      },
      contract_id: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
      timestamp: new Date().toISOString(),
      ledger: 12345678,
    },
  },
  {
    name: 'Burn Event',
    description: 'Token burning event',
    eventType: 'burn',
    schema: {
      type: 'object',
      properties: {
        event_type: {
          type: 'string',
          description: 'Type of the event',
          example: 'burn',
        },
        payload: {
          type: 'object',
          description: 'Burn details',
          properties: {
            from: {
              type: 'string',
              description: 'Burner address',
              example: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
            },
            amount: {
              type: 'string',
              description: 'Burned amount',
              example: '2000000',
            },
            asset: {
              type: 'string',
              description: 'Asset code',
              example: 'TOKEN',
            },
          },
        },
        contract_id: {
          type: 'string',
          description: 'Contract identifier',
          example: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'Event timestamp',
          example: new Date().toISOString(),
        },
      },
      required: ['event_type', 'payload', 'contract_id', 'timestamp'],
    },
    example: {
      event_type: 'burn',
      payload: {
        from: 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
        amount: '2000000',
        asset: 'TOKEN',
      },
      contract_id: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
      timestamp: new Date().toISOString(),
    },
  },
  {
    name: 'Custom Event',
    description: 'Custom event with flexible structure',
    eventType: 'custom',
    schema: {
      type: 'object',
      properties: {
        event_type: {
          type: 'string',
          description: 'Type of the event',
          example: 'custom',
        },
        payload: {
          type: 'object',
          description: 'Custom payload data',
          properties: {},
        },
        contract_id: {
          type: 'string',
          description: 'Contract identifier',
          example: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'Event timestamp',
          example: new Date().toISOString(),
        },
      },
      required: ['event_type', 'payload', 'contract_id', 'timestamp'],
    },
    example: {
      event_type: 'custom',
      payload: {},
      contract_id: 'CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM',
      timestamp: new Date().toISOString(),
    },
  },
];

// Validation function
export function validatePayload(
  payload: string,
  schema?: PayloadSchema
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Parse JSON
  let parsed: any;
  try {
    parsed = JSON.parse(payload);
  } catch (e) {
    return { valid: false, errors: ['Invalid JSON syntax'] };
  }

  // Basic validation
  if (typeof parsed !== 'object' || parsed === null) {
    errors.push('Payload must be a JSON object');
    return { valid: false, errors };
  }

  // Schema validation if provided
  if (schema) {
    const { required, properties } = schema.schema;

    // Check required fields
    for (const field of required) {
      if (!(field in parsed)) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate field types
    for (const [key, prop] of Object.entries(properties)) {
      if (key in parsed) {
        const value = parsed[key];
        const expectedType = prop.type;

        if (expectedType === 'string' && typeof value !== 'string') {
          errors.push(`Field "${key}" must be a string`);
        } else if (expectedType === 'number' && typeof value !== 'number') {
          errors.push(`Field "${key}" must be a number`);
        } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
          errors.push(`Field "${key}" must be a boolean`);
        } else if (expectedType === 'object' && (typeof value !== 'object' || value === null)) {
          errors.push(`Field "${key}" must be an object`);
        } else if (expectedType === 'array' && !Array.isArray(value)) {
          errors.push(`Field "${key}" must be an array`);
        }

        // Validate enum values
        if (prop.enum && !prop.enum.includes(value)) {
          errors.push(`Field "${key}" must be one of: ${prop.enum.join(', ')}`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// Get schema by event type
export function getSchemaByEventType(eventType: string): PayloadSchema | undefined {
  return WEBHOOK_SCHEMAS.find((s) => s.eventType === eventType);
}

// Get all available event types
export function getAvailableEventTypes(): string[] {
  return WEBHOOK_SCHEMAS.map((s) => s.eventType);
}
