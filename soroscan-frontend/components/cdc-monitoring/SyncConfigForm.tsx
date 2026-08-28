'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { CDCSyncConfig, WarehouseType } from './types';

export interface SyncConfigFormProps {
  initial?: Partial<CDCSyncConfig>;
  onSubmit: (config: CDCSyncConfig) => Promise<void>;
  onTestConnection: (config: Omit<CDCSyncConfig, 'syncId' | 'name'>) => Promise<{ ok: boolean; message: string }>;
  className?: string;
}

const WAREHOUSE_OPTIONS: { value: WarehouseType; label: string }[] = [
  { value: 'snowflake', label: 'Snowflake' },
  { value: 'bigquery', label: 'BigQuery' },
  { value: 'redshift', label: 'Redshift' },
  { value: 'databricks', label: 'Databricks' },
];

interface TestResult { ok: boolean; message: string }

export function SyncConfigForm({ initial, onSubmit, onTestConnection, className }: SyncConfigFormProps) {
  const [name, setName] = React.useState(initial?.name ?? '');
  const [warehouseType, setWarehouseType] = React.useState<WarehouseType>(initial?.warehouseType ?? 'snowflake');
  const [host, setHost] = React.useState(initial?.host ?? '');
  const [database, setDatabase] = React.useState(initial?.database ?? '');
  const [schema, setSchema] = React.useState(initial?.schema ?? '');
  const [username, setUsername] = React.useState(initial?.username ?? '');
  const [password, setPassword] = React.useState('');

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<TestResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const validate = (): string | null => {
    if (!name.trim()) return 'Name is required.';
    if (!host.trim()) return 'Host is required.';
    if (!database.trim()) return 'Database is required.';
    if (!schema.trim()) return 'Schema is required.';
    if (!username.trim()) return 'Username is required.';
    if (!password) return 'Password is required.';
    return null;
  };

  const buildCredentials = () => ({
    warehouseType,
    host: host.trim(),
    database: database.trim(),
    schema: schema.trim(),
    username: username.trim(),
    // password intentionally never logged — passed directly to handler
    password,
  });

  const handleTestConnection = async () => {
    const vErr = validate();
    if (vErr) { setError(vErr); return; }
    setError(null);
    setIsTesting(true);
    try {
      const result = await onTestConnection(buildCredentials());
      setTestResult(result);
    } catch (e) {
      setTestResult({ ok: false, message: e instanceof Error ? e.message : 'Connection failed.' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vErr = validate();
    if (vErr) { setError(vErr); return; }
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit({
        syncId: initial?.syncId ?? '',
        name: name.trim(),
        ...buildCredentials(),
      });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('space-y-4', className)}
      data-testid="sync-config-form"
      aria-label="CDC sync configuration"
    >
      {/* Name */}
      <Field label="Sync Name *" htmlFor="cfg-name">
        <input id="cfg-name" type="text" required value={name}
          onChange={(e) => setName(e.target.value)}
          data-testid="cfg-name"
          className={INPUT_CLS} placeholder="My Snowflake Sync" />
      </Field>

      {/* Warehouse type */}
      <Field label="Warehouse Type *" htmlFor="cfg-warehouse">
        <select id="cfg-warehouse" value={warehouseType}
          onChange={(e) => setWarehouseType(e.target.value as WarehouseType)}
          data-testid="cfg-warehouse-type"
          className={INPUT_CLS}>
          {WAREHOUSE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>

      {/* Host */}
      <Field label="Host *" htmlFor="cfg-host">
        <input id="cfg-host" type="text" required value={host}
          onChange={(e) => setHost(e.target.value)}
          data-testid="cfg-host"
          className={INPUT_CLS} placeholder="account.snowflakecomputing.com" />
      </Field>

      {/* Database + Schema row */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Database *" htmlFor="cfg-database">
          <input id="cfg-database" type="text" required value={database}
            onChange={(e) => setDatabase(e.target.value)}
            data-testid="cfg-database"
            className={INPUT_CLS} placeholder="SOROSCAN_DW" />
        </Field>
        <Field label="Schema *" htmlFor="cfg-schema">
          <input id="cfg-schema" type="text" required value={schema}
            onChange={(e) => setSchema(e.target.value)}
            data-testid="cfg-schema"
            className={INPUT_CLS} placeholder="PUBLIC" />
        </Field>
      </div>

      {/* Username + Password row */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Username *" htmlFor="cfg-username">
          <input id="cfg-username" type="text" autoComplete="username" required value={username}
            onChange={(e) => setUsername(e.target.value)}
            data-testid="cfg-username"
            className={INPUT_CLS} placeholder="sync_user" />
        </Field>
        <Field label="Password *" htmlFor="cfg-password">
          <input id="cfg-password" type="password" autoComplete="current-password" required value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="cfg-password"
            className={INPUT_CLS} placeholder="••••••••" />
        </Field>
      </div>

      {/* Test connection result */}
      {testResult && (
        <div
          role="status"
          data-testid="test-connection-result"
          className={cn(
            'text-xs font-mono px-3 py-2 rounded border',
            testResult.ok
              ? 'text-green-400 border-green-800 bg-green-950/20'
              : 'text-red-400 border-red-800 bg-red-950/20'
          )}
        >
          {testResult.ok ? '✓' : '✗'} {testResult.message}
        </div>
      )}

      {/* Error */}
      {error && (
        <div role="alert" data-testid="cfg-error" className="text-xs font-mono text-red-400 border border-red-800 bg-red-950/20 rounded px-3 py-2">
          {error}
        </div>
      )}

      {/* Success */}
      {saved && (
        <div role="status" data-testid="cfg-saved" className="text-xs font-mono text-green-400">
          ✓ Configuration saved.
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={handleTestConnection} disabled={isTesting}
          data-testid="test-connection-button"
          className="px-4 py-2 text-xs font-mono rounded border border-blue-800 bg-blue-900/20 text-blue-400 hover:bg-blue-900/40 disabled:opacity-50 transition-colors">
          {isTesting ? 'Testing…' : 'Test Connection'}
        </button>
        <button type="submit" disabled={isSubmitting}
          data-testid="cfg-submit-button"
          className="px-4 py-2 text-xs font-mono rounded border border-green-800 bg-green-900/20 text-green-400 hover:bg-green-900/40 disabled:opacity-50 transition-colors">
          {isSubmitting ? 'Saving…' : 'Save Configuration'}
        </button>
      </div>
    </form>
  );
}

const INPUT_CLS =
  'w-full h-9 px-3 text-xs font-mono bg-gray-900 border border-gray-700 rounded text-gray-200 placeholder-gray-600 focus:outline-none focus:border-green-600';

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}
