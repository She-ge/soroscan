"use client";

/**
 * ConfirmationModal.tsx
 *
 * Reusable modal for confirming bulk operations.
 * Displays a message, an optional slot for extra content (e.g. tag input),
 * a progress bar while the operation runs, and a result summary on completion.
 */

import { useEffect, useRef, type ReactNode } from "react";
import type { BatchProgress, BatchResult } from "@/lib/batchService";
import styles from "@/components/ingest/ingest-terminal.module.css";
import modalStyles from "./ConfirmationModal.module.css";

interface ConfirmationModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: "primary" | "danger";
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isRunning: boolean;
  progress: BatchProgress | null;
  result: BatchResult | null;
  /** Optional extra content rendered between the message and the progress bar */
  children?: ReactNode;
}

export function ConfirmationModal({
  title,
  message,
  confirmLabel,
  confirmVariant = "primary",
  confirmDisabled = false,
  onConfirm,
  onCancel,
  isRunning,
  progress,
  result,
  children,
}: ConfirmationModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isRunning) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isRunning, onCancel]);

  // Trap focus within the modal
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button, input, [tabindex]:not([tabindex="-1"])',
    );
    focusable?.[0]?.focus();
  }, []);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (!isRunning && e.target === overlayRef.current) onCancel();
  };

  const confirmBtnClass =
    confirmVariant === "danger"
      ? `${modalStyles.confirmBtn} ${modalStyles.confirmBtnDanger}`
      : `${modalStyles.confirmBtn} ${modalStyles.confirmBtnPrimary}`;

  return (
    <div
      ref={overlayRef}
      className={modalStyles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={handleOverlayClick}
    >
      <div ref={dialogRef} className={modalStyles.dialog}>
        {/* Header */}
        <div className={modalStyles.header}>
          <h2 id="confirm-modal-title" className={modalStyles.title}>
            {title}
          </h2>
          {!isRunning && (
            <button
              type="button"
              className={modalStyles.closeBtn}
              onClick={onCancel}
              aria-label="Close modal"
            >
              ✕
            </button>
          )}
        </div>

        {/* Body */}
        <div className={modalStyles.body}>
          <p className={modalStyles.message}>{message}</p>

          {/* Slot for additional content (e.g. tag input) */}
          {children}

          {/* Progress bar */}
          {progress && (
            <div className={modalStyles.progressSection} aria-live="polite">
              <div className={modalStyles.progressMeta}>
                <span className={modalStyles.progressLabel}>
                  {result
                    ? "Complete"
                    : `Processing… ${progress.completed} / ${progress.total}`}
                </span>
                <span className={modalStyles.progressPct}>{progress.percent}%</span>
              </div>
              <div
                className={modalStyles.progressTrack}
                role="progressbar"
                aria-valuenow={progress.percent}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={modalStyles.progressFill}
                  style={{ width: `${progress.percent}%` }}
                />
              </div>

              {/* Result summary */}
              {result && (
                <div className={modalStyles.resultSummary}>
                  {result.succeeded.length > 0 && (
                    <span className={modalStyles.successCount}>
                      ✓ {result.succeeded.length} succeeded
                    </span>
                  )}
                  {result.failed.length > 0 && (
                    <span className={modalStyles.failedCount}>
                      ✗ {result.failed.length} failed
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={modalStyles.footer}>
          <button
            type="button"
            className={`${styles.btn} ${styles.secondaryBtn}`}
            onClick={onCancel}
            disabled={isRunning}
            id="confirm-modal-cancel"
          >
            {result ? "Close" : "Cancel"}
          </button>
          <button
            type="button"
            className={confirmBtnClass}
            onClick={onConfirm}
            disabled={isRunning || confirmDisabled}
            id="confirm-modal-confirm"
          >
            {isRunning && (
              <span className={modalStyles.spinner} aria-hidden="true" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
