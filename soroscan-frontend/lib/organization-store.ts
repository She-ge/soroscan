/**
 * Client-side organization store with GraphQL-shaped operations.
 * Persists to localStorage so the UI works before backend GraphQL (#95) lands.
 */

import type {
  DataRegion,
  OrgActivityEntry,
  Organization,
  OrgRole,
  TeamInvitation,
  TeamMember,
} from "@/lib/organization";

const STORAGE_KEY = "soroscan.org.store.v1";
const ACTIVE_ORG_KEY = "soroscan.activeOrganizationId";

export interface OrgStoreState {
  organizations: Organization[];
  membersByOrg: Record<string, TeamMember[]>;
  invitationsByOrg: Record<string, TeamInvitation[]>;
  activityByOrg: Record<string, OrgActivityEntry[]>;
  currentUserEmail: string;
  currentUserRoleByOrg: Record<string, OrgRole>;
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function seedState(): OrgStoreState {
  const orgA: Organization = {
    id: "org_acme",
    name: "Acme Indexing",
    billingContact: "billing@acme.dev",
    dataRegion: "us-east",
    createdAt: "2026-01-10T12:00:00.000Z",
    contractCount: 12,
    webhookLimit: 50,
  };
  const orgB: Organization = {
    id: "org_nebula",
    name: "Nebula Labs",
    billingContact: "ops@nebula.io",
    dataRegion: "eu-west",
    createdAt: "2026-03-02T09:30:00.000Z",
    contractCount: 4,
    webhookLimit: 25,
  };

  return {
    currentUserEmail: "you@soroscan.dev",
    currentUserRoleByOrg: {
      [orgA.id]: "owner",
      [orgB.id]: "viewer",
    },
    organizations: [orgA, orgB],
    membersByOrg: {
      [orgA.id]: [
        {
          id: "mem_you",
          email: "you@soroscan.dev",
          role: "owner",
          joinedAt: "2026-01-10T12:00:00.000Z",
          lastActiveAt: new Date().toISOString(),
        },
        {
          id: "mem_alice",
          email: "alice@acme.dev",
          role: "admin",
          joinedAt: "2026-01-12T15:00:00.000Z",
          lastActiveAt: "2026-07-20T10:00:00.000Z",
        },
        {
          id: "mem_bob",
          email: "bob@acme.dev",
          role: "operator",
          joinedAt: "2026-02-01T11:00:00.000Z",
          lastActiveAt: "2026-07-18T08:00:00.000Z",
        },
        {
          id: "mem_carol",
          email: "carol@acme.dev",
          role: "viewer",
          joinedAt: "2026-04-04T16:00:00.000Z",
          lastActiveAt: null,
        },
      ],
      [orgB.id]: [
        {
          id: "mem_you_b",
          email: "you@soroscan.dev",
          role: "viewer",
          joinedAt: "2026-03-05T10:00:00.000Z",
          lastActiveAt: new Date().toISOString(),
        },
        {
          id: "mem_nova",
          email: "nova@nebula.io",
          role: "owner",
          joinedAt: "2026-03-02T09:30:00.000Z",
          lastActiveAt: "2026-07-21T12:00:00.000Z",
        },
      ],
    },
    invitationsByOrg: {
      [orgA.id]: [
        {
          id: "inv_pending",
          email: "dave@acme.dev",
          role: "viewer",
          invitedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: daysFromNow(5),
          status: "pending",
        },
      ],
      [orgB.id]: [],
    },
    activityByOrg: {
      [orgA.id]: [
        {
          id: "act_1",
          action: "org_created",
          actorEmail: "you@soroscan.dev",
          detail: "Organization created",
          timestamp: "2026-01-10T12:00:00.000Z",
        },
        {
          id: "act_2",
          action: "member_added",
          actorEmail: "you@soroscan.dev",
          targetEmail: "alice@acme.dev",
          detail: "Added alice@acme.dev as admin",
          timestamp: "2026-01-12T15:00:00.000Z",
        },
        {
          id: "act_3",
          action: "invite_sent",
          actorEmail: "you@soroscan.dev",
          targetEmail: "dave@acme.dev",
          detail: "Invited dave@acme.dev as viewer",
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      [orgB.id]: [
        {
          id: "act_b1",
          action: "member_added",
          actorEmail: "nova@nebula.io",
          targetEmail: "you@soroscan.dev",
          detail: "Added you@soroscan.dev as viewer",
          timestamp: "2026-03-05T10:00:00.000Z",
        },
      ],
    },
  };
}

function readState(): OrgStoreState {
  if (typeof window === "undefined") {
    return seedState();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw) as OrgStoreState;
  } catch {
    return seedState();
  }
}

function writeState(state: OrgStoreState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function pushActivity(
  state: OrgStoreState,
  orgId: string,
  entry: Omit<OrgActivityEntry, "id" | "timestamp">,
): void {
  const list = state.activityByOrg[orgId] ?? [];
  state.activityByOrg[orgId] = [
    {
      id: createId("act"),
      timestamp: new Date().toISOString(),
      ...entry,
    },
    ...list,
  ].slice(0, 100);
}

export function getActiveOrganizationId(): string | null {
  if (typeof window === "undefined") return "org_acme";
  return localStorage.getItem(ACTIVE_ORG_KEY) ?? "org_acme";
}

export function setActiveOrganizationId(id: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVE_ORG_KEY, id);
}

export function listOrganizations(): Organization[] {
  return readState().organizations;
}

export function getOrganization(id: string): Organization | null {
  return readState().organizations.find((org) => org.id === id) ?? null;
}

export function getCurrentUserRole(organizationId: string): OrgRole | null {
  return readState().currentUserRoleByOrg[organizationId] ?? null;
}

export function getCurrentUserEmail(): string {
  return readState().currentUserEmail;
}

export function listTeamMembers(organizationId: string): TeamMember[] {
  return [...(readState().membersByOrg[organizationId] ?? [])].sort((a, b) =>
    a.email.localeCompare(b.email),
  );
}

export function listInvitations(organizationId: string): TeamInvitation[] {
  return [...(readState().invitationsByOrg[organizationId] ?? [])].sort(
    (a, b) => new Date(b.invitedAt).getTime() - new Date(a.invitedAt).getTime(),
  );
}

export function listActivity(organizationId: string): OrgActivityEntry[] {
  return [...(readState().activityByOrg[organizationId] ?? [])].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function createOrganization(input: {
  name: string;
  billingContact: string;
  dataRegion: DataRegion;
}): Organization {
  const state = readState();
  const org: Organization = {
    id: createId("org"),
    name: input.name.trim(),
    billingContact: input.billingContact.trim(),
    dataRegion: input.dataRegion,
    createdAt: new Date().toISOString(),
    contractCount: 0,
    webhookLimit: 25,
  };
  state.organizations.push(org);
  state.currentUserRoleByOrg[org.id] = "owner";
  state.membersByOrg[org.id] = [
    {
      id: createId("mem"),
      email: state.currentUserEmail,
      role: "owner",
      joinedAt: org.createdAt,
      lastActiveAt: org.createdAt,
    },
  ];
  state.invitationsByOrg[org.id] = [];
  state.activityByOrg[org.id] = [];
  pushActivity(state, org.id, {
    action: "org_created",
    actorEmail: state.currentUserEmail,
    detail: `Organization "${org.name}" created`,
  });
  writeState(state);
  setActiveOrganizationId(org.id);
  return org;
}

export function updateOrganization(
  id: string,
  input: Partial<Pick<Organization, "name" | "billingContact" | "dataRegion">>,
): Organization {
  const state = readState();
  const org = state.organizations.find((item) => item.id === id);
  if (!org) throw new Error("Organization not found");
  if (input.name !== undefined) org.name = input.name.trim();
  if (input.billingContact !== undefined) {
    org.billingContact = input.billingContact.trim();
  }
  if (input.dataRegion !== undefined) org.dataRegion = input.dataRegion;
  pushActivity(state, id, {
    action: "settings_updated",
    actorEmail: state.currentUserEmail,
    detail: "Organization settings updated",
  });
  writeState(state);
  return { ...org };
}

export function inviteTeamMember(
  organizationId: string,
  email: string,
  role: OrgRole,
): { success: boolean; invitationId: string; message: string } {
  if (role === "owner") {
    throw new Error("Cannot invite a second owner. Transfer ownership first.");
  }
  const state = readState();
  const normalized = email.trim().toLowerCase();
  const members = state.membersByOrg[organizationId] ?? [];
  if (members.some((m) => m.email.toLowerCase() === normalized)) {
    throw new Error("User is already a member of this organization.");
  }
  const invites = state.invitationsByOrg[organizationId] ?? [];
  if (
    invites.some(
      (inv) => inv.email.toLowerCase() === normalized && inv.status === "pending",
    )
  ) {
    throw new Error("A pending invitation already exists for this email.");
  }
  const invitation: TeamInvitation = {
    id: createId("inv"),
    email: normalized,
    role,
    invitedAt: new Date().toISOString(),
    expiresAt: daysFromNow(7),
    status: "pending",
  };
  state.invitationsByOrg[organizationId] = [invitation, ...invites];
  pushActivity(state, organizationId, {
    action: "invite_sent",
    actorEmail: state.currentUserEmail,
    targetEmail: normalized,
    detail: `Invited ${normalized} as ${role}`,
  });
  writeState(state);
  return {
    success: true,
    invitationId: invitation.id,
    message: `Invitation sent to ${normalized}`,
  };
}

export function updateTeamMemberRole(
  organizationId: string,
  memberId: string,
  role: OrgRole,
): TeamMember {
  const state = readState();
  const members = state.membersByOrg[organizationId] ?? [];
  const member = members.find((item) => item.id === memberId);
  if (!member) throw new Error("Member not found");
  if (member.role === "owner") {
    throw new Error("Owner role cannot be changed. Transfer ownership first.");
  }
  if (role === "owner") {
    throw new Error("Use ownership transfer to promote an owner.");
  }
  const previous = member.role;
  member.role = role;
  pushActivity(state, organizationId, {
    action: "role_changed",
    actorEmail: state.currentUserEmail,
    targetEmail: member.email,
    detail: `Changed ${member.email} from ${previous} to ${role}`,
  });
  writeState(state);
  return { ...member };
}

export function removeTeamMember(
  organizationId: string,
  memberId: string,
): boolean {
  const state = readState();
  const members = state.membersByOrg[organizationId] ?? [];
  const member = members.find((item) => item.id === memberId);
  if (!member) throw new Error("Member not found");
  if (member.role === "owner") {
    throw new Error("Owner cannot be removed. Transfer ownership first.");
  }
  state.membersByOrg[organizationId] = members.filter((item) => item.id !== memberId);
  pushActivity(state, organizationId, {
    action: "member_removed",
    actorEmail: state.currentUserEmail,
    targetEmail: member.email,
    detail: `Removed ${member.email}`,
  });
  writeState(state);
  return true;
}

export function resendInvitation(
  organizationId: string,
  invitationId: string,
): TeamInvitation {
  const state = readState();
  const invites = state.invitationsByOrg[organizationId] ?? [];
  const invitation = invites.find((item) => item.id === invitationId);
  if (!invitation) throw new Error("Invitation not found");
  invitation.invitedAt = new Date().toISOString();
  invitation.expiresAt = daysFromNow(7);
  invitation.status = "pending";
  pushActivity(state, organizationId, {
    action: "invite_sent",
    actorEmail: state.currentUserEmail,
    targetEmail: invitation.email,
    detail: `Resent invitation to ${invitation.email}`,
  });
  writeState(state);
  return { ...invitation };
}

export function cancelInvitation(
  organizationId: string,
  invitationId: string,
): boolean {
  const state = readState();
  const invites = state.invitationsByOrg[organizationId] ?? [];
  const invitation = invites.find((item) => item.id === invitationId);
  if (!invitation) throw new Error("Invitation not found");
  invitation.status = "cancelled";
  pushActivity(state, organizationId, {
    action: "invite_cancelled",
    actorEmail: state.currentUserEmail,
    targetEmail: invitation.email,
    detail: `Cancelled invitation for ${invitation.email}`,
  });
  writeState(state);
  return true;
}

export function switchOrganization(organizationId: string): Organization {
  const org = getOrganization(organizationId);
  if (!org) throw new Error("Organization not found");
  setActiveOrganizationId(organizationId);
  return org;
}

/** Test helper — reset to seed data. */
export function __resetOrganizationStoreForTests(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ACTIVE_ORG_KEY);
  writeState(seedState());
  setActiveOrganizationId("org_acme");
}
