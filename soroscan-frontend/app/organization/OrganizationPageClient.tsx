"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/terminal/Button";
import { OrganizationSwitcher } from "@/components/organization/OrganizationSwitcher";
import { OrganizationSettingsPage } from "@/components/organization/OrganizationSettingsPage";
import { TeamMembersTable } from "@/components/organization/TeamMembersTable";
import { InviteMemberModal } from "@/components/organization/InviteMemberModal";
import { InvitationStatus } from "@/components/organization/InvitationStatus";
import { RolePermissionMatrix } from "@/components/organization/RolePermissionMatrix";
import { OrganizationActivityLog } from "@/components/organization/OrganizationActivityLog";
import { OrganizationCreateWizard } from "@/components/organization/OrganizationCreateWizard";
import { TypeConfirmDialog } from "@/components/organization/TypeConfirmDialog";
import { canManageMembers, type Organization, type TeamMember } from "@/lib/organization";
import {
  getActiveOrganizationId,
  getCurrentUserRole,
  getOrganization,
  listActivity,
  listInvitations,
  listTeamMembers,
  removeTeamMember,
} from "@/lib/organization-store";

const tabs = [
  { id: "members", label: "Members" },
  { id: "invitations", label: "Invitations" },
  { id: "settings", label: "Settings" },
  { id: "roles", label: "Roles" },
  { id: "activity", label: "Activity" },
  { id: "create", label: "Create" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function getTabId(value: string | null): TabId {
  return tabs.find((tab) => tab.id === value)?.id ?? "members";
}

export default function OrganizationPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = getTabId(searchParams?.get("tab") ?? null);

  const [organization, setOrganization] = React.useState<Organization | null>(null);
  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [memberToRemove, setMemberToRemove] = React.useState<TeamMember | null>(null);
  const [removing, setRemoving] = React.useState(false);
  const [tick, setTick] = React.useState(0);

  const refresh = React.useCallback(() => {
    const id = getActiveOrganizationId();
    if (!id) {
      setOrganization(null);
      setMembers([]);
      return;
    }
    setOrganization(getOrganization(id));
    setMembers(listTeamMembers(id));
    setTick((value) => value + 1);
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const setTab = (tabId: TabId) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("tab", tabId);
    router.replace(`/organization?${params.toString()}`);
  };

  const currentRole = organization
    ? getCurrentUserRole(organization.id)
    : null;
  const canManage = canManageMembers(currentRole);

  const invitations = organization
    ? listInvitations(organization.id)
    : [];
  const activity = organization ? listActivity(organization.id) : [];

  void tick;

  const handleConfirmRemove = () => {
    if (!organization || !memberToRemove) return;
    setRemoving(true);
    try {
      removeTeamMember(organization.id, memberToRemove.id);
      setMemberToRemove(null);
      refresh();
    } finally {
      setRemoving(false);
    }
  };

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-60px)] bg-terminal-black p-4 sm:p-6 font-terminal-mono text-terminal-green">
        <div className="mx-auto max-w-6xl space-y-6 animate-terminal-fade-in">
          <header className="flex flex-col gap-4 border border-terminal-green/30 bg-terminal-dark/30 p-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-terminal-gray">
                Multi-tenant control plane
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-[0.15em] text-terminal-green">
                ◆ ORGANIZATION
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-terminal-gray">
                Manage teams, invitations, roles, and org settings for{" "}
                <span className="text-terminal-cyan">
                  {organization?.name ?? "your workspace"}
                </span>
                .
              </p>
            </div>
            <OrganizationSwitcher onChanged={() => refresh()} />
          </header>

          <nav
            className="flex flex-wrap gap-2 border border-terminal-green/20 bg-terminal-black p-2"
            aria-label="Organization sections"
          >
            {tabs.map((tab) => {
              const selected = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTab(tab.id)}
                  className={`min-h-[40px] px-3 text-xs uppercase tracking-wider transition-terminal-fast ${
                    selected
                      ? "border border-terminal-green bg-terminal-green/15 text-terminal-green shadow-glow-green"
                      : "border border-transparent text-terminal-gray hover:text-terminal-green"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {activeTab === "members" && organization ? (
            <section className="space-y-4 border border-terminal-green/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm uppercase tracking-[0.2em]">Team members</h2>
                {canManage ? (
                  <Button type="button" onClick={() => setInviteOpen(true)}>
                    Invite member
                  </Button>
                ) : null}
              </div>
              <TeamMembersTable
                organizationId={organization.id}
                members={members}
                currentRole={currentRole}
                onChanged={refresh}
                onRequestRemove={setMemberToRemove}
              />
            </section>
          ) : null}

          {activeTab === "invitations" && organization ? (
            <section className="space-y-4 border border-terminal-green/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm uppercase tracking-[0.2em]">Invitations</h2>
                {canManage ? (
                  <Button type="button" onClick={() => setInviteOpen(true)}>
                    Invite member
                  </Button>
                ) : null}
              </div>
              <InvitationStatus
                organizationId={organization.id}
                invitations={invitations}
                currentRole={currentRole}
                onChanged={refresh}
              />
            </section>
          ) : null}

          {activeTab === "settings" && organization ? (
            <OrganizationSettingsPage
              organization={organization}
              currentRole={currentRole}
              onUpdated={(org) => {
                setOrganization(org);
                refresh();
              }}
            />
          ) : null}

          {activeTab === "roles" ? <RolePermissionMatrix /> : null}

          {activeTab === "activity" && organization ? (
            <OrganizationActivityLog entries={activity} />
          ) : null}

          {activeTab === "create" ? (
            <OrganizationCreateWizard
              onCreated={() => {
                refresh();
                setTab("settings");
              }}
            />
          ) : null}
        </div>
      </div>

      {organization ? (
        <InviteMemberModal
          organizationId={organization.id}
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          onInvited={refresh}
        />
      ) : null}

      <TypeConfirmDialog
        open={Boolean(memberToRemove)}
        title="REMOVE_MEMBER"
        description={
          memberToRemove
            ? `This will revoke ${memberToRemove.email}'s access to the organization.`
            : ""
        }
        confirmPhrase={memberToRemove?.email ?? ""}
        confirmText="Remove member"
        loading={removing}
        onCancel={() => setMemberToRemove(null)}
        onConfirm={handleConfirmRemove}
      />
    </AppShell>
  );
}
