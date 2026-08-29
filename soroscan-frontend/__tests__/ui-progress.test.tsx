import React from "react"
import { render, screen } from "@testing-library/react"
import { Progress } from "@/components/ui/progress"

describe("Progress Component", () => {
  it("renders with role progressbar", () => {
    render(<Progress value={50} data-testid="progress" />)
    const el = screen.getByTestId("progress")
    expect(el).toHaveAttribute("role", "progressbar")
  })

  it("sets aria-valuenow correctly", () => {
    render(<Progress value={50} data-testid="progress" />)
    expect(screen.getByTestId("progress")).toHaveAttribute("aria-valuenow", "50")
  })

  it("clamps value to min of 0", () => {
    render(<Progress value={-10} data-testid="progress" />)
    expect(screen.getByTestId("progress")).toHaveAttribute("aria-valuenow", "0")
  })

  it("clamps value to max", () => {
    render(<Progress value={150} max={100} data-testid="progress" />)
    expect(screen.getByTestId("progress")).toHaveAttribute("aria-valuenow", "100")
  })

  it("renders with custom max value", () => {
    render(<Progress value={3} max={10} data-testid="progress" />)
    expect(screen.getByTestId("progress")).toHaveAttribute("aria-valuemax", "10")
    expect(screen.getByTestId("progress")).toHaveAttribute("aria-valuenow", "3")
  })

  it("sets data-value attribute with percentage", () => {
    render(<Progress value={25} data-testid="progress" />)
    expect(screen.getByTestId("progress")).toHaveAttribute("data-value", "25")
  })

  it("renders size variants", () => {
    const { rerender } = render(<Progress value={50} size="sm" data-testid="progress" />)
    expect(screen.getByTestId("progress")).toHaveClass("h-1.5")

    rerender(<Progress value={50} size="lg" data-testid="progress" />)
    expect(screen.getByTestId("progress")).toHaveClass("h-4")
  })

  it("renders variant colors on inner bar", () => {
    const { container } = render(<Progress value={50} variant="success" data-testid="progress" />)
    const bar = container.querySelector('[class*="bg-green-500"]')
    expect(bar).toBeInTheDocument()
  })

  it("renders terminal variant", () => {
    const { container } = render(<Progress value={50} variant="terminal" data-testid="progress" />)
    const bar = container.querySelector('[class*="bg-terminal-green"]')
    expect(bar).toBeInTheDocument()
  })

  it("shows outside label when showLabel is true", () => {
    render(<Progress value={75} showLabel data-testid="progress" />)
    expect(screen.getByText("75%")).toBeInTheDocument()
  })

  it("uses custom label formatter", () => {
    render(
      <Progress
        value={3}
        max={10}
        showLabel
        labelFormatter={(v, m) => `${v}/${m} done`}
        data-testid="progress"
      />
    )
    expect(screen.getByText("3/10 done")).toBeInTheDocument()
  })

  it("does not show label by default", () => {
    render(<Progress value={50} data-testid="progress" />)
    expect(screen.queryByText("50%")).not.toBeInTheDocument()
  })

  it("applies custom className", () => {
    render(<Progress value={50} className="custom-class" data-testid="progress" />)
    expect(screen.getByTestId("progress")).toHaveClass("custom-class")
  })

  it("forwards ref", () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<Progress value={50} ref={ref} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.getAttribute("role")).toBe("progressbar")
  })

  it("has data-slot attribute", () => {
    render(<Progress value={50} data-testid="progress" />)
    expect(screen.getByTestId("progress")).toHaveAttribute("data-slot", "progress")
  })

  it("applies correct width percentage to inner bar", () => {
    const { container } = render(<Progress value={42} data-testid="progress" />)
    const track = screen.getByTestId("progress")
    const bar = track.firstChild as HTMLElement
    expect(bar).toHaveStyle({ width: "42%" })
  })
})
