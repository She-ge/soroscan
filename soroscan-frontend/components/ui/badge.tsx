/**
 * Badge Component
 * ──────────────────────────────────────────────────────────────────────────────
 * A reusable badge for statuses, labels, and tags.
 *
 * Features:
 * - Success, error, warning, and info variants
 * - Compact, normal, small, medium, and large sizes
 * - Rounded and square shapes
 * - Optional Lucide icon
 * - Optional dismiss button
 * - Backwards-compatible variants used by the existing application
 */

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { LucideIcon } from 'lucide-react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  [
    'inline-flex items-center justify-center gap-1.5',
    'border font-terminal-mono font-semibold uppercase tracking-wide',
    'transition-all',
    'focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-offset-2',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-terminal-gray/30 bg-terminal-gray/10 text-terminal-gray',
          'focus-visible:ring-terminal-gray',
        ],
        primary: [
          'border-terminal-green/30 bg-terminal-green/10 text-terminal-green',
          'focus-visible:ring-terminal-green',
        ],
        secondary: [
          'border-terminal-cyan/30 bg-terminal-cyan/10 text-terminal-cyan',
          'focus-visible:ring-terminal-cyan',
        ],
        success: [
          'border-terminal-green/30 bg-terminal-green/10 text-terminal-green',
          'focus-visible:ring-terminal-green',
        ],
        error: [
          'border-terminal-danger/30 bg-terminal-danger/10 text-terminal-danger',
          'focus-visible:ring-terminal-danger',
        ],
        danger: [
          'border-terminal-danger/30 bg-terminal-danger/10 text-terminal-danger',
          'focus-visible:ring-terminal-danger',
        ],
        warning: [
          'border-terminal-warning/30 bg-terminal-warning/10 text-terminal-warning',
          'focus-visible:ring-terminal-warning',
        ],
        info: [
          'border-terminal-cyan/30 bg-terminal-cyan/10 text-terminal-cyan',
          'focus-visible:ring-terminal-cyan',
        ],
        outline: ['border-current/30 bg-transparent text-current', 'focus-visible:ring-current'],
      },
      size: {
        compact: 'h-5 px-2 py-0.5 text-xs',
        normal: 'h-6 px-3 py-1 text-xs',
        sm: 'h-5 px-2 py-0.5 text-xs',
        md: 'h-6 px-3 py-1 text-xs',
        lg: 'h-8 px-4 py-1.5 text-sm',
      },
      shape: {
        rounded: 'rounded-full',
        square: 'rounded-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'normal',
      shape: 'rounded',
    },
  },
);

type BadgeVariantProps = VariantProps<typeof badgeVariants>;

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'onDismiss'>, BadgeVariantProps {
  /**
   * Optional Lucide icon displayed before the badge content.
   */
  icon?: LucideIcon;

  /**
   * Overrides the automatically selected icon size.
   */
  iconSize?: number;

  /**
   * Displays a dismiss button when true.
   */
  dismissible?: boolean;

  /**
   * Called when the dismiss button is clicked.
   */
  onDismiss?: () => void;

  /**
   * Accessible label for the dismiss button.
   */
  dismissLabel?: string;
}

function getDefaultIconSize(size: BadgeVariantProps['size']): number {
  if (size === 'compact' || size === 'sm') {
    return 10;
  }

  if (size === 'lg') {
    return 14;
  }

  return 12;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      shape,
      icon: Icon,
      iconSize,
      dismissible = false,
      onDismiss,
      dismissLabel = 'Dismiss badge',
      children,
      'aria-label': ariaLabel,
      ...props
    },
    ref,
  ) => {
    const [isVisible, setIsVisible] = React.useState(true);
    const actualIconSize = iconSize ?? getDefaultIconSize(size);

    const handleDismiss = (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.preventDefault();
      event.stopPropagation();

      setIsVisible(false);
      onDismiss?.();
    };

    if (!isVisible) {
      return null;
    }

    return (
      <span
        ref={ref}
        data-slot="badge"
        className={cn(
          badgeVariants({
            variant,
            size,
            shape,
          }),
          className,
        )}
        aria-label={ariaLabel}
        {...props}
      >
        {Icon ? (
          <Icon
            data-slot="badge-icon"
            size={actualIconSize}
            aria-hidden="true"
            className="shrink-0"
          />
        ) : null}

        <span data-slot="badge-content">{children}</span>

        {dismissible ? (
          <button
            type="button"
            data-slot="badge-dismiss"
            aria-label={dismissLabel}
            onClick={handleDismiss}
            className={cn(
              '-mr-1 inline-flex shrink-0 items-center justify-center',
              'rounded-full opacity-70 transition-opacity',
              'hover:opacity-100',
              'focus-visible:outline-none focus-visible:ring-1',
              'focus-visible:ring-current',
            )}
          >
            <X size={actualIconSize} aria-hidden="true" />
          </button>
        ) : null}
      </span>
    );
  },
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
