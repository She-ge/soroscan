import React from "react";
import { render, screen } from "@testing-library/react";
import { WebhookDeliveryStatusBadge, getDeliveryState } from "./WebhookDeliveryStatusBadge";

describe("WebhookDeliveryStatusBadge", () => {
  describe("Success state", () => {
    it("should render success state with green color", () => {
      render(
        <WebhookDeliveryStatusBadge
          state="success"
          lastDeliveryTime="2024-01-15T10:30:00Z"
        />
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveClass("text-terminal-green");
      expect(screen.getByText("Success")).toBeInTheDocument();
    });

    it("should show success icon", () => {
      const { container } = render(
        <WebhookDeliveryStatusBadge state="success" />
      );

      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should display last delivery time in tooltip", () => {
      render(
        <WebhookDeliveryStatusBadge
          state="success"
          lastDeliveryTime="2024-01-15T10:30:00Z"
          showTooltip={true}
        />
      );

      // Tooltip should be visible on hover (simulated via class check)
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toBeInTheDocument();
    });
  });

  describe("Retrying state", () => {
    it("should render retrying state with orange color", () => {
      render(
        <WebhookDeliveryStatusBadge
          state="retrying"
          lastDeliveryTime="2024-01-15T09:00:00Z"
          failureCount={3}
        />
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveClass("text-terminal-warning");
      expect(screen.getByText("Retrying")).toBeInTheDocument();
    });

    it("should show rotating icon for retrying state", () => {
      const { container } = render(
        <WebhookDeliveryStatusBadge state="retrying" />
      );

      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
      // Check for animate-spin class on the icon container
      const iconSpan = icon?.parentElement;
      expect(iconSpan?.className).toMatch(/animate-spin/);
    });

    it("should display failure count in tooltip", () => {
      render(
        <WebhookDeliveryStatusBadge
          state="retrying"
          failureCount={5}
          showTooltip={true}
        />
      );

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip.textContent).toContain("Failures: 5");
    });
  });

  describe("Failed state", () => {
    it("should render failed state with red color", () => {
      render(
        <WebhookDeliveryStatusBadge
          state="failed"
          lastDeliveryTime="2024-01-14T15:00:00Z"
          isActive={false}
        />
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveClass("text-terminal-danger");
      expect(screen.getByText("Failed")).toBeInTheDocument();
    });

    it("should show alert icon for failed state", () => {
      const { container } = render(
        <WebhookDeliveryStatusBadge state="failed" />
      );

      const icon = container.querySelector("svg");
      expect(icon).toBeInTheDocument();
    });

    it("should indicate subscription inactive in tooltip", () => {
      render(
        <WebhookDeliveryStatusBadge
          state="failed"
          isActive={false}
          showTooltip={true}
        />
      );

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip.textContent).toContain("Subscription inactive");
    });
  });

  describe("Time formatting", () => {
    it("should show 'Just now' for very recent deliveries", () => {
      const now = new Date();
      const timeStr = now.toISOString();

      render(
        <WebhookDeliveryStatusBadge
          state="success"
          lastDeliveryTime={timeStr}
          showTooltip={true}
        />
      );

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip.textContent).toContain("Just now");
    });

    it("should show 'Never' for undefined delivery time", () => {
      render(
        <WebhookDeliveryStatusBadge
          state="success"
          lastDeliveryTime={undefined}
          showTooltip={true}
        />
      );

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip.textContent).toContain("Last: Never");
    });

    it("should show minutes ago format", () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);
      const timeStr = fiveMinutesAgo.toISOString();

      render(
        <WebhookDeliveryStatusBadge
          state="success"
          lastDeliveryTime={timeStr}
          showTooltip={true}
        />
      );

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip.textContent).toMatch(/\d+m ago/);
    });

    it("should show hours ago format", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600000);
      const timeStr = twoHoursAgo.toISOString();

      render(
        <WebhookDeliveryStatusBadge
          state="success"
          lastDeliveryTime={timeStr}
          showTooltip={true}
        />
      );

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip.textContent).toMatch(/\d+h ago/);
    });

    it("should show days ago format", () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000);
      const timeStr = threeDaysAgo.toISOString();

      render(
        <WebhookDeliveryStatusBadge
          state="success"
          lastDeliveryTime={timeStr}
          showTooltip={true}
        />
      );

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip.textContent).toMatch(/\d+d ago/);
    });
  });

  describe("Tooltip behavior", () => {
    it("should not render tooltip when showTooltip is false", () => {
      render(
        <WebhookDeliveryStatusBadge
          state="success"
          showTooltip={false}
        />
      );

      const tooltip = screen.queryByRole("tooltip");
      expect(tooltip).not.toBeInTheDocument();
    });

    it("should include all tooltip details", () => {
      render(
        <WebhookDeliveryStatusBadge
          state="retrying"
          lastDeliveryTime={new Date(Date.now() - 10 * 60000).toISOString()}
          failureCount={2}
          isActive={true}
          showTooltip={true}
        />
      );

      const tooltip = screen.getByRole("tooltip");
      expect(tooltip.textContent).toContain("Delivery failing but retrying");
      expect(tooltip.textContent).toContain("Last:");
      expect(tooltip.textContent).toContain("Failures: 2");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA role and labels", () => {
      render(
        <WebhookDeliveryStatusBadge
          state="success"
          lastDeliveryTime="2024-01-15T10:30:00Z"
        />
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveAttribute(
        "aria-label",
        expect.stringContaining("Webhook delivery status")
      );
    });

    it("should have aria-hidden on decorative icons", () => {
      const { container } = render(
        <WebhookDeliveryStatusBadge state="success" />
      );

      const firstIcon = container.querySelector("[aria-hidden='true']");
      expect(firstIcon).toBeInTheDocument();
    });
  });

  describe("CSS classes", () => {
    it("should apply custom className", () => {
      render(
        <WebhookDeliveryStatusBadge
          state="success"
          className="custom-class"
        />
      );

      const badge = screen.getByRole("status");
      expect(badge).toHaveClass("custom-class");
    });

    it("should apply terminal styling classes", () => {
      render(<WebhookDeliveryStatusBadge state="success" />);

      const badge = screen.getByRole("status");
      expect(badge).toHaveClass("font-terminal-mono");
      expect(badge).toHaveClass("rounded");
    });
  });
});

describe("getDeliveryState", () => {
  it("should return 'failed' when webhook is inactive", () => {
    const state = getDeliveryState(false, true, 0);
    expect(state).toBe("failed");
  });

  it("should return 'success' when active with successful last delivery and no failures", () => {
    const state = getDeliveryState(true, true, 0);
    expect(state).toBe("success");
  });

  it("should return 'retrying' when active with failures", () => {
    const state = getDeliveryState(true, false, 3);
    expect(state).toBe("retrying");
  });

  it("should return 'retrying' when active with failure count > 0 despite success", () => {
    const state = getDeliveryState(true, true, 2);
    expect(state).toBe("retrying");
  });

  it("should return 'success' when active and no failures", () => {
    const state = getDeliveryState(true, true, 0);
    expect(state).toBe("success");
  });

  it("should return 'retrying' when active and last delivery failed", () => {
    const state = getDeliveryState(true, false, 0);
    expect(state).toBe("retrying");
  });
});
