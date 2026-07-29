import React from "react"
import { render, screen } from "@testing-library/react"
import { Spinner } from "@/components/ui/spinner"

describe("Spinner Component", () => {
  it("renders with default props", () => {
    render(<Spinner data-testid="spinner" />)
    const el = screen.getByTestId("spinner")
    expect(el).toBeInTheDocument()
    expect(el).toHaveAttribute("role", "status")
    expect(el).toHaveAttribute("aria-label", "Loading...")
    expect(el).toHaveClass("h-8", "w-8")
    expect(el).toHaveClass("text-foreground")
  })

  it("renders mini size variant", () => {
    render(<Spinner size="mini" data-testid="mini-spinner" />)
    expect(screen.getByTestId("mini-spinner")).toHaveClass("h-4", "w-4")
  })

  it("renders large size variant", () => {
    render(<Spinner size="large" data-testid="large-spinner" />)
    expect(screen.getByTestId("large-spinner")).toHaveClass("h-12", "w-12")
  })

  it("renders success color variant", () => {
    render(<Spinner color="success" data-testid="success-spinner" />)
    expect(screen.getByTestId("success-spinner")).toHaveClass("text-green-500")
  })

  it("renders warning color variant", () => {
    render(<Spinner color="warning" data-testid="warning-spinner" />)
    expect(screen.getByTestId("warning-spinner")).toHaveClass("text-yellow-500")
  })

  it("renders error color variant", () => {
    render(<Spinner color="error" data-testid="error-spinner" />)
    expect(screen.getByTestId("error-spinner")).toHaveClass("text-red-500")
  })

  it("applies custom className", () => {
    render(<Spinner className="my-custom-class" data-testid="custom-spinner" />)
    expect(screen.getByTestId("custom-spinner")).toHaveClass("my-custom-class")
  })

  it("uses custom label when provided", () => {
    render(<Spinner label="Fetching data..." data-testid="labeled-spinner" />)
    const el = screen.getByTestId("labeled-spinner")
    expect(el).toHaveAttribute("aria-label", "Fetching data...")
    expect(screen.getByText("Fetching data...")).toHaveClass("sr-only")
  })

  it("forwards ref to the root div", () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<Spinner ref={ref} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("DIV")
    expect(ref.current?.getAttribute("role")).toBe("status")
  })

  it("has accessible screen reader text", () => {
    render(<Spinner />)
    expect(screen.getByText("Loading...")).toHaveClass("sr-only")
  })
})