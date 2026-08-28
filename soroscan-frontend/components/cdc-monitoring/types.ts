/** Domain types for CDC Monitoring Dashboard (#917). */

export type CDCSyncStatus =
  | 'running'
  | 'idle'
  | 'failed'
  | 'retrying'
  | 'paused';

export type WarehouseType = 'snowflake' | 'bigquery' | 'redshift' | 'databricks';

export interface CDCSyncProgress {
  syncId: string;
  status: CDCSyncStatus;
  rowsSynced: number;
  rowsUpdated: number;
  rowsDeleted: number;
  latencyMs: number;
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  errorMessage?: string | null;
}

export interface TableSyncMetric {
  tableName: string;
  rowsSynced: number;
  rowsUpdated: number;
  rowsDeleted: number;
  lastSyncAt: string | null;
  latencyMs: number;
  status: CDCSyncStatus;
}

export interface SyncLogEntry {
  id: string;
  syncId: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  tableName?: string | null;
  status?: CDCSyncStatus | null;
}

export interface LatencyDataPoint {
  timestamp: string;
  latencyMs: number;
}

export interface CDCSyncConfig {
  syncId: string;
  name: string;
  warehouseType: WarehouseType;
  host: string;
  database: string;
  schema: string;
  username: string;
  /** Never stored or logged — treated as opaque */
  password: string;
}

/** Data freshness age buckets */
export type FreshnessLevel = 'fresh' | 'stale' | 'error';

export interface FreshnessCell {
  tableName: string;
  lastSyncAt: string | null;
  level: FreshnessLevel;
}
