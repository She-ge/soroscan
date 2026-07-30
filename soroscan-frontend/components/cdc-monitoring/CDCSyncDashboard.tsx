'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { SyncStatusCard } from './SyncStatusCard';
import type { CDCSyncProgress } from './types';

export interface CDCSyncSummary {
  syncId: string;
  name: string;
  progress: CDCSyncProgress | null;
}

export interface CDCSyncDashboardProps {
  syncs: CDCSyncSummary[];
  isLoading?: boolean;
  onRetry?: (syncId: string) => void;
  onTriggerSync?: (syncId: string) => void;
  className?: string;
}

export function CDCSyncDashboard({
  syncs,
  isLoading = false,
  onRetry,
  onTriggerSync,
  className,
}: CDCSyncDashboardProps) {
  const failedCount = syncs.filter((s) => s.progress?.status === 'failed').length;
  const runningCount = syncs.filter((s) => s.progress?.status === 'running').length;

  return (
    <div
      className={cn('space-y-5', className)}
      data-testid="cdc-sync-dashboard"
    >
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-6 px-4 py-3 rounded-lg border border-green-900 bg-gray-950">
        <div>
          <p className="text-[10px] font-mono text-gray-500 uppercase">Total Syncs</p>
          <p className="text-lg font-mono font-semibold text-green-400" data-testid="total-syncs-count">
            {syncs.length}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-mono text-gray-500 uppercase">Running</p>
          <p className="text-lg font-mono font-semibold text-green-300" data-testid="running-syncs-count">
            {runningCount}
          </p>
        </div>
        {failedCount > 0 && (
          <div>
            <p className="text-[10px] font-mono text-gray-500 uppercase">Failed</p>
            <p
              className="text-lg font-mono font-semibold text-red-400"
              role="alert"
              data-testid="failed-syncs-count"
            >
              {failedCount}
            </p>
          </div>
        )}
      </div>

      {/* Sync cards grid */}
      {isLoading ? (
        <div
          className="text-sm font-mono text-gray-500 animate-pulse py-8 text-center"
          data-testid="dashboard-loading"
        >
          Loading sync data…
        </div>
      ) : syncs.length === 0 ? (
        <div
          className="text-sm font-mono text-gray-600 py-10 text-center border border-green-900/30 rounded-lg bg-gray-950"
          data-testid="dashboard-empty"
        >
          No active CDC syncs configured.
        </div>
      ) : (
        <div
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
          data-testid="syncs-grid"
        >
          {syncs.map((s) => (
            <SyncStatusCard
              key={s.syncId}
              syncId={s.syncId}
              name={s.name}
              progress={s.progress}
              onRetry={onRetry}
              onTriggerSync={onTriggerSync}
            />
          ))}
        </div>
      )}
    </div>
  );
}
