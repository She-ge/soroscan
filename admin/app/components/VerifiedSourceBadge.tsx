'use client';

/**
 * VerifiedSourceBadge
 * ─────────────────────────────────────────────────────────────────────────────
 * Displays a gold/obsidian checkmark badge when a contract's source code has
 * been verified. Hovering reveals a tooltip with compiler details; clicking
 * navigates to (or toggles) the verified source view.
 *
 * Acceptance criteria:
 *  1. Gold/obsidian badge shown only when isVerified === true.
 *  2. Hover → tooltip with "Contract source code verified via compiler vX.X.X".
 *  3. Click → calls onViewSource (navigate / toggle source view).
 *  4. Fully accessible: keyboard-focusable, ARIA roles, screen-reader text.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VerificationDetails {
  /** Compiler version string, e.g. "0.21.3" */
  compilerVersion?: string;
  /** ISO timestamp when verification was completed */
  verifiedAt?: string;
  /** SHA-256 hash of the deployed bytecode */
  bytecodeHash?: string;
}

export interface VerifiedSourceBadgeProps {
  /** Whether the contract source is verified */
  isVerified: boolean;
  /** Verification metadata shown in the tooltip */
  verificationDetails?: VerificationDetails;
  /** Called when the badge is clicked */
  onViewSource?: () => void;
  /** Additional CSS classes on the root element */
  className?: string;
  /** Tooltip delay in ms (default 300) */
  tooltipDelay?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatVerifiedAt(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function buildTooltipText(details?: VerificationDetails): string {
  if (!details) return 'Contract source code verified';

  const parts: string[] = ['Contract source code verified'];

  if (details.compilerVersion) {
    parts.push(`via compiler v${details.compilerVersion}`);
  }
  if (details.verifiedAt) {
    parts.push(`on ${formatVerifiedAt(details.verifiedAt)}`);
  }

  return parts.join(' ');
}

// ─── Checkmark SVG ────────────────────────────────────────────────────────────

const CheckmarkIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 14 14"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <circle cx="7" cy="7" r="6.25" fill="#1a1a2e" stroke="#c9a227" strokeWidth="1.5" />
    <path
      d="M4 7.2l2 2 4-4"
      stroke="#c9a227"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface BadgeTooltipProps {
  content: React.ReactNode;
  visible: boolean;
  anchorRef: React.RefObject<HTMLElement | null>;
}

const BadgeTooltip: React.FC<BadgeTooltipProps> = ({ content, visible, anchorRef }) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: 'hidden' });

  useEffect(() => {
    if (!visible || !anchorRef.current || !tooltipRef.current) return;

    const anchor = anchorRef.current.getBoundingClientRect();
    const tip = tooltipRef.current.getBoundingClientRect();
    const vw = window.innerWidth;

    let left = anchor.left + anchor.width / 2 - tip.width / 2;
    // Clamp to viewport
    left = Math.max(8, Math.min(left, vw - tip.width - 8));

    const top = anchor.top - tip.height - 8;

    setStyle({
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      zIndex: 9999,
      visibility: 'visible',
    });
  }, [visible, anchorRef]);

  if (!visible) return null;

  return (
    <div
      ref={tooltipRef}
      role="tooltip"
      style={style}
      className="
        max-w-xs px-3 py-2 rounded-lg shadow-lg pointer-events-none
        bg-[#1a1a2e] border border-[#c9a227]/60
        text-[#c9a227] text-xs font-medium leading-snug
        animate-fade-in
      "
    >
      {content}
      {/* Arrow */}
      <span
        aria-hidden="true"
        className="
          absolute left-1/2 -translate-x-1/2 top-full
          border-4 border-transparent border-t-[#c9a227]/60
        "
      />
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const VerifiedSourceBadge: React.FC<VerifiedSourceBadgeProps> = ({
  isVerified,
  verificationDetails,
  onViewSource,
  className = '',
  tooltipDelay = 300,
}) => {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showTooltip = useCallback(() => {
    timerRef.current = setTimeout(() => setTooltipVisible(true), tooltipDelay);
  }, [tooltipDelay]);

  const hideTooltip = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTooltipVisible(false);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  if (!isVerified) return null;

  const tooltipText = buildTooltipText(verificationDetails);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        data-testid="verified-source-badge"
        aria-label="Verified source — click to view"
        aria-describedby="verified-badge-tooltip"
        onClick={onViewSource}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className={`
          inline-flex items-center gap-1.5
          px-2 py-0.5 rounded-full
          bg-[#1a1a2e] border border-[#c9a227]/70
          text-[#c9a227] text-xs font-semibold
          cursor-pointer select-none
          transition-all duration-150
          hover:bg-[#c9a227]/10 hover:border-[#c9a227]
          hover:shadow-[0_0_8px_rgba(201,162,39,0.4)]
          focus-visible:outline-none
          focus-visible:ring-2 focus-visible:ring-[#c9a227] focus-visible:ring-offset-1
          focus-visible:ring-offset-[#1a1a2e]
          ${className}
        `.trim().replace(/\s+/g, ' ')}
      >
        <CheckmarkIcon size={14} />
        <span>Verified</span>
        {/* Screen-reader-only extended description */}
        <span className="sr-only">. {tooltipText}</span>
      </button>

      <BadgeTooltip
        content={
          <div id="verified-badge-tooltip">
            <p className="font-semibold mb-1">✓ Source Verified</p>
            <p className="text-[#c9a227]/80">
              {verificationDetails?.compilerVersion
                ? `Compiler v${verificationDetails.compilerVersion}`
                : 'Compiler version unknown'}
            </p>
            {verificationDetails?.verifiedAt && (
              <p className="text-[#c9a227]/60 mt-0.5">
                {formatVerifiedAt(verificationDetails.verifiedAt)}
              </p>
            )}
            {verificationDetails?.bytecodeHash && (
              <p className="text-[#c9a227]/50 mt-1 font-mono text-[10px] truncate max-w-[200px]">
                {verificationDetails.bytecodeHash.slice(0, 16)}…
              </p>
            )}
            <p className="text-[#c9a227]/50 mt-1 text-[10px]">Click to view source</p>
          </div>
        }
        visible={tooltipVisible}
        anchorRef={anchorRef}
      />
    </>
  );
};

export default VerifiedSourceBadge;
