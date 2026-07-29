import {
  auditColorPairs,
  contrastRatio,
  meetsFocusContrast,
  meetsWcagAa,
} from "@/lib/contrast";
import { colors, contrastRatios } from "@/lib/design-tokens";
import { durations, easings, GPU_SAFE_PROPERTIES } from "@/lib/animations";
import {
  canManageMembers,
  invitationDaysRemaining,
  isInvitationExpired,
} from "@/lib/organization";

describe("design tokens (#909)", () => {
  it("exposes spacing-aligned semantic colors", () => {
    expect(colors.green).toBe("#00ff41");
    expect(colors.gray).toBe("#94a3b8");
    expect(colors.info).toBe("#38bdf8");
  });

  it("documents contrast ratios for primary pairs", () => {
    expect(contrastRatios.gray).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatios.grayMuted).toBeLessThan(4.5);
  });
});

describe("animation tokens (#911)", () => {
  it("defines the timing scale", () => {
    expect(durations.fast).toBe(100);
    expect(durations.normal).toBe(300);
    expect(durations.slow).toBe(500);
  });

  it("defines easing functions and GPU-safe properties", () => {
    expect(easings.elastic).toContain("cubic-bezier");
    expect(GPU_SAFE_PROPERTIES).toEqual(
      expect.arrayContaining(["transform", "opacity"]),
    );
  });
});

describe("contrast audit (#912)", () => {
  const bg = colors.black;

  it("passes AA for refined muted gray on terminal black", () => {
    const ratio = contrastRatio(colors.gray, bg);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(meetsWcagAa(colors.gray, bg)).toBe(true);
  });

  it("fails AA for legacy muted gray (kept for decorative use only)", () => {
    expect(meetsWcagAa(colors.grayMuted, bg)).toBe(false);
  });

  it("ensures focus ring meets 3:1 against adjacent dark surface", () => {
    expect(meetsFocusContrast(colors.green, colors.dark)).toBe(true);
  });

  it("audits the documented palette pairs", () => {
    const rows = auditColorPairs([
      { name: "green", foreground: colors.green, background: bg },
      { name: "cyan", foreground: colors.cyan, background: bg },
      { name: "danger", foreground: colors.danger, background: bg },
      { name: "gray", foreground: colors.gray, background: bg },
    ]);
    expect(rows.every((row) => row.aa)).toBe(true);
  });
});

describe("organization RBAC helpers (#913)", () => {
  it("restricts member management to owner/admin", () => {
    expect(canManageMembers("owner")).toBe(true);
    expect(canManageMembers("admin")).toBe(true);
    expect(canManageMembers("operator")).toBe(false);
    expect(canManageMembers("viewer")).toBe(false);
  });

  it("computes invitation countdown and expiry", () => {
    const now = Date.parse("2026-07-27T00:00:00.000Z");
    const expires = "2026-07-30T00:00:00.000Z";
    expect(invitationDaysRemaining(expires, now)).toBe(3);
    expect(isInvitationExpired(expires, now)).toBe(false);
    expect(isInvitationExpired("2026-07-26T00:00:00.000Z", now)).toBe(true);
  });
});
