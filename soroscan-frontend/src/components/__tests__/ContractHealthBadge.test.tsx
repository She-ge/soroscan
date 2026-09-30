import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  ContractHealthBadge,
  STATUS_BACKGROUND_CLASSES,
  type ContractHealthStatus,
} from "@/components/ui/ContractHealthBadge";

// Mock intersection observer for animations
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock matchMedia for motion settings
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe("ContractHealthBadge Component Unit Tests", () => {
  it("renders healthy status with correct background CSS classes and label", () => {
    render(<ContractHealthBadge status="healthy" />);

    const badge = screen.getByRole("status");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Healthy");
    expect(badge).toHaveAttribute("aria-label", "Contract health: Healthy");
    expect(badge).toHaveClass("bg-terminal-green/10");
    expect(badge).toHaveClass("status-healthy");
  });

  it("renders degraded status with correct background CSS classes and label", () => {
    render(<ContractHealthBadge status="degraded" />);

    const badge = screen.getByRole("status");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Degraded");
    expect(badge).toHaveAttribute("aria-label", "Contract health: Degraded");
    expect(badge).toHaveClass("bg-terminal-warning/10");
    expect(badge).toHaveClass("status-degraded");
  });

  it("renders offline status with correct background CSS classes and label", () => {
    render(<ContractHealthBadge status="offline" />);

    const badge = screen.getByRole("status");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Offline");
    expect(badge).toHaveAttribute("aria-label", "Contract health: Offline");
    expect(badge).toHaveClass("bg-terminal-gray/10");
    expect(badge).toHaveClass("status-offline");
  });

  it.each([
    ["healthy", "bg-terminal-green/10"],
    ["degraded", "bg-terminal-warning/10"],
    ["offline", "bg-terminal-gray/10"],
  ] as const)("asserts correct background CSS class for %s status", (status, expectedBgClass) => {
    const { container } = render(<ContractHealthBadge status={status as ContractHealthStatus} />);
    const badge = container.querySelector('[role="status"]');
    expect(badge).toHaveClass(expectedBgClass);
  });
});
