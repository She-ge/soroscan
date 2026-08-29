'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { getContractColor } from './contractColors';
import type { CorrelatedEvent } from './types';

export interface CorrelatedEventsPanelProps {
  events: CorrelatedEvent[];
  atomicGroupId: string | null;
  onEventClick?: (eventId: string) => void;
  className?: string;
}

export function CorrelatedEventsPanel({
  events,
  atomicGroupId,
  onEventClick,
  className,
}: CorrelatedEventsPanelProps) {
  return (
    <div
      className={cn('space-y-3', className)}
      data-testid="correlated-events-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-mono font-semibold text-green-400">
          Correlated Events
          <span
            className="ml-2 px-1.5 py-0.5 rounded-full bg-green-900/50 text-green-300 text-[10px]"
            data-testid="correlated-events-count"
          >
            {events.length}
          </span>
        </h3>
        {atomicGroupId && (
          <span className="text-[10px] font-mono text-gray-500">
            group #{atomicGroupId.slice(0, 8)}
          </span>
        )}
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-gray-500 font-mono" data-testid="correlated-events-empty">
          No correlated events found.
        </p>
      ) : (
        <ul className="space-y-1.5" role="list" data-testid="correlated-events-list">
          {events.map((ev) => {
            const color = getContractColor(ev.contractId);
            return (
              <li key={ev.id}>
                <button
                  type="button"
                  onClick={() => onEventClick?.(ev.id)}
                  data-testid={`correlated-event-${ev.id}`}
                  aria-label={`${ev.eventType} on ${ev.contractName} at block ${ev.blockNumber}`}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md border text-left hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: color.bg, borderColor: color.border }}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: color.border }}
                    aria-hidden="true"
                  />
                  <span
                    className="text-xs font-mono font-semibold truncate"
                    style={{ color: color.text }}
                  >
                    {ev.eventType}
                  </span>
                  <span className="text-[10px] font-mono text-gray-500 truncate flex-1">
                    {ev.contractName}
                  </span>
                  <span className="text-[10px] font-mono text-gray-600 shrink-0">
                    #{ev.blockNumber}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
