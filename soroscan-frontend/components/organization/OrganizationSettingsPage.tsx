"use client";

import * as React from "react";
import { Button } from "@/components/terminal/Button";
import { Input } from "@/components/terminal/Input";
import { Card } from "@/components/terminal/Card";
import { StatusBurst } from "@/components/terminal/Motion";
import {
  DATA_REGION_LABELS,
  canEditOrgSettings,
  type DataRegion,
  type Organization,
  type OrgRole,
} from "@/lib/organization";
import { updateOrganization } from "@/lib/organization-store";

interface OrganizationSettingsPageProps {
  organization: Organization;
  currentRole: OrgRole | null;
  onUpdated: (org: Organization) => void;
}

export function OrganizationSettingsPage({
  organization,
  currentRole,
  onUpdated,
}: OrganizationSettingsPageProps) {
  const readOnly = !canEditOrgSettings(currentRole);
  const [name, setName] = React.useState(organization.name);
  const [billingContact, setBillingContact] = React.useState(
    organization.billingContact,
  );
  const [dataRegion, setDataRegion] = React.useState<DataRegion>(
    organization.dataRegion,
  );
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setName(organization.name);
    setBillingContact(organization.billingContact);
    setDataRegion(organization.dataRegion);
    setSaved(false);
    setError(null);
  }, [organization]);

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    if (readOnly) return;
    setSaving(true);
    setError(null);
    try {
      const updated = updateOrganization(organization.id, {
        name,
        billingContact,
        dataRegion,
      });
      onUpdated(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="ORG_SETTINGS" className="animate-terminal-fade-in">
      <form onSubmit={handleSave} className="space-y-5">
        {readOnly ? (
          <p
            className="border border-terminal-warning/40 bg-terminal-warning/10 px-3 py-2 text-xs text-terminal-warning"
            role="status"
          >
            Read-only view. Only owners and admins can edit organization settings.
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="org-name"
            label="Organization name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={readOnly || saving}
            required
          />
          <Input
            id="org-billing"
            label="Billing contact"
            type="email"
            value={billingContact}
            onChange={(event) => setBillingContact(event.target.value)}
            disabled={readOnly || saving}
            required
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="org-region"
            className="ml-1 block text-xs font-terminal-mono uppercase tracking-wider text-terminal-cyan"
          >
            Data region
          </label>
          <select
            id="org-region"
            value={dataRegion}
            disabled={readOnly || saving}
            onChange={(event) => setDataRegion(event.target.value as DataRegion)}
            className="min-h-[44px] w-full border border-terminal-gray/40 bg-terminal-black px-3 font-terminal-mono text-sm text-terminal-green outline-none focus-visible:border-terminal-green"
          >
            {(Object.keys(DATA_REGION_LABELS) as DataRegion[]).map((region) => (
              <option key={region} value={region}>
                {DATA_REGION_LABELS[region]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 border border-terminal-green/20 bg-terminal-dark/40 p-4 text-xs text-terminal-gray sm:grid-cols-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest">Contracts</div>
            <div className="mt-1 text-lg text-terminal-green">
              {organization.contractCount}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest">Webhook limit</div>
            <div className="mt-1 text-lg text-terminal-cyan">
              {organization.webhookLimit}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest">Created</div>
            <div className="mt-1 text-terminal-green">
              {new Date(organization.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {!readOnly ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save settings"}
            </Button>
            {saved ? <StatusBurst tone="success" label="Settings saved" /> : null}
            {error ? <StatusBurst tone="error" label={error} /> : null}
          </div>
        ) : null}
      </form>
    </Card>
  );
}
