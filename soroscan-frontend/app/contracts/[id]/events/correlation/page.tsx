'use client';

import * as React from 'react';
import { Tabs } from '@/components/ui/tabs';
import {
  CorrelatedEventsPanel,
  AtomicTransactionTree,
  EventTimeline,
  CorrelationSearch,
  EventCorrelationBadge,
  CorrelationExporter,
} from '@/components/event-correlation';
import type { EventCorrelationData } from '@/components/event-correlation';

/** Stub — replace with real GraphQL call once Backend #98 ships. */
async function fetchCorrelationData(
  _eventId: string
): Promise<EventCorrelationData | null> {
  return null;
}

export default function EventCorrelationPage({
  params,
}: {
  params: { id: string };
}) {
  const { id: contractId } = params;
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeEventId, setActiveEventId] = React.useState<string | null>(null);
  const [correlationData, setCorrelationData] =
    React.useState<EventCorrelationData | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);

  const handleSearch = React.useCallback(async (query: string) => {
    if (!query) { setCorrelationData(null); return; }
    setIsLoading(true);
    try {
      const data = await fetchCorrelationData(query);
      setCorrelationData(data);
      setActiveEventId(query);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const timelineEvents = correlationData?.atomicGroup?.timeline ?? [];
  const relatedEvents = correlationData?.relatedEvents ?? [];

  const tabs = correlationData
    ? [
        {
          id: 'tree',
          title: 'Transaction Tree',
          content: (
            <AtomicTransactionTree
              events={timelineEvents}
              rootEventId={correlationData.id}
              onNodeClick={setSelectedNodeId}
            />
          ),
        },
        {
          id: 'timeline',
          title: 'Timeline',
          content: (
            <EventTimeline
              events={timelineEvents}
              onEventClick={setSelectedNodeId}
            />
          ),
        },
        {
          id: 'events',
          title: `Events (${relatedEvents.length})`,
          content: (
            <CorrelatedEventsPanel
              events={relatedEvents}
              atomicGroupId={correlationData.atomicGroupId}
              onEventClick={setSelectedNodeId}
            />
          ),
        },
      ]
    : [];

  return (
    <div
      className="max-w-6xl mx-auto py-8 px-4 space-y-6"
      data-testid="correlation-page"
    >
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-base font-mono font-semibold text-green-400">
          Event Correlation
        </h1>
        <p className="text-xs font-mono text-gray-500">
          Contract: <span className="text-gray-300">{contractId}</span>
        </p>
      </div>

      {/* Search */}
      <CorrelationSearch
        value={searchQuery}
        onChange={setSearchQuery}
        onSearch={handleSearch}
        isLoading={isLoading}
      />

      {/* Results */}
      {correlationData ? (
        <div className="space-y-4">
          {/* Badges + export row */}
          <div className="flex flex-wrap items-center gap-3">
            {correlationData.atomicGroupId && (
              <EventCorrelationBadge
                atomicGroupId={correlationData.atomicGroupId}
                eventCount={correlationData.atomicGroup?.totalEvents}
              />
            )}
            <CorrelationExporter
              data={correlationData}
              filename={`correlation-${correlationData.atomicGroupId ?? correlationData.id}.json`}
            />
          </div>

          {/* Selected node detail */}
          {selectedNodeId && (
            <div
              className="px-4 py-3 rounded border border-green-800 bg-green-950/20 text-xs font-mono text-green-300"
              data-testid="selected-node-detail"
            >
              Selected event: <span className="text-green-400 font-semibold">{selectedNodeId}</span>
            </div>
          )}

          {/* Tabs */}
          <Tabs items={tabs} />
        </div>
      ) : !isLoading ? (
        <div
          className="flex items-center justify-center py-16 text-sm font-mono text-gray-600 border border-green-900/30 rounded-lg bg-gray-950"
          data-testid="correlation-empty-state"
        >
          Enter an event ID, correlation ID, or atomic group ID to visualize.
        </div>
      ) : null}

      {isLoading && (
        <div
          className="flex items-center justify-center py-16 text-sm font-mono text-gray-500 animate-pulse"
          data-testid="correlation-loading"
        >
          Loading correlation data…
        </div>
      )}
    </div>
  );
}
