/**
 * Organization & team management types and RBAC helpers (#913).
 */

export type OrgRole = "owner" | "admin" | "operator" | "viewer";

export type DataRegion = "us-east" | "eu-west" | "ap-southeast";

export interface Organization {
  id: string;
  name: string;
  billingContact: string;
  dataRegion: DataRegion;
  createdAt: string;
  contractCount: number;
  webhookLimit: number;
}

export interface TeamMember {
  id: string;
  email: string;
  role: OrgRole;
  joinedAt: string;
  lastActiveAt: string | null;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: OrgRole;
  invitedAt: string;
  expiresAt: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
}

export interface OrgActivityEntry {
  id: string;
  action: "member_added" | "member_removed" | "role_changed" | "invite_sent" | "invite_cancelled" | "org_created" | "settings_updated";
  actorEmail: string;
  targetEmail?: string;
  detail: string;
  timestamp: string;
}

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  owner: "Owner",
  admin: "Admin",
  operator: "Operator",
  viewer: "Viewer",
};

export const DATA_REGION_LABELS: Record<DataRegion, string> = {
  "us-east": "US East (N. Virginia)",
  "eu-west": "EU West (Ireland)",
  "ap-southeast": "Asia Pacific (Singapore)",
};

/** Permission matrix shown in RolePermissionMatrix. */
export const ROLE_PERMISSIONS: Array<{
  capability: string;
  owner: boolean;
  admin: boolean;
  operator: boolean;
  viewer: boolean;
}> = [
  { capability: "Manage organization settings", owner: true, admin: true, operator: false, viewer: false },
  { capability: "Invite / remove members", owner: true, admin: true, operator: false, viewer: false },
  { capability: "Change member roles", owner: true, admin: true, operator: false, viewer: false },
  { capability: "Manage contracts & webhooks", owner: true, admin: true, operator: true, viewer: false },
  { capability: "View events & dashboards", owner: true, admin: true, operator: true, viewer: true },
  { capability: "Transfer ownership", owner: true, admin: false, operator: false, viewer: false },
];

export function canManageMembers(role: OrgRole | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export function canEditOrgSettings(role: OrgRole | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

export function invitationDaysRemaining(expiresAt: string, now = Date.now()): number {
  const ms = new Date(expiresAt).getTime() - now;
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function isInvitationExpired(expiresAt: string, now = Date.now()): boolean {
  return new Date(expiresAt).getTime() <= now;
}
