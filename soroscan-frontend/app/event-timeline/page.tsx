"use client";

import { useMemo, useState } from "react";

interface Event {
  id: string;
  contractId: string;
  eventType: string;
  ledger: number;
  timestamp: string;
  txHash: string;
  data: Record<string, unknown>;
}

interface TimelineGroup {
  startTime: Date;
  endTime: Date;
  events: Event[];
  eventCount: number;
  eventTypes: Map<string, number>;
}

// Mock event data
const mockEvents: Event[] = [
  {
    id: "1",
    contractId: "CABC1",
    eventType: "swap",
    ledger: 520001,
    timestamp: "2026-03-26T10:12:00Z",
    txHash: "tx_001",
    data: { amount: 100, price: 50 },
  },
  {
    id: "2",
    contractId: "CABC1",
    eventType: "mint",
    ledger: 520008,
    timestamp: "2026-03-26T10:15:00Z",
    txHash: "tx_002",
    data: { amount: 50 },
  },
  {
    id: "3",
    contractId: "CABC1",
    eventType: "swap",
    ledger: 520010,
    timestamp: "2026-03-26T10:18:00Z",
    txHash: "tx_003",
    data: { amount: 75, price: 55 },
  },
  {
    id: "4",
    contractId: "CABC1",
    eventType: "burn",
    ledger: 520020,
    timestamp: "2026-03-26T10:25:00Z",
    txHash: "tx_004",
    data: { amount: 25 },
  },
  {
    id: "5",
    contractId: "CABC1",
    eventType: "swap",
    ledger: 520025,
    timestamp: "2026-03-26T10:45:00Z",
    txHash: "tx_005",
    data: { amount: 150, price: 60 },
  },
];

function groupEventsByTimeRange(
  events: Event[],
  rangeMinutes: number
): TimelineGroup[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const groups: TimelineGroup[] = [];
  let currentGroup: Event[] = [];
  let groupStartTime = new Date(sorted[0].timestamp);

  for (const event of sorted) {
    const eventTime = new Date(event.timestamp);
    const timeDiff =
      (eventTime.getTime() - groupStartTime.getTime()) / (1000 * 60);

    if (timeDiff > rangeMinutes) {
      if (currentGroup.length > 0) {
        const endTime = new Date(
          currentGroup[currentGroup.length - 1].timestamp
        );
        const typeMap = new Map<string, number>();
        currentGroup.forEach((e) => {
          typeMap.set(e.eventType, (typeMap.get(e.eventType) || 0) + 1);
        });

        groups.push({
          startTime: groupStartTime,
          endTime,
          events: currentGroup,
          eventCount: currentGroup.length,
          eventTypes: typeMap,
        });
      }
      currentGroup = [event];
      groupStartTime = eventTime;
    } else {
      currentGroup.push(event);
    }
  }

  if (currentGroup.length > 0) {
    const endTime = new Date(currentGroup[currentGroup.length - 1].timestamp);
    const typeMap = new Map<string, number>();
    currentGroup.forEach((e) => {
      typeMap.set(e.eventType, (typeMap.get(e.eventType) || 0) + 1);
    });

    groups.push({
      startTime: groupStartTime,
      endTime,
      events: currentGroup,
      eventCount: currentGroup.length,
      eventTypes: typeMap,
    });
  }

  return groups.reverse();
}

export default function EventTimelinePage() {
  const [contractFilter, setContractFilter] = useState("CABC1");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [timeRange, setTimeRange] = useState(5); // minutes
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const filteredEvents = useMemo(() => {
    return mockEvents.filter((event) => {
      const contractMatch = event.contractId === contractFilter;
      const typeMatch = eventTypeFilter ? event.eventType === eventTypeFilter : true;
      return contractMatch && typeMatch;
    });
  }, [contractFilter, eventTypeFilter]);

  const timelineGroups = useMemo(() => {
    return groupEventsByTimeRange(filteredEvents, timeRange);
  }, [filteredEvents, timeRange]);

  const uniqueEventTypes = useMemo(() => {
    return [...new Set(mockEvents.map((e) => e.eventType))];
  }, []);

  const exportTimeline = () => {
    const data = {
      exportDate: new Date().toISOString(),
      contractId: contractFilter,
      eventTypeFilter,
      timeRange,
      totalEvents: filteredEvents.length,
      groups: timelineGroups.map((g) => ({
        startTime: g.startTime.toISOString(),
        endTime: g.endTime.toISOString(),
        eventCount: g.eventCount,
        eventTypes: Object.fromEntries(g.eventTypes),
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `timeline-${contractFilter}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-terminal-black p-8 text-terminal-green font-terminal-mono">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-xs text-terminal-gray tracking-[0.2em]">[EVENT_TIMELINE]</p>
          <h1 className="text-3xl mt-2">Contract Event History & Timeline</h1>
          <p className="text-sm text-terminal-gray mt-2">
            Visualize contract events chronologically with grouping and filtering.
          </p>
        </header>

        {/* Controls Section */}
        <section className="rounded border border-terminal-green/20 p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-terminal-gray block mb-1">Contract ID</label>
              <select
                value={contractFilter}
                onChange={(e) => setContractFilter(e.target.value)}
                className="w-full rounded border border-terminal-green/30 bg-terminal-black px-3 py-2 text-terminal-green"
              >
                <option value="CABC1">CABC1</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-terminal-gray block mb-1">Event Type Filter</label>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="w-full rounded border border-terminal-green/30 bg-terminal-black px-3 py-2 text-terminal-green"
              >
                <option value="">All event types</option>
                {uniqueEventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-terminal-gray block mb-1">Time Range (minutes)</label>
              <input
                type="range"
                min="1"
                max="60"
                value={timeRange}
                onChange={(e) => setTimeRange(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-terminal-gray mt-1">{timeRange} minutes</p>
            </div>
            <div>
              <label className="text-xs text-terminal-gray block mb-1">Zoom Level</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                  className="flex-1 rounded border border-terminal-cyan/40 px-2 py-2 text-xs hover:bg-terminal-cyan/10"
                >
                  - Zoom Out
                </button>
                <div className="flex-1 rounded border border-terminal-cyan/40 px-2 py-2 text-xs flex items-center justify-center">
                  {(zoom * 100).toFixed(0)}%
                </div>
                <button
                  type="button"
                  onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                  className="flex-1 rounded border border-terminal-cyan/40 px-2 py-2 text-xs hover:bg-terminal-cyan/10"
                >
                  Zoom In +
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={exportTimeline}
              className="rounded border border-terminal-magenta/40 px-4 py-2 text-terminal-magenta hover:bg-terminal-magenta/10"
            >
              Export Timeline
            </button>
          </div>
        </section>

        {/* Timeline Visualization */}
        <section className="rounded border border-terminal-green/20 p-4">
          <p className="text-xs text-terminal-gray mb-3">[TIMELINE_GROUPS]</p>
          <div className="space-y-2">
            {timelineGroups.length === 0 ? (
              <p className="text-terminal-gray text-xs">No events found for the selected filters.</p>
            ) : (
              timelineGroups.map((group, idx) => {
                const groupId = `${group.startTime.getTime()}-${idx}`;
                const isExpanded = expandedGroupId === groupId;
                const timeStart = group.startTime.toLocaleTimeString();
                const timeEnd = group.endTime.toLocaleTimeString();

                return (
                  <div
                    key={groupId}
                    className="rounded border border-terminal-green/20 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedGroupId(isExpanded ? null : groupId)
                      }
                      className="w-full p-3 text-left hover:bg-terminal-green/5 transition-colors flex items-center justify-between"
                    >
                      <div style={{ opacity: zoom }}>
                        <p className="text-sm font-semibold text-terminal-cyan">
                          {timeStart} - {timeEnd}
                        </p>
                        <div className="text-xs text-terminal-gray mt-1 flex flex-wrap gap-2">
                          {Array.from(group.eventTypes.entries()).map(
                            ([type, count]) => (
                              <span key={type} className="text-terminal-yellow">
                                [{type}: {count}]
                              </span>
                            )
                          )}
                        </div>
                      </div>
                      <div className="text-terminal-magenta text-sm font-bold">
                        {group.eventCount} events
                        <span className="text-xs text-terminal-gray ml-2">
                          {isExpanded ? "▼" : "▶"}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="bg-terminal-black/50 p-3 border-t border-terminal-green/10">
                        <table className="w-full text-xs">
                          <thead className="text-terminal-cyan">
                            <tr>
                              <th className="text-left px-2 py-1">Time</th>
                              <th className="text-left px-2 py-1">Type</th>
                              <th className="text-left px-2 py-1">Tx Hash</th>
                              <th className="text-left px-2 py-1">Ledger</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.events.map((event) => (
                              <tr
                                key={event.id}
                                className="border-t border-terminal-green/10 hover:bg-terminal-green/5"
                              >
                                <td className="px-2 py-1">
                                  {new Date(event.timestamp).toLocaleTimeString()}
                                </td>
                                <td className="px-2 py-1 text-terminal-yellow">
                                  {event.eventType}
                                </td>
                                <td className="px-2 py-1 text-terminal-magenta font-mono">
                                  {event.txHash}
                                </td>
                                <td className="px-2 py-1">{event.ledger}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Statistics */}
        <section className="rounded border border-terminal-cyan/20 p-4">
          <p className="text-xs text-terminal-cyan mb-3">[STATISTICS]</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-terminal-gray">Total Events</p>
              <p className="text-lg text-terminal-green font-bold">
                {filteredEvents.length}
              </p>
            </div>
            <div>
              <p className="text-terminal-gray">Time Groups</p>
              <p className="text-lg text-terminal-green font-bold">
                {timelineGroups.length}
              </p>
            </div>
            <div>
              <p className="text-terminal-gray">Event Types</p>
              <p className="text-lg text-terminal-green font-bold">
                {uniqueEventTypes.length}
              </p>
            </div>
            <div>
              <p className="text-terminal-gray">Time Span</p>
              <p className="text-lg text-terminal-green font-bold">
                {filteredEvents.length > 0
                  ? `${Math.round(
                      (new Date(
                        filteredEvents[filteredEvents.length - 1].timestamp
                      ).getTime() -
                        new Date(filteredEvents[0].timestamp).getTime()) /
                        (1000 * 60)
                    )} min`
                  : "N/A"}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
