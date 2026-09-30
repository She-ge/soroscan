"use client";

import { useEffect, useRef } from "react";
import { NotificationItem } from "./NotificationItem";
import type { NotificationFilter, NotificationItem as NotificationItemType } from "./useNotifications";

const FILTER_OPTIONS: { label: string; value: NotificationFilter }[] = [
  { label: "ALL", value: "all" },
  { label: "CONTRACT", value: "contract_paused" },
  { label: "WEBHOOK", value: "webhook_failure" },
  { label: "RATE LIMIT", value: "rate_limit" },
  { label: "SYSTEM", value: "system" },
  { label: "ALERT", value: "alert" },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItemType[];
  loading: boolean;
  onMarkRead: (id: number) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  filter: NotificationFilter;
  onFilterChange: (f: NotificationFilter) => void;
}

export function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  loading,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  filter,
  onFilterChange,
}: Props) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40" aria-hidden="true" />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Notification center"
        className="
          fixed top-0 right-0 z-50 h-full w-full max-w-sm
          bg-terminal-black border-l border-terminal-green/40
          flex flex-col font-terminal-mono
          shadow-[−4px_0_24px_rgba(0,255,65,0.08)]
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-terminal-green/30">
          <span className="text-sm text-terminal-green tracking-widest">NOTIFICATIONS</span>
          <div className="flex items-center gap-3">
            <button
              onClick={onMarkAllRead}
              className="text-[10px] text-terminal-green/60 hover:text-terminal-green transition-colors"
              aria-label="Mark all as read"
            >
              MARK ALL READ
            </button>
            <button
              onClick={onClearAll}
              className="text-[10px] text-terminal-danger/70 hover:text-terminal-danger transition-colors"
              aria-label="Clear all notifications"
            >
              CLEAR ALL
            </button>
            <button
              onClick={onClose}
              className="text-terminal-green/60 hover:text-terminal-green transition-colors text-lg leading-none"
              aria-label="Close notification drawer"
            >
              ×
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 px-3 py-2 border-b border-terminal-green/20 overflow-x-auto">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onFilterChange(opt.value)}
              className={`
                text-[10px] px-2 py-0.5 border shrink-0 transition-colors
                ${filter === opt.value
                  ? "border-terminal-green text-terminal-green bg-terminal-green/10"
                  : "border-terminal-green/30 text-terminal-green/50 hover:border-terminal-green/60 hover:text-terminal-green/80"
                }
              `}
              aria-pressed={filter === opt.value}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div
          role="list"
          className="flex-1 overflow-y-auto"
          aria-label="Notification list"
          aria-live="polite"
          aria-busy={loading}
        >
          {loading && (
            <p className="text-xs text-terminal-green/50 text-center py-8">LOADING...</p>
          )}
          {!loading && notifications.length === 0 && (
            <div
              data-testid="empty-notification-state"
              className="m-4 flex flex-col items-center justify-center p-6 text-center rounded border border-terminal-green/20 bg-terminal-green/5"
            >
              <div className="w-10 h-10 rounded-full bg-terminal-green/10 border border-terminal-green/30 flex items-center justify-center mb-3 text-terminal-green">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-xs font-semibold text-terminal-green">
                All clear! No new notifications
              </p>
              <p className="mt-1 text-[11px] text-terminal-gray">
                You have no unread notifications at this time.
              </p>
            </div>
          )}
          {!loading && notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onMarkRead={onMarkRead} />
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-terminal-green/20 text-[10px] text-terminal-green/30">
          SHOWING LAST 50 · REAL-TIME UPDATES ACTIVE
        </div>
      </div>
    </>
  );
}
