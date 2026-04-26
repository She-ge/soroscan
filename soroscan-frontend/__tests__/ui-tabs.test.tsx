import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"

import { Tabs } from "@/components/ui/tabs"

describe("Tabs", () => {
  const items = [
    { id: "overview", title: "Overview", content: <p>Overview content</p> },
    { id: "details", title: "Details", content: <p>Details content</p> },
    { id: "history", title: "History", content: <p>History content</p> },
  ]

  it("renders a horizontal tablist with accessible roles", () => {
    render(<Tabs items={items} />)

    const tablist = screen.getByRole("tablist")
    expect(tablist).toBeInTheDocument()

    const tabs = screen.getAllByRole("tab")
    expect(tabs).toHaveLength(3)
    expect(tabs[0]).toHaveAttribute("aria-selected", "true")
    expect(tabs[1]).toHaveAttribute("aria-selected", "false")
  })

  it("switches content when a tab is clicked", () => {
    render(<Tabs items={items} />)

    fireEvent.click(screen.getByRole("tab", { name: "Details" }))

    expect(screen.getByText("Details content")).toBeInTheDocument()
    expect(screen.queryByText("Overview content")).not.toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Details" })).toHaveAttribute(
      "aria-selected",
      "true"
    )
  })

  it("navigates tabs with arrow keys", () => {
    render(<Tabs items={items} />)

    const firstTab = screen.getByRole("tab", { name: "Overview" })
    firstTab.focus()
    fireEvent.keyDown(firstTab, { key: "ArrowRight", code: "ArrowRight" })

    const secondTab = screen.getByRole("tab", { name: "Details" })
    expect(secondTab).toHaveFocus()
    expect(secondTab).toHaveAttribute("aria-selected", "true")
    expect(screen.getByText("Details content")).toBeInTheDocument()
  })

  it("applies a visible active indicator to the selected tab", async () => {
    render(<Tabs items={items} />)

    const selectedTab = screen.getByRole("tab", { name: "Overview" })
    expect(selectedTab).toHaveClass("border-b-2")
  })
})
