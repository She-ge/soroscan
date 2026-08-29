import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";

import {
  groupEventsByTransaction,
  TransactionTimeline,
} from "./TransactionTimeline";
import type { TransactionTimelineEvent } from "./types";

const events: TransactionTimelineEvent[] = [
  {
    id: "event-3",
    transactionId: "tx-2",
    eventType: "Approve",
    title: "Approve event",
    timestamp: "2026-03-22T10:03:00.000Z",
    status: "error",
    details: {
      reason: "Rejected",
    },
  },
  {
    id: "event-1",
    transactionId: "tx-1",
    eventType: "Init",
    title: "Init event",
    timestamp: "2026-03-22T10:01:00.000Z",
    status: "success",
    details: {
      step: 1,
    },
  },
  {
    id: "event-2",
    transactionId: "tx-1",
    eventType: "Transfer",
    title: "Transfer event",
    timestamp: "2026-03-22T10:02:00.000Z",
    status: "pending",
    parentEventId: "event-1",
    details: {
      step: 2,
    },
  },
];

describe("groupEventsByTransaction", () => {
  it("sorts events chronologically and groups them by transaction", () => {
    const groups =
      groupEventsByTransaction(events);

    expect(groups).toHaveLength(2);
    expect(groups[0].transactionId).toBe("tx-1");

    expect(
      groups[0].events.map((event) => event.id),
    ).toEqual([
      "event-1",
      "event-2",
    ]);

    expect(groups[1].transactionId).toBe("tx-2");
  });
});

describe("TransactionTimeline", () => {
  it("renders events chronologically", () => {
    render(
      <TransactionTimeline events={events} />,
    );

    expect(
      screen
        .getAllByTestId("timeline-event-title")
        .map((element) => element.textContent),
    ).toEqual([
      "Init event",
      "Transfer event",
      "Approve event",
    ]);
  });

  it("groups events by logical transaction", () => {
    render(
      <TransactionTimeline events={events} />,
    );

    expect(
      screen.getAllByTestId("timeline-group"),
    ).toHaveLength(2);

    expect(
      screen.getByRole("heading", {
        name: "tx-1",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "tx-2",
      }),
    ).toBeInTheDocument();
  });

  it("color-codes success, error, and pending statuses", () => {
    render(
      <TransactionTimeline events={events} />,
    );

    const timelineEvents =
      screen.getAllByTestId("timeline-event");

    expect(timelineEvents[0]).toHaveAttribute(
      "data-status",
      "success",
    );

    expect(timelineEvents[1]).toHaveAttribute(
      "data-status",
      "pending",
    );

    expect(timelineEvents[2]).toHaveAttribute(
      "data-status",
      "error",
    );

    expect(
      screen.getAllByText("Success").length,
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText("Pending").length,
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText("Error").length,
    ).toBeGreaterThan(0);
  });

  it("shows event details when an event is clicked", () => {
    render(
      <TransactionTimeline events={events} />,
    );

    const initButton = screen.getByRole(
      "button",
      {
        name: /Init event/i,
      },
    );

    const details =
      screen.getAllByTestId(
        "timeline-event-details",
      )[0];

    expect(initButton).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    expect(details).toHaveClass(
      "grid-rows-[0fr]",
      "opacity-0",
    );

    fireEvent.click(initButton);

    expect(initButton).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    expect(details).toHaveClass(
      "grid-rows-[1fr]",
      "opacity-100",
    );

    expect(
      screen.getByText(/"step": 1/),
    ).toBeInTheDocument();
  });

  it("shows causality for child events", () => {
    render(
      <TransactionTimeline events={events} />,
    );

    expect(
      screen.getByText(
        "Caused by event event-1",
      ),
    ).toBeInTheDocument();
  });

  it("filters event types using show and hide controls", () => {
    render(
      <TransactionTimeline events={events} />,
    );

    const transferFilter = screen.getByRole(
      "checkbox",
      {
        name: "Transfer",
      },
    );

    fireEvent.click(transferFilter);

    expect(
      screen.queryByText("Transfer event"),
    ).not.toBeInTheDocument();

    expect(
      screen.getByText(
        "Showing 2 of 3 events",
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Hide all",
      }),
    );

    expect(
      screen.getByText(
        "No events match the selected filters.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Show all",
      }),
    );

    expect(
      screen.getByText("Transfer event"),
    ).toBeInTheDocument();
  });

  it("zooms the time scale in and out", () => {
    render(
      <TransactionTimeline events={events} />,
    );

    const zoomLevel = screen.getByTestId(
      "timeline-zoom-level",
    );

    expect(zoomLevel).toHaveTextContent("100%");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Zoom in",
      }),
    );

    expect(zoomLevel).toHaveTextContent("125%");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Zoom out",
      }),
    );

    expect(zoomLevel).toHaveTextContent("100%");

    fireEvent.click(
      screen.getByRole("button", {
        name: "Zoom out",
      }),
    );

    expect(zoomLevel).toHaveTextContent("75%");
  });

  it(
    "renders more than 1000 events",
    () => {
      const largeEventSet = Array.from(
        {
          length: 1001,
        },
        (
          _,
          index,
        ): TransactionTimelineEvent => ({
          id: `large-event-${index}`,
          transactionId: `large-tx-${Math.floor(
            index / 100,
          )}`,
          eventType:
            index % 2 === 0
              ? "Transfer"
              : "Approve",
          title: `Large event ${index}`,
          timestamp: new Date(
            Date.UTC(
              2026,
              2,
              22,
              10,
              0,
              index,
            ),
          ).toISOString(),
          status:
            index % 3 === 0
              ? "pending"
              : "success",
        }),
      );

      render(
        <TransactionTimeline
          events={largeEventSet}
        />,
      );

      expect(
        screen.getAllByTestId(
          "timeline-event",
        ),
      ).toHaveLength(1001);

      expect(
        within(
          screen.getByTestId(
            "transaction-timeline",
          ),
        ).getByText(
          "Showing 1001 of 1001 events",
        ),
      ).toBeInTheDocument();
    },
    15_000,
  );
});
