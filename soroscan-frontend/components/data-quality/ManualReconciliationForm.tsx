'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { DateRange } from './types';

export interface ReconciliationJobResult {
  jobId: string;
  status: string;
  estimatedDurationSecs: number | null;
}

export interface ManualReconciliationFormProps {
  contractId: string;
  onSubmit: (contractId: string, dateRange: DateRange, reason: string) => Promise<ReconciliationJobResult>;
  className?: string;
}

export function ManualReconciliationForm({ contractId, onSubmit, className }: ManualReconciliationFormProps) {
  const [start, setStart] = React.useState('');
  const [end, setEnd] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<ReconciliationJobResult | null>(null);

  const validate = (): string | null => {
    if (!start) return 'Start date is required.';
    if (!end) return 'End date is required.';
    if (new Date(start) > new Date(end)) return 'Start date must be before end date.';
    if (!reason.trim()) return 'Reason is required.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setIsSubmitting(true);
    try {
      const r = await onSubmit(contractId, { start, end }, reason.trim());
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start reconciliation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-2" data-testid="reconciliation-job-started">
        <div className="flex items-center gap-2 px-4 py-3 rounded border border-green-800 bg-green-950/20 text-green-400 text-sm font-mono">
          <span aria-hidden="true">▶</span>
          Reconciliation job started
        </div>
        <dl className="text-xs font-mono text-gray-400 space-y-1 px-1">
          <div className="flex gap-2">
            <dt className="text-gray-600">Job ID:</dt>
            <dd className="text-green-300" data-testid="started-job-id">{result.jobId}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-gray-600">Status:</dt>
            <dd data-testid="started-job-status">{result.status}</dd>
          </div>
          {result.estimatedDurationSecs != null && (
            <div className="flex gap-2">
              <dt className="text-gray-600">Est. duration:</dt>
              <dd data-testid="started-job-duration">{result.estimatedDurationSecs}s</dd>
            </div>
          )}
        </dl>
        <button type="button" onClick={() => setResult(null)}
          className="text-xs font-mono text-gray-500 hover:text-gray-300 mt-2">
          Start another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}
      data-testid="manual-reconciliation-form"
      aria-label="Trigger manual reconciliation">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label htmlFor="recon-start" className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider">
            Start Date *
          </label>
          <input id="recon-start" type="date" required value={start}
            onChange={(e) => setStart(e.target.value)}
            data-testid="recon-start-date"
            className={INPUT_CLS} />
        </div>
        <div className="space-y-1">
          <label htmlFor="recon-end" className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider">
            End Date *
          </label>
          <input id="recon-end" type="date" required value={end}
            onChange={(e) => setEnd(e.target.value)}
            data-testid="recon-end-date"
            className={INPUT_CLS} />
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="recon-reason" className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider">
          Reason *
        </label>
        <textarea id="recon-reason" required rows={3} value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Describe why you are triggering this reconciliation…"
          data-testid="recon-reason"
          className={cn(INPUT_CLS, 'resize-y h-auto')} />
      </div>

      {error && (
        <div role="alert" data-testid="recon-error"
          className="text-xs font-mono text-red-400 border border-red-800 bg-red-950/20 rounded px-3 py-2">
          {error}
        </div>
      )}

      <button type="submit" disabled={isSubmitting}
        data-testid="recon-submit-button"
        className="px-4 py-2 text-xs font-mono rounded border border-green-800 bg-green-900/20 text-green-400 hover:bg-green-900/40 disabled:opacity-50 transition-colors">
        {isSubmitting ? 'Starting…' : '▶ Start Reconciliation'}
      </button>
    </form>
  );
}

const INPUT_CLS = 'w-full h-9 px-3 text-xs font-mono bg-gray-900 border border-gray-700 rounded text-gray-200 placeholder-gray-600 focus:outline-none focus:border-green-600';
