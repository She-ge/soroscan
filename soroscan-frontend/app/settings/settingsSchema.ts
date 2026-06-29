/**
 * Zod schema for org settings JSON export/import.
 *
 * All fields are optional so a partial export can still be imported
 * without wiping unrelated settings. Unknown keys are stripped (strict
 * mode) to prevent injection of arbitrary data into localStorage.
 */
import { z } from "zod";

// ── Sub-schemas ────────────────────────────────────────────────────────────

export const ThemeSchema = z.enum(["dark", "light"]);

export const DisplaySettingsSchema = z.object({
  rowsPerPage: z.number().int().min(1).max(500).optional(),
  fontSize: z.enum(["xs", "sm", "base", "lg"]).optional(),
});

export const NotificationPrefsSchema = z.object({
  email: z.boolean().optional(),
  inApp: z.boolean().optional(),
  webhook: z.boolean().optional(),
  webhookUrl: z.string().url({ message: "webhookUrl must be a valid URL" }).or(z.literal("")).optional(),
});

export const APIKeySchema = z.object({
  id: z.string(),
  key: z.string().min(1),
  createdAt: z.string(),
});

// ── Root export schema ─────────────────────────────────────────────────────

export const OrgSettingsSchema = z.object({
  /** Schema version — bump when breaking changes are introduced */
  version: z.literal(1),
  exportedAt: z.string().datetime({ message: "exportedAt must be an ISO-8601 datetime" }),
  theme: ThemeSchema.optional(),
  display: DisplaySettingsSchema.optional(),
  notifications: NotificationPrefsSchema.optional(),
  /**
   * API keys are exported for portability but are intentionally
   * excluded from import by default (see useOrgSettings) because
   * they are security-sensitive. The UI exposes an opt-in toggle.
   */
  apiKeys: z.array(APIKeySchema).optional(),
});

export type OrgSettings = z.infer<typeof OrgSettingsSchema>;
export type DisplaySettings = z.infer<typeof DisplaySettingsSchema>;
export type NotificationPrefs = z.infer<typeof NotificationPrefsSchema>;
export type APIKey = z.infer<typeof APIKeySchema>;
