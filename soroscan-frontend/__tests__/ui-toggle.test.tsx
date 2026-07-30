import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { Toggle } from "@/components/ui/toggle"

describe("Toggle Component", () => {
  it("renders as a switch role", () => {
    render(<Toggle data-testid="toggle" />)
    const toggle = screen.getByTestId("toggle")
    expect(toggle).toHaveAttribute("role", "switch")
    expect(toggle).toHaveAttribute("aria-checked", "false")
  })

  it("toggles on click", () => {
    render(<Toggle data-testid="toggle" />)
    const toggle = screen.getByTestId("toggle")
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute("aria-checked", "true")
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute("aria-checked", "false")
  })

  it("toggles on Space key", () => {
    render(<Toggle data-testid="toggle" />)
    const toggle = screen.getByTestId("toggle")
    fireEvent.keyDown(toggle, { key: " " })
    expect(toggle).toHaveAttribute("aria-checked", "true")
  })

  it("toggles on Enter key", () => {
    render(<Toggle data-testid="toggle" />)
    const toggle = screen.getByTestId("toggle")
    fireEvent.keyDown(toggle, { key: "Enter" })
    expect(toggle).toHaveAttribute("aria-checked", "true")
  })

  it("calls onCheckedChange when toggled", () => {
    const onChange = jest.fn()
    render(<Toggle onCheckedChange={onChange} data-testid="toggle" />)
    fireEvent.click(screen.getByTestId("toggle"))
    expect(onChange).toHaveBeenCalledWith(true)
    fireEvent.click(screen.getByTestId("toggle"))
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it("respects controlled checked prop", () => {
    const { rerender } = render(<Toggle checked={true} data-testid="toggle" />)
    expect(screen.getByTestId("toggle")).toHaveAttribute("aria-checked", "true")

    rerender(<Toggle checked={false} data-testid="toggle" />)
    expect(screen.getByTestId("toggle")).toHaveAttribute("aria-checked", "false")
  })

  it("does not toggle when disabled", () => {
    render(<Toggle disabled data-testid="toggle" />)
    const toggle = screen.getByTestId("toggle")
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute("aria-checked", "false")
    expect(toggle).toBeDisabled()
  })

  it("renders with label", () => {
    render(<Toggle label="Enable notifications" />)
    expect(screen.getByText("Enable notifications")).toBeInTheDocument()
  })

  it("renders label as sr-only when hideLabel is true", () => {
    render(<Toggle label="Enable notifications" hideLabel data-testid="toggle" />)
    const label = screen.getByText("Enable notifications")
    expect(label).toHaveClass("sr-only")
    expect(screen.getByTestId("toggle")).toHaveAttribute("aria-label", "Enable notifications")
  })

  it("renders size variants", () => {
    const { rerender } = render(<Toggle size="sm" data-testid="toggle" />)
    expect(screen.getByTestId("toggle")).toHaveClass("h-5", "w-9")

    rerender(<Toggle size="lg" data-testid="toggle" />)
    expect(screen.getByTestId("toggle")).toHaveClass("h-7", "w-14")
  })

  it("shows checked state styling", () => {
    render(<Toggle checked={true} data-testid="toggle" />)
    expect(screen.getByTestId("toggle")).toHaveClass("bg-primary")
  })

  it("shows unchecked state styling", () => {
    render(<Toggle checked={false} data-testid="toggle" />)
    expect(screen.getByTestId("toggle")).toHaveClass("bg-input")
  })

  it("applies custom className", () => {
    render(<Toggle className="custom-class" data-testid="toggle" />)
    expect(screen.getByTestId("toggle")).toHaveClass("custom-class")
  })

  it("forwards ref", () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<Toggle ref={ref} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("BUTTON")
  })

  it("has data-slot and data-state attributes", () => {
    render(<Toggle data-testid="toggle" />)
    const toggle = screen.getByTestId("toggle")
    expect(toggle).toHaveAttribute("data-slot", "toggle")
    expect(toggle).toHaveAttribute("data-state", "unchecked")

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute("data-state", "checked")
  })
})
