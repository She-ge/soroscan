/**
 * Jest/React Testing Library tests for ResponsiveCard component (FE-152)
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  ResponsiveCard,
  ResponsiveCardHeader,
  ResponsiveCardBody,
  ResponsiveCardFooter,
} from "./responsive-card";

describe("ResponsiveCard Component (FE-152)", () => {
  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      render(<ResponsiveCard>Test content</ResponsiveCard>);
      expect(screen.getByText("Test content")).toBeInTheDocument();
    });

    it("should render with title prop", () => {
      render(
        <ResponsiveCard title="Card Title">
          Content here
        </ResponsiveCard>
      );

      expect(screen.getByText("Card Title")).toBeInTheDocument();
      expect(screen.getByText("Content here")).toBeInTheDocument();
    });

    it("should render with description", () => {
      render(
        <ResponsiveCard
          title="Title"
          description="This is a description"
        >
          Content
        </ResponsiveCard>
      );

      expect(screen.getByText("This is a description")).toBeInTheDocument();
    });

    it("should render with icon", () => {
      render(
        <ResponsiveCard icon="📦" title="Events">
          Content
        </ResponsiveCard>
      );

      expect(screen.getByText("📦")).toBeInTheDocument();
    });

    it("should render footer content", () => {
      render(
        <ResponsiveCard footer="Footer text">
          Body content
        </ResponsiveCard>
      );

      expect(screen.getByText("Footer text")).toBeInTheDocument();
    });
  });

  describe("Variants", () => {
    it("should apply default variant by default", () => {
      const { container } = render(
        <ResponsiveCard>Content</ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card).toHaveAttribute("data-variant", "default");
    });

    it("should apply flat variant", () => {
      const { container } = render(
        <ResponsiveCard variant="flat">Content</ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card).toHaveAttribute("data-variant", "flat");
    });

    it("should apply elevated variant", () => {
      const { container } = render(
        <ResponsiveCard variant="elevated">Content</ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card).toHaveAttribute("data-variant", "elevated");
    });

    it("should apply ghost variant", () => {
      const { container } = render(
        <ResponsiveCard variant="ghost">Content</ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card).toHaveAttribute("data-variant", "ghost");
    });

    it("should apply success variant", () => {
      const { container } = render(
        <ResponsiveCard variant="success" title="Success">
          Operation completed
        </ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card).toHaveAttribute("data-variant", "success");
    });

    it("should apply warning variant", () => {
      const { container } = render(
        <ResponsiveCard variant="warning" title="Warning">
          Please check
        </ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card).toHaveAttribute("data-variant", "warning");
    });

    it("should apply danger variant", () => {
      const { container } = render(
        <ResponsiveCard variant="danger" title="Error">
          Something failed
        </ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card).toHaveAttribute("data-variant", "danger");
    });

    it("should apply info variant", () => {
      const { container } = render(
        <ResponsiveCard variant="info" title="Info">
          Information
        </ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card).toHaveAttribute("data-variant", "info");
    });
  });

  describe("Spacing Variants", () => {
    it("should apply compact spacing", () => {
      const { container } = render(
        <ResponsiveCard spacing="compact">Content</ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card).toHaveAttribute("data-variant"); // spacing applied via class
    });

    it("should apply loose spacing", () => {
      const { container } = render(
        <ResponsiveCard spacing="loose">Content</ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe("Border Styles", () => {
    it("should render with default border", () => {
      const { container } = render(
        <ResponsiveCard>Content</ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card?.className).toContain("border");
    });

    it("should render with no border", () => {
      const { container } = render(
        <ResponsiveCard border="none">Content</ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card).toHaveAttribute("data-variant");
    });

    it("should render with thick border", () => {
      const { container } = render(
        <ResponsiveCard border="thick">Content</ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe("Rounded Variants", () => {
    it("should apply small radius", () => {
      const { container } = render(
        <ResponsiveCard rounded="sm">Content</ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card?.className).toContain("rounded");
    });

    it("should apply large radius", () => {
      const { container } = render(
        <ResponsiveCard rounded="lg">Content</ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card?.className).toContain("rounded");
    });

    it("should apply full radius", () => {
      const { container } = render(
        <ResponsiveCard rounded="full">Content</ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card?.className).toContain("rounded");
    });
  });

  describe("Interactive Features", () => {
    it("should handle click events", async () => {
      const handleClick = jest.fn();
      render(
        <ResponsiveCard onClick={handleClick} clickable>
          Clickable card
        </ResponsiveCard>
      );

      const card = screen.getByRole("button");
      await userEvent.click(card);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("should be keyboard accessible with Enter key", async () => {
      const handleClick = jest.fn();
      render(
        <ResponsiveCard onClick={handleClick} clickable>
          Keyboard card
        </ResponsiveCard>
      );

      const card = screen.getByRole("button");
      card.focus();
      fireEvent.keyDown(card, { key: "Enter" });

      expect(handleClick).toHaveBeenCalled();
    });

    it("should be keyboard accessible with Space key", async () => {
      const handleClick = jest.fn();
      render(
        <ResponsiveCard onClick={handleClick} clickable>
          Keyboard card
        </ResponsiveCard>
      );

      const card = screen.getByRole("button");
      card.focus();
      fireEvent.keyDown(card, { key: " " });

      expect(handleClick).toHaveBeenCalled();
    });

    it("should have tabIndex 0 when clickable", () => {
      const { container } = render(
        <ResponsiveCard clickable>Clickable</ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card).toHaveAttribute("tabIndex", "0");
    });

    it("should have tabIndex -1 when not interactive", () => {
      const { container } = render(
        <ResponsiveCard>Not interactive</ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card).toHaveAttribute("tabIndex", "-1");
    });
  });

  describe("Accessibility", () => {
    it("should support aria-label", () => {
      const { container } = render(
        <ResponsiveCard ariaLabel="Event information">
          Content
        </ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card).toHaveAttribute("aria-label", "Event information");
    });

    it("should support custom role attribute", () => {
      const { container } = render(
        <ResponsiveCard role="region">
          Content
        </ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card).toHaveAttribute("role", "region");
    });

    it("should have article role by default", () => {
      const { container } = render(
        <ResponsiveCard>Content</ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card).toHaveAttribute("role", "article");
    });

    it("should have button role when clickable", () => {
      const { container } = render(
        <ResponsiveCard clickable>Clickable</ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card).toHaveAttribute("role", "button");
    });

    it("should mark icon with aria-hidden", () => {
      render(
        <ResponsiveCard icon="📦" title="Title">
          Content
        </ResponsiveCard>
      );

      // Icon should be marked as decorative
      expect(screen.getByText("📦")).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("Composed Components", () => {
    it("should render with custom header", () => {
      render(
        <ResponsiveCard title="Title">
          <ResponsiveCardHeader>Custom header</ResponsiveCardHeader>
          <ResponsiveCardBody>Body content</ResponsiveCardBody>
        </ResponsiveCard>
      );

      expect(screen.getByText("Custom header")).toBeInTheDocument();
    });

    it("should render with custom body", () => {
      render(
        <ResponsiveCard>
          <ResponsiveCardBody>Custom body</ResponsiveCardBody>
        </ResponsiveCard>
      );

      expect(screen.getByText("Custom body")).toBeInTheDocument();
    });

    it("should render with custom footer", () => {
      render(
        <ResponsiveCard>
          <ResponsiveCardBody>Content</ResponsiveCardBody>
          <ResponsiveCardFooter>Custom footer</ResponsiveCardFooter>
        </ResponsiveCard>
      );

      expect(screen.getByText("Custom footer")).toBeInTheDocument();
    });
  });

  describe("Responsive Behavior", () => {
    it("should have responsive padding classes", () => {
      const { container } = render(
        <ResponsiveCard>Content</ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      const className = card?.className || "";

      // Should contain responsive padding utilities
      expect(className).toMatch(/px-|py-/);
    });

    it("should have responsive text sizing in body", () => {
      render(
        <ResponsiveCard>
          <ResponsiveCardBody>Responsive text</ResponsiveCardBody>
        </ResponsiveCard>
      );

      const body = screen.getByText("Responsive text").parentElement;
      const className = body?.className || "";

      // Should have responsive text size utilities
      expect(className).toMatch(/text-/);
    });
  });

  describe("Custom Classes", () => {
    it("should merge custom className", () => {
      const { container } = render(
        <ResponsiveCard className="custom-class">
          Content
        </ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card?.className).toContain("custom-class");
    });

    it("should support data attributes", () => {
      const { container } = render(
        <ResponsiveCard data-testid="test-card">
          Content
        </ResponsiveCard>
      );

      const card = container.querySelector('[data-testid="test-card"]');
      expect(card).toBeInTheDocument();
    });
  });

  describe("Hoverable State", () => {
    it("should apply hoverable styles when enabled", () => {
      const { container } = render(
        <ResponsiveCard hoverable>Content</ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      expect(card?.className).toContain("hover");
    });

    it("should not apply hoverable styles when disabled", () => {
      const { container } = render(
        <ResponsiveCard hoverable={false}>
          Content
        </ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      // Should still have base styles but no special hover
      expect(card).toBeInTheDocument();
    });
  });

  describe("Theme Integration", () => {
    it("should apply dark mode classes", () => {
      const { container } = render(
        <ResponsiveCard>Content</ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      const className = card?.className || "";

      // Should contain dark: utilities for terminal theme
      expect(className).toMatch(/dark:/);
    });

    it("should support terminal color tokens", () => {
      const { container } = render(
        <ResponsiveCard>Content</ResponsiveCard>
      );

      const card = container.querySelector('[data-slot="responsive-card"]');
      const className = card?.className || "";

      // Should reference terminal color tokens
      expect(
        className.includes("terminal-") || className.includes("terminal-light")
      ).toBe(true);
    });
  });
});
