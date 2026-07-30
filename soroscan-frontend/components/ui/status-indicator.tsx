/**
 * StatusIndicator Component
 * ──────────────────────────────────────────────────────────────────────────────
 * An animated status indicator with color-coded dots for system states.
 * 
 * Features:
 * - Animated pulsing dots for active/pending states
 * - Color coding: green (active), red (failed), yellow (pending)
 * - Consistent with terminal theme
 * - Accessibility support with proper ARIA labels
 * - Size variants for different contexts
 */
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

export type StatusType = "active" | "failed" | "pending" | "inactive";

const statusIndicatorVariants = cva(
  [
    "inline-flex items-center gap-2 font-terminal-mono text-xs tracking-wider uppercase",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  ],
  {
    variants: {
      variant: {
        default: "",
        compact: "gap-1.5",
      },
      size: {
        sm: "text-xs",
        md: "text-xs",
        lg: "text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

const dotVariants = cva(
  ["inline-block rounded-full shrink-0"],
  {
    variants: {
      size: {
        sm: "w-1.5 h-1.5",
        md: "w-2 h-2",
        lg: "w-2.5 h-2.5",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const STATUS_CONFIG: Record<
  StatusType,
  { 
    label: string; 
    dotClass: string; 
    textClass: string; 
    animate: boolean;
    focusRingClass: string;
  }
> = {
  active: {
    label: "Active",
    dotClass: "bg-terminal-green",
    textClass: "text-terminal-green",
    animate: true,
    focusRingClass: "focus-visible:ring-terminal-green",
  },
  failed: {
    label: "Failed",
    dotClass: "bg-terminal-danger",
    textClass: "text-terminal-danger",
    animate: false,
    focusRingClass: "focus-visible:ring-terminal-danger",
  },
  pending: {
    label: "Pending",
    dotClass: "bg-terminal-warning",
    textClass: "text-terminal-warning",
    animate: true,
    focusRingClass: "focus-visible:ring-terminal-warning",
  },
  inactive: {
    label: "Inactive",
    dotClass: "bg-terminal-gray",
    textClass: "text-terminal-gray",
    animate: false,
    focusRingClass: "focus-visible:ring-terminal-gray",
  },
};

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusIndicatorVariants> {
  /** The status type to display */
  status: StatusType;
  /** Custom label to override the default status label */
  label?: string;
  /** Whether to show only the dot without text */
  dotOnly?: boolean;
  /** Additional context for screen readers */
  "aria-label"?: string;
}

const StatusIndicator = React.forwardRef<HTMLSpanElement, StatusIndicatorProps>(
  ({ 
    className,
    variant,
    size,
    status,
    label,
    dotOnly = false,
    "aria-label": ariaLabel,
    ...props
  }, ref) => {
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.inactive;
    const displayLabel = label ?? config.label;
    
    const accessibleLabel = ariaLabel ?? `Status: ${displayLabel}`;

    return (
      <span
        ref={ref}
        role="status"
        aria-label={accessibleLabel}
        className={statusIndicatorVariants({ 
          variant, 
          size, 
          className: [
            className,
            config.textClass,
            config.focusRingClass,
          ].filter(Boolean).join(" ")
        })}
        {...props}
      >
        <span
          aria-hidden="true"
          className={[
            dotVariants({ size }),
            config.dotClass,
            config.animate ? "animate-pulse" : "",
          ].join(" ")}
        />
        {!dotOnly && (
          <span className="select-none">
            {displayLabel}
          </span>
        )}
      </span>
    );
  }
);

StatusIndicator.displayName = "StatusIndicator";

export { StatusIndicator, statusIndicatorVariants };