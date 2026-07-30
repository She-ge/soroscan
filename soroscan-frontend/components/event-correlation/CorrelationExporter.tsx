'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { EventCorrelationData } from './types';

export interface CorrelationExporterProps {
  data: EventCorrelationData;
  filename?: string;
  className?: string;
}

export function CorrelationExporter({
  data,
  filename,
  className,
}: CorrelationExporterProps) {
  const [exported, setExported] = React.useState(false);

  const handleExportJSON = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename ?? `correlation-${data.atomicGroupId ?? data.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const handleExportCSV = () => {
    const rows = [
      ['id', 'contractId', 'contractName', 'eventType', 'timestamp', 'blockNumber'],
      ...data.relatedEvents.map((ev) => [
        ev.id,
        ev.contractId,
        ev.contractName,
        ev.eventType,
        ev.timestamp,
        String(ev.blockNumber),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename
      ? filename.replace('.json', '.csv')
      : `correlation-${data.atomicGroupId ?? data.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={cn('flex items-center gap-2', className)}
      data-testid="correlation-exporter"
    >
      <button
        type="button"
        onClick={handleExportJSON}
        data-testid="export-json-button"
        aria-label="Export correlated events as JSON"
        className="px-3 py-1.5 text-xs font-mono rounded border border-green-800 bg-gray-900 text-green-400 hover:bg-green-900/30 transition-colors"
      >
        {exported ? '✓ Exported' : '↓ JSON'}
      </button>
      <button
        type="button"
        onClick={handleExportCSV}
        data-testid="export-csv-button"
        aria-label="Export correlated events as CSV"
        className="px-3 py-1.5 text-xs font-mono rounded border border-green-800 bg-gray-900 text-green-400 hover:bg-green-900/30 transition-colors"
      >
        ↓ CSV
      </button>
    </div>
  );
}
