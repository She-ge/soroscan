"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { TerminalCursor } from "@/components/terminal/Motion"
import {
  runValidators,
  type ValidatorConfig,
} from "@/lib/validators"

export type ValidatedInputHandle = {
  /** Run validators and surface errors. Returns true when valid. */
  validate: () => boolean
  /** Current validation error, if any. */
  getError: () => string | null
}

export type ValidatedInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "minLength" | "maxLength" | "id"
> & {
  /** Field label rendered above the input (terminal style). */
  label?: string
  /** Helper / hint text shown when there is no error. */
  hint?: React.ReactNode
  /** Stable id; generated when omitted. */
  id?: string
  /** Built-in validators: required, email, url, minLength, maxLength. */
  validators?: ValidatorConfig
  /** External error overrides built-in validation display. */
  error?: string | null
  /** Show green checkmark when the value is valid after interaction. Default true. */
  showSuccess?: boolean
  /** Show blinking terminal cursor when focused. Default true. */
  showCursor?: boolean
  /** Validate on blur (default) and/or change after first blur. */
  validateOn?: "blur" | "change" | "both"
  containerClassName?: string
  labelClassName?: string
  hintClassName?: string
  errorClassName?: string
  onValidationChange?: (isValid: boolean, error: string | null) => void
}

/**
 * Terminal-styled input with built-in validation feedback.
 * Displays red error text below the field and a green checkmark on success.
 */
const ValidatedInput = React.forwardRef<
  ValidatedInputHandle,
  ValidatedInputProps
>(function ValidatedInput(
  {
    label,
    hint,
    id: idProp,
    validators,
    error: externalError,
    showSuccess = true,
    showCursor = true,
    validateOn = "both",
    containerClassName,
    labelClassName,
    hintClassName,
    errorClassName,
    className,
    type = "text",
    value,
    defaultValue,
    onChange,
    onBlur,
    onFocus,
    onValidationChange,
    disabled,
    ...props
  },
  ref
) {
  const generatedId = React.useId()
  const id = idProp ?? generatedId
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = React.useState(
    () => String(defaultValue ?? "")
  )
  const currentValue = isControlled ? String(value ?? "") : internalValue

  const [touched, setTouched] = React.useState(false)
  const [internalError, setInternalError] = React.useState<string | null>(null)
  const [focused, setFocused] = React.useState(false)

  const applyValidation = React.useCallback(
    (nextValue: string): string | null => {
      const result = runValidators(nextValue, validators)
      setInternalError(result)
      onValidationChange?.(result === null, result)
      return result
    },
    [validators, onValidationChange]
  )

  React.useImperativeHandle(
    ref,
    () => ({
      validate: () => {
        setTouched(true)
        return applyValidation(currentValue) === null
      },
      getError: () => externalError ?? internalError,
    }),
    [applyValidation, currentValue, externalError, internalError]
  )

  const displayError =
    externalError !== undefined && externalError !== null && externalError !== ""
      ? externalError
      : touched
        ? internalError
        : null

  const hasError = Boolean(displayError)
  const isSuccess =
    showSuccess &&
    touched &&
    !hasError &&
    currentValue.trim().length > 0 &&
    runValidators(currentValue, validators) === null

  const describedBy = [
    hint && !hasError ? hintId : null,
    hasError ? errorId : null,
  ]
    .filter(Boolean)
    .join(" ")

  const shouldValidateOnChange =
    validateOn === "change" || validateOn === "both"
  const shouldValidateOnBlur =
    validateOn === "blur" || validateOn === "both"

  return (
    <div
      data-slot="validated-input"
      className={cn("w-full space-y-1 group", containerClassName)}
    >
      {label ? (
        <label
          htmlFor={id}
          className={cn(
            "text-xs font-terminal-mono text-terminal-cyan uppercase tracking-wider block ml-1",
            labelClassName
          )}
        >
          {label}
        </label>
      ) : null}

      <div className="relative flex items-center">
        <span className="absolute left-3 text-terminal-green font-terminal-mono transition-terminal-fast group-focus-within:opacity-100 opacity-70 pointer-events-none">
          &gt;
        </span>
        <input
          id={id}
          type={type}
          disabled={disabled}
          value={isControlled ? value : undefined}
          defaultValue={!isControlled ? defaultValue : undefined}
          aria-invalid={hasError ? true : undefined}
          aria-errormessage={hasError ? errorId : undefined}
          aria-describedby={describedBy || undefined}
          data-state={hasError ? "error" : isSuccess ? "success" : "default"}
          className={cn(
            "flex h-11 min-h-[44px] w-full bg-terminal-black border-terminal border-terminal-gray/40 px-8 py-2 text-sm font-terminal-mono text-terminal-green ring-offset-terminal-black file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-terminal-gray focus-visible:outline-none focus-visible:border-terminal-green focus-visible:shadow-glow-green transition-terminal-normal disabled:cursor-not-allowed disabled:opacity-50",
            hasError &&
              "border-terminal-danger text-terminal-danger focus-visible:border-terminal-danger focus-visible:shadow-glow-danger",
            isSuccess &&
              "border-terminal-green focus-visible:border-terminal-green pr-12",
            className
          )}
          onChange={(event) => {
            const next = event.target.value
            if (!isControlled) setInternalValue(next)
            if (touched && shouldValidateOnChange) {
              applyValidation(next)
            }
            onChange?.(event)
          }}
          onFocus={(event) => {
            setFocused(true)
            onFocus?.(event)
          }}
          onBlur={(event) => {
            setFocused(false)
            setTouched(true)
            if (shouldValidateOnBlur) {
              applyValidation(event.target.value)
            }
            onBlur?.(event)
          }}
          {...props}
        />

        {isSuccess ? (
          <span
            data-testid="validated-input-success"
            aria-hidden="true"
            className="absolute right-3 flex h-5 w-5 items-center justify-center rounded-full border border-terminal-green text-terminal-green"
          >
            <Check className="h-3 w-3" strokeWidth={3} />
          </span>
        ) : showCursor && focused ? (
          <TerminalCursor className="pointer-events-none absolute right-8" />
        ) : (
          <div className="absolute right-3 w-2 h-2 rounded-full border border-terminal-green/40 group-focus-within:bg-terminal-green group-focus-within:shadow-glow-green transition-terminal-fast" />
        )}
      </div>

      {hint !== undefined && hint !== null && !hasError ? (
        <p
          id={hintId}
          data-slot="validated-input-hint"
          className={cn(
            "text-[10px] text-terminal-gray/70 ml-1 font-terminal-mono",
            hintClassName
          )}
        >
          {hint}
        </p>
      ) : null}

      {hasError ? (
        <p
          id={errorId}
          role="alert"
          data-slot="validated-input-error"
          className={cn(
            "text-terminal-danger text-[10px] mt-1 ml-1 font-terminal-mono",
            errorClassName
          )}
        >
          {displayError}
        </p>
      ) : null}
    </div>
  )
})

ValidatedInput.displayName = "ValidatedInput"

export { ValidatedInput }
