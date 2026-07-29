/**
 * Badge and StatusIndicator Examples Tests
 * ──────────────────────────────────────────────────────────────────────────────
 * Tests for the examples showcasing Badge and StatusIndicator usage.
 */
import { render, screen } from "@testing-library/react";
import { BadgeStatusExamples } from "./badge-status-examples";

describe("BadgeStatusExamples", () => {
  it("renders all example sections", () => {
    render(<BadgeStatusExamples />);
    
    // Check that all main sections are present
    expect(screen.getByText("Contract List Usage")).toBeInTheDocument();
    expect(screen.getByText("Event Explorer Usage")).toBeInTheDocument();
    expect(screen.getByText("Webhook List Usage")).toBeInTheDocument();
    expect(screen.getByText("Size Variants Showcase")).toBeInTheDocument();
    expect(screen.getByText("Color Variants Showcase")).toBeInTheDocument();
  });

  it("shows contract list examples with different statuses", () => {
    render(<BadgeStatusExamples />);
    
    // Check for contract addresses
    expect(screen.getByText("contract_12345...abcdef")).toBeInTheDocument();
    expect(screen.getByText("contract_67890...xyz123")).toBeInTheDocument();
    expect(screen.getByText("contract_new456...def789")).toBeInTheDocument();
    
    // Check for different status indicators
    expect(screen.getByLabelText("Status: Active")).toBeInTheDocument();
    expect(screen.getByLabelText("Status: Failed")).toBeInTheDocument();
    expect(screen.getByLabelText("Status: Pending")).toBeInTheDocument();
  });

  it("shows event explorer examples with dot-only indicators", () => {
    render(<BadgeStatusExamples />);
    
    // Check for event types
    expect(screen.getByText("Transfer Event")).toBeInTheDocument();
    expect(screen.getByText("Mint Event")).toBeInTheDocument();
    expect(screen.getByText("Burn Event")).toBeInTheDocument();
    
    // Check for event-related badges
    expect(screen.getByText("High Priority")).toBeInTheDocument();
    expect(screen.getByText("Real-time")).toBeInTheDocument();
    expect(screen.getByText("Processing")).toBeInTheDocument();
  });

  it("shows webhook list examples with compact status indicators", () => {
    render(<BadgeStatusExamples />);
    
    // Check for webhook URLs
    expect(screen.getByText("https://api.example.com/webhook")).toBeInTheDocument();
    expect(screen.getByText("https://webhook.service.com/events")).toBeInTheDocument();
    expect(screen.getByText("https://broken.endpoint.com/hook")).toBeInTheDocument();
    
    // Check for delivery status badges
    expect(screen.getByText("Delivered")).toBeInTheDocument();
    expect(screen.getByText("Retrying")).toBeInTheDocument();
    expect(screen.getByText("Attempt 2/3")).toBeInTheDocument();
  });

  it("displays size variants correctly", () => {
    render(<BadgeStatusExamples />);
    
    // Check for size labels
    expect(screen.getByText("Small:")).toBeInTheDocument();
    expect(screen.getByText("Medium:")).toBeInTheDocument();
    expect(screen.getByText("Large:")).toBeInTheDocument();
    
    // Check for size-specific badges
    expect(screen.getByText("SM Badge")).toBeInTheDocument();
    expect(screen.getByText("MD Badge")).toBeInTheDocument();
    expect(screen.getByText("LG Badge")).toBeInTheDocument();
  });

  it("displays all color variants", () => {
    render(<BadgeStatusExamples />);
    
    // Check that all color variants are rendered
    const colorVariants = [
      "Default", "Primary", "Secondary", "Success",
      "Warning", "Danger", "Outline"
    ];
    
    colorVariants.forEach(variant => {
      expect(screen.getByText(variant)).toBeInTheDocument();
    });
  });

  it("shows proper visual hierarchy with status indicators and badges", () => {
    render(<BadgeStatusExamples />);
    
    // Verify that status indicators have proper ARIA roles
    const statusElements = screen.getAllByRole("status");
    expect(statusElements.length).toBeGreaterThan(0);
    
    // Verify that badges with icons include the icons
    const eventCountBadge = screen.getByText("1.2k Events");
    expect(eventCountBadge.closest("span")).toHaveClass("inline-flex", "items-center");
  });

  it("demonstrates accessibility features", () => {
    render(<BadgeStatusExamples />);
    
    // Check for proper ARIA labels on status indicators
    expect(screen.getByLabelText("Status: Active")).toHaveAttribute("role", "status");
    expect(screen.getByLabelText("Status: Failed")).toHaveAttribute("role", "status");
    expect(screen.getByLabelText("Status: Pending")).toHaveAttribute("role", "status");
  });
});