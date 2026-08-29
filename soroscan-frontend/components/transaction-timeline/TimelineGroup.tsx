"use client";

import * as React from "react";

import { TimelineEvent } from "./TimelineEvent";
import type {
  TimelineZoomLevel,
  TransactionTimelineGroupData,
} from "./types";

interface TimelineGroupProps {
  group: TransactionTimelineGroupData;
  expandedEventIds: ReadonlySet<string>;
  zoom: TimelineZoomLevel;
  onToggleEvent: (eventId: string) => void;
}

function formatTimeRange(
  startedAt: string,
  completedAt: string,
): string {
  const formatter = new Intl.DateTimeFormat(
    undefined,
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  );

  return `${formatter.format(
    new Date(startedAt),
  )} – ${formatter.format(new Date(completedAt))}`;
}

export const TimelineGroup = React.memo(
  function TimelineGroup({
    group,
    expandedEventIds,
    zoom,
    onToggleEvent,
  }: TimelineGroupProps) {
    const successCount = group.events.filter(
      (event) => event.status === "success",
    ).length;

    const errorCount = group.events.filter(
      (event) => event.status === "error",
    ).length;

    const pendingCount = group.events.filter(
      (event) => event.status === "pending",
    ).length;

    return (
      <section
        data-testid="timeline-group"
        aria-labelledby={`transaction-${group.transactionId}`}
        className="rounded-lg border border-terminal-cyan/20 bg-black/10 p-4"
      >
        <header className="mb-3 flex flex-col gap-3 border-b border-terminal-cyan/15 pb-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-terminal-gray">
              Logical transaction
            </p>

            <h2
              id={`transaction-${group.transactionId}`}
              className="mt-1 break-all text-base text-terminal-cyan"
            >
              {group.transactionId}
            </h2>

            <p className="mt-1 text-xs text-terminal-gray">
              {formatTimeRange(
                group.startedAt,
                group.completedAt,
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-wide">
            <span className="rounded-full border border-terminal-green/40 px-2 py-1 text-terminal-green">
              {successCount} success
            </span>

            <span className="rounded-full border border-terminal-danger/40 px-2 py-1 text-terminal-danger">
              {errorCount} error
            </span>

            <span className="rounded-full border border-terminal-warning/40 px-2 py-1 text-terminal-warning">
              {pendingCount} pending
            </span>
          </div>
        </header>

        <div
          role="list"
          aria-label={`Events in ${group.transactionId}`}
        >
          {group.events.map((event, index) => (
            <TimelineEvent
              key={event.id}
              event={event}
              expanded={expandedEventIds.has(event.id)}
              isLast={
                index === group.events.length - 1
              }
              zoom={zoom}
              onToggle={() =>
                onToggleEvent(event.id)
              }
            />
          ))}
        </div>
      </section>
    );
  },
);
