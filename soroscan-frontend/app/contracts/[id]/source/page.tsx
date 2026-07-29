'use client';

import * as React from 'react';
import { Tabs } from '@/components/ui/tabs';
import {
  ContractCodeViewer,
  VerificationBadge,
  ABIExplorer,
  BytecodeComparison,
  ConstructorArgsDecoder,
  VerificationRequestForm,
} from '@/components/contract-code';
import type { ContractCode, VerificationRequestData } from '@/components/contract-code';

/**
 * Stub — replace with real GraphQL / REST fetch once Backend #96 ships.
 * Returns null while loading so the page renders a skeleton.
 */
async function fetchContractCode(contractId: string): Promise<ContractCode | null> {
  // In production this would call the GraphQL `contractCode(id: $id)` query.
  // For now return null so the UI renders gracefully in its empty state.
  void contractId;
  return null;
}

async function submitVerificationRequest(
  _contractId: string,
  _data: VerificationRequestData
): Promise<void> {
  // POST /api/contracts/:id/verify — replace with real call once Backend #96 ships.
  await new Promise((resolve) => setTimeout(resolve, 500));
}

export default function ContractSourcePage({
  params,
}: {
  params: { id: string };
}) {
  const { id: contractId } = params;
  const [contractCode, setContractCode] = React.useState<ContractCode | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchContractCode(contractId).then((data) => {
      if (!cancelled) {
        setContractCode(data);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [contractId]);

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20" data-testid="source-loading">
        <span className="text-sm font-mono text-gray-500 animate-pulse">
          Loading contract source…
        </span>
      </div>
    );
  }

  /* ── No source yet — show verification request form ── */
  if (!contractCode) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 space-y-6" data-testid="source-unverified-view">
        <div className="flex items-center gap-3">
          <VerificationBadge status="unverified" />
          <h1 className="text-base font-mono text-gray-200">Contract Source Code</h1>
        </div>
        <p className="text-sm font-mono text-gray-500">
          No verified source code is available for this contract.
        </p>
        <div className="border border-yellow-900 rounded-lg p-5 bg-yellow-950/20">
          <h2
            className="text-sm font-mono text-yellow-400 mb-4"
            data-testid="request-verification-heading"
          >
            Request Verification
          </h2>
          <VerificationRequestForm
            contractId={contractId}
            onSubmit={(data) => submitVerificationRequest(contractId, data)}
          />
        </div>
      </div>
    );
  }

  /* ── Has source ── */
  const tabs = [
    {
      id: 'source',
      title: 'Source Code',
      content: (
        <ContractCodeViewer
          sourceCode={contractCode.sourceCode}
          language={contractCode.language}
          filename={`${contractId}.${contractCode.language === 'rust' ? 'rs' : 'wat'}`}
        />
      ),
    },
    {
      id: 'abi',
      title: `ABI (${contractCode.abi.length})`,
      content: (
        <ABIExplorer functions={contractCode.abi} />
      ),
    },
    {
      id: 'bytecode',
      title: 'Bytecode',
      content: (
        <BytecodeComparison
          compiledHash={contractCode.compiledHash}
          onChainHash={contractCode.onChainHash}
        />
      ),
    },
    ...(contractCode.constructorArgs && contractCode.constructorArgs.length > 0
      ? [
          {
            id: 'constructor',
            title: 'Constructor Args',
            content: (
              <ConstructorArgsDecoder args={contractCode.constructorArgs} />
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-5" data-testid="source-verified-view">
      {/* Page header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-base font-mono text-gray-200">Contract Source Code</h1>
        <VerificationBadge status={contractCode.verificationStatus} />
      </div>

      {/* Malicious warning banner */}
      {contractCode.verificationStatus === 'malicious' && (
        <div
          role="alert"
          className="flex items-center gap-2 px-4 py-3 rounded border border-red-700 bg-red-950/30 text-red-400 text-sm font-mono"
          data-testid="malicious-warning"
        >
          <span aria-hidden="true">🚨</span>
          This contract has been flagged as malicious. Do not interact with it.
        </div>
      )}

      {/* Tabs */}
      <Tabs items={tabs} />
    </div>
  );
}
