import { render, screen, fireEvent } from "@testing-library/react";
import { EventTable } from "@/app/dashboard/components/EventTable";
import type { EventRecord } from "@/components/ingest/types";

const mockEvents: EventRecord[] = [
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

describe("EventTable responsive card grid", () => {
  it("renders the mobile card grid container", () => {
    render(
      <EventTable
        events={mockEvents}
        loading={false}
        onEventClick={jest.fn()}
      />,
    );

    expect(screen.getByTestId("events-card-grid")).toBeInTheDocument();
    expect(screen.getAllByTestId("event-card")).toHaveLength(2);
  });

  it("shows event information inside the mobile cards", () => {
    render(
      <EventTable
        events={mockEvents}
        loading={false}
        onEventClick={jest.fn()}
      />,
    );

    const cards = screen.getAllByTestId("event-card");

    expect(cards[0]).toHaveTextContent("transfer");
    expect(cards[0]).toHaveTextContent("CCAAA123");
    expect(cards[0]).toHaveTextContent("1000");
    expect(cards[0]).toHaveTextContent("abc123");

    expect(cards[1]).toHaveTextContent("swap");
    expect(cards[1]).toHaveTextContent("CCBBB456");
    expect(cards[1]).toHaveTextContent("1001");
    expect(cards[1]).toHaveTextContent("def456");
  });

  it("calls onEventClick when a mobile card is clicked", () => {
    const handleEventClick = jest.fn();

    render(
      <EventTable
        events={mockEvents}
        loading={false}
        onEventClick={handleEventClick}
      />,
    );

    const cards = screen.getAllByTestId("event-card");
    fireEvent.click(cards[0]);

    expect(handleEventClick).toHaveBeenCalledWith(mockEvents[0]);
  });

  it("calls onEventClick when a mobile card is opened with keyboard", () => {
    const handleEventClick = jest.fn();

    render(
      <EventTable
        events={mockEvents}
        loading={false}
        onEventClick={handleEventClick}
      />,
    );

    const cards = screen.getAllByTestId("event-card");
    fireEvent.keyDown(cards[0], { key: "Enter" });

    expect(handleEventClick).toHaveBeenCalledWith(mockEvents[0]);
  });

  it("shows skeleton rows while loading", () => {
    const { container } = render(
      <EventTable events={[]} loading={true} onEventClick={jest.fn()} />,
    );

    expect(container.querySelectorAll("tbody tr")).toHaveLength(5);
    expect(container.querySelectorAll(".skeleton").length).toBeGreaterThan(0);
  });

  it("shows empty state when no events are available", () => {
    render(<EventTable events={[]} loading={false} onEventClick={jest.fn()} />);

    expect(screen.getByText(/No events found/i)).toBeInTheDocument();
  });
});
