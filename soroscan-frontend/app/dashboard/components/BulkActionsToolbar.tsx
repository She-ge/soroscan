"use client";

/**
 * BulkActionsToolbar.tsx
 *
 * Floating/sticky toolbar that slides into view when one or more events
 * are selected in the EventTable. Provides Export, Resend, Tag and Delete
 * bulk actions with progress tracking and confirmation modals.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { EventRecord } from "@/components/ingest/types";
import {
  exportEvents,
  resendWebhooks,
  tagEvents,
  deleteEvents,
  type BatchProgress,
  type BatchResult,
} from "@/lib/batchService";
import { ConfirmationModal } from "./ConfirmationModal";
import styles from "@/components/ingest/ingest-terminal.module.css";
import toolbarStyles from "./BulkActionsToolbar.module.css";

interface BulkActionsToolbarProps {
  selectedIds: Set<string>;
  allEvents: EventRecord[];
  onClearSelection: () => void;
  onSelectAll: () => void;
  /** Called with the IDs that were successfully deleted so the parent can remove them from state. */
  onDeleteSuccess: (deletedIds: string[]) => void;
  /** Called when bulk-tag succeeds so the parent can update the local tag map. */
  onBulkTagSuccess: (eventIds: string[], tag: string) => void;
  tagSuggestions: string[];
}

type ActiveAction = "resend" | "tag" | "delete" | null;

export function BulkActionsToolbar({
  selectedIds,
  allEvents,
  onClearSelection,
  onSelectAll,
  onDeleteSuccess,
  onBulkTagSuccess,
  tagSuggestions,
}: BulkActionsToolbarProps) {
  const count = selectedIds.size;
  const visible = count > 0;

  // Modal / progress state
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [result, setResult] = useState<BatchResult | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Focus tag input when tag action is triggered
  useEffect(() => {
    if (activeAction === "tag" && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [activeAction]);

  const selectedEvents = allEvents.filter((e) => selectedIds.has(e.id));
  const selectedIdsArray = Array.from(selectedIds);

  // ---- Export ---------------------------------------------------------------
  const handleExportCSV = useCallback(() => {
    exportEvents(selectedEvents, "csv");
  }, [selectedEvents]);

  const handleExportJSON = useCallback(() => {
    exportEvents(selectedEvents, "json");
  }, [selectedEvents]);

  // ---- Resend ---------------------------------------------------------------
  const handleResendConfirm = useCallback(async () => {
    setIsRunning(true);
    setProgress({ total: selectedIdsArray.length, completed: 0, failed: 0, percent: 0 });

    const batchResult = await resendWebhooks(selectedIdsArray, (p) => setProgress(p));

    setResult(batchResult);
    setIsRunning(false);
  }, [selectedIdsArray]);

  // ---- Tag ------------------------------------------------------------------
  const handleTagConfirm = useCallback(async () => {
    const tag = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag) return;

    setIsRunning(true);
    setProgress({ total: selectedIdsArray.length, completed: 0, failed: 0, percent: 0 });

    const batchResult = await tagEvents(selectedIdsArray, tag, (p) => setProgress(p));

    // Update parent's local tag map for succeeded IDs
    if (batchResult.succeeded.length) {
      onBulkTagSuccess(batchResult.succeeded, tag);
    }

    setResult(batchResult);
    setIsRunning(false);
  }, [selectedIdsArray, tagInput, onBulkTagSuccess]);

  // ---- Delete ---------------------------------------------------------------
  const handleDeleteConfirm = useCallback(async () => {
    setIsRunning(true);
    setProgress({ total: selectedIdsArray.length, completed: 0, failed: 0, percent: 0 });

    const batchResult = await deleteEvents(selectedIdsArray, (p) => setProgress(p));

    if (batchResult.succeeded.length) {
      onDeleteSuccess(batchResult.succeeded);
    }

    setResult(batchResult);
    setIsRunning(false);
  }, [selectedIdsArray, onDeleteSuccess]);

  // ---- Modal close ----------------------------------------------------------
  const handleModalClose = useCallback(() => {
    if (isRunning) return; // prevent close during operation
    setActiveAction(null);
    setProgress(null);
    setResult(null);
    setTagInput("");
  }, [isRunning]);

  // When operation completes with full success, auto-close modal after a beat
  useEffect(() => {
    if (result && result.failed.length === 0 && !isRunning) {
      const t = setTimeout(() => {
        setActiveAction(null);
        setProgress(null);
        setResult(null);
        setTagInput("");
        if (activeAction === "delete") {
          onClearSelection();
        }
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [result, isRunning, activeAction, onClearSelection]);

  return (
    <>
      {/* ── Floating toolbar ── */}
      <div
        className={`${toolbarStyles.toolbar} ${visible ? toolbarStyles.toolbarVisible : ""}`}
        role="toolbar"
        aria-label={`Bulk actions for ${count} selected event${count !== 1 ? "s" : ""}`}
        aria-hidden={!visible}
      >
        <div className={toolbarStyles.selectionInfo}>
          <span className={toolbarStyles.selectionCount}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {count} selected
          </span>
          <button
            type="button"
            className={toolbarStyles.textBtn}
            onClick={onSelectAll}
            id="bulk-select-all"
          >
            Select all
          </button>
          <button
            type="button"
            className={toolbarStyles.textBtn}
            onClick={onClearSelection}
            id="bulk-clear-selection"
          >
            Deselect all
          </button>
        </div>

        <div className={toolbarStyles.actions}>
          {/* Export group */}
          <div className={toolbarStyles.actionGroup}>
            <button
              type="button"
              className={`${toolbarStyles.actionBtn} ${toolbarStyles.exportBtn}`}
              onClick={handleExportCSV}
              id="bulk-export-csv"
              title="Export selected events as CSV"
            >
              <ExportIcon />
              CSV
            </button>
            <button
              type="button"
              className={`${toolbarStyles.actionBtn} ${toolbarStyles.exportBtn}`}
              onClick={handleExportJSON}
              id="bulk-export-json"
              title="Export selected events as JSON"
            >
              <ExportIcon />
              JSON
            </button>
          </div>

          <div className={toolbarStyles.divider} aria-hidden="true" />

          {/* Resend */}
          <button
            type="button"
            className={`${toolbarStyles.actionBtn} ${toolbarStyles.resendBtn}`}
            onClick={() => setActiveAction("resend")}
            id="bulk-resend"
            title="Resend webhooks for selected events"
          >
            <ResendIcon />
            Resend
          </button>

          {/* Tag */}
          <button
            type="button"
            className={`${toolbarStyles.actionBtn} ${toolbarStyles.tagBtn}`}
            onClick={() => setActiveAction("tag")}
            id="bulk-tag"
            title="Add a tag to selected events"
          >
            <TagIcon />
            Tag
          </button>

          <div className={toolbarStyles.divider} aria-hidden="true" />

          {/* Delete */}
          <button
            type="button"
            className={`${toolbarStyles.actionBtn} ${toolbarStyles.deleteBtn}`}
            onClick={() => setActiveAction("delete")}
            id="bulk-delete"
            title="Delete selected events"
          >
            <DeleteIcon />
            Delete
          </button>
        </div>
      </div>

      {/* ── Resend modal ── */}
      {activeAction === "resend" && (
        <ConfirmationModal
          title="Resend Webhooks"
          message={`Resend webhooks for ${count} selected event${count !== 1 ? "s" : ""}?`}
          confirmLabel={isRunning ? "Sending…" : result ? "Done" : "Resend"}
          confirmVariant="primary"
          onConfirm={result ? handleModalClose : handleResendConfirm}
          onCancel={handleModalClose}
          isRunning={isRunning}
          progress={progress}
          result={result}
        />
      )}

      {/* ── Tag modal ── */}
      {activeAction === "tag" && (
        <ConfirmationModal
          title="Add Tag to Events"
          message={`Add a tag to ${count} selected event${count !== 1 ? "s" : ""}:`}
          confirmLabel={isRunning ? "Tagging…" : result ? "Done" : "Apply Tag"}
          confirmVariant="primary"
          onConfirm={result ? handleModalClose : handleTagConfirm}
          onCancel={handleModalClose}
          isRunning={isRunning}
          progress={progress}
          result={result}
          confirmDisabled={!tagInput.trim() && !result}
        >
          {!result && (
            <div className={toolbarStyles.tagInputWrap}>
              <input
                ref={tagInputRef}
                id="bulk-tag-input"
                type="text"
                className={styles.fieldInput}
                placeholder="e.g. urgent, review-needed"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tagInput.trim() && !isRunning) {
                    handleTagConfirm();
                  }
                }}
                list="bulk-tag-suggestions"
                disabled={isRunning}
              />
              <datalist id="bulk-tag-suggestions">
                {tagSuggestions.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
          )}
        </ConfirmationModal>
      )}

      {/* ── Delete modal ── */}
      {activeAction === "delete" && (
        <ConfirmationModal
          title="Delete Events"
          message={`Permanently delete ${count} selected event${count !== 1 ? "s" : ""}? This action cannot be undone.`}
          confirmLabel={isRunning ? "Deleting…" : result ? "Done" : "Delete"}
          confirmVariant="danger"
          onConfirm={result ? handleModalClose : handleDeleteConfirm}
          onCancel={handleModalClose}
          isRunning={isRunning}
          progress={progress}
          result={result}
        />
      )}
    </>
  );
}

// ── SVG icons (inline, no external dependency) ──────────────────────────────

function ExportIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ResendIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-3.36" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
