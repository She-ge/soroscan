"use client";

/**
 * OrgSettingsExportImport
 *
 * Provides a terminal-styled panel for exporting the current org settings
 * to a JSON file and importing settings from a previously exported file.
 *
 * Export:
 *   - Collects theme, display, notification, and (optionally) API key
 *     settings from localStorage.
 *   - Triggers a browser download of a timestamped JSON file.
 *
 * Import:
 *   - Accepts a .json file via drag-and-drop or file picker.
 *   - Validates the file against the OrgSettingsSchema (Zod).
 *   - Shows a preview of what will be applied before committing.
 *   - Applies changes atomically; rolls back on any error.
 *   - API keys are opt-in (security-sensitive).
 */

import { useRef, useState, useCallback, DragEvent, ChangeEvent } from "react";
import { useOrgSettings, type ImportResult } from "../useOrgSettings";

// ── Types ──────────────────────────────────────────────────────────────────

type Phase =
  | { kind: "idle" }
  | { kind: "preview"; raw: unknown; fileName: string }
  | { kind: "success"; result: ImportResult }
  | { kind: "error"; errors: string[] };

// ── Component ──────────────────────────────────────────────────────────────

export default function OrgSettingsExportImport() {
  const { downloadSettings, importSettings, parseSettingsFile } =
    useOrgSettings();

  // Export options
  const [includeApiKeys, setIncludeApiKeys] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  // Import options
  const [importApiKeys, setImportApiKeys] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Export ─────────────────────────────────────────────────────────────

  const handleExport = () => {
    downloadSettings({ includeApiKeys });
    setExportDone(true);
    setTimeout(() => setExportDone(false), 2500);
  };

  // ── File ingestion ─────────────────────────────────────────────────────

  const ingestFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".json")) {
        setPhase({ kind: "error", errors: ["Only .json files are accepted."] });
        return;
      }
      try {
        const raw = await parseSettingsFile(file);
        setPhase({ kind: "preview", raw, fileName: file.name });
      } catch (err) {
        setPhase({
          kind: "error",
          errors: [err instanceof Error ? err.message : "Unknown error reading file."],
        });
      }
    },
    [parseSettingsFile],
  );

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) ingestFile(file);
    // Reset input so the same file can be re-selected after an error
    e.target.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) ingestFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  // ── Import confirm ─────────────────────────────────────────────────────

  const handleConfirmImport = () => {
    if (phase.kind !== "preview") return;
    const result = importSettings(phase.raw, { importApiKeys });
    if (result.success) {
      setPhase({ kind: "success", result });
      // Reload the page after a short delay so all components pick up the
      // new localStorage values without requiring manual refresh.
      setTimeout(() => window.location.reload(), 1800);
    } else {
      setPhase({ kind: "error", errors: result.errors });
    }
  };

  const handleReset = () => {
    setPhase({ kind: "idle" });
    setImportApiKeys(false);
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="border border-green-500/30 rounded p-4 mb-4">
      <h2 className="text-green-400 font-mono text-sm mb-1">
        [ SETTINGS IMPORT / EXPORT ]
      </h2>
      <p className="text-green-700 font-mono text-xs mb-4">
        Back up your preferences or migrate them to another device.
      </p>

      {/* ── Export section ─────────────────────────────────────────────── */}
      <div className="mb-5">
        <h3 className="text-green-500 font-mono text-xs mb-2 uppercase tracking-widest">
          Export
        </h3>

        <label className="flex items-center gap-2 mb-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeApiKeys}
            onChange={(e) => setIncludeApiKeys(e.target.checked)}
            className="accent-green-400"
            aria-label="Include API keys in export"
          />
          <span className="font-mono text-xs text-green-400">
            Include API keys{" "}
            <span className="text-green-700">(security-sensitive)</span>
          </span>
        </label>

        <button
          onClick={handleExport}
          className="w-full py-2 border border-green-500/30 rounded font-mono text-sm text-green-400 hover:border-green-400 hover:bg-green-400/10 transition-colors"
          aria-label="Export settings as JSON"
        >
          {exportDone ? "✓ DOWNLOADED" : "↓ EXPORT SETTINGS AS JSON"}
        </button>
      </div>

      {/* ── Divider ────────────────────────────────────────────────────── */}
      <div className="border-t border-green-500/20 mb-5" />

      {/* ── Import section ─────────────────────────────────────────────── */}
      <div>
        <h3 className="text-green-500 font-mono text-xs mb-2 uppercase tracking-widest">
          Import
        </h3>

        {/* Idle / drop zone */}
        {phase.kind === "idle" && (
          <>
            <div
              role="button"
              tabIndex={0}
              aria-label="Drop zone for settings JSON file"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
              className={`border-2 border-dashed rounded p-6 text-center cursor-pointer transition-colors mb-3 ${
                isDragging
                  ? "border-green-400 bg-green-400/10"
                  : "border-green-500/30 hover:border-green-400/60"
              }`}
            >
              <p className="font-mono text-xs text-green-500">
                {isDragging
                  ? "Drop to load settings file"
                  : "Drag & drop a settings .json file here, or click to browse"}
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
              aria-hidden="true"
            />
          </>
        )}

        {/* Preview — show what will be applied */}
        {phase.kind === "preview" && (
          <div className="space-y-3">
            <div className="border border-green-500/30 rounded p-3 bg-green-400/5">
              <p className="font-mono text-xs text-green-500 mb-1">
                File: <span className="text-green-300">{phase.fileName}</span>
              </p>
              <p className="font-mono text-xs text-green-600">
                Validate passed. Review the JSON below before applying.
              </p>
            </div>

            {/* Scrollable JSON preview */}
            <pre className="border border-green-500/20 rounded p-3 font-mono text-xs text-green-400 bg-black/30 overflow-auto max-h-48 whitespace-pre-wrap break-all">
              {JSON.stringify(phase.raw, null, 2)}
            </pre>

            {/* API key opt-in */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={importApiKeys}
                onChange={(e) => setImportApiKeys(e.target.checked)}
                className="accent-green-400"
                aria-label="Also import API keys from file"
              />
              <span className="font-mono text-xs text-green-400">
                Also import API keys{" "}
                <span className="text-green-700">(opt-in — replaces existing keys)</span>
              </span>
            </label>

            <div className="flex gap-2">
              <button
                onClick={handleConfirmImport}
                className="flex-1 py-2 border border-green-400 rounded font-mono text-sm text-green-400 hover:bg-green-400/10 transition-colors"
                aria-label="Confirm and apply imported settings"
              >
                ✓ APPLY SETTINGS
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-2 border border-green-500/30 rounded font-mono text-sm text-green-600 hover:border-green-500 hover:text-green-400 transition-colors"
                aria-label="Cancel import"
              >
                ✕ CANCEL
              </button>
            </div>
          </div>
        )}

        {/* Success */}
        {phase.kind === "success" && (
          <div className="border border-green-400/40 rounded p-3 bg-green-400/5 space-y-1">
            <p className="font-mono text-xs text-green-400 font-bold">
              ✓ Settings applied successfully
            </p>
            {phase.result.applied.map((item) => (
              <p key={item} className="font-mono text-xs text-green-600">
                • {item}
              </p>
            ))}
            <p className="font-mono text-xs text-green-700 mt-2">
              Reloading page to apply changes…
            </p>
          </div>
        )}

        {/* Error */}
        {phase.kind === "error" && (
          <div className="border border-red-500/40 rounded p-3 bg-red-500/5 space-y-1">
            <p className="font-mono text-xs text-red-400 font-bold mb-1">
              ✕ Import failed — no changes were applied
            </p>
            {phase.errors.map((err, i) => (
              <p key={i} className="font-mono text-xs text-red-500">
                • {err}
              </p>
            ))}
            <button
              onClick={handleReset}
              className="mt-2 w-full py-1.5 border border-red-500/30 rounded font-mono text-xs text-red-400 hover:border-red-400 hover:bg-red-400/10 transition-colors"
              aria-label="Dismiss error and try again"
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
