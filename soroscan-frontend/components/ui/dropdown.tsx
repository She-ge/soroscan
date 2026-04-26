"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface DropdownOption {
  label: string
  value: string
  disabled?: boolean
}

export interface DropdownProps
  extends Omit<React.ComponentProps<"button">, "onChange" | "value"> {
  options: DropdownOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
}

function getNextEnabledIndex(
  options: DropdownOption[],
  startIndex: number,
  step: 1 | -1
) {
  if (!options.length) {
    return -1
  }

  for (let offset = 1; offset <= options.length; offset += 1) {
    const index = (startIndex + offset * step + options.length) % options.length

    if (!options[index]?.disabled) {
      return index
    }
  }

  return -1
}

const Dropdown = React.forwardRef<HTMLButtonElement, DropdownProps>(
  function Dropdown(
    {
      className,
      options,
      value,
      onChange,
      placeholder = "Select an option",
      disabled = false,
      ...props
    },
    ref
  ) {
    const [open, setOpen] = React.useState(false)
    const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
    const rootRef = React.useRef<HTMLDivElement>(null)
    const buttonRef = React.useRef<HTMLButtonElement>(null)
    const listboxId = React.useId()

    const selectedOption = React.useMemo(
      () => options.find((option) => option.value === value),
      [options, value]
    )

    const syncRefs = React.useCallback(
      (node: HTMLButtonElement | null) => {
        buttonRef.current = node

        if (typeof ref === "function") {
          ref(node)
          return
        }

        if (ref) {
          ref.current = node
        }
      },
      [ref]
    )

    const getInitialHighlightedIndex = React.useCallback(() => {
      const selectedIndex = options.findIndex((option) => option.value === value)

      if (selectedIndex >= 0 && !options[selectedIndex]?.disabled) {
        return selectedIndex
      }

      return options.findIndex((option) => !option.disabled)
    }, [options, value])

    const openDropdown = React.useCallback(() => {
      if (disabled) {
        return
      }

      setOpen(true)
      setHighlightedIndex(getInitialHighlightedIndex())
    }, [disabled, getInitialHighlightedIndex])

    const closeDropdown = React.useCallback(() => {
      setOpen(false)
      setHighlightedIndex(-1)
    }, [])

    const selectOption = React.useCallback(
      (option: DropdownOption) => {
        if (option.disabled) {
          return
        }

        onChange(option.value)
        closeDropdown()
        buttonRef.current?.focus()
      },
      [closeDropdown, onChange]
    )

    React.useEffect(() => {
      if (!open) {
        return
      }

      function handlePointerDown(event: MouseEvent) {
        if (!rootRef.current?.contains(event.target as Node)) {
          closeDropdown()
        }
      }

      document.addEventListener("mousedown", handlePointerDown)

      return () => {
        document.removeEventListener("mousedown", handlePointerDown)
      }
    }, [closeDropdown, open])

    React.useEffect(() => {
      if (!open) {
        return
      }

      const activeIndex = getInitialHighlightedIndex()

      setHighlightedIndex((currentIndex) =>
        currentIndex >= 0 ? currentIndex : activeIndex
      )
    }, [getInitialHighlightedIndex, open])

    const highlightedOption = highlightedIndex >= 0 ? options[highlightedIndex] : null
    const activeDescendantId =
      open && highlightedOption
        ? `${listboxId}-option-${highlightedIndex}`
        : undefined

    function moveHighlight(step: 1 | -1) {
      const nextIndex = getNextEnabledIndex(options, highlightedIndex, step)

      if (nextIndex >= 0) {
        setHighlightedIndex(nextIndex)
      }
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
      if (disabled) {
        return
      }

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault()
          if (!open) {
            openDropdown()
            return
          }
          moveHighlight(1)
          return
        case "ArrowUp":
          event.preventDefault()
          if (!open) {
            openDropdown()
            return
          }
          moveHighlight(-1)
          return
        case "Enter":
        case " ":
          event.preventDefault()
          if (!open) {
            openDropdown()
            return
          }

          if (highlightedOption && !highlightedOption.disabled) {
            selectOption(highlightedOption)
          }
          return
        case "Escape":
          if (open) {
            event.preventDefault()
            closeDropdown()
          }
          return
        default:
          return
      }
    }

    return (
      <div
        ref={rootRef}
        data-slot="dropdown"
        className="relative inline-flex w-full flex-col"
      >
        <button
          ref={syncRefs}
          {...props}
          type="button"
          role="combobox"
          aria-controls={listboxId}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-activedescendant={activeDescendantId}
          className={cn(
            "border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring/50 flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            !selectedOption && "text-muted-foreground",
            className
          )}
          disabled={disabled}
          onClick={() => {
            if (open) {
              closeDropdown()
              return
            }

            openDropdown()
          }}
          onKeyDown={handleKeyDown}
        >
          <span className="truncate">{selectedOption?.label ?? placeholder}</span>
          <span aria-hidden="true" className="ml-2 shrink-0 text-xs">
            {open ? "▲" : "▼"}
          </span>
        </button>

        {open ? (
          <ul
            id={listboxId}
            role="listbox"
            data-slot="dropdown-options"
            className="bg-popover text-popover-foreground absolute top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border shadow-md"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value
              const isHighlighted = index === highlightedIndex

              return (
                <li
                  key={option.value}
                  id={`${listboxId}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={option.disabled ? true : undefined}
                  data-highlighted={isHighlighted ? "true" : undefined}
                  data-disabled={option.disabled ? "true" : undefined}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm outline-none",
                    isHighlighted && "bg-accent text-accent-foreground",
                    isSelected && "font-medium",
                    option.disabled && "text-muted-foreground cursor-not-allowed opacity-50"
                  )}
                  onMouseEnter={() => {
                    if (!option.disabled) {
                      setHighlightedIndex(index)
                    }
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault()
                  }}
                  onClick={() => {
                    selectOption(option)
                  }}
                >
                  {option.label}
                </li>
              )
            })}
          </ul>
        ) : null}
      </div>
    )
  }
)

Dropdown.displayName = "Dropdown"

export { Dropdown }
