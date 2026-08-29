"use client";

import * as React from "react";
import {
  Minus,
  Plus,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { TimelineGroup } from "./TimelineGroup";
import type {
  TimelineZoomLevel,
  TransactionTimelineEvent,
  TransactionTimelineGroupData,
} from "./types";

const zoomLevels: TimelineZoomLevel[] = [
  "compact",
  "normal",
  "comfortable",
];

const zoomLabels: Record<
  TimelineZoomLevel,
  string
> = {
  compact: "75%",
  normal: "100%",
  comfortable: "125%",
};

export interface TransactionTimelineProps {
  events: TransactionTimelineEvent[];
  className?: string;
  defaultZoom?: TimelineZoomLevel;
  emptyMessage?: string;
}

export function groupEventsByTransaction(
  events: TransactionTimelineEvent[],
): TransactionTimelineGroupData[] {
  const sortedEvents = [...events].sort(
    (left, right) =>
      new Date(left.timestamp).getTime() -
      new Date(right.timestamp).getTime(),
  );

  const groups = new Map<
    string,
    TransactionTimelineEvent[]
  >();

  sortedEvents.forEach((event) => {
    const transactionEvents =
      groups.get(event.transactionId) ?? [];

    transactionEvents.push(event);

    groups.set(
      event.transactionId,
      transactionEvents,
    );
  });

  return Array.from(groups.entries()).map(
    ([transactionId, transactionEvents]) => ({
      transactionId,
      startedAt: transactionEvents[0].timestamp,
      completedAt:
        transactionEvents[
          transactionEvents.length - 1
        ].timestamp,
      events: transactionEvents,
    }),
  );
}

export function TransactionTimeline({
  events,
  className,
  defaultZoom = "normal",
  emptyMessage =
    "No events match the selected filters.",
}: TransactionTimelineProps) {
  const [
    hiddenEventTypes,
    setHiddenEventTypes,
  ] = React.useState<Set<string>>(new Set());

  const [
    expandedEventIds,
    setExpandedEventIds,
  ] = React.useState<Set<string>>(new Set());

  const [zoom, setZoom] =
    React.useState<TimelineZoomLevel>(
      defaultZoom,
    );

  const eventTypes = React.useMemo(
    () =>
      Array.from(
        new Set(
          events.map((event) => event.eventType),
        ),
      ).sort((left, right) =>
        left.localeCompare(right),
      ),
    [events],
  );

  const visibleEvents = React.useMemo(
    () =>
      events.filter(
        (event) =>
          !hiddenEventTypes.has(event.eventType),
      ),
    [events, hiddenEventTypes],
  );

  const groups = React.useMemo(
    () =>
      groupEventsByTransaction(visibleEvents),
    [visibleEvents],
  );

  const zoomIndex = zoomLevels.indexOf(zoom);

  const toggleEventType = React.useCallback(
    (eventType: string): void => {
      setHiddenEventTypes((current) => {
        const next = new Set(current);

        if (next.has(eventType)) {
          next.delete(eventType);
        } else {
          next.add(eventType);
        }

        return next;
      });
    },
    [],
  );

  const toggleEvent = React.useCallback(
    (eventId: string): void => {
      setExpandedEventIds((current) => {
        const next = new Set(current);

        if (next.has(eventId)) {
          next.delete(eventId);
        } else {
          next.add(eventId);
        }

        return next;
      });
    },
    [],
  );

  const showAllEventTypes = (): void => {
    setHiddenEventTypes(new Set());
  };

  const hideAllEventTypes = (): void => {
    setHiddenEventTypes(new Set(eventTypes));
  };

  return (
    <div
      data-testid="transaction-timeline"
      className={cn("space-y-5", className)}
    >
      <section
        aria-label="Transaction timeline controls"
        className="grid gap-4 rounded-lg border border-terminal-green/20 bg-black/10 p-4 lg:grid-cols-[minmax(0,1fr)_auto]"
      >
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm text-terminal-green">
              Event type filters
            </h2>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={showAllEventTypes}
                className="rounded-sm border border-terminal-cyan/40 px-2 py-1 text-xs text-terminal-cyan hover:bg-terminal-cyan/10"
              >
                Show all
              </button>

              <button
                type="button"
                onClick={hideAllEventTypes}
                className="rounded-sm border border-terminal-gray/40 px-2 py-1 text-xs text-terminal-gray hover:bg-white/5"
              >
                Hide all
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            {eventTypes.map((eventType) => (
              <label
                key={eventType}
                className="inline-flex cursor-pointer items-center gap-2 rounded-sm border border-terminal-gray/25 px-3 py-2 text-xs text-terminal-light"
              >
                <input
                  type="checkbox"
                  checked={
                    !hiddenEventTypes.has(eventType)
                  }
                  onChange={() =>
                    toggleEventType(eventType)
                  }
                />

                <span>{eventType}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="min-w-52">
          <h2 className="text-sm text-terminal-green">
            Time scale
          </h2>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() =>
                setZoom(
                  zoomLevels[
                    Math.max(0, zoomIndex - 1)
                  ],
                )
              }
              disabled={zoomIndex === 0}
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-terminal-cyan/40 text-terminal-cyan disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus
                size={14}
                aria-hidden="true"
              />
            </button>

            <output
              data-testid="timeline-zoom-level"
              aria-live="polite"
              className="flex h-9 min-w-20 items-center justify-center rounded-sm border border-terminal-gray/30 px-3 text-xs text-terminal-light"
            >
              {zoomLabels[zoom]}
            </output>

            <button
              type="button"
              aria-label="Zoom in"
              onClick={() =>
                setZoom(
                  zoomLevels[
                    Math.min(
                      zoomLevels.length - 1,
                      zoomIndex + 1,
                    )
                  ],
                )
              }
              disabled={
                zoomIndex === zoomLevels.length - 1
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-terminal-cyan/40 text-terminal-cyan disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus
                size={14}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </section>

      <div
        aria-live="polite"
        className="flex flex-wrap justify-between gap-2 text-xs text-terminal-gray"
      >
        <span>
          Showing {visibleEvents.length} of{" "}
          {events.length} events
        </span>

        <span>
          {groups.length} logical transactions
        </span>
      </div>

      <div
        className="space-y-4"
        aria-label="Transaction events"
      >
        {groups.length ? (
          groups.map((group) => (
            <TimelineGroup
              key={group.transactionId}
              group={group}
              expandedEventIds={expandedEventIds}
              zoom={zoom}
              onToggleEvent={toggleEvent}
            />
          ))
        ) : (
          <p className="rounded-lg border border-terminal-gray/20 p-6 text-center text-sm text-terminal-gray">
            {emptyMessage}
          </p>
        )}
      </div>
    </div>
  );
}
