'use client';

import * as React from 'react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { VerificationStatus } from './types';

export interface VerificationBadgeProps {
  status: VerificationStatus;
  className?: string;
}

const CONFIG: Record<
  VerificationStatus,
  { label: string; icon: string; tooltip: string; colors: string }
> = {
  verified: {
    label: 'Verified',
    icon: '✓',
    tooltip: 'Source code has been verified against the on-chain bytecode.',
    colors: 'bg-green-900/40 text-green-400 border border-green-700',
  },
  unverified: {
    label: 'Unverified',
    icon: '⚠️',
    tooltip: 'Source code has not been verified. Interact with caution.',
    colors: 'bg-yellow-900/40 text-yellow-400 border border-yellow-700',
  },
  malicious: {
    label: 'Malicious',
    icon: '🚨',
    tooltip: 'This contract has been flagged as malicious by the verification registry.',
    colors: 'bg-red-900/40 text-red-400 border border-red-700',
  },
};

export function VerificationBadge({ status, className }: VerificationBadgeProps) {
  const cfg = CONFIG[status];
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="status"
            aria-label={`Verification status: ${cfg.label}`}
            data-testid="verification-badge"
            data-status={status}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-default select-none',
              cfg.colors,
              className
            )}
          >
            <span aria-hidden="true">{cfg.icon}</span>
            {cfg.label}
          </span>
        </TooltipTrigger>
        <TooltipContent>{cfg.tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
