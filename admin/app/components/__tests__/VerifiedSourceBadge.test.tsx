/**
 * VerifiedSourceBadge — unit tests
 *
 * Covers:
 *  1. Badge renders when isVerified === true
 *  2. Badge does NOT render when isVerified === false
 *  3. Hover state → tooltip appears with correct content
 *  4. Tooltip hides on mouse leave
 *  5. Keyboard focus → tooltip appears
 *  6. Keyboard blur → tooltip hides
 *  7. Click → onViewSource callback fires
 *  8. Tooltip shows compiler version
 *  9. Tooltip shows verifiedAt date
 * 10. Tooltip shows bytecode hash (truncated)
 * 11. Tooltip shows fallback when no details provided
 * 12. Accessibility: aria-label, role, type=button
 * 13. Custom className forwarded
 * 14. Tooltip delay is respected (does not show immediately)
 * 15. onViewSource not required (no crash when omitted)
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import VerifiedSourceBadge from '../VerifiedSourceBadge';
import type { VerificationDetails } from '../VerifiedSourceBadge';

// ─── Timer setup ──────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const DETAILS: VerificationDetails = {
  compilerVersion: '0.21.3',
  verifiedAt: '2026-03-15T12:00:00Z',
  bytecodeHash: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderBadge(props: Partial<React.ComponentProps<typeof VerifiedSourceBadge>> = {}) {
  return render(
    <VerifiedSourceBadge isVerified={true} {...props} />
  );
}

function getBadge() {
  return screen.getByTestId('verified-source-badge');
}

function hoverBadge(delay = 300) {
  fireEvent.mouseEnter(getBadge());
  act(() => { jest.advanceTimersByTime(delay); });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('VerifiedSourceBadge', () => {

  // ── 1. Renders when verified ───────────────────────────────────────────────

  it('renders the badge when isVerified is true', () => {
    renderBadge();
    expect(getBadge()).toBeInTheDocument();
  });

  it('displays "Verified" label text', () => {
    renderBadge();
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('renders a checkmark SVG icon', () => {
    const { container } = renderBadge();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  // ── 2. Does NOT render when not verified ──────────────────────────────────

  it('renders nothing when isVerified is false', () => {
    const { container } = render(<VerifiedSourceBadge isVerified={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('does not render the badge button when isVerified is false', () => {
    render(<VerifiedSourceBadge isVerified={false} />);
    expect(screen.queryByTestId('verified-source-badge')).not.toBeInTheDocument();
  });

  // ── 3. Hover → tooltip appears ────────────────────────────────────────────

  it('shows tooltip after mouse enter and delay', () => {
    renderBadge({ verificationDetails: DETAILS });
    hoverBadge();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  it('tooltip contains "Source Verified" heading', () => {
    renderBadge({ verificationDetails: DETAILS });
    hoverBadge();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Source Verified');
  });

  // ── 4. Tooltip hides on mouse leave ───────────────────────────────────────

  it('hides tooltip after mouse leave', () => {
    renderBadge({ verificationDetails: DETAILS });
    hoverBadge();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(getBadge());
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  // ── 5. Keyboard focus → tooltip appears ──────────────────────────────────

  it('shows tooltip on keyboard focus', () => {
    renderBadge({ verificationDetails: DETAILS });
    fireEvent.focus(getBadge());
    act(() => { jest.advanceTimersByTime(300); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  // ── 6. Keyboard blur → tooltip hides ─────────────────────────────────────

  it('hides tooltip on blur', () => {
    renderBadge({ verificationDetails: DETAILS });
    fireEvent.focus(getBadge());
    act(() => { jest.advanceTimersByTime(300); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.blur(getBadge());
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  // ── 7. Click → onViewSource fires ────────────────────────────────────────

  it('calls onViewSource when badge is clicked', () => {
    const onViewSource = jest.fn();
    renderBadge({ onViewSource });
    fireEvent.click(getBadge());
    expect(onViewSource).toHaveBeenCalledTimes(1);
  });

  it('does not throw when clicked without onViewSource handler', () => {
    renderBadge();
    expect(() => fireEvent.click(getBadge())).not.toThrow();
  });

  // ── 8. Tooltip shows compiler version ────────────────────────────────────

  it('shows compiler version in tooltip', () => {
    renderBadge({ verificationDetails: DETAILS });
    hoverBadge();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Compiler v0.21.3');
  });

  it('shows "Compiler version unknown" when compilerVersion is absent', () => {
    renderBadge({ verificationDetails: { verifiedAt: DETAILS.verifiedAt } });
    hoverBadge();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Compiler version unknown');
  });

  // ── 9. Tooltip shows verifiedAt date ─────────────────────────────────────

  it('shows formatted verifiedAt date in tooltip', () => {
    renderBadge({ verificationDetails: DETAILS });
    hoverBadge();
    // "Mar 15, 2026" — locale-formatted
    expect(screen.getByRole('tooltip')).toHaveTextContent('2026');
  });

  it('does not show date section when verifiedAt is absent', () => {
    renderBadge({ verificationDetails: { compilerVersion: '0.21.3' } });
    hoverBadge();
    // Should not contain a year-like string from a date
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).not.toHaveTextContent('Mar');
  });

  // ── 10. Tooltip shows bytecode hash (truncated) ───────────────────────────

  it('shows truncated bytecode hash in tooltip', () => {
    renderBadge({ verificationDetails: DETAILS });
    hoverBadge();
    // First 16 chars of the hash
    expect(screen.getByRole('tooltip')).toHaveTextContent('abcdef1234567890');
  });

  it('does not show hash section when bytecodeHash is absent', () => {
    renderBadge({ verificationDetails: { compilerVersion: '0.21.3' } });
    hoverBadge();
    expect(screen.getByRole('tooltip')).not.toHaveTextContent('abcdef');
  });

  // ── 11. Tooltip fallback when no details ─────────────────────────────────

  it('shows tooltip with fallback text when no verificationDetails provided', () => {
    renderBadge();
    hoverBadge();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Source Verified');
  });

  // ── 12. Accessibility ─────────────────────────────────────────────────────

  it('has aria-label on the badge button', () => {
    renderBadge();
    expect(getBadge()).toHaveAttribute('aria-label', 'Verified source — click to view');
  });

  it('is a button element (keyboard focusable)', () => {
    renderBadge();
    expect(getBadge().tagName).toBe('BUTTON');
  });

  it('has type="button" to prevent accidental form submission', () => {
    renderBadge();
    expect(getBadge()).toHaveAttribute('type', 'button');
  });

  it('SVG icon has aria-hidden to avoid duplicate announcements', () => {
    const { container } = renderBadge();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('includes screen-reader-only extended description', () => {
    renderBadge({ verificationDetails: DETAILS });
    // The .sr-only span should contain the tooltip text
    const srText = screen.getByText(/Contract source code verified/i);
    expect(srText).toBeInTheDocument();
  });

  // ── 13. Custom className ──────────────────────────────────────────────────

  it('forwards custom className to the badge button', () => {
    renderBadge({ className: 'ml-2 my-custom' });
    expect(getBadge()).toHaveClass('ml-2', 'my-custom');
  });

  // ── 14. Tooltip delay respected ──────────────────────────────────────────

  it('does not show tooltip before delay elapses', () => {
    renderBadge({ verificationDetails: DETAILS, tooltipDelay: 500 });
    fireEvent.mouseEnter(getBadge());
    // Advance less than the delay
    act(() => { jest.advanceTimersByTime(499); });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('shows tooltip after custom delay elapses', () => {
    renderBadge({ verificationDetails: DETAILS, tooltipDelay: 500 });
    fireEvent.mouseEnter(getBadge());
    act(() => { jest.advanceTimersByTime(500); });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });

  // ── 15. "Click to view source" hint in tooltip ───────────────────────────

  it('shows "Click to view source" hint in tooltip', () => {
    renderBadge({ verificationDetails: DETAILS });
    hoverBadge();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Click to view source');
  });
});
