"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "h-5 w-9",
        md: "h-6 w-11",
        lg: "h-7 w-14",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

const thumbVariants = cva(
  "pointer-events-none inline-block rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out",
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        md: "h-5 w-5",
        lg: "h-6 w-6",
      },
      checked: {
        true: "",
        false: "",
      },
      sizeChecked: {
        sm: "translate-x-4",
        md: "translate-x-5",
        lg: "translate-x-7",
      },
    },
    compoundVariants: [
      { size: "sm", checked: true, className: "translate-x-4" },
      { size: "md", checked: true, className: "translate-x-5" },
      { size: "lg", checked: true, className: "translate-x-7" },
      { size: "sm", checked: false, className: "translate-x-0" },
      { size: "md", checked: false, className: "translate-x-0" },
      { size: "lg", checked: false, className: "translate-x-0" },
    ],
    defaultVariants: {
      size: "md",
      checked: false,
    },
  }
)

interface ToggleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size">,
    VariantProps<typeof toggleVariants> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  label?: string
  hideLabel?: boolean
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  (
    {
      className,
      size,
      checked: controlledChecked,
      onCheckedChange,
      defaultChecked,
      label,
      hideLabel = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked ?? false)
    const isControlled = controlledChecked !== undefined
    const isChecked = isControlled ? controlledChecked : internalChecked

    const handleToggle = React.useCallback(() => {
      if (disabled) return
      const newChecked = !isChecked
      if (!isControlled) setInternalChecked(newChecked)
      onCheckedChange?.(newChecked)
    }, [disabled, isChecked, isControlled, onCheckedChange])

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault()
          handleToggle()
        }
      },
      [handleToggle]
    )

    const toggleId = React.useId()

    return (
      <div className="inline-flex items-center gap-2">
        <button
          ref={ref}
          id={toggleId}
          type="button"
          role="switch"
          aria-checked={isChecked}
          aria-label={hideLabel ? label : undefined}
          disabled={disabled}
          data-slot="toggle"
          data-state={isChecked ? "checked" : "unchecked"}
          className={cn(
            toggleVariants({ size }),
            isChecked ? "bg-primary" : "bg-input",
            className
          )}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          {...props}
        >
          <span
            aria-hidden="true"
            className={cn(
              thumbVariants({ size, checked: isChecked }),
              isChecked ? "translate-x-full" : "translate-x-0"
            )}
          />
        </button>
        {label && (
          <label
            htmlFor={toggleId}
            className={cn(
              "text-sm font-medium leading-none cursor-pointer select-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              hideLabel && "sr-only"
            )}
            onClick={(e) => {
              e.preventDefault()
              handleToggle()
            }}
          >
            {label}
          </label>
        )}
      </div>
    )
  }
)
Toggle.displayName = "Toggle"

export { Toggle, toggleVariants }
