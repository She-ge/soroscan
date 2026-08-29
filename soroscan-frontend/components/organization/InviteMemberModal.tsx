"use client";

import * as React from "react";
import { Button } from "@/components/terminal/Button";
import { Input } from "@/components/terminal/Input";
import { Modal } from "@/components/terminal/Modal";
import { ORG_ROLE_LABELS, type OrgRole } from "@/lib/organization";
import { inviteTeamMember } from "@/lib/organization-store";

interface InviteMemberModalProps {
  organizationId: string;
  open: boolean;
  onClose: () => void;
  onInvited: () => void;
}

const INVITE_ROLES: OrgRole[] = ["admin", "operator", "viewer"];

export function InviteMemberModal({
  organizationId,
  open,
  onClose,
  onInvited,
}: InviteMemberModalProps) {
  const [emails, setEmails] = React.useState("");
  const [role, setRole] = React.useState<OrgRole>("viewer");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setEmails("");
      setRole("viewer");
      setError(null);
      setMessage(null);
      setBusy(false);
    }
  }, [open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = emails
      .split(/[\s,;]+/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (!parsed.length) {
      setError("Enter at least one email address.");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const results = parsed.map((email) =>
        inviteTeamMember(organizationId, email, role),
      );
      setMessage(
        results.length === 1
          ? results[0].message
          : `Sent ${results.length} invitations.`,
      );
      onInvited();
      if (results.length === 1) {
        onClose();
      } else {
        setEmails("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="INVITE_MEMBER">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-terminal-gray">
          Invite one or more teammates. Separate emails with commas for bulk invite.
          Invitations expire in 7 days.
        </p>

        <Input
          id="invite-emails"
          label="Email address(es)"
          placeholder="alice@acme.dev, bob@acme.dev"
          value={emails}
          onChange={(event) => setEmails(event.target.value)}
          disabled={busy}
          required
        />

        <div className="space-y-1">
          <label
            htmlFor="invite-role"
            className="ml-1 block text-xs uppercase tracking-wider text-terminal-cyan"
          >
            Role
          </label>
          <select
            id="invite-role"
            value={role}
            disabled={busy}
            onChange={(event) => setRole(event.target.value as OrgRole)}
            className="min-h-[44px] w-full border border-terminal-gray/40 bg-terminal-black px-3 font-terminal-mono text-sm text-terminal-green"
          >
            {INVITE_ROLES.map((item) => (
              <option key={item} value={item}>
                {ORG_ROLE_LABELS[item]}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <p className="text-xs text-terminal-danger" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-xs text-terminal-green" role="status">
            {message}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? "Sending…" : "Send invite"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
