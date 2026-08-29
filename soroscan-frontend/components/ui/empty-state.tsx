"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Button as TerminalButton, buttonVariants as terminalButtonVariants } from "@/components/terminal/Button";

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  id?: string;
  ariaLabel?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  terminalVariant?: "primary" | "secondary" | "danger";
  size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
  icon?: React.ReactNode;
}

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional icon or custom illustration. */
  icon?: React.ReactNode;
  title?: string;
  description?: React.ReactNode;
  /** Primary call-to-action. */
  action?: EmptyStateAction;
  /** Secondary call-to-action shown beside or below the primary action. */
  secondaryAction?: EmptyStateAction;
  /** Optional hint line below actions (e.g. CLI command). */
  footer?: React.ReactNode;
  /** Visual style — `terminal` matches the SoroScan retro-futuristic UI. */
  variant?: "default" | "terminal";
  /** Accessible label when title alone is insufficient. */
  ariaLabel?: string;
}

function EmptyStateActionButton({
  action,
  terminal,
}: {
  action: EmptyStateAction;
  terminal: boolean;
}) {
  const content = (
    <>
      {action.icon}
      {action.label}
    </>
  );

  if (terminal) {
    const size =
      action.size === "lg" ? "lg" : action.size === "sm" ? "sm" : "default";

    if (action.href) {
      return (
        <Link
          href={action.href}
          id={action.id}
          aria-label={action.ariaLabel ?? action.label}
          className={cn(
            terminalButtonVariants({
              variant: action.terminalVariant ?? "primary",
              size,
            }),
            "min-h-[44px] inline-flex",
          )}
        >
          {content}
        </Link>
      );
    }

    return (
      <TerminalButton
        id={action.id}
        variant={action.terminalVariant ?? "primary"}
        size={size}
        onClick={action.onClick}
        aria-label={action.ariaLabel ?? action.label}
        className="min-h-[44px]"
      >
        {content}
      </TerminalButton>
    );
  }

  return (
    <Button
      id={action.id}
      variant={action.variant}
      size={action.size}
      onClick={action.onClick}
      asChild={!!action.href}
      aria-label={action.ariaLabel ?? action.label}
      className="min-h-[44px]"
    >
      {action.href ? <Link href={action.href}>{content}</Link> : content}
    </Button>
  );
}

/** Terminal-style icon ring wrapper for empty states. */
export function EmptyStateIcon({
  children,
  className,
  animated = true,
}: {
  children: React.ReactNode;
  className?: string;
  animated?: boolean;
}) {
  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      data-testid="empty-state-icon"
    >
      {animated && (
        <span
          className="absolute inline-flex h-24 w-24 rounded-full border border-terminal-green/20 animate-ping"
          aria-hidden="true"
        />
      )}
      <span
        className="
          relative inline-flex items-center justify-center
          h-20 w-20 rounded-full
          border border-terminal-green/30
          bg-terminal-green/5
        "
        aria-hidden="true"
      >
        {children}
      </span>
    </div>
  );
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    {
      className,
      icon,
      title,
      description,
      action,
      secondaryAction,
      footer,
      variant = "default",
      ariaLabel,
      ...props
    },
    ref,
  ) => {
    const isTerminal = variant === "terminal";

    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        aria-label={ariaLabel ?? title}
        data-testid="empty-state"
        data-variant={variant}
        className={cn(
          "flex flex-col items-center justify-center text-center gap-6 py-12 px-4 sm:py-16",
          isTerminal && "font-terminal-mono",
          className,
        )}
        {...props}
      >
        {icon && (
          <div
            className={cn(
              "flex items-center justify-center",
              !isTerminal && "text-muted-foreground",
            )}
            aria-hidden={typeof icon !== "string"}
          >
            {icon}
          </div>
        )}

        {(title || description) && (
          <div className="space-y-2 max-w-md">
            {title && (
              <h3
                className={cn(
                  "text-lg font-semibold",
                  isTerminal
                    ? "text-terminal-green tracking-widest uppercase"
                    : "text-foreground",
                )}
              >
                {title}
              </h3>
            )}
            {description && (
              <p
                className={cn(
                  "text-sm leading-relaxed",
                  isTerminal ? "text-terminal-gray" : "text-muted-foreground",
                )}
              >
                {description}
              </p>
            )}
          </div>
        )}

        {(action || secondaryAction) && (
          <>
            {isTerminal && (
              <div
                className="w-full max-w-xs border-t border-dashed border-terminal-green/20"
                aria-hidden="true"
              />
            )}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 w-full sm:w-auto">
              {action && (
                <EmptyStateActionButton action={action} terminal={isTerminal} />
              )}
              {secondaryAction && (
                <EmptyStateActionButton
                  action={secondaryAction}
                  terminal={isTerminal}
                />
              )}
            </div>
          </>
        )}

        {footer && (
          <div
            className={cn(
              "text-xs tracking-wider max-w-sm",
              isTerminal ? "text-terminal-gray/50" : "text-muted-foreground",
            )}
          >
            {footer}
          </div>
        )}
      </div>
    );
  },
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
