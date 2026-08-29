"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const stepperVariants = cva("flex gap-4", {
  variants: {
    orientation: {
      horizontal: "flex-row items-start overflow-x-auto pb-1",
      vertical: "flex-col",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
})

const stepItemVariants = cva(
  "group flex min-h-11 items-start gap-3 rounded-md text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "text-sm",
        md: "text-sm",
        lg: "text-base",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

export interface StepperItem {
  id: string
  title: React.ReactNode
  description?: React.ReactNode
  optional?: boolean
  disabled?: boolean
}

export interface StepperProps
  extends Omit<React.HTMLAttributes<HTMLOListElement>, "onChange">,
    VariantProps<typeof stepperVariants>,
    VariantProps<typeof stepItemVariants> {
  items: StepperItem[]
  currentStep: number
  onStepChange?: (step: number) => void
}

const Stepper = React.forwardRef<HTMLOListElement, StepperProps>(
  (
    { className, items, currentStep, onStepChange, orientation, size, ...props },
    ref
  ) => {
    return (
      <ol
        ref={ref}
        data-slot="stepper"
        className={cn(stepperVariants({ orientation }), className)}
        {...props}
      >
        {items.map((item, index) => {
          const stepNumber = index + 1
          const state =
            currentStep === stepNumber
              ? "current"
              : currentStep > stepNumber
                ? "complete"
                : "upcoming"

          return (
            <li
              key={item.id}
              aria-current={state === "current" ? "step" : undefined}
              data-state={state}
              className={cn(
                "min-w-0",
                orientation === "horizontal" ? "min-w-[13rem] flex-1" : "w-full"
              )}
            >
              <button
                type="button"
                disabled={item.disabled}
                data-slot="stepper-item"
                className={cn(stepItemVariants({ size }), "w-full")}
                onClick={() => {
                  if (!item.disabled) {
                    onStepChange?.(stepNumber)
                  }
                }}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                    state === "complete" && "border-terminal-green bg-terminal-green text-terminal-black",
                    state === "current" && "border-primary bg-primary text-primary-foreground",
                    state === "upcoming" && "border-border bg-muted text-muted-foreground"
                  )}
                >
                  {state === "complete" ? "✓" : stepNumber}
                </span>

                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <span>{item.title}</span>
                    {item.optional ? (
                      <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                    ) : null}
                  </span>
                  {item.description ? (
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  ) : null}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    )
  }
)

Stepper.displayName = "Stepper"

export { Stepper, stepperVariants, stepItemVariants }
