/**
 * Badge Component
 * ──────────────────────────────────────────────────────────────────────────────
 * A reusable static badge component for labels, tags, and status displays.
 * 
 * Features:
 * - Size variants (sm, md, lg)
 * - Color variants with terminal theme
 * - Optional icon support
 * - Consistent styling across the app
 * - Accessibility support
 */
"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { LucideIcon } from "lucide-react";

const badgeVariants = cva(
  [
    "inline-flex items-center justify-center gap-1.5 rounded-full",
    "font-terminal-mono font-semibold tracking-wide uppercase transition-all",
    "border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  ],
  {
    variants: {
      variant: {
        default: [
          "bg-terminal-gray/10 text-terminal-gray border-terminal-gray/30",
          "focus-visible:ring-terminal-gray",
        ],
        primary: [
          "bg-terminal-green/10 text-terminal-green border-terminal-green/30",
          "focus-visible:ring-terminal-green",
        ],
        secondary: [
          "bg-terminal-cyan/10 text-terminal-cyan border-terminal-cyan/30",
          "focus-visible:ring-terminal-cyan",
        ],
        success: [
          "bg-terminal-green/10 text-terminal-green border-terminal-green/30",
          "focus-visible:ring-terminal-green",
        ],
        warning: [
          "bg-terminal-warning/10 text-terminal-warning border-terminal-warning/30",
          "focus-visible:ring-terminal-warning",
        ],
        danger: [
          "bg-terminal-danger/10 text-terminal-danger border-terminal-danger/30",
          "focus-visible:ring-terminal-danger",
        ],
        outline: [
          "border-current/30 text-current bg-transparent",
          "focus-visible:ring-current",
        ],
      },
      size: {
        sm: "px-2 py-0.5 text-xs h-5",
        md: "px-3 py-1 text-xs h-6",
        lg: "px-4 py-1.5 text-sm h-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Optional icon to display before the badge text */
  icon?: LucideIcon;
  /** Icon size in pixels */
  iconSize?: number;
  /** Screen reader label for accessibility */
  "aria-label"?: string;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ 
    className, 
    variant, 
    size, 
    icon: Icon, 
    iconSize, 
    children, 
    "aria-label": ariaLabel,
    ...props 
  }, ref) => {
    // Calculate icon size based on badge size
    const defaultIconSize = size === "sm" ? 10 : size === "lg" ? 14 : 12;
    const actualIconSize = iconSize ?? defaultIconSize;

    return (
      <span
        ref={ref}
        className={badgeVariants({ variant, size, className })}
        aria-label={ariaLabel}
        {...props}
      >
        {Icon && (
          <Icon 
            size={actualIconSize} 
            aria-hidden="true"
            className="shrink-0"
          />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };