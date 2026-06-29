# Webhook Payload Builder

A comprehensive UI for building, validating, and testing webhook payloads with real-time schema validation and interactive templates.

## Features

### 1. **JSON Editor with Syntax Highlighting**
- Real-time syntax highlighting for JSON
- Line numbers and character count
- Format and reset functionality
- Synchronized scrolling between editor and highlight overlay

### 2. **Schema Validation**
- Real-time validation against predefined schemas
- Detailed error messages for validation failures
- Visual indicators for valid/invalid payloads
- Type checking for all fields
- Required field validation

### 3. **Template System**
- Quick templates for common event types:
  - Test Event
  - Transfer Event
  - Mint Event
  - Burn Event
  - Custom Event
- Searchable template selector
- One-click template application
- Auto-detection of event type from payload

### 4. **Schema Viewer**
- Interactive schema documentation
- Expandable/collapsible property tree
- Field descriptions and examples
- Type information and constraints
- Required field indicators

### 5. **Visual Payload Builder**
- Form-based payload construction
- Type-appropriate input fields:
  - Text inputs for strings
  - Number inputs for numbers
  - Checkboxes for booleans
  - Date-time pickers for timestamps
  - Dropdowns for enums
  - Textareas for objects
- Nested object support
- Auto-population with example values
- "Use Current Time" quick action

### 6. **Send Test Payload**
- Send test webhooks to configured endpoints
- HMAC signature generation
- Request/response inspection
- Retry functionality
- Request history tracking

## Usage

### Selecting a Template

1. Click the **Templates** button in the toolbar
2. Search or browse available templates
3. Click on a template to apply it to the editor
4. The payload will be populated with example data

### Viewing Schema Documentation

1. Select a template or ensure your payload has an `event_type` field
2. Click the **Schema** button in the toolbar
3. Browse the schema properties, types, and descriptions
4. Click on nested objects to expand/collapse them

### Using the Visual Builder

1. Click the **Builder** button in the toolbar
2. Fill in the form fields with your desired values
3. Use the "Use Current Time" button to set the timestamp to now
4. Click **Apply** to update the JSON editor with your changes

### Validating Your Payload

1. Toggle validation on/off with the **Validate** button
2. Validation runs automatically as you type
3. View validation errors in the status bar and validation panel
4. Fix errors based on the detailed error messages

### Sending a Test Webhook

1. Select a webhook from the sidebar
2. Build or edit your payload
3. Ensure validation passes (green checkmark)
4. Click **Send Test** to dispatch the webhook
5. View the response in the bottom panel

## Schema Structure

Each schema defines:

```typescript
interface PayloadSchema {
  name: string;              // Display name
  description: string;       // Schema description
  eventType: string;         // Event type identifier
  schema: {
    type: 'object';
    properties: {            // Field definitions
      [key: string]: {
        type: string;        // Field type
        description?: string;
        example?: any;
        required?: boolean;
        enum?: string[];
        format?: string;
      };
    };
    required: string[];      // Required field names
  };
  example: object;           // Example payload
}
```

## Adding Custom Schemas

To add a new schema, edit `schemas.ts` and add to the `WEBHOOK_SCHEMAS` array:

```typescript
{
  name: 'My Custom Event',
  description: 'Description of the event',
  eventType: 'my_custom_event',
  schema: {
    type: 'object',
    properties: {
      event_type: {
        type: 'string',
        example: 'my_custom_event',
      },
      // Add more properties...
    },
    required: ['event_type'],
  },
  example: {
    event_type: 'my_custom_event',
    // Add example data...
  },
}
```

## Components

### `PayloadEditor.tsx`
Main editor component with syntax highlighting and toolbar.

### `TemplateSelector.tsx`
Dropdown for selecting and applying payload templates.

### `SchemaValidator.tsx`
Real-time validation panel showing errors and success states.

### `SchemaViewer.tsx`
Interactive schema documentation viewer.

### `PayloadBuilder.tsx`
Visual form-based payload builder.

### `schemas.ts`
Schema definitions and validation logic.

## Keyboard Shortcuts

- **Ctrl/Cmd + F**: Format JSON
- **Ctrl/Cmd + R**: Reset to default
- **Ctrl/Cmd + Enter**: Send test (when valid)

## API Integration

The webhook tester integrates with the Django backend:

- **GET** `/api/ingest/webhooks/` - List webhooks
- **POST** `/api/ingest/webhooks/{id}/test/` - Send test payload

Test payloads are sent with proper HMAC signatures for authentication.

## Validation Rules

1. **JSON Syntax**: Must be valid JSON
2. **Required Fields**: All required fields must be present
3. **Type Checking**: Fields must match their defined types
4. **Enum Values**: Enum fields must use allowed values
5. **Format Validation**: Date-time fields must be ISO 8601 format

## Best Practices

1. **Start with a Template**: Use templates as a starting point
2. **Validate Early**: Enable validation to catch errors as you type
3. **Use the Builder**: For complex payloads, use the visual builder
4. **Check the Schema**: Review schema documentation when unsure
5. **Test Incrementally**: Test simple payloads before complex ones

## Troubleshooting

### Validation Errors

- **"Invalid JSON syntax"**: Check for missing commas, brackets, or quotes
- **"Missing required field"**: Add the required field to your payload
- **"Field must be a string/number/etc"**: Check the field type matches the schema

### Send Failures

- **"No webhook selected"**: Select a webhook from the sidebar
- **"Invalid payload"**: Fix validation errors before sending
- **"Network error"**: Check backend is running and accessible

## Future Enhancements

- [ ] Import/export payload templates
- [ ] Payload history with search
- [ ] Bulk testing across multiple webhooks
- [ ] Custom schema upload
- [ ] Payload diff viewer
- [ ] Variable substitution (e.g., `{{timestamp}}`)
- [ ] Webhook response assertions
- [ ] Performance metrics and timing breakdown
