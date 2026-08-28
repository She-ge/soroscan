import React from "react"
import { render, screen } from "@testing-library/react"
import { Card } from "./card"

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Hello card</Card>)
    expect(screen.getByText("Hello card")).toBeInTheDocument()
  })

  it("renders with padding wrapper around children", () => {
    const { container } = render(<Card>Body</Card>)
    const body = container.querySelector(".p-4")
    expect(body).toBeInTheDocument()
  })

  it("renders with border and rounded corners by default", () => {
    const { container } = render(<Card>Content</Card>)
    expect(container.firstChild).toHaveClass(
      "rounded-lg",
      "border",
      "border-gray-200"
    )
  })

  it("applies default variant (shadow-sm)", () => {
    const { container } = render(<Card variant="default">Content</Card>)
    expect(container.firstChild).toHaveClass("shadow-sm")
    expect(container.firstChild).not.toHaveClass("shadow-lg")
  })

  it("applies flat variant (no shadow)", () => {
    const { container } = render(<Card variant="flat">Content</Card>)
    expect(container.firstChild).not.toHaveClass("shadow-sm")
    expect(container.firstChild).not.toHaveClass("shadow-lg")
  })

  it("applies elevated variant (shadow-lg)", () => {
    const { container } = render(<Card variant="elevated">Content</Card>)
    expect(container.firstChild).toHaveClass("shadow-lg")
  })

  it("defaults to white background", () => {
    const { container } = render(<Card>Content</Card>)
    expect(container.firstChild).toHaveClass("bg-white")
  })

  it("applies gray background", () => {
    const { container } = render(<Card background="gray">Content</Card>)
    expect(container.firstChild).toHaveClass("bg-gray-50")
  })

  it("applies blue background", () => {
    const { container } = render(<Card background="blue">Content</Card>)
    expect(container.firstChild).toHaveClass("bg-blue-50")
  })

  it("applies green background", () => {
    const { container } = render(<Card background="green">Content</Card>)
    expect(container.firstChild).toHaveClass("bg-green-50")
  })

  it("applies yellow background", () => {
    const { container } = render(<Card background="yellow">Content</Card>)
    expect(container.firstChild).toHaveClass("bg-yellow-50")
  })

  it("applies red background", () => {
    const { container } = render(<Card background="red">Content</Card>)
    expect(container.firstChild).toHaveClass("bg-red-50")
  })

  it("renders title when provided", () => {
    render(<Card title="Card Title">Body</Card>)
    expect(screen.getByText("Card Title")).toBeInTheDocument()
  })

  it("renders title with bottom border", () => {
    const { container } = render(<Card title="Title">Body</Card>)
    const header = container.querySelector(".border-b")
    expect(header).toBeInTheDocument()
  })

  it("does not render header section when title is omitted", () => {
    const { container } = render(<Card>Body</Card>)
    expect(container.querySelector(".border-b")).not.toBeInTheDocument()
  })

  it("renders footer when provided", () => {
    render(<Card footer="Card Footer">Body</Card>)
    expect(screen.getByText("Card Footer")).toBeInTheDocument()
  })

  it("renders footer with top border", () => {
    const { container } = render(<Card footer="Footer">Body</Card>)
    const footer = container.querySelector(".border-t")
    expect(footer).toBeInTheDocument()
  })

  it("does not render footer section when footer is omitted", () => {
    const { container } = render(<Card>Body</Card>)
    expect(container.querySelector(".border-t")).not.toBeInTheDocument()
  })

  it("renders title, body, and footer together", () => {
    render(
      <Card title="Title" footer="Footer">
        Body content
      </Card>
    )
    expect(screen.getByText("Title")).toBeInTheDocument()
    expect(screen.getByText("Body content")).toBeInTheDocument()
    expect(screen.getByText("Footer")).toBeInTheDocument()
  })

  it("accepts ReactNode children", () => {
    render(
      <Card>
        <p data-testid="child-p">Paragraph</p>
        <span data-testid="child-span">Span</span>
      </Card>
    )
    expect(screen.getByTestId("child-p")).toBeInTheDocument()
    expect(screen.getByTestId("child-span")).toBeInTheDocument()
  })

  it("applies hover classes when hoverable=true", () => {
    const { container } = render(<Card hoverable>Content</Card>)
    expect(container.firstChild).toHaveClass(
      "cursor-pointer",
      "transition-shadow"
    )
  })

  it("does not apply hover classes by default", () => {
    const { container } = render(<Card>Content</Card>)
    expect(container.firstChild).not.toHaveClass("cursor-pointer")
  })

  it("applies custom className", () => {
    const { container } = render(<Card className="my-custom">Content</Card>)
    expect(container.firstChild).toHaveClass("my-custom")
  })

  it("exposes data attributes for variant and background", () => {
    const { container } = render(
      <Card variant="elevated" background="green">
        Content
      </Card>
    )
    expect(container.firstChild).toHaveAttribute("data-slot", "card")
    expect(container.firstChild).toHaveAttribute("data-variant", "elevated")
    expect(container.firstChild).toHaveAttribute("data-background", "green")
  })
})
