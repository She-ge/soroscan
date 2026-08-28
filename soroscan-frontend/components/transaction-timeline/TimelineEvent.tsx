"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type {
  TimelineEventStatus,
  TimelineZoomLevel,
  TransactionTimelineEvent,
} from "./types";

interface TimelineEventProps {
  event: TransactionTimelineEvent;
  expanded: boolean;
  isLast: boolean;
  zoom: TimelineZoomLevel;
  onToggle: () => void;
}

const statusStyles: Record<
  TimelineEventStatus,
  {
    border: string;
    dot: string;
    text: string;
    label: string;
  }
> = {
  success: {
    border: "border-terminal-green/40",
    dot: "bg-terminal-green",
    text: "text-terminal-green",
    label: "Success",
  },
  error: {
    border: "border-terminal-danger/50",
    dot: "bg-terminal-danger",
    text: "text-terminal-danger",
    label: "Error",
  },
  pending: {
    border: "border-terminal-warning/50",
    dot: "bg-terminal-warning",
    text: "text-terminal-warning",
    label: "Pending",
  },
};

const zoomSpacing: Record<
  TimelineZoomLevel,
  string
> = {
  compact: "py-2",
  normal: "py-4",
  comfortable: "py-6",
};

const performanceStyle = {
  contentVisibility: "auto",
  containIntrinsicSize: "160px",
} as React.CSSProperties;

function formatTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp));
}

function formatDetails(details: unknown): string {
  if (typeof details === "string") {
    return details;
  }

  return JSON.stringify(details ?? {}, null, 2);
}

export const TimelineEvent = React.memo(
  function TimelineEvent({
    event,
    expanded,
    isLast,
    zoom,
    onToggle,
  }: TimelineEventProps) {
    const styles = statusStyles[event.status];

    return (
      <article
        role="listitem"
        data-testid="timeline-event"
        data-status={event.status}
        className={cn(
          "relative pl-9",
          zoomSpacing[zoom],
        )}
        style={performanceStyle}
      >
        {!isLast ? (
          <span
            aria-hidden="true"
            className="absolute bottom-0 left-[0.7rem] top-0 w-px bg-terminal-gray/30"
          />
        ) : null}

        <span
          aria-hidden="true"
          className={cn(
            "absolute left-1 top-[1.45rem] h-4 w-4",
            "rounded-full border-4 border-terminal-black",
            styles.dot,
          )}
        />

        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={`timeline-event-details-${event.id}`}
          onClick={onToggle}
          className={cn(
            "w-full rounded-md border bg-black/20",
            "p-3 text-left transition-terminal-normal",
            "hover:bg-white/[0.03]",
            styles.border,
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {expanded ? (
                  <ChevronDown
                    size={14}
                    aria-hidden="true"
                  />
                ) : (
                  <ChevronRight
                    size={14}
                    aria-hidden="true"
                  />
                )}

                <span
                  data-testid="timeline-event-title"
                  className="font-semibold text-terminal-light"
                >
                  {event.title}
                </span>

                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5",
                    "text-[10px] font-semibold uppercase",
                    "tracking-wide",
                    styles.border,
                    styles.text,
                  )}
                >
                  {styles.label}
                </span>
              </div>

              <p className="mt-2 text-xs text-terminal-gray">
                {formatTimestamp(event.timestamp)}
                {" · "}
                {event.eventType}
              </p>

              {event.parentEventId ? (
                <p className="mt-1 text-xs text-terminal-cyan">
                  Caused by event {event.parentEventId}
                </p>
              ) : null}
            </div>

            <code className="shrink-0 text-xs text-terminal-gray">
              {event.id}
            </code>
          </div>
        </button>

        <div
          id={`timeline-event-details-${event.id}`}
          data-testid="timeline-event-details"
          className={cn(
            "grid transition-[grid-template-rows,opacity]",
            "duration-300 ease-in-out",
            expanded
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div className="ml-3 mt-2 rounded-md border border-terminal-cyan/20 bg-black/30 p-3 text-xs">
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-terminal-gray">
                    Transaction
                  </dt>
                  <dd className="mt-1 break-all text-terminal-light">
                    {event.transactionId}
                  </dd>
                </div>

                <div>
                  <dt className="text-terminal-gray">
                    Contract
                  </dt>
                  <dd className="mt-1 break-all text-terminal-light">
                    {event.contractId ?? "Not provided"}
                  </dd>
                </div>

                <div>
                  <dt className="text-terminal-gray">
                    Ledger
                  </dt>
                  <dd className="mt-1 text-terminal-light">
                    {event.ledger ?? "Not provided"}
                  </dd>
                </div>

                <div>
                  <dt className="text-terminal-gray">
                    Transaction hash
                  </dt>
                  <dd className="mt-1 break-all text-terminal-light">
                    {event.txHash ?? "Not provided"}
                  </dd>
                </div>
              </dl>

              <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-sm border border-terminal-gray/20 bg-terminal-black p-3 text-terminal-light">
                {formatDetails(event.details)}
              </pre>
            </div>
          </div>
        </div>
      </article>
    );
  },
);
