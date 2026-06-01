"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DrawerProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  position?: "left" | "right";
  title?: string;
  showCloseButton?: boolean;
}

export function Drawer({
  isOpen,
  onClose,
  position = "left",
  title,
  showCloseButton = true,
  className,
  children,
  ...props
}: DrawerProps) {
  const drawerRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, onClose]);

  // Close on Escape key press
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Prevent background scrolling when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Drawer"}
        className={cn(
          "fixed top-0 bottom-0 z-50 h-full w-full max-w-sm bg-terminal-black flex flex-col font-terminal-mono",
          "shadow-[0_0_24px_rgba(0,255,65,0.12)] transition-transform duration-300 ease-out",
          position === "right" ? "right-0 border-l border-terminal-green/40" : "left-0 border-r border-terminal-green/40",
          className
        )}
        {...props}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-terminal-green/30">
            {title ? (
              <span className="text-sm font-semibold text-terminal-green tracking-widest uppercase">
                {title}
              </span>
            ) : (
              <span />
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-terminal-green/60 hover:text-terminal-green transition-colors text-lg leading-none p-1 focus:outline-none focus:ring-1 focus:ring-terminal-green/50"
                aria-label="Close drawer"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  );
}
