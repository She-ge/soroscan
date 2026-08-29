import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-lg overflow-hidden border border-gray-200 dark:border-terminal-medium",
  {
    variants: {
      variant: {
        default: "shadow-sm",
        flat: "",
        elevated: "shadow-lg",
      },
      background: {
        white: "bg-white dark:bg-terminal-black text-gray-900 dark:text-terminal-light",
        gray: "bg-gray-50 dark:bg-terminal-dark text-gray-900 dark:text-terminal-light",
        blue: "bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200",
        green: "bg-green-50 dark:bg-green-950/40 text-green-900 dark:text-green-200",
        yellow: "bg-yellow-50 dark:bg-yellow-950/40 text-yellow-900 dark:text-yellow-200",
        red: "bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200",
      },
    },
    defaultVariants: {
      variant: "default",
      background: "white",
    },
  }
)

export interface CardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof cardVariants> {
  /** Enable hover lift effect */
  hoverable?: boolean
  /** Optional title rendered in the card header */
  title?: React.ReactNode
  /** Optional footer content */
  footer?: React.ReactNode
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "default",
      background = "white",
      hoverable = false,
      title,
      footer,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        data-slot="card"
        data-variant={variant}
        data-background={background}
        className={cn(
          cardVariants({ variant, background }),
          hoverable &&
            cn(
              "transition-shadow duration-200 cursor-pointer",
              variant === "elevated" ? "hover:shadow-xl" : "hover:shadow-md"
            ),
          className
        )}
        {...props}
      >
        {title != null && title !== "" && (
          <div
            data-slot="card-header"
            className="px-4 py-3 border-b border-gray-200 dark:border-terminal-medium font-semibold text-gray-800 dark:text-terminal-light"
          >
            {title}
          </div>
        )}

        <div data-slot="card-body" className="p-4">
          {children}
        </div>

        {footer != null && footer !== "" && (
          <div
            data-slot="card-footer"
            className="px-4 py-3 border-t border-gray-200 dark:border-terminal-medium text-sm text-gray-500 dark:text-terminal-gray"
          >
            {footer}
          </div>
        )}
      </div>
    )
  }
)
Card.displayName = "Card"

export { Card, cardVariants }
