"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends Omit<
    React.ComponentPropsWithoutRef<"input">,
    "type" | "checked" | "defaultChecked" | "onChange"
  > {
  label: React.ReactNode
  checked: boolean
  indeterminate?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(
    {
      id,
      className,
      label,
      checked,
      indeterminate = false,
      disabled = false,
      onCheckedChange,
      ...props
    },
    forwardedRef,
  ) {
    const generatedId = React.useId()
    const checkboxId = id ?? `checkbox-${generatedId}`
    const internalRef = React.useRef<HTMLInputElement>(null)

    React.useImperativeHandle(
      forwardedRef,
      () => internalRef.current as HTMLInputElement,
    )

    React.useEffect(() => {
      if (!internalRef.current) {
        return
      }

      internalRef.current.indeterminate = indeterminate
    }, [indeterminate])

    const state = indeterminate
      ? "indeterminate"
      : checked
        ? "checked"
        : "unchecked"

    return (
      <div
        className={cn(
          "inline-flex items-center",
          disabled && "cursor-not-allowed",
          className,
        )}
        data-disabled={disabled || undefined}
        data-state={state}
      >
        <input
          {...props}
          ref={internalRef}
          id={checkboxId}
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          aria-checked={indeterminate ? "mixed" : checked}
          aria-disabled={disabled}
          data-state={state}
          onChange={(event) => {
            onCheckedChange?.(event.currentTarget.checked)
          }}
        />

        <label
          htmlFor={checkboxId}
          className={cn(
            "inline-flex items-center gap-2 text-sm font-medium",
            disabled
              ? "cursor-not-allowed text-muted-foreground"
              : "cursor-pointer",
          )}
        >
          <span
            aria-hidden="true"
            data-testid="checkbox-indicator"
            data-state={state}
            className={cn(
              "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
              "peer-focus-visible:ring-ring/50 peer-focus-visible:ring-[3px]",
              checked || indeterminate
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background",
              disabled && "opacity-60",
            )}
          >
            {indeterminate ? (
              <span
                data-testid="indeterminate-icon"
                className="h-0.5 w-2 rounded bg-current"
              />
            ) : checked ? (
              <svg
                data-testid="checked-icon"
                viewBox="0 0 16 16"
                className="h-3 w-3 fill-none stroke-current"
                aria-hidden="true"
              >
                <path
                  d="M3.5 8.5 6.5 11.5 12.5 4.5"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </span>

          <span>{label}</span>
        </label>
      </div>
    )
  },
)

Checkbox.displayName = "Checkbox"

export { Checkbox }
