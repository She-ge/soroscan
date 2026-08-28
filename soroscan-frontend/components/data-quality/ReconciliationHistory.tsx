'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { ReconciliationJob } from './types';

export interface ReconciliationHistoryProps {
  jobs: ReconciliationJob[];
  className?: string;
}

const STATUS_STYLES: Record<string, string> = {
  success:  'text-green-400 border-green-800 bg-green-950/20',
  failed:   'text-red-400 border-red-800 bg-red-950/20',
  running:  'text-blue-400 border-blue-800 bg-blue-950/20',
  pending:  'text-gray-400 border-gray-700 bg-gray-900/20',
  partial:  'text-yellow-400 border-yellow-800 bg-yellow-950/20',
};

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-20 h-1.5 rounded-full bg-gray-800"
      role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-blue-500 transition-all"
        style={{ width: `${Math.min(100, percent)}%` }} />
    </div>
  );
}

export function ReconciliationHistory({ jobs, className }: ReconciliationHistoryProps) {
  if (jobs.length === 0) {
    return (
      <p className="text-sm font-mono text-gray-500 py-4" data-testid="reconciliation-history-empty">
        No reconciliation jobs found.
      </p>
    );
  }

  return (
    <div className={cn('overflow-x-auto rounded-lg border border-green-900', className)}
      data-testid="reconciliation-history">
      <table className="w-full text-xs font-mono">
        <thead className="bg-gray-900 border-b border-green-900">
          <tr className="text-gray-500">
            <th className="text-left px-4 py-2.5 font-normal">Job ID</th>
            <th className="text-left px-4 py-2.5 font-normal">Status</th>
            <th className="text-left px-4 py-2.5 font-normal">Started</th>
            <th className="text-right px-4 py-2.5 font-normal">Recovered</th>
            <th className="text-left px-4 py-2.5 font-normal">Progress</th>
            <th className="text-left px-4 py-2.5 font-normal">Reason</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.jobId}
              className="border-t border-gray-800 hover:bg-gray-900/40"
              data-testid={`reconciliation-job-${job.jobId}`}>
              <td className="px-4 py-2.5 text-green-300 font-semibold">
                {job.jobId.slice(0, 10)}…
              </td>
              <td className="px-4 py-2.5">
                <span className={cn('px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase',
                  STATUS_STYLES[job.status] ?? STATUS_STYLES.pending)}
                  data-testid={`job-status-${job.jobId}`}>
                  {job.status}
                </span>
              </td>
              <td className="px-4 py-2.5 text-gray-500">
                {new Date(job.startedAt).toLocaleString()}
              </td>
              <td className="px-4 py-2.5 text-right text-blue-400"
                data-testid={`job-recovered-${job.jobId}`}>
                {job.eventsRecovered.toLocaleString()}
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <ProgressBar percent={job.progressPercent} />
                  <span className="text-gray-600" data-testid={`job-progress-${job.jobId}`}>
                    {job.progressPercent}%
                  </span>
                </div>
              </td>
              <td className="px-4 py-2.5 text-gray-400 max-w-[12rem] truncate">
                {job.reason}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
