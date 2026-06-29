"use client";

/**
 * useOrgSettings
 *
 * Collects all organisation settings from localStorage, serialises them
 * to a validated JSON blob for export, and applies an imported blob back
 * to localStorage with full Zod validation and atomic rollback on error.
 */

import { useCallback } from "react";
import { OrgSettingsSchema, type OrgSettings } from "./settingsSchema";

// ── localStorage keys ──────────────────────────────────────────────────────

const KEYS = {
  theme: "theme",
  display: "displayPrefs",
  notifications: "notificationPrefs",
  apiKeys: "apiKeys",
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────

function safeRead<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return undefined;
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

// ── Hook ───────────────────────────────────────────────────────────────────

export interface ExportOptions {
  /** Include API keys in the export (default: true) */
  includeApiKeys?: boolean;
}

export interface ImportOptions {
  /** Apply API keys from the import file (default: false — security opt-in) */
  importApiKeys?: boolean;
}

export interface ImportResult {
  success: boolean;
  /** Human-readable summary of what was applied */
  applied: string[];
  /** Validation or apply errors */
  errors: string[];
}

export function useOrgSettings() {
  // ── Export ───────────────────────────────────────────────────────────────

  const exportSettings = useCallback(
    (options: ExportOptions = {}): OrgSettings => {
      const { includeApiKeys = true } = options;

      const raw: OrgSettings = {
        version: 1,
        exportedAt: new Date().toISOString(),
        theme: (safeRead<string>(KEYS.theme) as "dark" | "light") ?? undefined,
        display: safeRead(KEYS.display),
        notifications: safeRead(KEYS.notifications),
        apiKeys: includeApiKeys ? safeRead(KEYS.apiKeys) : undefined,
      };

      // Validate before handing back — this should never fail for our own data
      // but it catches corruption in localStorage.
      const parsed = OrgSettingsSchema.safeParse(raw);
      if (!parsed.success) {
        // Return a minimal valid export rather than throwing
        return {
          version: 1,
          exportedAt: new Date().toISOString(),
        };
      }
      return parsed.data;
    },
    [],
  );

  // ── Download helper ──────────────────────────────────────────────────────

  const downloadSettings = useCallback(
    (options: ExportOptions = {}) => {
      const settings = exportSettings(options);
      const blob = new Blob([JSON.stringify(settings, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `soroscan-settings-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [exportSettings],
  );

  // ── Import ───────────────────────────────────────────────────────────────

  const importSettings = useCallback(
    (raw: unknown, options: ImportOptions = {}): ImportResult => {
      const { importApiKeys = false } = options;
      const result: ImportResult = { success: false, applied: [], errors: [] };

      // 1. Validate the incoming JSON against the schema
      const parsed = OrgSettingsSchema.safeParse(raw);
      if (!parsed.success) {
        result.errors = parsed.error.issues.map(
          (i) => `${i.path.join(".") || "root"}: ${i.message}`,
        );
        return result;
      }

      const settings = parsed.data;

      // 2. Take a snapshot of current localStorage for rollback
      const snapshot: Record<string, string | null> = {
        [KEYS.theme]: localStorage.getItem(KEYS.theme),
        [KEYS.display]: localStorage.getItem(KEYS.display),
        [KEYS.notifications]: localStorage.getItem(KEYS.notifications),
        [KEYS.apiKeys]: localStorage.getItem(KEYS.apiKeys),
      };

      const rollback = () => {
        for (const [key, value] of Object.entries(snapshot)) {
          if (value === null) {
            localStorage.removeItem(key);
          } else {
            localStorage.setItem(key, value);
          }
        }
      };

      // 3. Apply each section
      try {
        if (settings.theme !== undefined) {
          localStorage.setItem(KEYS.theme, settings.theme);
          result.applied.push(`theme → "${settings.theme}"`);
        }

        if (settings.display !== undefined) {
          localStorage.setItem(KEYS.display, JSON.stringify(settings.display));
          result.applied.push("display preferences");
        }

        if (settings.notifications !== undefined) {
          localStorage.setItem(
            KEYS.notifications,
            JSON.stringify(settings.notifications),
          );
          result.applied.push("notification preferences");
        }

        if (importApiKeys && settings.apiKeys !== undefined) {
          localStorage.setItem(KEYS.apiKeys, JSON.stringify(settings.apiKeys));
          result.applied.push(`${settings.apiKeys.length} API key(s)`);
        }

        result.success = true;
        return result;
      } catch (err) {
        // Something went wrong writing to localStorage — roll back everything
        rollback();
        result.errors.push(
          `Failed to apply settings: ${err instanceof Error ? err.message : String(err)}. All changes have been rolled back.`,
        );
        return result;
      }
    },
    [],
  );

  // ── Parse file helper ────────────────────────────────────────────────────

  const parseSettingsFile = useCallback(
    (file: File): Promise<unknown> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target?.result;
            if (typeof text !== "string") {
              reject(new Error("Could not read file contents."));
              return;
            }
            resolve(JSON.parse(text));
          } catch {
            reject(new Error("File is not valid JSON."));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.readAsText(file);
      }),
    [],
  );

  return { exportSettings, downloadSettings, importSettings, parseSettingsFile };
}
