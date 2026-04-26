import * as React from "react"

import { cn } from "@/lib/utils"

export interface TabItem {
  id: string
  title: string
  content: React.ReactNode
}

export interface TabsProps {
  items: TabItem[]
  defaultIndex?: number
  className?: string
}

export function Tabs({ items, defaultIndex = 0, className }: TabsProps) {
  const [activeIndex, setActiveIndex] = React.useState(
    Math.min(Math.max(defaultIndex, 0), items.length - 1)
  )
  const id = React.useId()
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([])

  const focusTab = (index: number) => {
    const nextIndex = (index + items.length) % items.length
    setActiveIndex(nextIndex)
    tabRefs.current[nextIndex]?.focus()
  }

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault()
        focusTab(index + 1)
        break
      case "ArrowLeft":
        event.preventDefault()
        focusTab(index - 1)
        break
      case "Home":
        event.preventDefault()
        focusTab(0)
        break
      case "End":
        event.preventDefault()
        focusTab(items.length - 1)
        break
      default:
        break
    }
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        role="tablist"
        aria-label="Tab navigation"
        className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-700"
      >
        {items.map((item, index) => {
          const selected = index === activeIndex
          return (
            <button
              key={item.id}
              ref={(element) => {
                tabRefs.current[index] = element
              }}
              id={`${id}-tab-${item.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${id}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onKeyDown={(event) => handleKeyDown(event, index)}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "rounded-t-md px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80",
                selected
                  ? "border-b-2 border-primary text-primary"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
              )}
            >
              {item.title}
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        {items.map((item, index) => {
          const selected = index === activeIndex
          return (
            <div
              key={item.id}
              id={`${id}-panel-${item.id}`}
              role="tabpanel"
              aria-labelledby={`${id}-tab-${item.id}`}
              hidden={!selected}
              className="focus-visible:outline-none"
            >
              {selected && item.content}
            </div>
          )
        })}
      </div>
    </div>
  )
}
