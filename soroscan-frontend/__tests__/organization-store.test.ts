import {
  __resetOrganizationStoreForTests,
  cancelInvitation,
  createOrganization,
  getCurrentUserRole,
  inviteTeamMember,
  listInvitations,
  listOrganizations,
  listTeamMembers,
  removeTeamMember,
  updateTeamMemberRole,
} from "@/lib/organization-store";
import { canManageMembers } from "@/lib/organization";

describe("organization store (#913)", () => {
  beforeEach(() => {
    localStorage.clear();
    __resetOrganizationStoreForTests();
  });

  it("seeds multiple organizations for the switcher", () => {
    expect(listOrganizations().length).toBeGreaterThanOrEqual(2);
  });

  it("invites a member and records a pending invitation", () => {
    const result = inviteTeamMember("org_acme", "new@acme.dev", "viewer");
    expect(result.success).toBe(true);
    const invites = listInvitations("org_acme");
    expect(invites.some((inv) => inv.email === "new@acme.dev")).toBe(true);
  });

  it("updates member roles without requiring a reload", () => {
    const members = listTeamMembers("org_acme");
    const operator = members.find((m) => m.role === "operator");
    expect(operator).toBeTruthy();
    const updated = updateTeamMemberRole("org_acme", operator!.id, "viewer");
    expect(updated.role).toBe("viewer");
    expect(
      listTeamMembers("org_acme").find((m) => m.id === operator!.id)?.role,
    ).toBe("viewer");
  });

  it("prevents removing the owner", () => {
    const owner = listTeamMembers("org_acme").find((m) => m.role === "owner");
    expect(() => removeTeamMember("org_acme", owner!.id)).toThrow(/owner/i);
  });

  it("cancels invitations", () => {
    const pending = listInvitations("org_acme").find(
      (inv) => inv.status === "pending",
    );
    expect(pending).toBeTruthy();
    expect(cancelInvitation("org_acme", pending!.id)).toBe(true);
    expect(
      listInvitations("org_acme").find((inv) => inv.id === pending!.id)?.status,
    ).toBe("cancelled");
  });

  it("creates a new organization with the current user as owner", () => {
    const org = createOrganization({
      name: "Orbit Collective",
      billingContact: "finance@orbit.dev",
      dataRegion: "ap-southeast",
    });
    expect(org.name).toBe("Orbit Collective");
    expect(getCurrentUserRole(org.id)).toBe("owner");
    expect(canManageMembers(getCurrentUserRole(org.id))).toBe(true);
  });
});
