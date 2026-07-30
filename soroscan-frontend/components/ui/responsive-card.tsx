/**
 * ResponsiveCard Component (FE-152)
 *
 * A responsive card component that adapts to different screen sizes and
 * adheres to the SoroScan design system tokens. Includes accessibility support,
 * keyboard navigation, and terminal theme styling.
 *
 * @component
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Responsive card style variants
 */
const responsiveCardVariants = cva(
  cn(
    // Base layout
    "w-full rounded-lg border overflow-hidden transition-all duration-300",
    // Responsive sizing
    "px-3 sm:px-4 md:px-5 lg:px-6",
    "py-3 sm:py-4 md:py-5 lg:py-6",
    // Dark mode border
    "border-gray-200 dark:border-terminal-medium",
    // Focus states for accessibility
    "focus-within:outline-none focus-within:ring-2 focus-within:ring-terminal-cyan/50",
    // Keyboard navigation support
    "focus-within:ring-offset-2 dark:focus-within:ring-offset-terminal-black"
  ),
  {
    variants: {
      variant: {
        /**
         * Default card with subtle shadow
         */
        default: cn(
          "shadow-sm hover:shadow-md",
          "bg-white dark:bg-terminal-black",
          "text-gray-900 dark:text-terminal-light"
        ),

        /**
         * Flat card with no shadow
         */
        flat: cn(
          "bg-white dark:bg-terminal-black",
          "text-gray-900 dark:text-terminal-light"
        ),

        /**
         * Elevated card with pronounced shadow
         */
        elevated: cn(
          "shadow-lg hover:shadow-xl",
          "bg-white dark:bg-terminal-black",
          "text-gray-900 dark:text-terminal-light"
        ),

        /**
         * Ghost card with transparent background
         */
        ghost: cn(
          "border-dashed",
          "bg-transparent",
          "hover:bg-gray-50 dark:hover:bg-terminal-dark"
        ),

        /**
         * Success state card
         */
        success: cn(
          "border-terminal-green/30 dark:border-terminal-green/30",
          "bg-green-50 dark:bg-green-950/20",
          "text-green-900 dark:text-terminal-green",
          "shadow-sm shadow-terminal-green/5"
        ),

        /**
         * Warning state card
         */
        warning: cn(
          "border-terminal-warning/30",
          "bg-yellow-50 dark:bg-yellow-950/20",
          "text-yellow-900 dark:text-terminal-warning",
          "shadow-sm shadow-terminal-warning/5"
        ),

        /**
         * Danger state card
         */
        danger: cn(
          "border-terminal-danger/30",
          "bg-red-50 dark:bg-red-950/20",
          "text-red-900 dark:text-terminal-danger",
          "shadow-sm shadow-terminal-danger/5"
        ),

        /**
         * Info state card
         */
        info: cn(
          "border-terminal-cyan/30",
          "bg-blue-50 dark:bg-blue-950/20",
          "text-blue-900 dark:text-terminal-cyan",
          "shadow-sm shadow-terminal-cyan/5"
        ),
      },

      /**
       * Responsive spacing sizes
       */
      spacing: {
        compact: "gap-2 sm:gap-3",
        default: "gap-3 sm:gap-4 md:gap-5",
        loose: "gap-4 sm:gap-5 md:gap-6 lg:gap-8",
      },

      /**
       * Enable/disable hover effects
       */
      hoverable: {
        true: "cursor-pointer transition-transform hover:scale-102",
        false: "",
      },

      /**
       * Card borders
       */
      border: {
        none: "border-0",
        thin: "border",
        thick: "border-2",
      },

      /**
       * Responsive radius
       */
      rounded: {
        sm: "rounded-sm sm:rounded-md",
        md: "rounded-md sm:rounded-lg",
        lg: "rounded-lg sm:rounded-xl",
        full: "rounded-full",
      },
    },

    defaultVariants: {
      variant: "default",
      spacing: "default",
      hoverable: false,
      border: "thin",
      rounded: "md",
    },
  }
);

/**
 * Header component for responsive card
 */
const ResponsiveCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="responsive-card-header"
    className={cn(
      "px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-3 md:py-4",
      "border-b border-gray-200 dark:border-terminal-medium",
      "font-semibold text-base sm:text-lg",
      "text-gray-800 dark:text-terminal-light",
      className
    )}
    {...props}
  />
));
ResponsiveCardHeader.displayName = "ResponsiveCardHeader";

/**
 * Body component for responsive card
 */
const ResponsiveCardBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="responsive-card-body"
    className={cn(
      "px-3 sm:px-4 md:px-5 lg:px-6",
      "py-3 sm:py-4 md:py-5 lg:py-6",
      "text-sm sm:text-base",
      className
    )}
    {...props}
  />
));
ResponsiveCardBody.displayName = "ResponsiveCardBody";

/**
 * Footer component for responsive card
 */
const ResponsiveCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="responsive-card-footer"
    className={cn(
      "px-3 sm:px-4 md:px-5 lg:px-6",
      "py-2 sm:py-3 md:py-4",
      "border-t border-gray-200 dark:border-terminal-medium",
      "text-xs sm:text-sm",
      "text-gray-500 dark:text-terminal-gray",
      "bg-gray-50 dark:bg-terminal-dark/50",
      className
    )}
    {...props}
  />
));
ResponsiveCardFooter.displayName = "ResponsiveCardFooter";

/**
 * Props for ResponsiveCard component
 */
export interface ResponsiveCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof responsiveCardVariants> {
  /** Optional title rendered in the card header */
  title?: React.ReactNode;

  /** Optional footer content */
  footer?: React.ReactNode;

  /** Optional description shown in header */
  description?: React.ReactNode;

  /** Optional icon shown in header */
  icon?: React.ReactNode;

  /** Make the card clickable with hover effects */
  clickable?: boolean;

  /** Optional click handler */
  onClick?: React.MouseEventHandler<HTMLDivElement>;

  /** Optional aria-label for accessibility */
  ariaLabel?: string;

  /** Optional role attribute */
  role?: string;

  /** Optional keyboard handler for Enter/Space keys */
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
}

/**
 * ResponsiveCard Component
 *
 * A responsive card component that adapts to different screen sizes.
 * Features:
 * - Responsive padding and spacing that scales with screen size
 * - Terminal theme color tokens for dark mode
 * - Accessibility support with keyboard navigation
 * - Multiple visual variants (default, flat, elevated, ghost, etc.)
 * - Support for header, body, and footer sections
 * - Hover effects and interactive states
 *
 * @example
 * ```tsx
 * <ResponsiveCard variant="elevated" title="Events" hoverable>
 *   <p>Card content here</p>
 * </ResponsiveCard>
 * ```
 */
const ResponsiveCard = React.forwardRef<
  HTMLDivElement,
  ResponsiveCardProps
>(
  (
    {
      className,
      variant = "default",
      spacing = "default",
      hoverable = false,
      border = "thin",
      rounded = "md",
      title,
      description,
      icon,
      footer,
      clickable = false,
      onClick,
      ariaLabel,
      role = clickable ? "button" : "article",
      onKeyDown,
      children,
      ...props
    },
    ref
  ) => {
    const isInteractive = clickable || onClick !== undefined;

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      // Handle Enter and Space keys for interactive cards
      if (isInteractive && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        onClick?.(event as React.MouseEvent<HTMLDivElement>);
      }

      onKeyDown?.(event);
    };

    return (
      <div
        ref={ref}
        data-slot="responsive-card"
        data-variant={variant}
        role={role}
        tabIndex={isInteractive ? 0 : -1}
        aria-label={ariaLabel}
        className={cn(
          responsiveCardVariants({
            variant,
            spacing,
            hoverable: hoverable || isInteractive,
            border,
            rounded,
            className,
          })
        )}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {/* Header section */}
        {(title || description || icon) && (
          <ResponsiveCardHeader>
            <div className="flex items-start gap-3 sm:gap-4">
              {icon && (
                <div
                  className="flex-shrink-0 text-lg sm:text-xl md:text-2xl"
                  aria-hidden="true"
                >
                  {icon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                {title && (
                  <h3
                    className={cn(
                      "text-base sm:text-lg font-semibold truncate",
                      "text-gray-900 dark:text-terminal-light"
                    )}
                  >
                    {title}
                  </h3>
                )}
                {description && (
                  <p
                    className={cn(
                      "text-xs sm:text-sm mt-1",
                      "text-gray-600 dark:text-terminal-gray"
                    )}
                  >
                    {description}
                  </p>
                )}
              </div>
            </div>
          </ResponsiveCardHeader>
        )}

        {/* Body section */}
        <ResponsiveCardBody>{children}</ResponsiveCardBody>

        {/* Footer section */}
        {footer && <ResponsiveCardFooter>{footer}</ResponsiveCardFooter>}
      </div>
    );
  }
);
ResponsiveCard.displayName = "ResponsiveCard";

export {
  ResponsiveCard,
  ResponsiveCardHeader,
  ResponsiveCardBody,
  ResponsiveCardFooter,
  responsiveCardVariants,
};
