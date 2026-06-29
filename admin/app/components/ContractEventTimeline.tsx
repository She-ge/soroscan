'use client';

import React, { useState, useMemo } from 'react';
import VerifiedSourceBadge from './VerifiedSourceBadge';
import type { VerificationDetails } from './VerifiedSourceBadge';

// Event types with icons
const EVENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  SWAP_COMPLETE: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  LIQUIDITY_ADD: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  VAULT_DEPOSIT: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  YIELD_CLAIMED: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  GOV_PROPOSAL: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  ORACLE_UPDATE: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  STAKING_LOCK: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  DEFAULT: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  SWAP_COMPLETE: 'bg-blue-500',
  LIQUIDITY_ADD: 'bg-green-500',
  VAULT_DEPOSIT: 'bg-purple-500',
  YIELD_CLAIMED: 'bg-yellow-500',
  GOV_PROPOSAL: 'bg-pink-500',
  ORACLE_UPDATE: 'bg-orange-500',
  STAKING_LOCK: 'bg-cyan-500',
  DEFAULT: 'bg-zinc-500',
};

export interface ContractEvent {
  id: string;
  eventType: string;
  timestamp: string;
  txHash?: string;
  payload?: Record<string, unknown>;
}

export interface ContractEventTimelineProps {
  events: ContractEvent[];
  onEventClick?: (event: ContractEvent) => void;
  selectedEventId?: string;
  filterEventTypes?: string[];
  /** Whether the contract's source code is verified */
  isVerified?: boolean;
  /** Verification metadata shown in the badge tooltip */
  verificationDetails?: VerificationDetails;
  /** Called when the verified badge is clicked */
  onViewSource?: () => void;
  /** Optional contract name shown in the header */
  contractName?: string;
}

export function ContractEventTimeline({
  events,
  onEventClick,
  selectedEventId,
  filterEventTypes = [],
  isVerified = false,
  verificationDetails,
  onViewSource,
  contractName,
}: ContractEventTimelineProps) {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Filter and sort events
  const sortedEvents = useMemo(() => {
    let filtered = events;
    
    if (filterEventTypes.length > 0) {
      filtered = events.filter(e => filterEventTypes.includes(e.eventType));
    }
    
    return [...filtered].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [events, filterEventTypes]);

  // Get unique event types for filter
  const eventTypes = useMemo(() => 
    [...new Set(events.map(e => e.eventType))].sort(),
    [events]
  );

  const [typeFilter, setTypeFilter] = useState<string[]>([]);

  const filteredEvents = useMemo(() => {
    if (typeFilter.length === 0) return sortedEvents;
    return sortedEvents.filter(e => typeFilter.includes(e.eventType));
  }, [sortedEvents, typeFilter]);

  const toggleTypeFilter = (type: string) => {
    setTypeFilter(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleEventClick = (event: ContractEvent) => {
    setExpandedEventId(prev => prev === event.id ? null : event.id);
    onEventClick?.(event);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getEventIcon = (type: string) => EVENT_TYPE_ICONS[type] || EVENT_TYPE_ICONS.DEFAULT;
  const getEventColor = (type: string) => EVENT_TYPE_COLORS[type] || EVENT_TYPE_COLORS.DEFAULT;

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-zinc-900 rounded-lg">
        <p className="text-zinc-500">No events to display</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header: contract name + verified badge */}
      {(contractName || isVerified) && (
        <div className="flex items-center gap-2 px-3 pt-3 pb-1">
          {contractName && (
            <span className="text-sm font-semibold text-zinc-200 truncate">
              {contractName}
            </span>
          )}
          {isVerified && (
            <VerifiedSourceBadge
              isVerified={isVerified}
              verificationDetails={verificationDetails}
              onViewSource={onViewSource}
            />
          )}
        </div>
      )}

      {/* Filter bar */}
      {eventTypes.length > 1 && (
        <div className="flex items-center gap-2 p-3 border-b border-zinc-800 bg-zinc-900/50">
          <span className="text-xs text-zinc-500">Filter:</span>
          <div className="flex flex-wrap gap-1">
            {eventTypes.map(type => (
              <button
                key={type}
                onClick={() => toggleTypeFilter(type)}
                className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded transition-colors ${
                  typeFilter.includes(type)
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${getEventColor(type)}`} />
                {type.replace(/_/g, ' ')}
              </button>
            ))}
            {typeFilter.length > 0 && (
              <button
                onClick={() => setTypeFilter([])}
                className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300"
              >
                Clear
              </button>
            )}
          </div>
          <span className="ml-auto text-xs text-zinc-500">
            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-zinc-700" />

          <div className="space-y-1">
            {filteredEvents.map((event, index) => {
              const isExpanded = expandedEventId === event.id;
              const isSelected = selectedEventId === event.id;
              const iconColor = getEventColor(event.eventType);

              return (
                <div
                  key={event.id}
                  className="relative flex items-start gap-4 py-2"
                >
                  {/* Icon on timeline */}
                  <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full ${iconColor} flex items-center justify-center text-white`}>
                    {getEventIcon(event.eventType)}
                  </div>

                  {/* Event card */}
                  <div
                    className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected || isExpanded
                        ? 'bg-zinc-800 border-zinc-600'
                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/30'
                    }`}
                    onClick={() => handleEventClick(event)}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-200">
                          {event.eventType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500">
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </div>

                    {/* Transaction hash */}
                    {event.txHash && (
                      <div className="mt-2">
                        <span className="text-xs font-mono text-zinc-400">
                          {event.txHash.slice(0, 10)}...{event.txHash.slice(-8)}
                        </span>
                      </div>
                    )}

                    {/* Expanded payload */}
                    {isExpanded && event.payload && (
                      <div className="mt-3 pt-3 border-t border-zinc-700">
                        <pre className="text-xs font-mono bg-zinc-950 p-2 rounded overflow-x-auto text-zinc-300 max-h-48">
                          {JSON.stringify(event.payload, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Click hint */}
                    <div className="mt-2 text-xs text-zinc-600">
                      {isExpanded ? 'Click to collapse' : 'Click for details'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}