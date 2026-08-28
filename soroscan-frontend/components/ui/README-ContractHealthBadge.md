# Contract Health Badge System

A comprehensive status indicator system for SoroScan contract health monitoring, featuring animated pulse dots, contextual tooltips, and full accessibility support.

## Overview

The Contract Health Badge system provides visual indicators for four distinct contract health states:

- **Healthy** (`#00e5ff`) - Contract operating normally
- **Degraded** (`#ffaa00`) - Performance issues or reduced functionality  
- **Paused** (`#38bdf8`) - Temporarily suspended operations
- **Error** (`#ff3366`) - Critical failures, non-functional

## Quick Start

```tsx
import { ContractHealthBadge } from '@/components/ui/ContractHealthBadge';

// Basic usage
<ContractHealthBadge status="healthy" />
<ContractHealthBadge status="degraded" />
<ContractHealthBadge status="paused" />
<ContractHealthBadge status="error" />
```

## Component Props

### Core Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `status` | `ContractHealthStatus` | Required | Health status: `healthy`, `degraded`, `paused`, `error` |
| `label` | `string` | Auto-generated | Custom status label |
| `variant` | `default \| compact \| pill \| square` | `default` | Visual style variant |
| `size` | `sm \| md \| lg` | `md` | Badge size |
| `glow` | `none \| subtle \| moderate \| intense` | `subtle` | Glow effect intensity |

### Display Options

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `dotOnly` | `boolean` | `false` | Show only status dot without text |
| `showIcon` | `boolean` | `false` | Use status icon instead of dot |
| `metrics` | `BadgeMetrics` | `undefined` | Additional metrics to display |

### Animation & Interaction

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `disableAnimation` | `boolean` | `false` | Disable pulse animations |
| `animationContext` | `AnimationContext` | `dashboard` | Context for animation intensity |
| `disableTooltip` | `boolean` | `false` | Disable tooltip completely |

### Degraded Status Context

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `degradationContext` | `DegradationContext` | `undefined` | Detailed degradation information |
| `tooltipContent` | `string` | Auto-generated | Custom tooltip content |

## Usage Examples

### Basic Status Indicators

```tsx
// Simple status display
<ContractHealthBadge status="healthy" />

// With custom label
<ContractHealthBadge 
  status="degraded" 
  label="Performance Issues"
/>

// Dot only for compact displays
<ContractHealthBadge 
  status="error" 
  dotOnly 
  size="sm"
/>
```

### Size and Style Variants

```tsx
// Different sizes
<ContractHealthBadge status="healthy" size="sm" />
<ContractHealthBadge status="healthy" size="md" />
<ContractHealthBadge status="healthy" size="lg" />

// Style variants
<ContractHealthBadge status="healthy" variant="pill" />
<ContractHealthBadge status="healthy" variant="compact" />
<ContractHealthBadge status="healthy" variant="square" />

// Glow effects
<ContractHealthBadge status="healthy" glow="intense" />
```

### With Metrics

```tsx
<ContractHealthBadge 
  status="healthy"
  metrics={{
    eventCount: 15420,
    uptime: "99.9%",
    lastActivity: "2 min ago"
  }}
  variant="pill"
  size="lg"
/>
```

### Degraded Status with Context

```tsx
import { COMMON_DEGRADATION_SCENARIOS } from '@/lib/tooltip-content-guidelines';

<ContractHealthBadge 
  status="degraded"
  degradationContext={COMMON_DEGRADATION_SCENARIOS.highLatency}
  variant="pill"
/>

// Custom degradation context
<ContractHealthBadge 
  status="degraded"
  degradationContext={{
    type: "performance",
    severity: "moderate",
    details: {
      responseTime: 2500,
      errorRate: 8
    },
    autoRecoveryActive: true,
    estimatedResolution: "5-10 minutes"
  }}
/>
```

## Preset Configurations

Use predefined configurations for common contexts:

```tsx
import { HealthBadgePresets } from '@/components/ui/ContractHealthBadge';

// Contract list context
<ContractHealthBadge 
  status="healthy" 
  {...HealthBadgePresets.contractList}
/>

// Dashboard widget
<ContractHealthBadge 
  status="degraded" 
  {...HealthBadgePresets.dashboard}
/>

// Contract detail page
<ContractHealthBadge 
  status="error" 
  {...HealthBadgePresets.contractDetail}
/>

// Compact view (mobile)
<ContractHealthBadge 
  status="paused" 
  {...HealthBadgePresets.compactView}
/>
```

## Real-World Context Examples

### Contract Explorer List

```tsx
function ContractListItem({ contract }) {
  return (
    <div className="flex items-center justify-between p-3 rounded border">
      <div className="flex items-center gap-3">
        <ContractHealthBadge 
          status={contract.health.status}
          degradationContext={contract.health.context}
          animationContext="contract-list"
          {...HealthBadgePresets.contractList}
        />
        <code className="font-terminal-mono">
          {contract.id.substring(0, 8)}...{contract.id.slice(-8)}
        </code>
      </div>
      <span className="text-sm text-gray-500">
        {contract.eventCount.toLocaleString()} events
      </span>
    </div>
  );
}
```

### Dashboard Widget

```tsx
function HealthOverviewWidget({ contracts }) {
  const healthCounts = contracts.reduce((acc, contract) => {
    acc[contract.health.status]++;
    return acc;
  }, { healthy: 0, degraded: 0, paused: 0, error: 0 });

  return (
    <div className="grid grid-cols-2 gap-3">
      {Object.entries(healthCounts).map(([status, count]) => (
        <div key={status} className="p-4 text-center border rounded">
          <ContractHealthBadge 
            status={status}
            {...HealthBadgePresets.dashboard}
          />
          <div className="mt-2 text-2xl font-bold">{count}</div>
          <div className="text-sm text-gray-500 capitalize">
            {status} Contracts
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Contract Detail Header

```tsx
function ContractDetailHeader({ contract }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-bold font-terminal-mono">
          {contract.name}
        </h1>
        <code className="text-sm text-gray-500">
          {contract.id}
        </code>
      </div>
      <div className="text-right">
        <ContractHealthBadge 
          status={contract.health.status}
          degradationContext={contract.health.context}
          metrics={{
            eventCount: contract.totalEvents,
            uptime: contract.uptime
          }}
          {...HealthBadgePresets.contractDetail}
        />
        <div className="mt-2 text-sm text-gray-500">
          Last updated: {contract.lastUpdate}
        </div>
      </div>
    </div>
  );
}
```

## Animation Behavior

### Automatic Animations

- **Healthy status**: Gentle 2s breathing pulse
- **Degraded status**: Attention-seeking 1.8s pulse with scaling
- **Paused/Error status**: No animation (static display)

### Animation Contexts

Different contexts apply appropriate animation intensity:

```tsx
// Subtle animations for lists
<ContractHealthBadge 
  status="healthy"
  animationContext="contract-list"
/>

// Standard animations for dashboards  
<ContractHealthBadge 
  status="degraded"
  animationContext="dashboard"
/>

// Enhanced animations for detail views
<ContractHealthBadge 
  status="healthy"
  animationContext="detail-view"
/>
```

### Accessibility Considerations

- Animations automatically pause when `prefers-reduced-motion` is set
- Alternative visual cues provided for reduced motion environments
- Performance optimizations pause animations when elements are off-screen

## Tooltip System

### Automatic Tooltip Generation

The system automatically generates contextual tooltips:

```tsx
// Basic status description
<ContractHealthBadge status="healthy" />
// Tooltip: "Contract is operating normally with all systems functional"

// Degraded status with detailed context
<ContractHealthBadge 
  status="degraded"
  degradationContext={{
    type: "performance",
    severity: "moderate",
    details: { responseTime: 2500, errorRate: 5 },
    autoRecoveryActive: true
  }}
/>
// Tooltip: Detailed performance information with metrics and recovery status
```

### Custom Tooltip Content

```tsx
<ContractHealthBadge 
  status="paused"
  tooltipContent="Contract paused for scheduled maintenance until 2PM UTC"
/>
```

### Tooltip Formatting by Context

Tooltips automatically adjust content based on UI context:

- **Contract List**: Brief, non-intrusive (≤120 chars)
- **Dashboard**: Informative with key metrics (≤200 chars)  
- **Detail View**: Comprehensive information (≤400 chars)
- **Mobile**: Essential information only (≤80 chars)

## Degradation Context System

### Degradation Types

```tsx
type DegradationType = 
  | "performance"      // High latency, slow responses
  | "connectivity"     // Network issues, timeouts
  | "data_quality"     // Schema validation, corruption
  | "sync_lag"         // Blockchain synchronization delays
  | "partial_failure"  // Some features unavailable
  | "resource_limit"   // Memory, CPU, or storage constraints
  | "configuration"    // Misconfiguration issues
  | "network_issues";  // Infrastructure problems
```

### Severity Levels

```tsx
type DegradationSeverity = "minor" | "moderate" | "severe";
```

### Complete Example

```tsx
const degradationContext = {
  type: "performance",
  severity: "moderate",
  details: {
    responseTime: 2500,
    errorRate: 8,
    lastSuccess: "3 minutes ago",
    affectedOps: 15
  },
  autoRecoveryActive: true,
  estimatedResolution: "10-15 minutes"
};

<ContractHealthBadge 
  status="degraded"
  degradationContext={degradationContext}
/>
```

## Color Specifications

Exact hex values used in the terminal theme:

| Status | Primary Color | Background | Border | Usage |
|--------|---------------|------------|--------|-------|
| Healthy | `#00e5ff` | `rgba(0, 229, 255, 0.1)` | `rgba(0, 229, 255, 0.3)` | Normal operations |
| Degraded | `#ffaa00` | `rgba(255, 170, 0, 0.1)` | `rgba(255, 170, 0, 0.3)` | Performance issues |
| Paused | `#38bdf8` | `rgba(56, 189, 248, 0.1)` | `rgba(56, 189, 248, 0.3)` | Suspended operations |
| Error | `#ff3366` | `rgba(255, 51, 102, 0.1)` | `rgba(255, 51, 102, 0.3)` | Critical failures |

## Testing

### Running Tests

```bash
# Run all badge tests
npm test ContractHealthBadge

# Run with coverage
npm test ContractHealthBadge -- --coverage

# Run accessibility tests
npm test ContractHealthBadge -- --testNamePattern="accessibility"
```

### Manual Testing Checklist

- [ ] All four status types render correctly
- [ ] Size variants display appropriately
- [ ] Animations work smoothly in supported browsers
- [ ] Tooltips appear with correct content
- [ ] Accessibility: Screen reader compatible
- [ ] Accessibility: Keyboard navigation works
- [ ] Accessibility: High contrast mode support
- [ ] Performance: Multiple badges render efficiently
- [ ] Responsive: Works on mobile devices

## Browser Support

- **Modern browsers**: Full feature support including animations
- **Legacy browsers**: Graceful degradation without animations
- **Screen readers**: Full accessibility support
- **High contrast mode**: Alternative visual indicators
- **Reduced motion**: Static alternatives provided

## Performance Considerations

- Animations use GPU acceleration (`transform: translateZ(0)`)
- Intersection Observer pauses off-screen animations
- Tooltip content generation is memoized
- Component re-renders are minimized with React.memo patterns

## Troubleshooting

### Common Issues

**Animations not working**
- Check that `prefers-reduced-motion` is not set to `reduce`
- Verify CSS animations are loaded
- Ensure `disableAnimation` prop is not set to `true`

**Tooltips not appearing**
- Confirm `disableTooltip` is not set to `true`
- Check that tooltip provider is available in component tree
- Verify tooltip content is not empty

**Colors not displaying correctly**
- Ensure terminal theme CSS variables are loaded
- Check for CSS specificity conflicts
- Verify dark/light theme context

**Performance issues**
- Limit the number of animated badges on screen
- Use `dotOnly` variant for large lists
- Consider virtualization for very long lists

## Contributing

When contributing to the badge system:

1. **Maintain consistency** with the terminal theme
2. **Test accessibility** with screen readers
3. **Verify performance** with multiple instances
4. **Document new features** in this README
5. **Add tests** for new functionality

## Related Components

- `StatusIndicator` - Basic status dots without badges
- `Badge` - General-purpose badge component
- `Tooltip` - Tooltip system used by health badges
- `Card` - Container components for dashboard widgets