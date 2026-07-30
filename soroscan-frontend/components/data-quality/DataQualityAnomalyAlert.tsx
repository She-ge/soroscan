'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { AnomalyAlert } from './types';

export interface DataQualityAnomalyAlertProps {
  alerts: AnomalyAlert[];
  onDismiss?: (id: string) => void;
  className?: string;
}

export function DataQualityAnomalyAlert({ alerts, onDismiss, className }: DataQualityAnomalyAlertProps) {
  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());

  const visible = alerts.filter((a) => !dismissed.has(a.id));

  if (visible.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
    onDismiss?.(id);
  };

  return (
    <div className={cn('space-y-2', className)} data-testid="anomaly-alerts-container">
      {visible.map((alert) => (
        <div
          key={alert.id}
          role="alert"
          data-testid={`anomaly-alert-${alert.id}`}
          className="flex items-start gap-3 px-4 py-3 rounded-lg border border-red-800 bg-red-950/20"
        >
          <span className="text-red-400 text-base mt-0.5 shrink-0" aria-hidden="true">⚠</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono font-semibold text-red-400">
              Event count anomaly detected — {alert.dropPercent.toFixed(1)}% drop
            </p>
            <p className="text-[10px] font-mono text-gray-500 mt-0.5">
              Contract <span className="text-gray-300">{alert.contractId.slice(0, 16)}…</span>
              {' · '}Expected <span className="text-gray-300">{alert.expectedCount.toLocaleString()}</span>
              {', '}actual <span className="text-red-400">{alert.actualCount.toLocaleString()}</span>
              {' · '}{new Date(alert.detectedAt).toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleDismiss(alert.id)}
            aria-label={`Dismiss anomaly alert for ${alert.contractId}`}
            data-testid={`dismiss-alert-${alert.id}`}
            className="shrink-0 text-gray-600 hover:text-gray-300 text-xs transition-colors"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
