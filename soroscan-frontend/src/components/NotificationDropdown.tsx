import * as React from "react";
import { CheckCircle2, Bell, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NotificationItem {
  id: string | number;
  title?: string;
  message: string;
  timestamp?: string;
  read?: boolean;
  type?: string;
}

export interface NotificationDropdownProps {
  isOpen?: boolean;
  onClose?: () => void;
  notifications?: NotificationItem[];
  loading?: boolean;
  onMarkRead?: (id: string | number) => void;
  onMarkAllRead?: () => void;
  onClearAll?: () => void;
  className?: string;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen = true,
  onClose,
  notifications = [],
  loading = false,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  className,
}) => {
  if (!isOpen) return null;

  const hasNotifications = notifications && notifications.length > 0;

  return (
    <div
      role="dialog"
      aria-label="Notifications"
      data-testid="notification-dropdown"
      className={cn(
        "w-80 sm:w-96 rounded-lg border border-terminal-green/30 bg-terminal-black/95 shadow-xl font-terminal-mono text-terminal-green z-50 overflow-hidden flex flex-col",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-terminal-green/20 bg-terminal-green/5">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-terminal-green" />
          <span className="text-xs font-bold tracking-wider uppercase">
            Notifications
          </span>
          {hasNotifications && (
            <span className="px-1.5 py-0.2 bg-terminal-green/20 text-[10px] text-terminal-green rounded border border-terminal-green/30">
              {notifications.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasNotifications && onMarkAllRead && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-[10px] text-terminal-gray hover:text-terminal-green transition-colors"
              title="Mark all as read"
            >
              Mark read
            </button>
          )}
          {hasNotifications && onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[10px] text-terminal-danger/70 hover:text-terminal-danger transition-colors"
              title="Clear all"
            >
              Clear
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close notifications"
              className="text-terminal-gray hover:text-terminal-green p-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-h-80 overflow-y-auto p-2 space-y-2">
        {loading ? (
          <div className="py-8 text-center text-xs text-terminal-gray animate-pulse">
            LOADING NOTIFICATIONS...
          </div>
        ) : !hasNotifications ? (
          /* Empty State Card with Icon */
          <div
            data-testid="empty-notification-state"
            className="flex flex-col items-center justify-center p-6 text-center rounded-md border border-terminal-green/20 bg-terminal-green/5 my-2 mx-1"
          >
            <div className="w-10 h-10 rounded-full bg-terminal-green/10 border border-terminal-green/30 flex items-center justify-center mb-3 text-terminal-green shadow-[0_0_12px_rgba(0,255,65,0.15)]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-terminal-green">
              All clear! No new notifications
            </h4>
            <p className="mt-1 text-xs text-terminal-gray">
              You are all caught up with your latest alerts and events.
            </p>
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className={cn(
                "p-3 rounded border transition-colors flex items-start justify-between gap-2",
                item.read
                  ? "border-terminal-green/10 bg-terminal-black/40 text-terminal-gray"
                  : "border-terminal-green/30 bg-terminal-green/10 text-terminal-green"
              )}
            >
              <div className="flex-1 min-w-0">
                {item.title && (
                  <p className="text-xs font-bold truncate mb-0.5">{item.title}</p>
                )}
                <p className="text-xs break-words">{item.message}</p>
                {item.timestamp && (
                  <span className="text-[10px] text-terminal-gray mt-1 block">
                    {item.timestamp}
                  </span>
                )}
              </div>
              {!item.read && onMarkRead && (
                <button
                  type="button"
                  onClick={() => onMarkRead(item.id)}
                  aria-label="Mark as read"
                  className="shrink-0 p-1 text-terminal-gray hover:text-terminal-green transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
