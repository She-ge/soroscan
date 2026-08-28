'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { GapFillPreviewItem } from './types';

export interface GapFillPreviewProps {
  items: GapFillPreviewItem[];
  onExport?: () => void;
  className?: string;
}

export function GapFillPreview({ items, onExport, className }: GapFillPreviewProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm font-mono text-gray-500 py-4" data-testid="gap-fill-preview-empty">
        No events to preview for gap fill.
      </p>
    );
  }

  return (
    <div className={cn('space-y-3', className)} data-testid="gap-fill-preview">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-gray-500">
          <span className="text-blue-400 font-semibold">{items.length.toLocaleString()}</span> events would be recovered
        </span>
        {onExport && (
          <button type="button" onClick={onExport}
            data-testid="gap-fill-export-button"
            aria-label="Export gap fill preview as JSON"
            className="px-3 py-1 rounded border border-green-800 bg-gray-900 text-green-400 hover:bg-green-900/30 transition-colors">
            ↓ Export
          </button>
        )}
      </div>

      <div className="overflow-y-auto max-h-64 rounded-lg border border-blue-900/50">
        <table className="w-full text-xs font-mono">
          <thead className="bg-gray-900 border-b border-blue-900/50 sticky top-0">
            <tr className="text-gray-500">
              <th className="text-right px-4 py-2 font-normal">Sequence</th>
              <th className="text-left px-4 py-2 font-normal">Est. Timestamp</th>
              <th className="text-left px-4 py-2 font-normal">Contract</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.sequence}
                className="border-t border-gray-800 hover:bg-gray-900/40"
                data-testid={`gap-fill-row-${idx}`}>
                <td className="px-4 py-2 text-right text-blue-300">{item.sequence.toLocaleString()}</td>
                <td className="px-4 py-2 text-gray-400">{item.estimatedTimestamp}</td>
                <td className="px-4 py-2 text-green-300 truncate max-w-[8rem]">{item.contractId.slice(0, 12)}…</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
