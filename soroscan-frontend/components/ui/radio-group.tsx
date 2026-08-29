"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const radioGroupVariants = cva("flex gap-3", {
  variants: {
    orientation: {
      horizontal: "flex-row flex-wrap",
      vertical: "flex-col",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
})

const radioItemVariants = cva(
  "flex min-h-11 items-center gap-3 rounded-md border border-border bg-background px-4 py-3 text-sm transition-colors outline-none hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "px-3 py-2 text-sm",
        md: "px-4 py-3 text-sm",
        lg: "px-5 py-4 text-base",
      },
      checked: {
        true: "border-primary bg-primary/5",
        false: "",
      },
    },
    defaultVariants: {
      size: "md",
      checked: false,
    },
  }
)

export interface RadioOption {
  value: string
  label: React.ReactNode
  description?: React.ReactNode
  disabled?: boolean
}

export interface RadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">,
    VariantProps<typeof radioGroupVariants>,
    VariantProps<typeof radioItemVariants> {
  options: RadioOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  name?: string
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      className,
      options,
      value,
      defaultValue,
      onValueChange,
      orientation,
      size,
      name,
      ...props
    },
    ref
  ) => {
    const isControlled = value !== undefined
    const [internalValue, setInternalValue] = React.useState(defaultValue)
    const selectedValue = isControlled ? value : internalValue
    const optionRefs = React.useRef<Array<HTMLButtonElement | null>>([])

    const updateValue = React.useCallback(
      (nextValue: string, disabled?: boolean) => {
        if (disabled) {
          return
        }

        if (!isControlled) {
          setInternalValue(nextValue)
        }

        onValueChange?.(nextValue)
      },
      [isControlled, onValueChange]
    )

    const moveFocus = React.useCallback(
      (currentIndex: number, step: 1 | -1) => {
        for (let offset = 1; offset <= options.length; offset += 1) {
          const nextIndex = (currentIndex + offset * step + options.length) % options.length
          const nextOption = options[nextIndex]

          if (!nextOption?.disabled) {
            optionRefs.current[nextIndex]?.focus()
            updateValue(nextOption.value)
            return
          }
        }
      },
      [options, updateValue]
    )

    const groupLabel = name ?? "Radio group"

    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-label={groupLabel}
        data-slot="radio-group"
        className={cn(radioGroupVariants({ orientation }), className)}
        {...props}
      >
        {options.map((option, index) => {
          const isChecked = selectedValue === option.value

          return (
            <button
              key={option.value}
              ref={(node) => {
                optionRefs.current[index] = node
              }}
              type="button"
              role="radio"
              aria-checked={isChecked}
              aria-disabled={option.disabled ? "true" : undefined}
              data-state={isChecked ? "checked" : "unchecked"}
              data-slot="radio-group-item"
              disabled={option.disabled}
              className={cn(radioItemVariants({ size, checked: isChecked }))}
              onClick={() => updateValue(option.value, option.disabled)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown" || event.key === "ArrowRight") {
                  event.preventDefault()
                  moveFocus(index, 1)
                }

                if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
                  event.preventDefault()
                  moveFocus(index, -1)
                }

                if (event.key === " " || event.key === "Enter") {
                  event.preventDefault()
                  updateValue(option.value, option.disabled)
                }
              }}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-primary",
                  isChecked && "bg-primary"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full bg-primary-foreground transition-opacity",
                    isChecked ? "opacity-100" : "opacity-0"
                  )}
                />
              </span>
              <span className="flex min-w-0 flex-col text-left">
                <span className="font-medium text-foreground">{option.label}</span>
                {option.description ? (
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                ) : null}
              </span>
            </button>
          )
        })}
      </div>
    )
  }
)

RadioGroup.displayName = "RadioGroup"

export { RadioGroup, radioGroupVariants, radioItemVariants }
