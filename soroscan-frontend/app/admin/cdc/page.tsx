'use client';

import * as React from 'react';
import { Tabs } from '@/components/ui/tabs';
import {
  CDCSyncDashboard,
  SyncConfigForm,
  TableLevelMetrics,
  DataFreshnessHeatmap,
  SyncLogViewer,
  CDCLatencyChart,
} from '@/components/cdc-monitoring';
import type {
  CDCSyncSummary,
  CDCSyncProgress,
  TableSyncMetric,
  SyncLogEntry,
  LatencyDataPoint,
  FreshnessCell,
  CDCSyncConfig,
} from '@/components/cdc-monitoring';
import { getFreshnessLevel } from '@/components/cdc-monitoring';

// ── Stubs — replace with real GraphQL + @tanstack/react-query calls once Backend #99 ships ──

const POLL_INTERVAL_MS = 30_000;

function useCDCSyncs(): { syncs: CDCSyncSummary[]; isLoading: boolean; refetch: () => void } {
  const [syncs] = React.useState<CDCSyncSummary[]>([]);
  return { syncs, isLoading: false, refetch: () => {} };
}

function useTableMetrics(_syncId: string): TableSyncMetric[] { return []; }
function useSyncLogs(_syncId: string): SyncLogEntry[] { return []; }
function useLatencyHistory(_syncId: string): LatencyDataPoint[] { return []; }
function useFreshnessCells(metrics: TableSyncMetric[]): FreshnessCell[] {
  return metrics.map((m) => ({
    tableName: m.tableName,
    lastSyncAt: m.lastSyncAt,
    level: getFreshnessLevel(m.lastSyncAt),
  }));
}

async function triggerSync(_syncId: string): Promise<void> {}
async function retrySync(_syncId: string): Promise<void> {}
async function saveConfig(_cfg: CDCSyncConfig): Promise<void> {}
async function testConnection(_creds: Omit<CDCSyncConfig, 'syncId' | 'name'>): Promise<{ ok: boolean; message: string }> {
  return { ok: false, message: 'Backend #99 not yet connected.' };
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CDCMonitoringPage() {
  const { syncs, isLoading, refetch } = useCDCSyncs();
  const [selectedSyncId, setSelectedSyncId] = React.useState<string | null>(null);

  // Poll every 30 s for real-time updates
  React.useEffect(() => {
    const id = setInterval(refetch, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refetch]);

  const tableMetrics = useTableMetrics(selectedSyncId ?? '');
  const syncLogs = useSyncLogs(selectedSyncId ?? '');
  const latencyHistory = useLatencyHistory(selectedSyncId ?? '');
  const freshnessCells = useFreshnessCells(tableMetrics);

  const detailTabs = selectedSyncId
    ? [
        {
          id: 'tables',
          title: 'Tables',
          content: <TableLevelMetrics metrics={tableMetrics} />,
        },
        {
          id: 'freshness',
          title: 'Freshness',
          content: <DataFreshnessHeatmap cells={freshnessCells} />,
        },
        {
          id: 'latency',
          title: 'Latency',
          content: <CDCLatencyChart data={latencyHistory} targetLatencyMs={5000} />,
        },
        {
          id: 'logs',
          title: 'Logs',
          content: <SyncLogViewer logs={syncLogs} />,
        },
      ]
    : [];

  const topTabs = [
    {
      id: 'dashboard',
      title: 'Syncs',
      content: (
        <CDCSyncDashboard
          syncs={syncs}
          isLoading={isLoading}
          onRetry={retrySync}
          onTriggerSync={triggerSync}
        />
      ),
    },
    {
      id: 'config',
      title: 'Add Sync',
      content: (
        <div className="max-w-2xl">
          <SyncConfigForm
            onSubmit={saveConfig}
            onTestConnection={testConnection}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6" data-testid="cdc-monitoring-page">
      <div>
        <h1 className="text-base font-mono font-semibold text-green-400">
          CDC Monitoring
        </h1>
        <p className="text-xs font-mono text-gray-500 mt-0.5">
          Real-time Change Data Capture sync status · updates every 30s
        </p>
      </div>

      <Tabs items={topTabs} />

      {selectedSyncId && detailTabs.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono text-green-300">
              Sync detail: <span className="text-green-400">{selectedSyncId}</span>
            </h2>
            <button
              type="button"
              onClick={() => setSelectedSyncId(null)}
              className="text-xs font-mono text-gray-500 hover:text-gray-300"
            >
              ✕ Close
            </button>
          </div>
          <Tabs items={detailTabs} />
        </div>
      )}
    </div>
  );
}
