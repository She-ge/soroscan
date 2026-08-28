'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BytecodeComparisonProps {
  compiledHash: string;
  onChainHash: string;
  className?: string;
}

function HashRow({
  label,
  hash,
  testId,
}: {
  label: string;
  hash: string;
  testId: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = hash;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-1">
      <p className="text-xs text-gray-500 uppercase tracking-wider font-mono">{label}</p>
      <div className="flex items-center gap-2">
        <code
          className="flex-1 block text-xs font-mono text-green-300 bg-gray-900 rounded px-3 py-2 break-all border border-gray-800"
          data-testid={testId}
        >
          {hash}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${label}`}
          data-testid={`${testId}-copy`}
          className="shrink-0 px-2.5 py-1.5 text-xs font-mono rounded border border-green-900 bg-gray-900 text-green-500 hover:bg-green-900/30 transition-colors"
        >
          {copied ? '✓' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

export function BytecodeComparison({
  compiledHash,
  onChainHash,
  className,
}: BytecodeComparisonProps) {
  const hashesMatch = compiledHash === onChainHash;

  return (
    <div
      className={cn('space-y-4', className)}
      data-testid="bytecode-comparison"
    >
      <HashRow
        label="Compiled Hash"
        hash={compiledHash}
        testId="compiled-hash"
      />
      <HashRow
        label="On-Chain Hash"
        hash={onChainHash}
        testId="onchain-hash"
      />

      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded border text-xs font-mono',
          hashesMatch
            ? 'bg-green-900/20 border-green-800 text-green-400'
            : 'bg-red-900/20 border-red-800 text-red-400'
        )}
        role="status"
        aria-label={hashesMatch ? 'Hashes match' : 'Hash mismatch'}
        data-testid="hash-match-status"
      >
        <span aria-hidden="true">{hashesMatch ? '✓' : '✗'}</span>
        {hashesMatch ? 'Hashes match — bytecode verified' : 'Hash mismatch — bytecode differs from source'}
      </div>
    </div>
  );
}
