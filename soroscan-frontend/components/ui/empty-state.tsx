"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg";
  };
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={cn(
          "flex flex-col items-center justify-center text-center gap-6 py-12 px-4",
          className
        )}
        {...props}
      >
        {icon && (
          <div
            className="text-muted-foreground"
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
        {(title || description) && (
          <div className="space-y-2 max-w-md">
            {title && (
              <h3 className="text-lg font-semibold text-foreground">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        )}
        {action && (
          action.href ? (
            <a
              href={action.href}
              className={cn(
                "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "h-9 px-4 py-2"
              )}
            >
              {action.label}
            </a>
          ) : (
            <Button
              variant={action.variant}
              size={action.size}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )
        )}
      </div>
    );
  }
);
EmptyState.displayName = "EmptyState";

export { EmptyState };
