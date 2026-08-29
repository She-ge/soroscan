'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { SyncLogEntry, CDCSyncStatus } from './types';

export interface SyncLogViewerProps {
  logs: SyncLogEntry[];
  className?: string;
}

const LEVEL_STYLES: Record<string, string> = {
  info:  'text-green-400',
  warn:  'text-yellow-400',
  error: 'text-red-400',
};

export function SyncLogViewer({ logs, className }: SyncLogViewerProps) {
  const [tableFilter, setTableFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<CDCSyncStatus | ''>('');
  const [isExporting, setIsExporting] = React.useState(false);

  const filtered = React.useMemo(() => {
    return logs.filter((l) => {
      const matchTable = tableFilter
        ? l.tableName?.toLowerCase().includes(tableFilter.toLowerCase())
        : true;
      const matchStatus = statusFilter ? l.status === statusFilter : true;
      return matchTable && matchStatus;
    });
  }, [logs, tableFilter, statusFilter]);

  const handleExport = () => {
    setIsExporting(true);
    const json = JSON.stringify(filtered, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sync-logs.json';
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setIsExporting(false), 1500);
  };

  return (
    <div
      className={cn('space-y-3', className)}
      data-testid="sync-log-viewer"
    >
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={tableFilter}
          onChange={(e) => setTableFilter(e.target.value)}
          placeholder="Filter by table…"
          aria-label="Filter logs by table name"
          data-testid="log-filter-table"
          className="h-8 px-3 text-xs font-mono bg-gray-900 border border-green-900 rounded text-green-300 placeholder-gray-600 focus:outline-none focus:border-green-500 w-44"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as CDCSyncStatus | '')}
          aria-label="Filter logs by status"
          data-testid="log-filter-status"
          className="h-8 px-2 text-xs font-mono bg-gray-900 border border-green-900 rounded text-green-300 focus:outline-none focus:border-green-500"
        >
          <option value="">All statuses</option>
          {(['running', 'idle', 'failed', 'retrying', 'paused'] as const).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <span className="text-[10px] font-mono text-gray-600 ml-auto">
          {filtered.length} / {logs.length} entries
        </span>
        <button
          type="button"
          onClick={handleExport}
          disabled={filtered.length === 0}
          data-testid="log-export-button"
          aria-label="Export sync logs as JSON"
          className="px-3 py-1.5 text-xs font-mono rounded border border-green-800 bg-gray-900 text-green-400 hover:bg-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isExporting ? '✓' : '↓ Export'}
        </button>
      </div>

      {/* Log list */}
      <div
        className="overflow-y-auto max-h-80 rounded-lg border border-green-900 bg-gray-950"
        data-testid="sync-log-list"
        role="log"
        aria-live="polite"
        aria-label="Sync event log"
      >
        {filtered.length === 0 ? (
          <p className="px-4 py-4 text-xs font-mono text-gray-600" data-testid="log-empty">
            No log entries match the current filters.
          </p>
        ) : (
          <ul className="divide-y divide-gray-800">
            {filtered.map((entry) => (
              <li
                key={entry.id}
                className="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-900/40"
                data-testid={`log-entry-${entry.id}`}
              >
                <span className="shrink-0 text-[10px] font-mono text-gray-600 pt-0.5 w-36">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
                <span
                  className={cn(
                    'shrink-0 w-10 text-[10px] font-mono font-semibold uppercase pt-0.5',
                    LEVEL_STYLES[entry.level] ?? 'text-gray-400'
                  )}
                  data-testid={`log-level-${entry.id}`}
                >
                  {entry.level}
                </span>
                {entry.tableName && (
                  <span className="shrink-0 text-[10px] font-mono text-blue-400 pt-0.5 w-28 truncate">
                    {entry.tableName}
                  </span>
                )}
                <span className="text-xs font-mono text-gray-300 min-w-0 break-words">
                  {entry.message}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
