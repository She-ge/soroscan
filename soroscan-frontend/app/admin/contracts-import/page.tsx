'use client';

import * as React from 'react';
import { getAccessToken } from '@/lib/auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ContractsImportPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [format, setFormat] = React.useState('');
  const [onError, setOnError] = React.useState('rollback');
  const [dryRun, setDryRun] = React.useState(true);
  const [report, setReport] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const submit = async () => {
    if (!file) {
      setError('Choose a CSV or JSON file first.');
      return;
    }
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const token = getAccessToken();
      const body = new FormData();
      body.append('file', file);
      body.append('dry_run', String(dryRun));
      body.append('on_error', onError);
      if (format) body.append('format', format);

      const res = await fetch(`${API_BASE}/api/ingest/contracts/metadata/bulk-import/`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.detail || JSON.stringify(data) || `Import failed (${res.status})`);
      }
      setReport(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6" data-testid="contracts-import-page">
      <div>
        <h1 className="text-base font-mono font-semibold text-green-400">Bulk Import Metadata</h1>
        <p className="text-xs font-mono text-gray-500 mt-0.5">
          CSV/JSON import with validation, rollback-on-error, and import reporting.
        </p>
      </div>

      <div className="space-y-3 border border-green-900/40 p-4 bg-black/40">
        <input
          type="file"
          accept=".csv,.json,text/csv,application/json"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          data-testid="import-file"
          className="block w-full text-xs font-mono text-gray-300"
        />

        <label className="block text-xs font-mono text-gray-400">
          Format
          <select
            className="mt-1 block w-full bg-gray-950 border border-green-900/50 px-3 py-2 text-sm font-mono text-green-300"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            <option value="">Auto-detect</option>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
        </label>

        <label className="block text-xs font-mono text-gray-400">
          On error
          <select
            className="mt-1 block w-full bg-gray-950 border border-green-900/50 px-3 py-2 text-sm font-mono text-green-300"
            value={onError}
            onChange={(e) => setOnError(e.target.value)}
          >
            <option value="rollback">Rollback</option>
            <option value="skip">Skip row</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs font-mono text-gray-300">
          <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
          Dry run (validate only)
        </label>

        <button
          type="button"
          onClick={submit}
          disabled={loading}
          className="px-3 py-2 text-xs font-mono border border-green-700 bg-green-950 text-green-300"
          data-testid="import-submit"
        >
          {loading ? 'Importing…' : 'Run import'}
        </button>
      </div>

      {error && <p className="text-xs font-mono text-red-400">{error}</p>}
      {report && (
        <pre className="text-xs font-mono text-green-200 whitespace-pre-wrap border border-green-900/30 p-3">
          {report}
        </pre>
      )}
    </div>
  );
}
