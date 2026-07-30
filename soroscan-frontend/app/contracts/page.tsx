"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/terminal/Card";
import { Button } from "@/components/terminal/Button";
import { ContractTable } from "./components/ContractTable";
import { RegisterModal } from "./components/RegisterModal";
import { DeleteConfirmModal } from "./components/DeleteConfirmModal";
import {
  listContracts,
  registerContract,
  deleteContract,
} from "@/components/ingest/contract-graphql";
import type { Contract, ContractFormData } from "@/components/ingest/contract-types";

interface ContractWithMetrics extends Contract {
  eventCount: number;
  lastEventTime?: string;
  status: "active" | "inactive";
}

export default function ContractsPage() {
  const [contracts, setContracts] = React.useState<ContractWithMetrics[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<ContractWithMetrics | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = React.useState(false);
  const [backfillInProgress, setBackfillInProgress] = React.useState<string | null>(null);

  const loadContracts = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await listContracts();
      // Prefer API fields when present so UI stays deterministic for tests/visuals.
      const enhanced = data.map((c: Contract) => ({
        ...c,
        eventCount: c.eventCount ?? 0,
        lastEventTime: c.updatedAt,
        status: c.status ?? "active",
      }));
      setContracts(enhanced);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contracts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const handleRegister = async (data: ContractFormData) => {
    await registerContract(data);
    await loadContracts();
  };

  const handleDeleteClick = (id: string) => {
    const contract = contracts.find((c) => c.id === id);
    if (contract) {
      setDeleteTarget(contract);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      await deleteContract(deleteTarget.id);
      await loadContracts();
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete contract");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBackfill = async (contractId: string) => {
    setBackfillInProgress(contractId);
    try {
      // Simulate backfill task
      await new Promise((resolve) => setTimeout(resolve, 1500));
      alert(`Backfill started for contract ${contractId}. Task ID: task_${Date.now()}`);
    } catch (_err) {
      setError("Failed to start backfill");
    } finally {
      setBackfillInProgress(null);
    }
  };

  const totalEvents = contracts.reduce((sum, c) => c.eventCount, 0);
  const activeContracts = contracts.filter((c) => c.status === "active").length;

  return (
    <div className="min-h-screen bg-terminal-black p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-terminal-mono text-terminal-green mb-2">
              [CONTRACT_MANAGEMENT]
            </h1>
            <p className="text-terminal-gray font-terminal-mono text-sm">
              Manage tracked contracts, events, and monitoring tasks
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Link href="/contract-upgrades" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto">
                Upgrade Timeline
              </Button>
            </Link>
            <Button
              variant={showFavoritesOnly ? "primary" : "secondary"}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className="w-full sm:w-auto"
            >
              {showFavoritesOnly ? "Show All" : "Show Favorites"}
            </Button>
            <Button
              variant="primary"
              data-testid="register-contract-btn"
              data-tour="register-contract"
              onClick={() => setIsRegisterModalOpen(true)}
              className="w-full sm:w-auto"
            >
              Register Contract
            </Button>
          </div>
        </div>

        {error && (
          <Card>
            <div className="p-4 border border-terminal-danger bg-terminal-danger/10 text-terminal-danger">
              {error}
            </div>
          </Card>
        )}

        {/* Contract Summary Stats */}
        {contracts.length > 0 && !isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded border border-terminal-green/20 p-4">
              <p className="text-xs text-terminal-gray mb-1">Total Contracts</p>
              <p className="text-2xl font-bold text-terminal-green">{contracts.length}</p>
            </div>
            <div className="rounded border border-terminal-cyan/20 p-4">
              <p className="text-xs text-terminal-gray mb-1">Active</p>
              <p className="text-2xl font-bold text-terminal-cyan">{activeContracts}</p>
            </div>
            <div className="rounded border border-terminal-yellow/20 p-4">
              <p className="text-xs text-terminal-gray mb-1">Total Events</p>
              <p className="text-2xl font-bold text-terminal-yellow">{totalEvents}</p>
            </div>
            <div className="rounded border border-terminal-magenta/20 p-4">
              <p className="text-xs text-terminal-gray mb-1">Avg Events</p>
              <p className="text-2xl font-bold text-terminal-magenta">
                {contracts.length > 0 ? Math.round(totalEvents / contracts.length) : 0}
              </p>
            </div>
          </div>
        )}

        <Card title="TRACKED_CONTRACTS">
          {isLoading ? (
            <div className="text-center py-12 text-terminal-gray font-terminal-mono">
              LOADING...
            </div>
          ) : (
            <div className="space-y-4">
              <ContractTable
                contracts={contracts}
                onDelete={handleDeleteClick}
                onRegister={() => setIsRegisterModalOpen(true)}
                showFavoritesOnly={showFavoritesOnly}
              />

              {/* Enhanced Contract Table with Actions */}
              <div className="rounded border border-terminal-green/20 overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-terminal-green/5">
                    <tr>
                      <th className="px-3 py-2 text-left">Contract ID</th>
                      <th className="px-3 py-2 text-left hidden sm:table-cell">Events</th>
                      <th className="px-3 py-2 text-left hidden md:table-cell">Status</th>
                      <th className="px-3 py-2 text-left hidden lg:table-cell">Last Event</th>
                      <th className="px-3 py-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-center text-terminal-gray">
                          No contracts. Register one to start.
                        </td>
                      </tr>
                    ) : (
                      contracts.map((contract) => (
                        <tr key={contract.id} className="border-t border-terminal-green/10 hover:bg-terminal-green/5">
                          <td className="px-3 py-2 font-mono text-terminal-cyan text-xs">
                            {contract.id.slice(0, 12)}...
                          </td>
                          <td className="px-3 py-2 hidden sm:table-cell">
                            <span className="text-terminal-yellow font-bold">{contract.eventCount}</span>
                          </td>
                          <td className="px-3 py-2 hidden md:table-cell">
                            <span
                              className={`px-2 py-1 rounded text-xs font-mono ${
                                contract.status === "active"
                                  ? "bg-terminal-green/20 text-terminal-green"
                                  : "bg-terminal-red/20 text-terminal-red"
                              }`}
                            >
                              {contract.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 hidden lg:table-cell text-xs text-terminal-gray">
                            {contract.lastEventTime
                              ? new Date(contract.lastEventTime).toLocaleString()
                              : "Never"}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex gap-1 justify-center">
                              <button
                                type="button"
                                onClick={() => handleBackfill(contract.id)}
                                disabled={backfillInProgress === contract.id}
                                className="px-2 py-1 text-xs rounded border border-terminal-magenta/40 hover:bg-terminal-magenta/10 disabled:opacity-50"
                                title="Trigger data backfill"
                              >
                                {backfillInProgress === contract.id ? "↻" : "↻"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(contract.id)}
                                className="px-2 py-1 text-xs rounded border border-terminal-red/40 text-terminal-red hover:bg-terminal-red/10"
                                title="Delete contract"
                              >
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>

        <RegisterModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onSubmit={handleRegister}
        />

        <DeleteConfirmModal
          isOpen={!!deleteTarget}
          contractName={deleteTarget?.name ?? ""}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}
