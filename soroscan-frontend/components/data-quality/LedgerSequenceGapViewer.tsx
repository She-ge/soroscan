'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { LedgerGap } from './types';

export interface LedgerSequenceGapViewerProps {
  gaps: LedgerGap[];
  totalEvents: number;
  className?: string;
}

export function LedgerSequenceGapViewer({ gaps, totalEvents, className }: LedgerSequenceGapViewerProps) {
  const [page, setPage] = React.useState(0);
  const PAGE_SIZE = 50;
  const totalPages = Math.max(1, Math.ceil(gaps.length / PAGE_SIZE));
  const visible = gaps.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (gaps.length === 0) {
    return (
      <div className={cn('flex items-center gap-2 px-4 py-3 rounded-lg border border-green-800 bg-green-950/20 text-green-400 text-sm font-mono', className)}
        data-testid="gap-viewer-no-gaps">
        <span aria-hidden="true">✓</span> No sequence gaps detected — ledger is complete.
      </div>
    );
  }

  const totalMissing = gaps.reduce((s, g) => s + g.count, 0);

  return (
    <div className={cn('space-y-3', className)} data-testid="ledger-gap-viewer">
      {/* Summary */}
      <div className="flex items-center gap-6 text-xs font-mono text-gray-500">
        <span><span className="text-red-400 font-semibold">{gaps.length}</span> gap range{gaps.length !== 1 ? 's' : ''}</span>
        <span><span className="text-red-400 font-semibold">{totalMissing.toLocaleString()}</span> missing events</span>
        <span className="ml-auto text-gray-600">{totalEvents.toLocaleString()} total indexed</span>
      </div>

      {/* Gap table */}
      <div className="overflow-x-auto rounded-lg border border-red-900/50" data-testid="gap-table">
        <table className="w-full text-xs font-mono">
          <thead className="bg-gray-900 border-b border-red-900/50">
            <tr className="text-gray-500">
              <th className="text-left px-4 py-2 font-normal">#</th>
              <th className="text-right px-4 py-2 font-normal">Start Seq</th>
              <th className="text-right px-4 py-2 font-normal">End Seq</th>
              <th className="text-right px-4 py-2 font-normal">Missing</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((gap, idx) => (
              <tr
                key={`${gap.startSequence}-${gap.endSequence}`}
                className="border-t border-gray-800 hover:bg-gray-900/40"
                data-testid={`gap-row-${page * PAGE_SIZE + idx}`}
              >
                <td className="px-4 py-2 text-gray-600">{page * PAGE_SIZE + idx + 1}</td>
                <td className="px-4 py-2 text-right text-red-300">{gap.startSequence.toLocaleString()}</td>
                <td className="px-4 py-2 text-right text-red-300">{gap.endSequence.toLocaleString()}</td>
                <td className="px-4 py-2 text-right text-red-400 font-semibold">{gap.count.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 text-xs font-mono">
          <button type="button" onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0} data-testid="gap-prev-page"
            className="px-2 py-1 rounded border border-gray-700 bg-gray-900 text-gray-400 disabled:opacity-40">
            ‹ Prev
          </button>
          <span className="text-gray-600">Page {page + 1} / {totalPages}</span>
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1} data-testid="gap-next-page"
            className="px-2 py-1 rounded border border-gray-700 bg-gray-900 text-gray-400 disabled:opacity-40">
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}
