/**
 * Badge Component Tests
 * ──────────────────────────────────────────────────────────────────────────────
 * Tests for the reusable Badge component including all variants and features.
 */
import { render, screen } from "@testing-library/react";
import { Check, AlertTriangle } from "lucide-react";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders basic badge with default variant and size", () => {
    render(<Badge>Default Badge</Badge>);
    
    const badge = screen.getByText("Default Badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("bg-terminal-gray/10", "text-terminal-gray", "px-3", "py-1");
  });

  it("renders all size variants correctly", () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText("Small")).toHaveClass("px-2", "py-0.5", "text-xs", "h-5");

    rerender(<Badge size="md">Medium</Badge>);
    expect(screen.getByText("Medium")).toHaveClass("px-3", "py-1", "text-xs", "h-6");

    rerender(<Badge size="lg">Large</Badge>);
    expect(screen.getByText("Large")).toHaveClass("px-4", "py-1.5", "text-sm", "h-8");
  });

  it("renders all color variants correctly", () => {
    const variants = [
      { variant: "default" as const, expectedClasses: ["bg-terminal-gray/10", "text-terminal-gray"] },
      { variant: "primary" as const, expectedClasses: ["bg-terminal-green/10", "text-terminal-green"] },
      { variant: "secondary" as const, expectedClasses: ["bg-terminal-cyan/10", "text-terminal-cyan"] },
      { variant: "success" as const, expectedClasses: ["bg-terminal-green/10", "text-terminal-green"] },
      { variant: "warning" as const, expectedClasses: ["bg-terminal-warning/10", "text-terminal-warning"] },
      { variant: "danger" as const, expectedClasses: ["bg-terminal-danger/10", "text-terminal-danger"] },
      { variant: "outline" as const, expectedClasses: ["border-current/30", "text-current", "bg-transparent"] },
    ];

    variants.forEach(({ variant, expectedClasses }) => {
      render(<Badge variant={variant} data-testid={`badge-${variant}`}>{variant}</Badge>);
      const badge = screen.getByTestId(`badge-${variant}`);
      expectedClasses.forEach(className => {
        expect(badge).toHaveClass(className);
      });
    });
  });

  it("renders with icon correctly", () => {
    render(
      <Badge icon={Check} data-testid="badge-with-icon">
        Success
      </Badge>
    );

    const badge = screen.getByTestId("badge-with-icon");
    expect(badge).toBeInTheDocument();
    
    // Check that icon is present and has correct attributes
    const icon = badge.querySelector("svg");
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  it("supports custom icon size", () => {
    render(
      <Badge icon={AlertTriangle} iconSize={16} data-testid="custom-icon-badge">
        Warning
      </Badge>
    );

    const icon = screen.getByTestId("custom-icon-badge").querySelector("svg");
    expect(icon).toHaveAttribute("width", "16");
    expect(icon).toHaveAttribute("height", "16");
  });

  it("uses appropriate default icon sizes for each badge size", () => {
    const { rerender } = render(
      <Badge size="sm" icon={Check} data-testid="sm-badge">Small</Badge>
    );
    let icon = screen.getByTestId("sm-badge").querySelector("svg");
    expect(icon).toHaveAttribute("width", "10");

    rerender(<Badge size="md" icon={Check} data-testid="md-badge">Medium</Badge>);
    icon = screen.getByTestId("md-badge").querySelector("svg");
    expect(icon).toHaveAttribute("width", "12");

    rerender(<Badge size="lg" icon={Check} data-testid="lg-badge">Large</Badge>);
    icon = screen.getByTestId("lg-badge").querySelector("svg");
    expect(icon).toHaveAttribute("width", "14");
  });

  it("forwards accessibility attributes correctly", () => {
    render(
      <Badge aria-label="Custom accessibility label" data-testid="accessible-badge">
        Badge Content
      </Badge>
    );

    const badge = screen.getByTestId("accessible-badge");
    expect(badge).toHaveAttribute("aria-label", "Custom accessibility label");
  });

  it("forwards HTML attributes and className", () => {
    render(
      <Badge 
        className="custom-class" 
        data-custom="test-value"
        data-testid="custom-badge"
      >
        Custom Badge
      </Badge>
    );

    const badge = screen.getByTestId("custom-badge");
    expect(badge).toHaveClass("custom-class");
    expect(badge).toHaveAttribute("data-custom", "test-value");
  });

  it("maintains consistent structure with terminal theme classes", () => {
    render(<Badge data-testid="theme-badge">Theme Test</Badge>);
    
    const badge = screen.getByTestId("theme-badge");
    expect(badge).toHaveClass(
      "font-terminal-mono",
      "font-semibold",
      "tracking-wide",
      "uppercase",
      "rounded-full",
      "border"
    );
  });

  it("supports ref forwarding", () => {
    const ref = jest.fn();
    render(<Badge ref={ref}>Ref Test</Badge>);
    expect(ref).toHaveBeenCalled();
  });
});