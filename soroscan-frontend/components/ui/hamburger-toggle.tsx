"use client";

import * as React from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HamburgerToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isOpen: boolean;
  onClick: () => void;
  ariaControls?: string;
}

export function HamburgerToggle({
  isOpen,
  onClick,
  ariaControls = "mobile-menu",
  className,
  ...props
}: HamburgerToggleProps) {
  return (
    <button
      className={cn(
        "md:hidden text-terminal-green hover:text-terminal-cyan transition-colors p-2",
        "focus:outline-none focus:ring-1 focus:ring-terminal-green/50 rounded-sm",
        className
      )}
      onClick={onClick}
      aria-label={isOpen ? "Close menu" : "Toggle menu"}
      aria-expanded={isOpen}
      aria-controls={ariaControls}
      aria-haspopup="true"
      {...props}
    >
      {isOpen ? <X size={20} /> : <Menu size={20} />}
    </button>
  );
}
