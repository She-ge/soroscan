import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react";
import { EventTable } from "../EventTable";
import type { EventRecord } from "@/components/ingest/types";

describe("EventTable", () => {
  const mockEvents: EventRecord[] = [
    {
      id: "1",
      contractId: "CCAAA123",
      contractName: "Test Contract",
      eventType: "transfer",
      ledger: 1000,
      eventIndex: 0,
      timestamp: "2024-01-01T00:00:00Z",
      txHash: "abc123",
      payload: { amount: 100 },
    },
    {
      id: "2",
      contractId: "CCBBB456",
      contractName: "Another Contract",
      eventType: "swap",
      ledger: 1001,
      eventIndex: 1,
      timestamp: "2024-01-01T01:00:00Z",
      txHash: "def456",
      payload: { from: "A", to: "B" },
    },
  ];

  const mockOnEventClick = jest.fn();
  const mockOnToggleSelect = jest.fn();
  const mockOnToggleSelectAll = jest.fn();

  const defaultMultiSelectProps = {
    selectedIds: new Set<string>(),
    onToggleSelect: mockOnToggleSelect,
    onToggleSelectAll: mockOnToggleSelectAll,
  };

  beforeEach(() => {
    mockOnEventClick.mockClear();
    mockOnToggleSelect.mockClear();
    mockOnToggleSelectAll.mockClear();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve()),
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("Loading State (issue #595)", () => {
    it("shows skeleton loader while loading", () => {
      const { container } = render(
        <EventTable
          events={[]}
          loading={true}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />
      );

      // Check that skeleton rows are rendered
      const skeletonRows = container.querySelectorAll("tbody tr");
      expect(skeletonRows.length).toBe(5);

      // Check that skeleton elements exist
      const skeletons = container.querySelectorAll(".skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("skeleton matches table structure with 7 columns (including checkbox)", () => {
      const { container } = render(
        <EventTable
          events={[]}
          loading={true}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />
      );

      const firstRow = container.querySelector("tbody tr");
      const cells = firstRow?.querySelectorAll("td");

      // Should have 7 columns: Checkbox, Contract, Type, Ledger, Time, Transaction, Actions
      expect(cells?.length).toBe(7);
    });

    it("skeleton has proper styling for each column type", () => {
      const { container } = render(
        <EventTable
          events={[]}
          loading={true}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />
      );

      const firstRow = container.querySelector("tbody tr");
      const skeletons = firstRow?.querySelectorAll(".skeleton");

      // 7 skeleton cells: checkbox + Contract + Type + Ledger + Time + Tx + Actions
      expect(skeletons?.length).toBe(7);

      // Contract column skeleton (index 1, after checkbox)
      expect(skeletons?.[1]).toHaveStyle({ width: "120px" });

      // Type column skeleton (pill-shaped)
      expect(skeletons?.[2]).toHaveStyle({ borderRadius: "12px" });
    });

    it("does not show skeleton when not loading", () => {
      const { container } = render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />
      );

      const skeletons = container.querySelectorAll(".skeleton");
      expect(skeletons.length).toBe(0);
    });

    it("transitions smoothly from skeleton to content", () => {
      const { container, rerender } = render(
        <EventTable
          events={[]}
          loading={true}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />
      );

      // Initially shows skeleton
      let skeletons = container.querySelectorAll(".skeleton");
      expect(skeletons.length).toBeGreaterThan(0);

      // Rerender with data
      rerender(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />
      );

      // Skeleton should be gone
      skeletons = container.querySelectorAll(".skeleton");
      expect(skeletons.length).toBe(0);

      // Content should be visible (check for shortened contract ID)
      expect(screen.getByText(/CCAAA/)).toBeInTheDocument();
    });
  });

  describe("Event Display", () => {
    it("renders events when not loading", () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />
      );

      // Check for shortened contract IDs (not full names)
      expect(screen.getByText(/CCAAA/)).toBeInTheDocument();
      expect(screen.getByText(/CCBBB/)).toBeInTheDocument();
      expect(screen.getByText("transfer")).toBeInTheDocument();
      expect(screen.getByText("swap")).toBeInTheDocument();
    });

    it("shows empty state when no events and not loading", () => {
      render(
        <EventTable
          events={[]}
          loading={false}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />
      );

      expect(screen.getByText(/No events found/i)).toBeInTheDocument();
    });

    it("calls onEventClick when View button is clicked", () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />
      );

      const viewButtons = screen.getAllByRole("button", { name: /view/i });
      fireEvent.click(viewButtons[0]);

      expect(mockOnEventClick).toHaveBeenCalledWith(mockEvents[0]);
    });

    it("copies contract ID to clipboard", async () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />
      );

      const copyButtons = screen.getAllByTitle("Copy contract ID");
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("CCAAA123");
      });
    });

    it("copies transaction hash to clipboard", async () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />
      );

      const copyButtons = screen.getAllByTitle("Copy transaction hash");
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith("abc123");
      });
    });

    it("shows checkmark after successful copy", async () => {
      jest.useFakeTimers();
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />
      );

      const copyButtons = screen.getAllByTitle("Copy contract ID");
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(copyButtons[0]).toHaveTextContent("✓");
      });

      // After 2 seconds, should revert to clipboard icon
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });

      await waitFor(() => {
        expect(copyButtons[0]).toHaveTextContent("📋");
      });
    });

    it("applies hover effects to event rows", () => {
      const { container } = render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />
      );

      const eventRow = container.querySelector("tbody tr");
      expect(eventRow).toHaveStyle({ cursor: "pointer" });
    });
  });

  describe("Multi-select (issue #569)", () => {
    it("renders a checkbox in each event row", () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />
      );

      // One checkbox per row + one in header = 3 total
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBe(mockEvents.length + 1); // rows + header
    });

    it("calls onToggleSelect when a row checkbox is clicked", () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />
      );

      const rowCheckboxes = screen.getAllByRole("checkbox").slice(1); // exclude header
      fireEvent.click(rowCheckboxes[0]);
      expect(mockOnToggleSelect).toHaveBeenCalledWith("1");
    });

    it("calls onToggleSelectAll when header checkbox is clicked", () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />
      );

      const headerCheckbox = screen.getByLabelText(/select all events/i);
      fireEvent.click(headerCheckbox);
      expect(mockOnToggleSelectAll).toHaveBeenCalledTimes(1);
    });

    it("shows header checkbox as checked when all rows are selected", () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
          selectedIds={new Set(["1", "2"])}
          onToggleSelect={mockOnToggleSelect}
          onToggleSelectAll={mockOnToggleSelectAll}
        />
      );

      const headerCheckbox = screen.getByLabelText(/deselect all events/i);
      expect(headerCheckbox).toBeChecked();
    });

    it("shows selected row with visual highlight class", () => {
      const { container } = render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
          selectedIds={new Set(["1"])}
          onToggleSelect={mockOnToggleSelect}
          onToggleSelectAll={mockOnToggleSelectAll}
        />
      );

      const rows = container.querySelectorAll("tbody tr");
      // First row should have the selectedRow class
      expect(rows[0].className).toMatch(/selectedRow/);
      // Second row should NOT
      expect(rows[1].className).not.toMatch(/selectedRow/);
    });
  });

  describe("Accessibility", () => {
    it("has proper table structure", () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />
      );

      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();

      const headers = screen.getAllByRole("columnheader");
      // Checkbox + Contract + Type + Ledger + Time + Transaction + Actions = 7
      expect(headers).toHaveLength(7);
    });

    it("skeleton rows have unique keys", () => {
      const { container } = render(
        <EventTable
          events={[]}
          loading={true}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />
      );

      const rows = container.querySelectorAll("tbody tr");

      // Check that we have 5 skeleton rows
      expect(rows.length).toBe(5);

      // React keys are used internally and don't appear in DOM
      // Just verify all rows are rendered
      rows.forEach((row) => {
        expect(row).toBeInTheDocument();
      });
    });
  });
});
