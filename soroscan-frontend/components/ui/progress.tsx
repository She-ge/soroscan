"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const progressTrackVariants = cva(
  "relative w-full overflow-hidden rounded-full bg-muted",
  {
    variants: {
      size: {
        sm: "h-1.5",
        md: "h-2.5",
        lg: "h-4",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const progressBarVariants = cva(
  "h-full w-full flex-1 rounded-full transition-all duration-500 ease-in-out",
  {
    variants: {
      variant: {
        default: "bg-primary",
        success: "bg-green-500",
        warning: "bg-yellow-500",
        danger: "bg-red-500",
        info: "bg-blue-500",
        terminal: "bg-terminal-green",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressTrackVariants>,
    VariantProps<typeof progressBarVariants> {
  value: number
  max?: number
  showLabel?: boolean
  labelPosition?: "inside" | "outside" | "none"
  labelFormatter?: (value: number, max: number) => string
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      size,
      variant,
      value,
      max = 100,
      showLabel = false,
      labelPosition = "outside",
      labelFormatter,
      ...props
    },
    ref
  ) => {
    const clampedValue = Math.min(Math.max(value, 0), max)
    const percentage = max > 0 ? Math.round((clampedValue / max) * 100) : 0
    const formatLabel = labelFormatter ?? ((v: number, m: number) => `${Math.round((v / m) * 100)}%`)

    const bar = (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${percentage}% complete`}
        data-slot="progress"
        data-value={percentage}
        className={cn(progressTrackVariants({ size }), className)}
        {...props}
      >
        <div
          className={cn(
            progressBarVariants({ variant }),
            "flex items-center justify-center"
          )}
          style={{ width: `${percentage}%` }}
        >
          {showLabel && labelPosition === "inside" && size === "lg" && (
            <span className="text-[10px] font-bold text-white leading-none">
              {formatLabel(clampedValue, max)}
            </span>
          )}
        </div>
      </div>
    )

    if (showLabel && labelPosition === "outside") {
      return (
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1">{bar}</div>
          <span className="text-sm text-muted-foreground font-medium whitespace-nowrap min-w-[3ch] text-right">
            {formatLabel(clampedValue, max)}
          </span>
        </div>
      )
    }

    return bar
  }
)
Progress.displayName = "Progress"

export { Progress, progressTrackVariants, progressBarVariants }
