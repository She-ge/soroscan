'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { getFreshnessLevel, FRESHNESS_COLORS, FRESHNESS_LABELS } from './freshnessUtils';
import type { FreshnessCell } from './types';

export interface DataFreshnessHeatmapProps {
  cells: FreshnessCell[];
  className?: string;
}

function formatAge(lastSyncAt: string | null): string {
  if (!lastSyncAt) return 'never';
  const ageMs = Date.now() - new Date(lastSyncAt).getTime();
  const mins = Math.floor(ageMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function DataFreshnessHeatmap({ cells, className }: DataFreshnessHeatmapProps) {
  if (cells.length === 0) {
    return (
      <p className="text-sm text-gray-500 font-mono py-4" data-testid="heatmap-empty">
        No freshness data available.
      </p>
    );
  }

  return (
    <div
      className={cn('space-y-3', className)}
      data-testid="data-freshness-heatmap"
      aria-label="Data freshness heatmap"
    >
      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500">
        <span className="text-gray-400">Freshness:</span>
        {(['fresh', 'stale', 'error'] as const).map((level) => (
          <span key={level} className="flex items-center gap-1">
            <span
              className={cn('w-3 h-3 rounded border', FRESHNESS_COLORS[level])}
              aria-hidden="true"
            />
            {level} ({FRESHNESS_LABELS[level]})
          </span>
        ))}
      </div>

      {/* Grid */}
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}
      >
        {cells.map((cell) => {
          const level = cell.level;
          return (
            <div
              key={cell.tableName}
              className={cn(
                'rounded-md border px-3 py-2 text-xs font-mono',
                FRESHNESS_COLORS[level]
              )}
              data-testid={`heatmap-cell-${cell.tableName}`}
              aria-label={`${cell.tableName}: ${level}, last synced ${formatAge(cell.lastSyncAt)}`}
            >
              <p className="font-semibold truncate">{cell.tableName}</p>
              <p className="opacity-70 text-[10px] mt-0.5">{formatAge(cell.lastSyncAt)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
