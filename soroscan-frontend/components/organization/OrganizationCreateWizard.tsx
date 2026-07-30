"use client";

import * as React from "react";
import { Button } from "@/components/terminal/Button";
import { Input } from "@/components/terminal/Input";
import { Card } from "@/components/terminal/Card";
import { TerminalProgressBar, StatusBurst } from "@/components/terminal/Motion";
import {
  DATA_REGION_LABELS,
  type DataRegion,
  type Organization,
} from "@/lib/organization";
import { createOrganization } from "@/lib/organization-store";

interface OrganizationCreateWizardProps {
  onCreated: (org: Organization) => void;
}

const STEPS = ["Identity", "Region", "Confirm"] as const;

export function OrganizationCreateWizard({
  onCreated,
}: OrganizationCreateWizardProps) {
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState("");
  const [billingContact, setBillingContact] = React.useState("");
  const [dataRegion, setDataRegion] = React.useState<DataRegion>("us-east");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  const progress = Math.round(((step + 1) / STEPS.length) * 100);

  const canNext =
    step === 0
      ? name.trim().length >= 2 && billingContact.includes("@")
      : step === 1
        ? Boolean(dataRegion)
        : true;

  const handleCreate = () => {
    setBusy(true);
    setError(null);
    try {
      const org = createOrganization({ name, billingContact, dataRegion });
      setDone(true);
      onCreated(org);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="CREATE_ORGANIZATION" className="animate-terminal-fade-in">
      <div className="mb-6 space-y-3">
        <TerminalProgressBar value={progress} label={`Step ${step + 1}: ${STEPS[step]}`} />
        <ol className="flex gap-2 text-[10px] uppercase tracking-widest text-terminal-gray">
          {STEPS.map((label, index) => (
            <li
              key={label}
              className={
                index === step
                  ? "text-terminal-green"
                  : index < step
                    ? "text-terminal-cyan"
                    : undefined
              }
            >
              {index + 1}. {label}
            </li>
          ))}
        </ol>
      </div>

      {step === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="create-org-name"
            label="Organization name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <Input
            id="create-org-billing"
            label="Billing contact"
            type="email"
            value={billingContact}
            onChange={(event) => setBillingContact(event.target.value)}
            required
          />
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-2">
          <label
            htmlFor="create-org-region"
            className="text-xs uppercase tracking-wider text-terminal-cyan"
          >
            Primary data region
          </label>
          <select
            id="create-org-region"
            value={dataRegion}
            onChange={(event) => setDataRegion(event.target.value as DataRegion)}
            className="min-h-[44px] w-full border border-terminal-gray/40 bg-terminal-black px-3 font-terminal-mono text-sm text-terminal-green"
          >
            {(Object.keys(DATA_REGION_LABELS) as DataRegion[]).map((region) => (
              <option key={region} value={region}>
                {DATA_REGION_LABELS[region]}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {step === 2 ? (
        <dl className="space-y-2 border border-terminal-green/20 bg-terminal-dark/40 p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-terminal-gray">Name</dt>
            <dd className="text-terminal-green">{name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-terminal-gray">Billing</dt>
            <dd className="text-terminal-green">{billingContact}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-terminal-gray">Region</dt>
            <dd className="text-terminal-cyan">{DATA_REGION_LABELS[dataRegion]}</dd>
          </div>
        </dl>
      ) : null}

      {error ? (
        <p className="mt-4 text-xs text-terminal-danger" role="alert">
          {error}
        </p>
      ) : null}
      {done ? (
        <div className="mt-4">
          <StatusBurst tone="success" label="Organization created" />
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={step === 0 || busy}
          onClick={() => setStep((value) => Math.max(0, value - 1))}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            disabled={!canNext}
            onClick={() => setStep((value) => value + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button type="button" disabled={busy || done} onClick={handleCreate}>
            {busy ? "Creating…" : "Create organization"}
          </Button>
        )}
      </div>
    </Card>
  );
}
