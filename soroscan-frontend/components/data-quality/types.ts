/** Domain types for Data Quality Dashboard (#918). */

export interface LedgerGap {
  startSequence: number;
  endSequence: number;
  count: number;
}

export interface LastReconciliation {
  timestamp: string;
  status: 'success' | 'failed' | 'running' | 'partial';
  eventsRecovered: number;
}

export interface DataQualityMetrics {
  contractId: string;
  completenessPercent: number;
  expectedEventCount: number;
  actualEventCount: number;
  gaps: LedgerGap[];
  lastReconciliation: LastReconciliation | null;
}

export type ReconciliationStatus = 'pending' | 'running' | 'success' | 'failed' | 'partial';

export interface ReconciliationJob {
  jobId: string;
  contractId: string;
  status: ReconciliationStatus;
  startedAt: string;
  completedAt: string | null;
  eventsRecovered: number;
  reason: string;
  progressPercent: number;
  estimatedDurationSecs: number | null;
  dateRangeStart: string;
  dateRangeEnd: string;
}

export interface EventCountPoint {
  date: string;
  expected: number;
  actual: number;
}

export interface GapFillPreviewItem {
  sequence: number;
  estimatedTimestamp: string;
  contractId: string;
}

export interface AnomalyAlert {
  id: string;
  contractId: string;
  detectedAt: string;
  dropPercent: number;
  expectedCount: number;
  actualCount: number;
}

export interface DateRange {
  start: string;
  end: string;
}
