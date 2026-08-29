"use client"

import * as React from "react"
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastType = "success" | "error" | "info" | "warning"

export interface ToastAction {
  label: string
  onClick: () => void
}

/** Default auto-dismiss delay for a toast, in milliseconds. */
export const DEFAULT_TOAST_DURATION_MS = 5000

export interface ToastOptions {
  message: string
  type?: ToastType
  title?: string
  action?: ToastAction
}

interface Toast extends Required<Pick<ToastOptions, "message" | "type">> {
  id: string
  title?: string
  action?: ToastAction
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, title?: string, action?: ToastAction) => string
  dismissToast: (id: string) => void
  dismissAllToasts: () => void
}

export interface ToastProviderProps {
  children: React.ReactNode
  position?: "top-right" | "bottom-right"
  /** Auto-dismiss duration in milliseconds. Set to 0 to disable auto-dismiss. */
  duration?: number
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)
let dispatchToast: ((message: string, type?: ToastType, title?: string, action?: ToastAction) => string) | null = null

function createToastId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const toastStyles = {
  success: { border: "border-terminal-green", icon: "text-terminal-green", shadow: "shadow-[var(--shadow-glow-green)]" },
  error: { border: "border-terminal-danger", icon: "text-terminal-danger", shadow: "shadow-[var(--shadow-glow-danger)]" },
  info: { border: "border-terminal-cyan", icon: "text-terminal-cyan", shadow: "shadow-[var(--shadow-glow-cyan)]" },
  warning: { border: "border-terminal-warning", icon: "text-terminal-warning", shadow: "shadow-[0_0_18px_rgba(255,170,0,0.45)]" },
}

const toastIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

export function ToastProvider({
  children,
  position = "bottom-right",
  duration = DEFAULT_TOAST_DURATION_MS,
}: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const dismissToast = React.useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const dismissAllToasts = React.useCallback(() => {
    setToasts([])
  }, [])

  const showToast = React.useCallback((message: string, type: ToastType = "info", title?: string, action?: ToastAction) => {
    const id = createToastId()
    setToasts((current) => [{ id, message, type, title, action }, ...current])
    return id
  }, [])

  React.useEffect(() => {
    dispatchToast = showToast
    return () => { if (dispatchToast === showToast) dispatchToast = null }
  }, [showToast])

  const contextValue = React.useMemo(() => ({ showToast, dismissToast, dismissAllToasts }), [dismissAllToasts, dismissToast, showToast])
  const positionClasses = position === "bottom-right" ? "bottom-4 right-4" : "right-4 top-4"

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        data-testid="toast-container"
        data-position={position}
        className={`pointer-events-none fixed z-50 flex max-h-screen w-full max-w-sm flex-col gap-3 px-4 sm:px-0 ${positionClasses}`}
        aria-label="Notifications" aria-live="polite" aria-relevant="additions removals"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} duration={duration} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within a ToastProvider")
  return context
}

export function showToast(message: string, type: ToastType = "info", title?: string, action?: ToastAction) {
  if (!dispatchToast) return undefined
  return dispatchToast(message, type, title, action)
}

function ToastItem({ toast, duration, onDismiss }: { toast: Toast, duration: number, onDismiss: () => void }) {
  const { message, title, type, action } = toast
  const Icon = toastIcons[type]
  const styles = toastStyles[type]
  const role = type === "error" ? "alert" : "status"
  
  // Auto-dismiss and pause-on-hover logic
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const startTimer = React.useCallback(() => {
    if (duration > 0) {
      timerRef.current = setTimeout(onDismiss, duration)
    }
  }, [duration, onDismiss])

  const clearTimer = React.useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  React.useEffect(() => {
    startTimer()
    return clearTimer
  }, [startTimer, clearTimer])

  return (
    <div
      role={role}
      data-testid="toast"
      data-toast-type={type}
      onMouseEnter={clearTimer}
      onMouseLeave={startTimer}
      className={cn(
        "pointer-events-auto relative flex items-start gap-3 border border-l-4 bg-terminal-black/95 px-4 py-3 font-terminal-mono text-sm",
        styles.border, styles.shadow
      )}
    >
      <Icon data-testid={`toast-icon-${type}`} className={`mt-0.5 h-5 w-5 shrink-0 ${styles.icon}`} aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-1">
        {title && <h4 className="font-bold leading-none tracking-tight text-foreground">{title}</h4>}
        <p className="break-words leading-snug text-foreground/90">{message}</p>
        
        {/* Action Button support */}
        {action && (
          <div className="mt-2">
            <button
              onClick={() => { action.onClick(); onDismiss(); }}
              className="text-xs font-semibold underline underline-offset-2 hover:text-foreground/80 focus-visible:outline-none"
            >
              {action.label}
            </button>
          </div>
        )}
      </div>
      <button
        type="button" onClick={onDismiss}
        className="ml-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-terminal-green/40 text-terminal-green/80 transition hover:border-terminal-green hover:text-terminal-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-cyan"
        aria-label={`Dismiss${title ? ` ${title}` : ""} notification`}
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  )
}