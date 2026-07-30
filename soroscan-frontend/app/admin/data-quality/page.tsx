'use client';

import * as React from 'react';
import { Tabs } from '@/components/ui/tabs';
import {
  DataQualityScorecard, LedgerSequenceGapViewer, EventCountComparison,
  ReconciliationHistory, ManualReconciliationForm, GapFillPreview,
  DataQualityAnomalyAlert,
} from '@/components/data-quality';
import type {
  DataQualityMetrics, ReconciliationJob, EventCountPoint,
  GapFillPreviewItem, AnomalyAlert, DateRange,
} from '@/components/data-quality';

/** Stubs — replace with real GraphQL calls once Backend #100 ships. */
async function fetchMetrics(_contractId: string): Promise<DataQualityMetrics | null> { return null; }
async function fetchJobs(): Promise<ReconciliationJob[]> { return []; }
async function fetchEventCounts(_contractId: string, _range: DateRange): Promise<EventCountPoint[]> { return []; }
async function fetchGapFillPreview(_contractId: string): Promise<GapFillPreviewItem[]> { return []; }
async function fetchAnomalyAlerts(): Promise<AnomalyAlert[]> { return []; }

async function triggerReconciliation(contractId: string, dateRange: DateRange, reason: string) {
  void contractId; void dateRange; void reason;
  return { jobId: 'job-stub', status: 'pending', estimatedDurationSecs: null };
}

function exportReportPDF(contractId: string) {
  const content = `Data Quality Report\nContract: ${contractId}\nGenerated: ${new Date().toISOString()}`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dq-report-${contractId.slice(0, 8)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DataQualityPage() {
  const [selectedContractId, setSelectedContractId] = React.useState<string | null>(null);
  const [allMetrics, setAllMetrics] = React.useState<DataQualityMetrics[]>([]);
  const [jobs, setJobs] = React.useState<ReconciliationJob[]>([]);
  const [eventCounts, setEventCounts] = React.useState<EventCountPoint[]>([]);
  const [gapFillItems, setGapFillItems] = React.useState<GapFillPreviewItem[]>([]);
  const [anomalies, setAnomalies] = React.useState<AnomalyAlert[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchJobs(), fetchAnomalyAlerts()]).then(([j, a]) => {
      setJobs(j); setAnomalies(a); setIsLoading(false);
    });
  }, []);

  const handleSelectContract = React.useCallback(async (contractId: string) => {
    setSelectedContractId(contractId);
    const [m, counts, preview] = await Promise.all([
      fetchMetrics(contractId),
      fetchEventCounts(contractId, { start: '2024-01-01', end: new Date().toISOString().slice(0, 10) }),
      fetchGapFillPreview(contractId),
    ]);
    if (m) setAllMetrics((prev) => [...prev.filter((x) => x.contractId !== contractId), m]);
    setEventCounts(counts);
    setGapFillItems(preview);
  }, []);

  const selectedMetrics = allMetrics.find((m) => m.contractId === selectedContractId) ?? null;

  const detailTabs = selectedMetrics
    ? [
        { id: 'gaps', title: `Gaps (${selectedMetrics.gaps.length})`,
          content: <LedgerSequenceGapViewer gaps={selectedMetrics.gaps} totalEvents={selectedMetrics.actualEventCount} /> },
        { id: 'counts', title: 'Event Counts',
          content: <EventCountComparison data={eventCounts} /> },
        { id: 'gapfill', title: 'Gap Fill Preview',
          content: <GapFillPreview items={gapFillItems}
            onExport={() => {
              const blob = new Blob([JSON.stringify(gapFillItems, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url;
              a.download = 'gap-fill-preview.json'; a.click(); URL.revokeObjectURL(url);
            }} /> },
        { id: 'reconcile', title: 'Reconcile',
          content: <ManualReconciliationForm contractId={selectedContractId!} onSubmit={triggerReconciliation} /> },
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6" data-testid="data-quality-page">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-base font-mono font-semibold text-green-400">Data Quality</h1>
          <p className="text-xs font-mono text-gray-500 mt-0.5">Event completeness & reconciliation</p>
        </div>
        {selectedContractId && (
          <button type="button"
            onClick={() => exportReportPDF(selectedContractId)}
            data-testid="export-pdf-button"
            aria-label="Export reconciliation report"
            className="px-3 py-1.5 text-xs font-mono rounded border border-green-800 bg-gray-900 text-green-400 hover:bg-green-900/30 transition-colors">
            ↓ Export Report
          </button>
        )}
      </div>

      <DataQualityAnomalyAlert alerts={anomalies} />

      <div className="space-y-1">
        <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Completeness Scorecard</p>
        <DataQualityScorecard metrics={allMetrics} isLoading={isLoading}
          onSelectContract={handleSelectContract} />
      </div>

      <div className="space-y-1">
        <p className="text-xs font-mono text-gray-500 uppercase tracking-wider">Reconciliation History</p>
        <ReconciliationHistory jobs={jobs} />
      </div>

      {selectedContractId && detailTabs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono text-green-300">
              Detail: <span className="text-green-400">{selectedContractId.slice(0, 16)}…</span>
            </h2>
            <button type="button" onClick={() => setSelectedContractId(null)}
              className="text-xs font-mono text-gray-500 hover:text-gray-300">✕ Close</button>
          </div>
          <Tabs items={detailTabs} />
        </div>
      )}
    </div>
  );
}
