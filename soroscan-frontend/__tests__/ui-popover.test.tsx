import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { Popover } from "@/components/ui/popover"

describe("Popover", () => {
  it("renders the trigger", () => {
    render(<Popover trigger="Open details" content={<p>Popover content</p>} />)
    expect(screen.getByRole("button", { name: "Open details" })).toBeInTheDocument()
  })

  it("opens and closes when the trigger is clicked", () => {
    render(<Popover trigger="Open details" content={<p>Popover content</p>} />)

    const trigger = screen.getByRole("button", { name: "Open details" })
    fireEvent.click(trigger)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(trigger).toHaveAttribute("aria-expanded", "true")

    fireEvent.click(trigger)
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("supports defaultOpen", () => {
    render(<Popover trigger="Open details" content={<p>Popover content</p>} defaultOpen />)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("supports controlled mode", () => {
    const { rerender } = render(
      <Popover trigger="Open details" content={<p>Popover content</p>} open={false} />
    )
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()

    rerender(<Popover trigger="Open details" content={<p>Popover content</p>} open />)
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("calls onOpenChange", () => {
    const onOpenChange = jest.fn()
    render(
      <Popover
        trigger="Open details"
        content={<p>Popover content</p>}
        onOpenChange={onOpenChange}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Open details" }))
    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it("closes on escape", () => {
    render(<Popover trigger="Open details" content={<p>Popover content</p>} defaultOpen />)

    fireEvent.keyDown(document, { key: "Escape" })
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("closes when clicking outside", () => {
    render(
      <div>
        <button type="button">Outside</button>
        <Popover trigger="Open details" content={<p>Popover content</p>} defaultOpen />
      </div>
    )

    fireEvent.mouseDown(screen.getByRole("button", { name: "Outside" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("applies content variants", () => {
    render(
      <Popover
        trigger="Open details"
        content={<p>Popover content</p>}
        defaultOpen
        side="top"
        align="end"
      />
    )

    expect(screen.getByRole("dialog")).toHaveClass("bottom-full", "right-0")
  })
})
