"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const accordionTriggerVariants = cva(
  "flex min-h-11 w-full items-center justify-between gap-4 rounded-md border border-border bg-background px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      size: {
        sm: "px-3 py-2 text-sm",
        md: "px-4 py-3 text-sm",
        lg: "px-5 py-4 text-base",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
)

export interface AccordionItem {
  id: string
  title: React.ReactNode
  content: React.ReactNode
  disabled?: boolean
}

export interface AccordionProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof accordionTriggerVariants> {
  items: AccordionItem[]
  value?: string[]
  defaultValue?: string[]
  onValueChange?: (value: string[]) => void
  type?: "single" | "multiple"
  collapsible?: boolean
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      className,
      items,
      size,
      value,
      defaultValue = [],
      onValueChange,
      type = "single",
      collapsible = true,
      ...props
    },
    ref
  ) => {
    const isControlled = value !== undefined
    const [internalValue, setInternalValue] = React.useState<string[]>(defaultValue)
    const openItems = isControlled ? value : internalValue

    const setOpenItems = React.useCallback(
      (nextValue: string[]) => {
        if (!isControlled) {
          setInternalValue(nextValue)
        }
        onValueChange?.(nextValue)
      },
      [isControlled, onValueChange]
    )

    const toggleItem = React.useCallback(
      (itemId: string, disabled?: boolean) => {
        if (disabled) {
          return
        }

        const isOpen = openItems.includes(itemId)

        if (type === "single") {
          if (isOpen) {
            setOpenItems(collapsible ? [] : [itemId])
            return
          }

          setOpenItems([itemId])
          return
        }

        if (isOpen) {
          setOpenItems(openItems.filter((value) => value !== itemId))
          return
        }

        setOpenItems([...openItems, itemId])
      },
      [collapsible, openItems, setOpenItems, type]
    )

    return (
      <div ref={ref} data-slot="accordion" className={cn("w-full space-y-3", className)} {...props}>
        {items.map((item) => {
          const panelId = `accordion-panel-${item.id}`
          const triggerId = `accordion-trigger-${item.id}`
          const isOpen = openItems.includes(item.id)

          return (
            <div
              key={item.id}
              data-state={isOpen ? "open" : "closed"}
              className="overflow-hidden rounded-lg border border-border/70 bg-card/40"
            >
              <button
                id={triggerId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                disabled={item.disabled}
                data-slot="accordion-trigger"
                className={cn(accordionTriggerVariants({ size }), "rounded-none border-0 bg-transparent")}
                onClick={() => toggleItem(item.id, item.disabled)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    toggleItem(item.id, item.disabled)
                  }
                }}
              >
                <span className="flex-1">{item.title}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "shrink-0 text-muted-foreground transition-transform duration-200",
                    isOpen && "rotate-180"
                  )}
                >
                  ▼
                </span>
              </button>

              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                aria-hidden={!isOpen}
                data-slot="accordion-panel"
                className={cn(
                  "grid transition-all duration-300 ease-in-out",
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <div className="px-4 pb-4 pt-0 text-sm text-muted-foreground sm:px-5">
                    <div className="border-t border-border/60 pt-4">{item.content}</div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }
)

Accordion.displayName = "Accordion"

export { Accordion, accordionTriggerVariants }