# Badge and StatusIndicator Components

This document describes the reusable Badge and StatusIndicator components that provide consistent status visualization across the SoroScan application.

## Overview

Both components are designed to work together to provide clear, scannable visual representation of status fields (active, failed, pending) and other categorization needs throughout the application.

## Components

### Badge Component

A static label with background, border, and optional icon support.

**Features:**
- Size variants: `sm`, `md`, `lg`
- Color variants: `default`, `primary`, `secondary`, `success`, `warning`, `danger`, `outline`
- Icon support with automatic sizing
- Terminal theme consistency
- Full accessibility support

**Usage:**
```tsx
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

// Basic badge
<Badge variant="success">Active</Badge>

// With icon
<Badge variant="warning" icon={CheckCircle} size="sm">
  Processing
</Badge>

// Custom styling
<Badge className="custom-class" variant="outline">
  Custom
</Badge>
```

### StatusIndicator Component

An animated status indicator with color-coded dots and labels.

**Features:**
- Status types: `active`, `failed`, `pending`, `inactive`
- Animated pulsing dots for active/pending states
- Color coding: green (active), red (failed), yellow (pending), gray (inactive)
- Size variants: `sm`, `md`, `lg`
- Compact variant with reduced spacing
- Dot-only mode for minimal display

**Usage:**
```tsx
import { StatusIndicator } from "@/components/ui/status-indicator";

// Basic status indicator
<StatusIndicator status="active" />

// Compact variant
<StatusIndicator status="pending" variant="compact" />

// Dot only
<StatusIndicator status="failed" dotOnly />

// Custom label
<StatusIndicator status="active" label="Running" />
```

## Color Coding

The components follow consistent color coding throughout the application:

- **Green (`terminal-green`)**: Active, Success, Healthy states
- **Red (`terminal-danger`)**: Failed, Error, Critical states  
- **Yellow (`terminal-warning`)**: Pending, Processing, Warning states
- **Gray (`terminal-gray`)**: Inactive, Neutral, Default states
- **Cyan (`terminal-cyan`)**: Secondary, Information states

## Usage Contexts

### Contract List

Used to show contract status and metadata:

```tsx
// Active contract with event count
<div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
    <StatusIndicator status="active" />
    <span>contract_12345...abcdef</span>
  </div>
  <div className="flex gap-2">
    <Badge variant="success" icon={Activity} size="sm">
      1.2k Events
    </Badge>
    <Badge variant="secondary" size="sm">
      Verified
    </Badge>
  </div>
</div>
```

### Event Explorer

Used for event status and categorization:

```tsx
// Event with priority and processing status
<div className="flex items-center gap-4">
  <StatusIndicator status="active" size="sm" dotOnly />
  <span>Transfer Event</span>
  <Badge variant="primary" size="sm">High Priority</Badge>
  <Badge variant="secondary" size="sm" icon={Zap}>Real-time</Badge>
</div>
```

### Webhook List

Used for delivery status and timing information:

```tsx
// Webhook with delivery status
<div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
    <StatusIndicator status="active" variant="compact" />
    <span>https://api.example.com/webhook</span>
  </div>
  <div className="flex gap-2">
    <Badge variant="success" icon={CheckCircle} size="sm">
      Delivered
    </Badge>
    <Badge variant="outline" size="sm">2min ago</Badge>
  </div>
</div>
```

## Specialized Badge Components

The codebase includes several specialized badge components that extend the base functionality:

- **`WebhookDeliveryStatusBadge`**: For webhook delivery states with tooltip information
- **`SubscriptionStatusBadge`**: For GraphQL WebSocket connection states
- **`EventCountBadge`**: For real-time event counting with streaming updates

## Accessibility

Both components include comprehensive accessibility features:

- Proper ARIA roles (`role="status"` for status indicators)
- Screen reader labels with `aria-label`
- Focus management with visible focus rings
- High contrast colors that meet WCAG guidelines
- Semantic markup for assistive technologies

## Animation

StatusIndicator components include subtle animations:

- **Active/Pending states**: Pulsing animation (`animate-pulse`)
- **Failed/Inactive states**: Static display (no animation)

Animations respect user preferences for reduced motion when browser settings indicate this preference.

## Testing

Comprehensive test suites are included for both components:

- **Unit tests**: All variants, props, and accessibility features
- **Integration tests**: Usage in different contexts
- **Visual regression tests**: Ensure consistent styling

Test files:
- `components/ui/badge.test.tsx`
- `components/ui/status-indicator.test.tsx`
- `components/ui/badge-status-examples.test.tsx`

## Performance

Both components are optimized for performance:

- Forward refs for proper React integration
- Minimal re-renders with stable class name generation
- Efficient CSS-in-JS with class-variance-authority
- Tree-shakeable exports

## Terminal Theme Integration

The components are designed specifically for the SoroScan terminal aesthetic:

- Monospace typography (`font-terminal-mono`)
- Terminal-inspired color palette
- Consistent borders and spacing
- Uppercase text transform for labels
- High contrast for readability

## Examples

See `components/ui/badge-status-examples.tsx` for comprehensive usage examples showcasing all features and contexts.