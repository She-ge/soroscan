'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { DataQualityMetrics } from './types';

export interface DataQualityScorecardProps {
  metrics: DataQualityMetrics[];
  isLoading?: boolean;
  onSelectContract?: (contractId: string) => void;
  className?: string;
}

function CompletenessBar({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const color =
    clamped >= 99 ? 'bg-green-500' :
    clamped >= 90 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="w-full h-1.5 rounded-full bg-gray-800" role="progressbar"
      aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}
      aria-label={`${clamped.toFixed(1)}% complete`}>
      <div className={cn('h-full rounded-full transition-all', color)}
        style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function DataQualityScorecard({
  metrics, isLoading = false, onSelectContract, className,
}: DataQualityScorecardProps) {
  if (isLoading) {
    return (
      <div className="text-sm font-mono text-gray-500 animate-pulse py-6" data-testid="scorecard-loading">
        Loading quality metrics…
      </div>
    );
  }
  if (metrics.length === 0) {
    return (
      <p className="text-sm font-mono text-gray-500 py-4" data-testid="scorecard-empty">
        No contract quality data available.
      </p>
    );
  }

  return (
    <div className={cn('space-y-2', className)} data-testid="data-quality-scorecard">
      {metrics.map((m) => (
        <button
          key={m.contractId}
          type="button"
          onClick={() => onSelectContract?.(m.contractId)}
          data-testid={`scorecard-row-${m.contractId}`}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-lg border border-green-900 bg-gray-950 hover:bg-gray-900 transition-colors text-left"
          aria-label={`${m.contractId}: ${m.completenessPercent.toFixed(1)}% complete`}
        >
          <span className="w-32 shrink-0 font-mono text-xs text-green-300 truncate">
            {m.contractId.slice(0, 12)}…
          </span>
          <div className="flex-1 space-y-1">
            <CompletenessBar percent={m.completenessPercent} />
          </div>
          <span
            className={cn(
              'shrink-0 w-16 text-right font-mono text-sm font-semibold',
              m.completenessPercent >= 99 ? 'text-green-400' :
              m.completenessPercent >= 90 ? 'text-yellow-400' : 'text-red-400'
            )}
            data-testid={`completeness-pct-${m.contractId}`}
          >
            {m.completenessPercent.toFixed(1)}%
          </span>
          <span className="shrink-0 text-[10px] font-mono text-gray-600 w-24 text-right">
            {m.gaps.length} gap{m.gaps.length !== 1 ? 's' : ''}
          </span>
        </button>
      ))}
    </div>
  );
}
