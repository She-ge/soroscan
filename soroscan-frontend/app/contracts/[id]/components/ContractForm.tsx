"use client";

import * as React from "react";
import { Input } from "@/components/terminal/Input";
import { Button } from "@/components/terminal/Button";
import type { Contract, ContractFormData } from "@/components/ingest/contract-types";

interface ContractFormProps {
  contract: Contract;
  onSave: (data: ContractFormData) => Promise<void>;
  onCancel: () => void;
}

const DESCRIPTION_MAX_LENGTH = 256;
const DESCRIPTION_WARNING_THRESHOLD = Math.floor(DESCRIPTION_MAX_LENGTH * 0.9);

export function ContractForm({ contract, onSave, onCancel }: ContractFormProps) {
  const [formData, setFormData] = React.useState<ContractFormData>({
    contractId: contract.contractId,
    name: contract.name,
    description: contract.description || "",
    tags: contract.tags || [],
    status: contract.status,
  });
  const [tagsInput, setTagsInput] = React.useState((contract.tags || []).join(", "));
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update contract");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTagsChange = (value: string) => {
    setTagsInput(value);
    const tags = value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    setFormData({ ...formData, tags });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-terminal-mono text-terminal-cyan uppercase tracking-wider block ml-1">
          Contract ID (Read-only)
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-3 text-terminal-gray font-terminal-mono">&gt;</span>
          <input
            type="text"
            value={formData.contractId}
            disabled
            className="flex h-10 w-full bg-terminal-black/50 border-terminal border-terminal-gray/30 px-8 py-2 text-sm font-terminal-mono text-terminal-gray cursor-not-allowed"
          />
        </div>
      </div>

      <Input
        label="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="My Contract"
        required
      />

      <div className="space-y-1">
        <label className="text-xs font-terminal-mono text-terminal-cyan uppercase tracking-wider block ml-1">
          Description
        </label>
        <div className="relative">
          <span className="absolute left-3 top-3 text-terminal-green font-terminal-mono">
            &gt;
          </span>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description..."
            rows={3}
            maxLength={DESCRIPTION_MAX_LENGTH}
            className="w-full bg-terminal-black border-terminal border-terminal-gray/30 px-8 py-2 text-sm font-terminal-mono text-terminal-green placeholder:text-terminal-gray/50 focus-visible:outline-none focus-visible:border-terminal-green focus-visible:shadow-glow-green/20 transition-all resize-none"
          />
        </div>
        <div className="flex justify-end">
          <span
            className={`text-xs font-terminal-mono ${
              formData.description.length >= DESCRIPTION_WARNING_THRESHOLD
                ? "text-terminal-danger"
                : "text-terminal-gray"
            }`}
            aria-live="polite"
          >
            {formData.description.length}/{DESCRIPTION_MAX_LENGTH}
          </span>
        </div>
      </div>

      <Input
        label="Tags (comma-separated)"
        value={tagsInput}
        onChange={(e) => handleTagsChange(e.target.value)}
        placeholder="defi, token, swap"
      />

      <div className="space-y-1">
        <label className="text-xs font-terminal-mono text-terminal-cyan uppercase tracking-wider block ml-1">
          Status
        </label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="active"
              checked={formData.status === "active"}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as "active" | "inactive" })
              }
              className="w-4 h-4 accent-terminal-green"
            />
            <span className="text-sm font-terminal-mono text-terminal-green">ACTIVE</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="status"
              value="inactive"
              checked={formData.status === "inactive"}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as "active" | "inactive" })
              }
              className="w-4 h-4 accent-terminal-gray"
            />
            <span className="text-sm font-terminal-mono text-terminal-gray">INACTIVE</span>
          </label>
        </div>
      </div>

      {error && (
        <div className="p-3 border border-terminal-danger bg-terminal-danger/10 text-terminal-danger text-sm">
          {error}
        </div>
      )}

     <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button type="submit" variant="primary" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "SAVING..." : "SAVE CHANGES"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting} className="sm:w-auto">
          CANCEL
        </Button>
      </div>
    </form>
  );
}
