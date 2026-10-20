import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { EventExplorerDashboard } from "@/app/dashboard/components/EventExplorerDashboard";

const showToastMock = jest.fn();

jest.mock("@/context/ToastContext", () => ({
  useToast: () => ({ showToast: showToastMock }),
}));

jest.mock("@/components/ingest/graphql", () => ({
  fetchAllContracts: jest.fn().mockResolvedValue([{ contractId: "CABC", name: "Test" }]),
  fetchExplorerEvents: jest.fn(),
}));

jest.mock("@/src/hooks/useContractEventSubscription", () => ({
  useContractEventSubscription: () => ({
    events: [
      {
        id: "evt-1",
        eventType: "swap",
        ledgerSequence: 1,
        timestamp: new Date().toISOString(),
        payload: "{}",
      },
    ],
    connectionState: "connected",
  }),
}));

jest.mock("@/src/hooks/useEventGapCatchUp", () => ({
  useEventGapCatchUp: () => ({
    recoveredEvents: [],
    recordReceivedEvent: jest.fn(),
  }),
  prependRecoveredEvents: (prev: unknown[]) => prev,
}));

jest.mock("@/components/notifications/NotificationBell", () => ({
  NotificationBell: () => <div />,
}));

jest.mock("@/src/components/ConnectionStatusBadge", () => ({
  ConnectionStatusBadge: () => <div />,
}));

import { fetchExplorerEvents } from "@/components/ingest/graphql";

describe("EventExplorerDashboard background refresh failure", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchExplorerEvents as jest.Mock).mockImplementation(({ offset }: { offset: number }) => {
      if (offset === 0) return Promise.reject(new Error("refresh boom"));
      return Promise.resolve([]);
    });
  });

  it("surfaces a non-blocking warning toast instead of an unhandled rejection", async () => {
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => {
      unhandled.push(reason);
    };
    process.on("unhandledRejection", onUnhandled);
    render(<EventExplorerDashboard />);
    await waitFor(
      () => {
        expect(showToastMock).toHaveBeenCalledWith(
          expect.stringMatching(/background refresh failed/i),
          "warning",
          expect.anything(),
        );
      },
      { timeout: 3000 },
    );
    await new Promise((resolve) => setTimeout(resolve, 50));
    process.removeListener("unhandledRejection", onUnhandled as never);
    expect(unhandled).toHaveLength(0);
  });
});
