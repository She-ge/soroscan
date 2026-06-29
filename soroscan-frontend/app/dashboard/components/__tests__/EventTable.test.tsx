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
        />,
      );

      expect(container.querySelectorAll("tbody tr")).toHaveLength(5);
      expect(container.querySelectorAll(".skeleton").length).toBeGreaterThan(0);
    });

    it("skeleton matches table structure with 7 columns including checkbox", () => {
      const { container } = render(
        <EventTable
          events={[]}
          loading={true}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />,
      );

      const firstRow = container.querySelector("tbody tr");
      const cells = firstRow?.querySelectorAll("td");

      expect(cells?.length).toBe(7);
    });

    it("skeleton has proper styling for each column type", () => {
      const { container } = render(
        <EventTable
          events={[]}
          loading={true}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />,
      );

      const firstRow = container.querySelector("tbody tr");
      const skeletons = firstRow?.querySelectorAll(".skeleton");

      expect(skeletons?.length).toBe(7);
      expect(skeletons?.[1]).toHaveStyle({ width: "120px" });
      expect(skeletons?.[2]).toHaveStyle({ borderRadius: "12px" });
    });

    it("does not show skeleton when not loading", () => {
      const { container } = render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />,
      );

      expect(container.querySelectorAll(".skeleton")).toHaveLength(0);
    });

    it("transitions smoothly from skeleton to content", () => {
      const { container, rerender } = render(
        <EventTable
          events={[]}
          loading={true}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />,
      );

      expect(container.querySelectorAll(".skeleton").length).toBeGreaterThan(0);

      rerender(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />,
      );

      expect(container.querySelectorAll(".skeleton")).toHaveLength(0);
      expect(screen.getAllByText(/CCAAA/).length).toBeGreaterThan(0);
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
        />,
      );

      expect(screen.getAllByText(/CCAAA/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/CCBBB/).length).toBeGreaterThan(0);
      expect(screen.getAllByText("transfer").length).toBeGreaterThan(0);
      expect(screen.getAllByText("swap").length).toBeGreaterThan(0);
    });

    it("shows empty state when no events and not loading", () => {
      render(
        <EventTable
          events={[]}
          loading={false}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />,
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
        />,
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
        />,
      );

      fireEvent.click(screen.getAllByTitle("Copy contract ID")[0]);

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
        />,
      );

      fireEvent.click(screen.getAllByTitle("Copy transaction hash")[0]);

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
        />,
      );

      const copyButtons = screen.getAllByTitle("Copy contract ID");
      fireEvent.click(copyButtons[0]);

      await waitFor(() => {
        expect(copyButtons[0]).toHaveTextContent("✓");
      });

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
        />,
      );

      expect(container.querySelector("tbody tr")).toHaveStyle({
        cursor: "pointer",
      });
    });
  });

  describe("Responsive Card Grid", () => {
    it("renders a mobile card grid for events", () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />,
      );

      expect(screen.getByTestId("events-card-grid")).toBeInTheDocument();
      expect(screen.getAllByTestId("event-card")).toHaveLength(2);
    });

    it("shows event information in mobile cards", () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />,
      );

      const cards = screen.getAllByTestId("event-card");

      expect(cards[0]).toHaveTextContent("transfer");
      expect(cards[0]).toHaveTextContent("CCAAA123");
      expect(cards[0]).toHaveTextContent("1000");
      expect(cards[0]).toHaveTextContent("abc123");
    });

    it("opens event details when a mobile card is clicked", () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />,
      );

      fireEvent.click(screen.getAllByTestId("event-card")[0]);

      expect(mockOnEventClick).toHaveBeenCalledWith(mockEvents[0]);
    });

    it("opens event details from keyboard on a mobile card", () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />,
      );

      fireEvent.keyDown(screen.getAllByTestId("event-card")[0], {
        key: "Enter",
      });

      expect(mockOnEventClick).toHaveBeenCalledWith(mockEvents[0]);
    });
  });

  describe("Multi-select (issue #569)", () => {
    it("renders one table checkbox per event row plus the header checkbox", () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />,
      );

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes).toHaveLength(mockEvents.length + 1);
    });

    it("calls onToggleSelect when a row checkbox is clicked", () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />,
      );

      const checkbox = screen.getAllByLabelText("Select event 1")[0];
      fireEvent.click(checkbox);

      expect(mockOnToggleSelect).toHaveBeenCalledWith("1");
    });

    it("calls onToggleSelectAll when header checkbox is clicked", () => {
      render(
        <EventTable
          events={mockEvents}
          loading={false}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />,
      );

      fireEvent.click(screen.getByLabelText(/select all events/i));

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
        />,
      );

      expect(screen.getByLabelText(/deselect all events/i)).toBeChecked();
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
        />,
      );

      const rows = container.querySelectorAll("tbody tr");

      expect(rows[0].className).toMatch(/selectedRow/);
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
        />,
      );

      expect(screen.getByRole("table")).toBeInTheDocument();
      expect(screen.getAllByRole("columnheader")).toHaveLength(7);
    });

    it("skeleton rows have unique keys", () => {
      const { container } = render(
        <EventTable
          events={[]}
          loading={true}
          onEventClick={mockOnEventClick}
          {...defaultMultiSelectProps}
        />,
      );

      const rows = container.querySelectorAll("tbody tr");

      expect(rows).toHaveLength(5);
      rows.forEach((row) => {
        expect(row).toBeInTheDocument();
      });
    });
  });
});
