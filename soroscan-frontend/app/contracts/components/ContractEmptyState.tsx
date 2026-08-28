"use client";

import * as React from "react";
import { FileCode2, Plus } from "lucide-react";
import { EmptyState, EmptyStateIcon } from "@/components/ui/empty-state";

interface ContractEmptyStateProps {
  onRegister: () => void;
}

/**
 * Shown inside the TRACKED_CONTRACTS card when the user has no contracts yet.
 */
export function ContractEmptyState({ onRegister }: ContractEmptyStateProps) {
  return (
    <EmptyState
      variant="terminal"
      ariaLabel="No contracts registered"
      icon={
        <EmptyStateIcon>
          <FileCode2
            className="h-9 w-9 text-terminal-green"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </EmptyStateIcon>
      }
      title="No contracts found"
      description={
        <>
          You haven&apos;t registered any Soroban contracts yet.
          <br className="hidden sm:block" />
          Register a contract to start indexing events.
        </>
      }
      action={{
        id: "empty-state-register-contract",
        label: "Register Contract",
        onClick: onRegister,
        ariaLabel: "Register your first contract",
        terminalVariant: "primary",
        size: "lg",
        icon: <Plus className="h-4 w-4" aria-hidden="true" />,
      }}
      footer={
        <>$ soroscan contracts register --id &lt;CONTRACT_ID&gt;</>
      }
    />
  );
}
