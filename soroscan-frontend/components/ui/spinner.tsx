import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const spinnerVariants = cva(
  "inline-block animate-spin rounded-full border-2 border-current border-t-transparent",
  {
    variants: {
      size: {
        mini: "h-4 w-4",
        default: "h-8 w-8",
        large: "h-12 w-12",
      },
      color: {
        default: "text-foreground",
        success: "text-green-500",
        warning: "text-yellow-500",
        error: "text-red-500",
      },
    },
    defaultVariants: {
      size: "default",
      color: "default",
    },
  }
)

interface SpinnerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof spinnerVariants> {
  label?: string
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size, color, label = "Loading...", ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        aria-label={label}
        className={cn(spinnerVariants({ size, color }), className)}
        {...props}
      >
        <span className="sr-only">{label}</span>
      </div>
    )
  }
)
Spinner.displayName = "Spinner"

export { Spinner, spinnerVariants }