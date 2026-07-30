'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { TableSyncMetric } from './types';

export interface TableLevelMetricsProps {
  metrics: TableSyncMetric[];
  className?: string;
}

const STATUS_DOT: Record<string, string> = {
  running:  'bg-green-400',
  idle:     'bg-gray-500',
  failed:   'bg-red-400',
  retrying: 'bg-yellow-400',
  paused:   'bg-gray-600',
};

function formatTs(ts: string | null) {
  if (!ts) return '—';
  try { return new Date(ts).toLocaleString(); } catch { return ts; }
}

export function TableLevelMetrics({ metrics, className }: TableLevelMetricsProps) {
  if (metrics.length === 0) {
    return (
      <p className="text-sm text-gray-500 font-mono py-4" data-testid="table-metrics-empty">
        No table metrics available.
      </p>
    );
  }

  return (
    <div
      className={cn('overflow-x-auto rounded-lg border border-green-900', className)}
      data-testid="table-level-metrics"
    >
      <table className="w-full text-xs font-mono">
        <thead className="bg-gray-900 border-b border-green-900">
          <tr className="text-gray-500">
            <th className="text-left px-4 py-2.5 font-normal">Table</th>
            <th className="text-right px-4 py-2.5 font-normal">Rows Synced</th>
            <th className="text-right px-4 py-2.5 font-normal">Updated</th>
            <th className="text-right px-4 py-2.5 font-normal">Deleted</th>
            <th className="text-right px-4 py-2.5 font-normal">Latency</th>
            <th className="text-left px-4 py-2.5 font-normal">Last Sync</th>
            <th className="text-left px-4 py-2.5 font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m, idx) => (
            <tr
              key={m.tableName}
              className={cn(
                'border-t border-gray-800 hover:bg-gray-900/40',
                idx % 2 === 0 ? 'bg-gray-950' : 'bg-gray-900/20'
              )}
              data-testid={`table-metric-row-${m.tableName}`}
            >
              <td className="px-4 py-2.5 text-green-300 font-semibold">{m.tableName}</td>
              <td className="px-4 py-2.5 text-right text-gray-200">
                {m.rowsSynced.toLocaleString()}
              </td>
              <td className="px-4 py-2.5 text-right text-blue-400">
                {m.rowsUpdated.toLocaleString()}
              </td>
              <td className="px-4 py-2.5 text-right text-red-400">
                {m.rowsDeleted.toLocaleString()}
              </td>
              <td
                className={cn(
                  'px-4 py-2.5 text-right',
                  m.latencyMs > 5000 ? 'text-red-400' : 'text-green-400'
                )}
                data-testid={`table-latency-${m.tableName}`}
              >
                {m.latencyMs.toLocaleString()} ms
              </td>
              <td className="px-4 py-2.5 text-gray-500">{formatTs(m.lastSyncAt)}</td>
              <td className="px-4 py-2.5">
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn('w-1.5 h-1.5 rounded-full', STATUS_DOT[m.status] ?? 'bg-gray-500')}
                    aria-hidden="true"
                  />
                  <span className="text-gray-400">{m.status}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
