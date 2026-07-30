'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { CDCSyncProgress } from './types';

export interface SyncStatusCardProps {
  syncId: string;
  name: string;
  progress: CDCSyncProgress | null;
  isLoading?: boolean;
  onRetry?: (syncId: string) => void;
  onTriggerSync?: (syncId: string) => void;
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  running:  'text-green-400 border-green-700 bg-green-900/20',
  idle:     'text-gray-400 border-gray-700 bg-gray-900/20',
  failed:   'text-red-400 border-red-700 bg-red-900/20',
  retrying: 'text-yellow-400 border-yellow-700 bg-yellow-900/20',
  paused:   'text-gray-500 border-gray-700 bg-gray-900/20',
};

function MetricItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-mono text-gray-200">{value}</p>
    </div>
  );
}

function formatTs(ts: string | null) {
  if (!ts) return '—';
  try { return new Date(ts).toLocaleString(); } catch { return ts; }
}

export function SyncStatusCard({
  syncId,
  name,
  progress,
  isLoading = false,
  onRetry,
  onTriggerSync,
  className,
}: SyncStatusCardProps) {
  const status = progress?.status ?? 'idle';
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.idle;

  return (
    <div
      className={cn(
        'rounded-lg border border-green-900 bg-gray-950 p-4 space-y-4',
        className
      )}
      data-testid={`sync-status-card-${syncId}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p
            className="text-sm font-mono font-semibold text-green-300 truncate"
            data-testid={`sync-name-${syncId}`}
          >
            {name}
          </p>
          <p className="text-[10px] font-mono text-gray-600 truncate">{syncId}</p>
        </div>
        <span
          className={cn(
            'shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-mono font-semibold uppercase',
            statusStyle
          )}
          data-testid={`sync-status-${syncId}`}
          role="status"
          aria-label={`Sync status: ${status}`}
        >
          {status}
        </span>
      </div>

      {/* Metrics grid */}
      {isLoading ? (
        <div className="text-xs font-mono text-gray-600 animate-pulse" data-testid={`sync-loading-${syncId}`}>
          Loading…
        </div>
      ) : progress ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
          <MetricItem label="Rows Synced" value={progress.rowsSynced.toLocaleString()} />
          <MetricItem label="Updated" value={progress.rowsUpdated.toLocaleString()} />
          <MetricItem label="Deleted" value={progress.rowsDeleted.toLocaleString()} />
          <MetricItem
            label="Latency"
            value={
              <span
                className={progress.latencyMs > 5000 ? 'text-red-400' : 'text-green-400'}
                data-testid={`sync-latency-${syncId}`}
              >
                {progress.latencyMs.toLocaleString()} ms
              </span>
            }
          />
          <MetricItem label="Last Sync" value={formatTs(progress.lastSyncAt)} />
          <MetricItem label="Next Sync" value={formatTs(progress.nextSyncAt)} />
        </div>
      ) : null}

      {/* Error message */}
      {progress?.errorMessage && (
        <div
          role="alert"
          className="text-xs font-mono text-red-400 border border-red-800 bg-red-950/20 rounded px-3 py-2"
          data-testid={`sync-error-${syncId}`}
        >
          {progress.errorMessage}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        {(status === 'failed' || status === 'retrying') && onRetry && (
          <button
            type="button"
            onClick={() => onRetry(syncId)}
            data-testid={`retry-btn-${syncId}`}
            className="px-3 py-1.5 text-xs font-mono rounded border border-yellow-800 bg-yellow-900/20 text-yellow-400 hover:bg-yellow-900/40 transition-colors"
          >
            ↺ Retry
          </button>
        )}
        {onTriggerSync && (
          <button
            type="button"
            onClick={() => onTriggerSync(syncId)}
            data-testid={`trigger-btn-${syncId}`}
            aria-label={`Manually trigger sync for ${name}`}
            className="px-3 py-1.5 text-xs font-mono rounded border border-green-800 bg-green-900/20 text-green-400 hover:bg-green-900/40 transition-colors"
          >
            ▶ Sync Now
          </button>
        )}
      </div>
    </div>
  );
}
