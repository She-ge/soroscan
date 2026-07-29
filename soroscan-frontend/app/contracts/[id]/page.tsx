"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/terminal/Card";
import { Button } from "@/components/terminal/Button";
import { ContractForm } from "./components/ContractForm";
import {
  getContract,
  updateContract,
} from "@/components/ingest/contract-graphql";
import type { Contract, ContractFormData } from "@/components/ingest/contract-types";

export default function ContractDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const contractId = decodeURIComponent(params.id);

  const [contract, setContract] = React.useState<Contract | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getContract(contractId);
        if (!active) return;
        setContract(data);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load contract");
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [contractId]);

  const handleSave = async (data: ContractFormData) => {
    if (!contract) return;
    const updated = await updateContract(contract.id, data);
    setContract(updated);
    setStatusMessage("CONTRACT_UPDATED");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-terminal-black p-8 font-terminal-mono text-terminal-green">
        LOADING_CONTRACT...
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-terminal-black p-8 font-terminal-mono space-y-4">
        <p className="text-terminal-danger">{error || "Contract not found"}</p>
        <Button variant="secondary" onClick={() => router.push("/contracts")}>
          BACK_TO_CONTRACTS
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-terminal-black p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-terminal-cyan tracking-widest mb-1">
              [CONTRACT_DETAIL]
            </p>
            <h1 className="text-2xl font-terminal-mono text-terminal-green">
              {contract.name}
            </h1>
          </div>
          <Button variant="secondary" onClick={() => router.push("/contracts")}>
            BACK
          </Button>
        </div>

        {statusMessage && (
          <div
            className="border border-terminal-green/40 bg-terminal-green/10 p-3 text-sm text-terminal-green"
            data-testid="contract-status"
          >
            {statusMessage}
          </div>
        )}

        <Card title="EDIT_CONTRACT">
          <div data-testid="contract-edit-form">
            <ContractForm
              contract={contract}
              onSave={handleSave}
              onCancel={() => router.push("/contracts")}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
