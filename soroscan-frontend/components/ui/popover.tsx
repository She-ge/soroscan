"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const popoverContentVariants = cva(
  "absolute z-50 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-md",
  {
    variants: {
      side: {
        top: "bottom-full mb-2",
        bottom: "top-full mt-2",
      },
      align: {
        start: "left-0",
        center: "left-1/2 -translate-x-1/2",
        end: "right-0",
      },
    },
    defaultVariants: {
      side: "bottom",
      align: "start",
    },
  }
)

export interface PopoverProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "content">,
    VariantProps<typeof popoverContentVariants> {
  trigger: React.ReactNode
  content: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

const Popover = React.forwardRef<HTMLDivElement, PopoverProps>(
  (
    {
      className,
      trigger,
      content,
      side,
      align,
      open,
      defaultOpen = false,
      onOpenChange,
      ...props
    },
    ref
  ) => {
    const isControlled = open !== undefined
    const [internalOpen, setInternalOpen] = React.useState(defaultOpen)
    const isOpen = isControlled ? open : internalOpen
    const rootRef = React.useRef<HTMLDivElement>(null)
    const contentRef = React.useRef<HTMLDivElement>(null)
    const triggerId = React.useId()
    const contentId = React.useId()

    const setOpen = React.useCallback(
      (nextOpen: boolean) => {
        if (!isControlled) {
          setInternalOpen(nextOpen)
        }

        onOpenChange?.(nextOpen)
      },
      [isControlled, onOpenChange]
    )

    React.useEffect(() => {
      if (!isOpen) {
        return
      }

      function handlePointerDown(event: MouseEvent) {
        if (!rootRef.current?.contains(event.target as Node)) {
          setOpen(false)
        }
      }

      function handleEscape(event: KeyboardEvent) {
        if (event.key === "Escape") {
          setOpen(false)
        }
      }

      document.addEventListener("mousedown", handlePointerDown)
      document.addEventListener("keydown", handleEscape)

      return () => {
        document.removeEventListener("mousedown", handlePointerDown)
        document.removeEventListener("keydown", handleEscape)
      }
    }, [isOpen, setOpen])

    React.useEffect(() => {
      if (!isOpen) {
        return
      }

      contentRef.current?.focus()
    }, [isOpen])

    return (
      <div
        ref={rootRef}
        data-slot="popover"
        className={cn("relative inline-flex max-w-full", className)}
        {...props}
      >
        <button
          id={triggerId}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          aria-controls={contentId}
          data-slot="popover-trigger"
          className="min-h-11 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={() => setOpen(!isOpen)}
        >
          {trigger}
        </button>

        {isOpen ? (
          <div
            id={contentId}
            ref={(node) => {
              contentRef.current = node
              if (typeof ref === "function") {
                ref(node)
                return
              }
              if (ref) {
                ref.current = node
              }
            }}
            role="dialog"
            aria-labelledby={triggerId}
            tabIndex={-1}
            data-slot="popover-content"
            className={cn(popoverContentVariants({ side, align }))}
          >
            {content}
          </div>
        ) : null}
      </div>
    )
  }
)

Popover.displayName = "Popover"

export { Popover, popoverContentVariants }
