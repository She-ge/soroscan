'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import type { TimelineResult, TimelineGroup, TimelineFilters, EventStatus, TimelineBucketSize, TimelineZoomLevel, TimelineEvent } from './types';
import { ZOOM_LEVELS } from './types';

interface TimelineContextType {
  // Data
  timeline: TimelineResult | null;
  isLoading: boolean;
  error: string | null;
  
  // Contract
  contractId: string | null;
  setContractId: (id: string) => void;
  
  // Zoom
  zoomLevel: TimelineZoomLevel;
  setZoomLevel: (level: TimelineZoomLevel) => void;
  
  // Filters
  filters: TimelineFilters;
  setEventTypes: (types: string[]) => void;
  setStatuses: (statuses: EventStatus[]) => void;
  setSearchQuery: (query: string) => void;
  
  // Group expansion
  expandedGroups: Set<number>;
  toggleGroup: (index: number) => void;
  expandAll: () => void;
  collapseAll: () => void;
  
  // Event details
  selectedEvent: TimelineEvent | null;
  setSelectedEvent: (event: TimelineEvent | null) => void;
  
  // Actions
  refreshTimeline: () => Promise<void>;
  
  // Available event types (extracted from data)
  availableEventTypes: string[];
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined);

const DEFAULT_BASE_URL = 'http://localhost:8000';

export function TimelineProvider({ children, initialContractId }: { children: ReactNode; initialContractId?: string }) {
  const [contractId, setContractId] = useState<string | null>(initialContractId || null);
  const [timeline, setTimeline] = useState<TimelineResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Zoom
  const [zoomLevel, setZoomLevel] = useState<TimelineZoomLevel>(ZOOM_LEVELS[2]); // 30min default
  
  // Filters
  const [filters, setFilters] = useState<TimelineFilters>({
    eventTypes: [],
    statuses: ['success', 'error', 'pending'],
    searchQuery: '',
  });
  
  // Expanded groups
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  
  // Selected event for details
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  
  // Extract available event types from timeline data
  const availableEventTypes = React.useMemo(() => {
    if (!timeline?.groups) return [];
    const types = new Set<string>();
    timeline.groups.forEach(group => {
      group.event_type_counts.forEach(etc => types.add(etc.event_type));
    });
    return Array.from(types).sort();
  }, [timeline]);
  
  const setEventTypes = useCallback((types: string[]) => {
    setFilters(prev => ({ ...prev, eventTypes: types }));
  }, []);
  
  const setStatuses = useCallback((statuses: EventStatus[]) => {
    setFilters(prev => ({ ...prev, statuses }));
  }, []);
  
  const setSearchQuery = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  }, []);
  
  const toggleGroup = useCallback((index: number) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);
  
  const expandAll = useCallback(() => {
    if (!timeline) return;
    const allIndices = new Set(timeline.groups.map((_, i) => i));
    setExpandedGroups(allIndices);
  }, [timeline]);
  
  const collapseAll = useCallback(() => {
    setExpandedGroups(new Set());
  }, []);
  
  const refreshTimeline = useCallback(async () => {
    if (!contractId) {
      setTimeline(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Build GraphQL query
      const query = `
        query EventTimeline(
          $contractId: String!
          $bucketSize: TimelineBucketSize!
          $eventTypes: [String!]
          $includeEvents: Boolean!
        ) {
          event_timeline(
            contract_id: $contractId
            bucket_size: $bucketSize
            event_types: $eventTypes
            include_events: $includeEvents
          ) {
            contract_id
            bucket_size
            since
            until
            total_events
            groups {
              start
              end
              event_count
              event_type_counts {
                event_type
                count
              }
              events {
                id
                event_type
                timestamp
                payload
                tx_hash
                status
              }
            }
          }
        }
      `;
      
      const variables = {
        contractId,
        bucketSize: zoomLevel.bucketSize,
        eventTypes: filters.eventTypes.length > 0 ? filters.eventTypes : null,
        includeEvents: true,
      };
      
      const response = await fetch(`${DEFAULT_BASE_URL}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'GraphQL error');
      }
      
      // Process the timeline data
      const timelineData = result.data?.event_timeline;
      
      if (timelineData) {
        // Determine status based on event data (this would come from the backend in real implementation)
        const processedGroups = timelineData.groups.map((group: TimelineGroup, index: number) => ({
          ...group,
          events: group.events.map((event: TimelineEvent) => ({
            ...event,
            status: determineEventStatus(event),
          })),
        }));
        
        setTimeline({
          ...timelineData,
          groups: processedGroups,
        });
        
        // Auto-expand first few groups
        const initialExpanded = new Set<number>();
        for (let i = 0; i < Math.min(3, processedGroups.length); i++) {
          initialExpanded.add(i);
        }
        setExpandedGroups(initialExpanded);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setIsLoading(false);
    }
  }, [contractId, zoomLevel.bucketSize, filters.eventTypes]);
  
  // Load timeline when contract or filters change
  useEffect(() => {
    refreshTimeline();
  }, [contractId, zoomLevel.bucketSize]);
  
  // Filter groups based on current filters
  const filteredGroups = React.useMemo(() => {
    if (!timeline?.groups) return [];
    
    return timeline.groups.map((group, index) => {
      let filteredEvents = group.events;
      
      // Filter by status
      if (filters.statuses.length > 0) {
        filteredEvents = filteredEvents.filter(e => filters.statuses.includes(e.status));
      }
      
      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredEvents = filteredEvents.filter(e => 
          e.event_type.toLowerCase().includes(query) ||
          e.tx_hash?.toLowerCase().includes(query)
        );
      }
      
      return {
        ...group,
        events: filteredEvents,
        event_count: filteredEvents.length,
      };
    }).filter(group => group.event_count > 0);
  }, [timeline?.groups, filters]);
  
  const value: TimelineContextType = {
    timeline: timeline ? { ...timeline, groups: filteredGroups } : null,
    isLoading,
    error,
    contractId,
    setContractId,
    zoomLevel,
    setZoomLevel,
    filters,
    setEventTypes,
    setStatuses,
    setSearchQuery,
    expandedGroups,
    toggleGroup,
    expandAll,
    collapseAll,
    selectedEvent,
    setSelectedEvent,
    refreshTimeline,
    availableEventTypes,
  };
  
  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
}

export function useTimeline() {
  const context = useContext(TimelineContext);
  if (!context) {
    throw new Error('useTimeline must be used within a TimelineProvider');
  }
  return context;
}

// Helper to determine event status (in real implementation, this would come from the backend)
function determineEventStatus(event: TimelineEvent): EventStatus {
  // Check payload for status indicators
  if (event.payload) {
    if (event.payload.status === 'failed' || event.payload.status === 'error') {
      return 'error';
    }
    if (event.payload.status === 'pending' || event.payload.status === 'processing') {
      return 'pending';
    }
  }
  
  // Check event type for status hints
  if (event.event_type.includes('error') || event.event_type.includes('failed')) {
    return 'error';
  }
  
  // Default to success
  return 'success';
}