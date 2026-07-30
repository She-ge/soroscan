'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { ABIFunction } from './types';

export interface ABIExplorerProps {
  functions: ABIFunction[];
  /** Called when the user copies a function signature */
  onCopyFunction?: (fn: ABIFunction) => void;
  className?: string;
}

function buildSignature(fn: ABIFunction): string {
  const params = fn.parameters
    .map((p) => `${p.name}: ${p.type}`)
    .join(', ');
  const ret = fn.returnType ? ` -> ${fn.returnType}` : '';
  return `fn ${fn.name}(${params})${ret}`;
}

function ABIFunctionRow({
  fn,
  onCopy,
}: {
  fn: ABIFunction;
  onCopy?: (fn: ABIFunction) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const panelId = React.useId();

  const handleCopy = async () => {
    const sig = buildSignature(fn);
    try {
      await navigator.clipboard.writeText(sig);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = sig;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.(fn);
  };

  return (
    <div
      className="border border-green-900 rounded-md overflow-hidden"
      data-testid="abi-function-row"
    >
      {/* Header / trigger */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-900 hover:bg-gray-800 transition-colors text-left"
        data-testid={`abi-fn-toggle-${fn.name}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={cn(
              'shrink-0 text-xs px-1.5 py-0.5 rounded font-mono font-semibold',
              fn.isInvokable
                ? 'bg-green-900/50 text-green-400 border border-green-800'
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            )}
            aria-label={fn.isInvokable ? 'Invokable' : 'Read-only'}
          >
            {fn.isInvokable ? 'invoke' : 'view'}
          </span>
          <span
            className="font-mono text-sm text-green-300 truncate"
            data-testid={`abi-fn-name-${fn.name}`}
          >
            {fn.name}
          </span>
          {fn.returnType && (
            <span className="font-mono text-xs text-gray-500 hidden sm:inline">
              → {fn.returnType}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            aria-label={`Copy ${fn.name} function signature`}
            data-testid={`copy-fn-${fn.name}`}
            className="px-2 py-0.5 text-xs font-mono rounded border border-green-900 bg-gray-900 text-green-500 hover:bg-green-900/30 transition-colors"
          >
            {copied ? '✓' : 'Copy'}
          </button>
          <span
            className="text-gray-500 text-sm"
            aria-hidden="true"
          >
            {open ? '▲' : '▼'}
          </span>
        </div>
      </button>

      {/* Expanded detail panel */}
      {open && (
        <div
          id={panelId}
          className="px-4 py-3 bg-gray-950 border-t border-green-900 space-y-3"
          data-testid={`abi-fn-panel-${fn.name}`}
        >
          {/* Signature */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Signature</p>
            <code className="block text-xs font-mono text-green-300 bg-gray-900 rounded px-3 py-2 break-all">
              {buildSignature(fn)}
            </code>
          </div>

          {/* Parameters */}
          {fn.parameters.length > 0 ? (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Parameters</p>
              <table className="w-full text-xs font-mono" data-testid={`abi-fn-params-${fn.name}`}>
                <thead>
                  <tr className="text-gray-600">
                    <th className="text-left pr-6 pb-1 font-normal">Name</th>
                    <th className="text-left pb-1 font-normal">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {fn.parameters.map((param) => (
                    <tr key={param.name} className="border-t border-gray-800">
                      <td className="pr-6 py-1 text-green-400">{param.name}</td>
                      <td className="py-1 text-blue-400">{param.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-gray-600 font-mono">No parameters</p>
          )}

          {/* Return type */}
          {fn.returnType && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Returns</p>
              <span className="text-xs font-mono text-blue-400">{fn.returnType}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ABIExplorer({ functions, onCopyFunction, className }: ABIExplorerProps) {
  if (functions.length === 0) {
    return (
      <p
        className="text-sm text-gray-500 font-mono py-4"
        data-testid="abi-empty-state"
      >
        No ABI functions available.
      </p>
    );
  }

  return (
    <div
      className={cn('space-y-2', className)}
      data-testid="abi-explorer"
      aria-label="ABI function explorer"
    >
      <p className="text-xs text-gray-500 font-mono mb-3">
        {functions.length} function{functions.length !== 1 ? 's' : ''}
      </p>
      {functions.map((fn) => (
        <ABIFunctionRow key={fn.name} fn={fn} onCopy={onCopyFunction} />
      ))}
    </div>
  );
}
