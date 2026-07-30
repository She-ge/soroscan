'use client';

/**
 * Pagination — FE-151
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable terminal-styled pagination component for the SoroScan admin panel.
 *
 * Supports two modes:
 *  - Cursor-based: provide nextCursor / previousCursor (opaque strings)
 *  - Page-based:   provide currentPage / totalPages
 *
 * Cursor mode takes priority when both sets of props are supplied.
 *
 * Terminal aesthetic: zinc palette, font-mono, uppercase "< PREV" / "NEXT >"
 * buttons, clear disabled/enabled visual states.
 */

import React, { useEffect } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PaginationProps {
  // ── Page-based ──────────────────────────────────────────────────────────
  /** Current page number (1-indexed). Used in page-based mode. */
  currentPage?: number;
  /** Total number of pages. Used in page-based mode. */
  totalPages?: number;

  // ── Cursor-based ────────────────────────────────────────────────────────
  /** Opaque cursor for the next page. Presence enables the next button. */
  nextCursor?: string | null;
  /** Opaque cursor for the previous page. Presence enables the prev button. */
  previousCursor?: string | null;

  // ── Shared ──────────────────────────────────────────────────────────────
  /** Total number of items in the dataset (for "Showing X–Y of Z" display). */
  totalItems?: number;
  /** Items displayed per page (for "Showing X–Y of Z" display). */
  itemsPerPage?: number;

  /** Called when the next button is clicked (and enabled). */
  onNext?: () => void;
  /** Called when the previous button is clicked (and enabled). */
  onPrevious?: () => void;

  /** Additional CSS classes on the root container. */
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns the "Showing X–Y of Z" range string.
 * Returns null when required values are missing or zero.
 */
function buildRangeLabel(
  currentPage: number | undefined,
  itemsPerPage: number | undefined,
  totalItems: number | undefined,
  isCursorMode: boolean,
): string | null {
  if (isCursorMode) {
    // In cursor mode we don't reliably know the current offset, so
    // just show the total item count when available.
    if (!totalItems) return null;
    return `${totalItems.toLocaleString()} items`;
  }

  if (!totalItems || !itemsPerPage || itemsPerPage === 0) return null;

  if (currentPage === undefined) return null;

  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);
  return `Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${totalItems.toLocaleString()}`;
}

// ─── Sub-component: NavButton ─────────────────────────────────────────────────

interface NavButtonProps {
  label: string;
  direction: 'prev' | 'next';
  disabled: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ label, direction, disabled, onClick }) => {
  const baseClasses = [
    'inline-flex items-center gap-1',
    'px-3 py-2',
    'font-mono text-xs uppercase tracking-wider',
    'border rounded',
    'transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950',
  ].join(' ');

  const enabledClasses =
    'border-zinc-600 text-zinc-200 hover:border-zinc-400 hover:text-zinc-100 bg-zinc-900 hover:bg-zinc-800 cursor-pointer';

  const disabledClasses =
    'border-zinc-700/50 text-zinc-500/50 bg-zinc-900 cursor-not-allowed pointer-events-none select-none';

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={direction === 'prev' ? 'Go to previous page' : 'Go to next page'}
      aria-disabled={disabled}
      data-testid={direction === 'prev' ? 'pagination-prev' : 'pagination-next'}
      className={`${baseClasses} ${disabled ? disabledClasses : enabledClasses}`}
    >
      {direction === 'prev' && (
        <span aria-hidden="true">{'<'}</span>
      )}
      <span>{label}</span>
      {direction === 'next' && (
        <span aria-hidden="true">{'>'}</span>
      )}
    </button>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  nextCursor,
  previousCursor,
  totalItems,
  itemsPerPage,
  onNext,
  onPrevious,
  className = '',
}) => {
  // ── Determine mode ──────────────────────────────────────────────────────
  // Cursor mode takes priority (Req 8.2)
  const isCursorMode =
    nextCursor !== undefined || previousCursor !== undefined;

  // ── Validation warnings (Req 8.1, 8.4) ─────────────────────────────────
  useEffect(() => {
    if (!isCursorMode && currentPage !== undefined && totalPages !== undefined) {
      if (currentPage < 1 || currentPage > totalPages) {
        console.warn(
          `[Pagination] currentPage (${currentPage}) is out of range [1, ${totalPages}].`,
        );
      }
    }
    if (itemsPerPage === 0) {
      console.warn('[Pagination] itemsPerPage is 0 — cannot compute item range.');
    }
  }, [isCursorMode, currentPage, totalPages, itemsPerPage]);

  // ── Derive enabled states ────────────────────────────────────────────────
  let prevEnabled: boolean;
  let nextEnabled: boolean;

  if (isCursorMode) {
    prevEnabled = Boolean(previousCursor);
    nextEnabled = Boolean(nextCursor);
  } else {
    // Page mode — or no props at all (Req 8.3 → fully disabled)
    if (currentPage === undefined || totalPages === undefined) {
      prevEnabled = false;
      nextEnabled = false;
    } else {
      prevEnabled = currentPage > 1;
      nextEnabled = currentPage < totalPages;
    }
  }

  // ── Info label ───────────────────────────────────────────────────────────
  let infoLabel: string | null = null;

  if (isCursorMode) {
    infoLabel = buildRangeLabel(currentPage, itemsPerPage, totalItems, true);
  } else if (currentPage !== undefined && totalPages !== undefined) {
    // "Page X of Y" (Req 3.2)
    infoLabel = `PAGE ${currentPage} OF ${totalPages}`;

    // Override with item range when available (Req 1.3)
    const rangeLabel = buildRangeLabel(currentPage, itemsPerPage, totalItems, false);
    if (rangeLabel) {
      infoLabel = rangeLabel.toUpperCase();
    }
  }

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handlePrev = () => {
    if (prevEnabled && onPrevious) onPrevious();
  };

  const handleNext = () => {
    if (nextEnabled && onNext) onNext();
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      data-testid="pagination"
      className={`
        flex items-center justify-between gap-4
        px-4 py-3
        bg-zinc-900 border border-zinc-800 rounded-lg
        font-mono
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {/* Previous button */}
      <NavButton
        label="PREV"
        direction="prev"
        disabled={!prevEnabled}
        onClick={handlePrev}
      />

      {/* Centre info */}
      <div
        className="flex-1 text-center text-xs font-mono text-zinc-400 uppercase tracking-wider select-none"
        aria-live="polite"
        aria-atomic="true"
        data-testid="pagination-info"
      >
        {infoLabel ?? '—'}
      </div>

      {/* Next button */}
      <NavButton
        label="NEXT"
        direction="next"
        disabled={!nextEnabled}
        onClick={handleNext}
      />
    </nav>
  );
};

export default Pagination;
