/**
 * StatusIndicator Component Tests
 * ──────────────────────────────────────────────────────────────────────────────
 * Tests for the animated StatusIndicator component.
 */
import { render, screen } from "@testing-library/react";
import { StatusIndicator } from "./status-indicator";

describe("StatusIndicator", () => {
  it("renders active status with correct styling and animation", () => {
    render(<StatusIndicator status="active" data-testid="active-indicator" />);
    
    const indicator = screen.getByTestId("active-indicator");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveClass("text-terminal-green");
    expect(indicator).toHaveAttribute("role", "status");
    expect(indicator).toHaveAttribute("aria-label", "Status: Active");

    const dot = indicator.querySelector("span[aria-hidden]");
    expect(dot).toHaveClass("bg-terminal-green", "animate-pulse");
    
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders failed status without animation", () => {
    render(<StatusIndicator status="failed" data-testid="failed-indicator" />);
    
    const indicator = screen.getByTestId("failed-indicator");
    expect(indicator).toHaveClass("text-terminal-danger");

    const dot = indicator.querySelector("span[aria-hidden]");
    expect(dot).toHaveClass("bg-terminal-danger");
    expect(dot).not.toHaveClass("animate-pulse");
    
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("renders pending status with animation", () => {
    render(<StatusIndicator status="pending" data-testid="pending-indicator" />);
    
    const indicator = screen.getByTestId("pending-indicator");
    expect(indicator).toHaveClass("text-terminal-warning");

    const dot = indicator.querySelector("span[aria-hidden]");
    expect(dot).toHaveClass("bg-terminal-warning", "animate-pulse");
    
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("renders inactive status without animation", () => {
    render(<StatusIndicator status="inactive" data-testid="inactive-indicator" />);
    
    const indicator = screen.getByTestId("inactive-indicator");
    expect(indicator).toHaveClass("text-terminal-gray");

    const dot = indicator.querySelector("span[aria-hidden]");
    expect(dot).toHaveClass("bg-terminal-gray");
    expect(dot).not.toHaveClass("animate-pulse");
    
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("handles unknown status gracefully by defaulting to inactive", () => {
    // @ts-expect-error Testing unknown status
    render(<StatusIndicator status="unknown" data-testid="unknown-indicator" />);
    
    const indicator = screen.getByTestId("unknown-indicator");
    expect(indicator).toHaveClass("text-terminal-gray");
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("renders all size variants correctly", () => {
    const { rerender } = render(<StatusIndicator status="active" size="sm" data-testid="indicator" />);
    let dot = screen.getByTestId("indicator").querySelector("span[aria-hidden]");
    expect(dot).toHaveClass("w-1.5", "h-1.5");

    rerender(<StatusIndicator status="active" size="md" data-testid="indicator" />);
    dot = screen.getByTestId("indicator").querySelector("span[aria-hidden]");
    expect(dot).toHaveClass("w-2", "h-2");

    rerender(<StatusIndicator status="active" size="lg" data-testid="indicator" />);
    dot = screen.getByTestId("indicator").querySelector("span[aria-hidden]");
    expect(dot).toHaveClass("w-2.5", "h-2.5");
  });

  it("renders compact variant with smaller gap", () => {
    render(<StatusIndicator status="active" variant="compact" data-testid="compact-indicator" />);
    
    const indicator = screen.getByTestId("compact-indicator");
    expect(indicator).toHaveClass("gap-1.5");
  });

  it("supports custom labels", () => {
    render(<StatusIndicator status="active" label="Running" data-testid="custom-label" />);
    
    expect(screen.getByText("Running")).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });

  it("renders dot-only variant", () => {
    render(<StatusIndicator status="active" dotOnly data-testid="dot-only" />);
    
    const indicator = screen.getByTestId("dot-only");
    const dot = indicator.querySelector("span[aria-hidden]");
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass("bg-terminal-green", "animate-pulse");
    
    // Should not show text
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });

  it("supports custom aria-label", () => {
    render(
      <StatusIndicator 
        status="pending" 
        aria-label="Custom status description"
        data-testid="custom-aria"
      />
    );
    
    const indicator = screen.getByTestId("custom-aria");
    expect(indicator).toHaveAttribute("aria-label", "Custom status description");
  });

  it("forwards HTML attributes and className", () => {
    render(
      <StatusIndicator 
        status="active"
        className="custom-class"
        data-custom="test-value"
        data-testid="custom-indicator"
      />
    );

    const indicator = screen.getByTestId("custom-indicator");
    expect(indicator).toHaveClass("custom-class");
    expect(indicator).toHaveAttribute("data-custom", "test-value");
  });

  it("maintains consistent terminal theme structure", () => {
    render(<StatusIndicator status="active" data-testid="theme-indicator" />);
    
    const indicator = screen.getByTestId("theme-indicator");
    expect(indicator).toHaveClass(
      "font-terminal-mono",
      "text-xs",
      "tracking-wider",
      "uppercase",
      "inline-flex",
      "items-center",
      "gap-2"
    );
  });

  it("supports ref forwarding", () => {
    const ref = jest.fn();
    render(<StatusIndicator status="active" ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it("has correct focus management for accessibility", () => {
    render(<StatusIndicator status="active" data-testid="focus-indicator" />);
    
    const indicator = screen.getByTestId("focus-indicator");
    expect(indicator).toHaveClass(
      "focus-visible:outline-none",
      "focus-visible:ring-2",
      "focus-visible:ring-offset-2",
      "focus-visible:ring-terminal-green"
    );
  });
});