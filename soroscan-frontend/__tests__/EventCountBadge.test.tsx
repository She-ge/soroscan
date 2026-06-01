import React from "react";
import { render, screen } from "@testing-library/react";
import { EventStreamProvider } from "@/context/EventStreamContext";
import { EventCountBadge } from "@/components/ui/EventCountBadge";

// ── Mock useContractEventSubscription ───────────────────────────────
const mockHook = {
  useContractEventSubscription: jest.fn(),
};

jest.mock("@/src/hooks/useContractEventSubscription", () => ({
  useContractEventSubscription: (opts: unknown) => mockHook.useContractEventSubscription(opts),
}));

describe("EventCountBadge", () => {
  beforeEach(() => {
    mockHook.useContractEventSubscription.mockReset();
  });

  it("renders the correct initial count", () => {
    mockHook.useContractEventSubscription.mockReturnValue({
      events: [],
      loading: false,
      error: undefined,
      connectionState: "connected",
    });

    render(
      <EventStreamProvider>
        <EventCountBadge contractId="C123" initialCount={42} />
      </EventStreamProvider>
    );

    expect(screen.getByTestId("event-count-badge-C123")).toHaveTextContent("42");
  });

  it("renders correctly for zero events", () => {
    mockHook.useContractEventSubscription.mockReturnValue({
      events: [],
      loading: false,
      error: undefined,
      connectionState: "connected",
    });

    render(
      <EventStreamProvider>
        <EventCountBadge contractId="C123" initialCount={0} />
      </EventStreamProvider>
    );

    const badge = screen.getByTestId("event-count-badge-C123");
    expect(badge).toHaveTextContent("0");
    expect(badge.className).toContain("text-terminal-gray");
  });

  it("formats extremely high event counts as k+", () => {
    mockHook.useContractEventSubscription.mockReturnValue({
      events: [],
      loading: false,
      error: undefined,
      connectionState: "connected",
    });

    render(
      <EventStreamProvider>
        <EventCountBadge contractId="C123" initialCount={12345} />
      </EventStreamProvider>
    );

    expect(screen.getByTestId("event-count-badge-C123")).toHaveTextContent("12k+");
  });

  it("updates automatically when a new event arrives in the stream", () => {
    // Start with empty events list
    let mockResult = {
      events: [],
      loading: false,
      error: undefined,
      connectionState: "connected",
    };
    
    mockHook.useContractEventSubscription.mockImplementation(() => mockResult);

    const { rerender } = render(
      <EventStreamProvider>
        <EventCountBadge contractId="C123" initialCount={5} />
      </EventStreamProvider>
    );

    expect(screen.getByTestId("event-count-badge-C123")).toHaveTextContent("5");

    // Simulate an event arriving by updating mock implementation and rerendering
    mockResult = {
      events: [
        {
          id: "evt-1",
          eventType: "transfer",
          ledgerSequence: 100,
          timestamp: new Date().toISOString(),
          payload: "{}",
        },
      ],
      loading: false,
      error: undefined,
      connectionState: "connected",
    };

    rerender(
      <EventStreamProvider>
        <EventCountBadge contractId="C123" initialCount={5} />
      </EventStreamProvider>
    );

    expect(screen.getByTestId("event-count-badge-C123")).toHaveTextContent("6");
  });
});
