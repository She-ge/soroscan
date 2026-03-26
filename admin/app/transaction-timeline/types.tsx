// Transaction Timeline Types

import type { ReactNode } from 'react';

export type EventStatus = 'success' | 'error' | 'pending';

export type TimelineBucketSize = 
  | 'FIVE_MINUTES'
  | 'FIFTEEN_MINUTES'
  | 'THIRTY_MINUTES'
  | 'ONE_HOUR'
  | 'SIX_HOURS'
  | 'TWELVE_HOURS'
  | 'ONE_DAY';

export interface TimelineEventTypeCount {
  event_type: string;
  count: number;
}

export interface TimelineEvent {
  id: number;
  event_type: string;
  timestamp: string;
  payload: Record<string, unknown> | null;
  tx_hash: string | null;
  status: EventStatus;
}

export interface TimelineGroup {
  start: string;
  end: string;
  event_count: number;
  event_type_counts: TimelineEventTypeCount[];
  events: TimelineEvent[];
}

export interface TimelineResult {
  contract_id: string;
  bucket_size: TimelineBucketSize;
  since: string;
  until: string;
  total_events: number;
  groups: TimelineGroup[];
}

export interface TimelineFilters {
  eventTypes: string[];
  statuses: EventStatus[];
  searchQuery: string;
}

export interface TimelineZoomLevel {
  label: string;
  bucketSize: TimelineBucketSize;
  scale: number;
}

export const ZOOM_LEVELS: TimelineZoomLevel[] = [
  { label: '5m', bucketSize: 'FIVE_MINUTES', scale: 1 },
  { label: '15m', bucketSize: 'FIFTEEN_MINUTES', scale: 0.8 },
  { label: '30m', bucketSize: 'THIRTY_MINUTES', scale: 0.6 },
  { label: '1h', bucketSize: 'ONE_HOUR', scale: 0.4 },
  { label: '6h', bucketSize: 'SIX_HOURS', scale: 0.2 },
  { label: '12h', bucketSize: 'TWELVE_HOURS', scale: 0.1 },
  { label: '1d', bucketSize: 'ONE_DAY', scale: 0.05 },
];

export const STATUS_COLORS: Record<EventStatus, string> = {
  success: 'bg-green-500/20 text-green-400 border-green-500/30',
  error: 'bg-red-500/20 text-red-400 border-red-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export const STATUS_ICONS: Record<EventStatus, ReactNode> = {
  success: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  pending: (
    <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};