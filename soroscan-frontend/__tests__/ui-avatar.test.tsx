import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { Avatar } from "@/components/ui/avatar"

describe("Avatar Component", () => {
  it("renders with fallback initials from alt text", () => {
    render(<Avatar alt="John Doe" data-testid="avatar" />)
    expect(screen.getByTestId("avatar")).toBeInTheDocument()
    expect(screen.getByText("J")).toBeInTheDocument()
  })

  it("renders with custom fallback prop", () => {
    render(<Avatar fallback="JD" data-testid="avatar" />)
    expect(screen.getByText("JD")).toBeInTheDocument()
  })

  it("renders image when src is provided", () => {
    render(<Avatar src="/test.jpg" alt="User" data-testid="avatar" />)
    const img = screen.getByRole("img")
    expect(img).toHaveAttribute("src", "/test.jpg")
    expect(img).toHaveAttribute("alt", "User")
  })

  it("falls back to initials on image error", () => {
    render(<Avatar src="/broken.jpg" alt="Jane" data-testid="avatar" />)
    const img = screen.getByRole("img")
    fireEvent.error(img)
    expect(screen.getByText("J")).toBeInTheDocument()
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
  })

  it("renders size variants with correct classes", () => {
    const { rerender } = render(<Avatar size="xs" data-testid="avatar" />)
    expect(screen.getByTestId("avatar")).toHaveClass("h-6", "w-6", "text-[10px]")

    rerender(<Avatar size="xl" data-testid="avatar" />)
    expect(screen.getByTestId("avatar")).toHaveClass("h-16", "w-16", "text-lg")

    rerender(<Avatar size="2xl" data-testid="avatar" />)
    expect(screen.getByTestId("avatar")).toHaveClass("h-24", "w-24", "text-2xl")
  })

  it("renders square shape variant", () => {
    render(<Avatar shape="square" data-testid="avatar" />)
    expect(screen.getByTestId("avatar")).toHaveClass("rounded-lg")
  })

  it("renders circle shape by default", () => {
    render(<Avatar data-testid="avatar" />)
    expect(screen.getByTestId("avatar")).toHaveClass("rounded-full")
  })

  it("renders status indicator when provided", () => {
    render(<Avatar status="online" data-testid="avatar" />)
    const indicator = screen.getByTestId("avatar-status-indicator")
    expect(indicator).toBeInTheDocument()
    expect(indicator).toHaveClass("bg-green-500")
    expect(indicator).toHaveAttribute("aria-label", "online")
  })

  it("renders all status variants", () => {
    const { rerender } = render(<Avatar status="online" data-testid="avatar" />)
    expect(screen.getByTestId("avatar-status-indicator")).toHaveClass("bg-green-500")

    rerender(<Avatar status="away" data-testid="avatar" />)
    expect(screen.getByTestId("avatar-status-indicator")).toHaveClass("bg-yellow-500")

    rerender(<Avatar status="busy" data-testid="avatar" />)
    expect(screen.getByTestId("avatar-status-indicator")).toHaveClass("bg-red-500")

    rerender(<Avatar status="offline" data-testid="avatar" />)
    expect(screen.getByTestId("avatar-status-indicator")).toHaveClass("bg-gray-400")
  })

  it("does not render status indicator when status is not provided", () => {
    render(<Avatar data-testid="avatar" />)
    expect(screen.queryByTestId("avatar-status-indicator")).not.toBeInTheDocument()
  })

  it("applies custom className", () => {
    render(<Avatar className="custom-class" data-testid="avatar" />)
    expect(screen.getByTestId("avatar")).toHaveClass("custom-class")
  })

  it("forwards ref to the root div", () => {
    const ref = React.createRef<HTMLDivElement>()
    render(<Avatar ref={ref} />)
    expect(ref.current).not.toBeNull()
    expect(ref.current?.tagName).toBe("DIV")
  })

  it("has data-slot attribute", () => {
    render(<Avatar data-testid="avatar" />)
    expect(screen.getByTestId("avatar")).toHaveAttribute("data-slot", "avatar")
  })
})
