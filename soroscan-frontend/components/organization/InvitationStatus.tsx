"use client";

import * as React from "react";
import { Button } from "@/components/terminal/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/terminal/Table";
import {
  ORG_ROLE_LABELS,
  canManageMembers,
  invitationDaysRemaining,
  isInvitationExpired,
  type OrgRole,
  type TeamInvitation,
} from "@/lib/organization";
import {
  cancelInvitation,
  resendInvitation,
} from "@/lib/organization-store";

interface InvitationStatusProps {
  organizationId: string;
  invitations: TeamInvitation[];
  currentRole: OrgRole | null;
  onChanged: () => void;
}

export function InvitationStatus({
  organizationId,
  invitations,
  currentRole,
  onChanged,
}: InvitationStatusProps) {
  const canManage = canManageMembers(currentRole);
  const [error, setError] = React.useState<string | null>(null);

  const pending = invitations.filter((inv) => {
    if (inv.status === "cancelled" || inv.status === "accepted") return false;
    return !isInvitationExpired(inv.expiresAt) || inv.status === "pending";
  });

  const handleResend = (invitationId: string) => {
    setError(null);
    try {
      resendInvitation(organizationId, invitationId);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resend failed");
    }
  };

  const handleCancel = (invitationId: string) => {
    setError(null);
    try {
      cancelInvitation(organizationId, invitationId);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel failed");
    }
  };

  if (!pending.length) {
    return (
      <p className="text-sm text-terminal-gray" role="status">
        No pending invitations.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-xs text-terminal-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="overflow-x-auto border border-terminal-green/30">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              {canManage ? <TableHead>Actions</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {pending.map((invitation) => {
              const expired = isInvitationExpired(invitation.expiresAt);
              const days = invitationDaysRemaining(invitation.expiresAt);
              return (
                <TableRow key={invitation.id}>
                  <TableCell>{invitation.email}</TableCell>
                  <TableCell>{ORG_ROLE_LABELS[invitation.role]}</TableCell>
                  <TableCell className="text-terminal-gray">
                    {expired ? (
                      <span className="text-terminal-danger">Expired</span>
                    ) : (
                      <span>{days}d remaining</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="uppercase tracking-wider text-terminal-cyan">
                      {expired ? "expired" : invitation.status}
                    </span>
                  </TableCell>
                  {canManage ? (
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => handleResend(invitation.id)}
                        >
                          Resend
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => handleCancel(invitation.id)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
