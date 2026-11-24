import { render, fireEvent } from "@testing-library/react";
import { EventTable } from "@/app/dashboard/components/EventTable";
import type { EventRecord } from "@/components/ingest/types";

const events: EventRecord[] = [
  {
    id: "event-1",
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
    id: "event-2",
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

function renderTable(onEventClick = jest.fn()) {
  const view = render(
    <EventTable
      events={events}
      loading={false}
      onEventClick={onEventClick}
      selectedIds={new Set()}
      onToggleSelect={jest.fn()}
    />,
  );
  return { ...view, onEventClick };
}

const rows = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("tbody tr"));

describe("EventTable keyboard operability", () => {
  it("makes every event row focusable", () => {
    const { container } = renderTable();
    const tableRows = rows(container);

    expect(tableRows).toHaveLength(events.length);
    tableRows.forEach((row) => expect(row).toHaveAttribute("tabindex", "0"));
  });

  it("opens the event detail with Enter", () => {
    const { container, onEventClick } = renderTable();
    const row = rows(container)[0];

    fireEvent.keyDown(row, { key: "Enter" });

    expect(onEventClick).toHaveBeenCalledTimes(1);
    expect(onEventClick).toHaveBeenCalledWith(events[0]);
  });

  it("opens the event detail with Space", () => {
    const { container, onEventClick } = renderTable();
    const row = rows(container)[1];

    fireEvent.keyDown(row, { key: " " });

    expect(onEventClick).toHaveBeenCalledTimes(1);
    expect(onEventClick).toHaveBeenCalledWith(events[1]);
  });

  it("does not open the detail for keys pressed on the row checkbox", () => {
    const { container, onEventClick } = renderTable();
    // Both the desktop table and the mobile card grid render a checkbox for
    // the same event; drive the one inside the table row.
    const checkbox = container.querySelector(
      'tbody input[type="checkbox"]',
    ) as HTMLElement;
    expect(checkbox).toBeTruthy();

    fireEvent.keyDown(checkbox, { key: "Enter" });
    fireEvent.keyDown(checkbox, { key: " " });

    expect(onEventClick).not.toHaveBeenCalled();
    // The row itself is still keyboard operable afterwards.
    fireEvent.keyDown(rows(container)[0], { key: "Enter" });
    expect(onEventClick).toHaveBeenCalledTimes(1);
  });

  it("still opens the detail on click", () => {
    const { container, onEventClick } = renderTable();

    fireEvent.click(rows(container)[0]);

    expect(onEventClick).toHaveBeenCalledWith(events[0]);
  });
});
