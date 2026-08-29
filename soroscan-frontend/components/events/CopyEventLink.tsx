'use client';

import * as React from 'react';
import { Check, Link2 } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface CopyEventLinkProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'onClick'
> {
  /**
   * Event ID included in the shareable event URL.
   */
  eventId: string | number;

  /**
   * Base URL used before the event ID.
   *
   * Defaults to:
   * window.location.origin + "/events"
   */
  baseUrl?: string;

  /**
   * Time in milliseconds before the copied state resets.
   */
  feedbackDuration?: number;

  /**
   * Visible button text before copying.
   */
  label?: string;
}

/**
 * Creates a shareable event URL.
 */
export function buildEventUrl(eventId: string | number, baseUrl: string): string {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
  const encodedEventId = encodeURIComponent(String(eventId));

  return `${normalizedBaseUrl}/${encodedEventId}`;
}

async function copyWithFallback(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');

  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const copied = document.execCommand('copy');

  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error('Unable to copy the event link.');
  }
}

export const CopyEventLink = React.forwardRef<HTMLButtonElement, CopyEventLinkProps>(
  (
    {
      eventId,
      baseUrl,
      feedbackDuration = 2000,
      label = 'Copy Link',
      className,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [copyState, setCopyState] = React.useState<'idle' | 'copied' | 'error'>('idle');

    const resetTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    React.useEffect(() => {
      return () => {
        if (resetTimeoutRef.current) {
          clearTimeout(resetTimeoutRef.current);
        }
      };
    }, []);

    const handleCopy = async (): Promise<void> => {
      const resolvedBaseUrl =
        baseUrl ?? (typeof window !== 'undefined' ? `${window.location.origin}/events` : '/events');

      const eventUrl = buildEventUrl(eventId, resolvedBaseUrl);

      try {
        await copyWithFallback(eventUrl);
        setCopyState('copied');
      } catch {
        setCopyState('error');
      }

      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }

      resetTimeoutRef.current = setTimeout(() => {
        setCopyState('idle');
      }, feedbackDuration);
    };

    const isCopied = copyState === 'copied';
    const hasError = copyState === 'error';

    return (
      <button
        ref={ref}
        type="button"
        data-slot="copy-event-link"
        data-testid="copy-event-link"
        aria-label={
          isCopied
            ? `Link copied for event ${eventId}`
            : hasError
              ? `Copy failed for event ${eventId}`
              : `Copy link to event ${eventId}`
        }
        aria-live="polite"
        disabled={disabled}
        onClick={() => void handleCopy()}
        className={cn(
          'inline-flex items-center justify-center gap-2',
          'rounded-sm border px-3 py-2',
          'font-terminal-mono text-xs font-semibold uppercase',
          'tracking-wide transition-colors',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-terminal-cyan',
          'disabled:cursor-not-allowed disabled:opacity-50',
          isCopied
            ? ['border-terminal-green/50', 'bg-terminal-green/10', 'text-terminal-green']
            : hasError
              ? ['border-terminal-danger/50', 'bg-terminal-danger/10', 'text-terminal-danger']
              : [
                  'border-terminal-cyan/40',
                  'bg-terminal-cyan/5',
                  'text-terminal-cyan',
                  'hover:bg-terminal-cyan/10',
                ],
          className,
        )}
        {...props}
      >
        {isCopied ? (
          <Check data-slot="copy-event-link-icon" size={14} aria-hidden="true" />
        ) : (
          <Link2 data-slot="copy-event-link-icon" size={14} aria-hidden="true" />
        )}

        <span data-slot="copy-event-link-label">
          {isCopied ? 'Copied!' : hasError ? 'Copy Failed' : label}
        </span>
      </button>
    );
  },
);

CopyEventLink.displayName = 'CopyEventLink';
