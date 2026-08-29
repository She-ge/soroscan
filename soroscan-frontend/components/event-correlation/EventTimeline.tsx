'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { getContractColor } from './contractColors';
import type { AtomicGroupTimeline } from './types';

export interface EventTimelineProps {
  events: AtomicGroupTimeline[];
  onEventClick?: (eventId: string) => void;
  className?: string;
}

function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  } catch {
    return ts;
  }
}

export function EventTimeline({ events, onEventClick, className }: EventTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-gray-500 font-mono py-4" data-testid="timeline-empty">
        No events in timeline.
      </p>
    );
  }

  // Sort ascending by timestamp then blockNumber
  const sorted = [...events].sort((a, b) => {
    const td = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    return td !== 0 ? td : a.blockNumber - b.blockNumber;
  });

  return (
    <div
      className={cn('relative overflow-y-auto', className)}
      data-testid="event-timeline"
      aria-label="Event timeline"
    >
      {/* Vertical rail */}
      <div
        className="absolute left-[7.25rem] top-0 bottom-0 w-px bg-green-900/60"
        aria-hidden="true"
      />

      <ol className="space-y-0" role="list">
        {sorted.map((ev, idx) => {
          const color = getContractColor(ev.contractId);
          return (
            <li
              key={`${ev.eventId}-${idx}`}
              data-testid={`timeline-event-${ev.eventId}`}
              className="relative flex items-start gap-4 py-2 group"
            >
              {/* Timestamp column */}
              <span className="w-28 shrink-0 text-right text-[10px] font-mono text-gray-500 pt-0.5 leading-tight">
                {formatTime(ev.timestamp)}
              </span>

              {/* Node dot */}
              <span
                className="relative z-10 mt-1 w-3 h-3 shrink-0 rounded-full border-2"
                style={{ borderColor: color.border, backgroundColor: color.bg }}
                aria-hidden="true"
              />

              {/* Event info */}
              <button
                type="button"
                onClick={() => onEventClick?.(ev.eventId)}
                className="flex-1 text-left min-w-0"
                data-testid={`timeline-event-btn-${ev.eventId}`}
                aria-label={`Event ${ev.eventType} on ${ev.contractName} at block ${ev.blockNumber}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="text-xs font-mono font-semibold"
                    style={{ color: color.text }}
                  >
                    {ev.eventType}
                  </span>
                  <span className="text-[10px] font-mono text-gray-500 truncate max-w-[12rem]">
                    {ev.contractName}
                  </span>
                  <span className="text-[10px] font-mono text-gray-600">
                    #{ev.blockNumber}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
