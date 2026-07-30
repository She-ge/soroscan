"use client"

import * as React from "react"
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react"

export type ToastType = "success" | "error" | "info" | "warning"

export interface ToastOptions {
  message: string
  type?: ToastType
  title?: string
}

interface Toast extends Required<Pick<ToastOptions, "message" | "type">> {
  id: string
  title?: string
}

interface ToastContextValue {
  showToast: (
    message: string,
    type?: ToastType,
    title?: string,
  ) => string
  dismissToast: (id: string) => void
  dismissAllToasts: () => void
}

export interface ToastProviderProps {
  children: React.ReactNode
  position?: "top-right" | "bottom-right"
  /** Auto-dismiss duration in milliseconds. */
  duration?: number
}

interface ToastItemProps {
  toast: Toast
  onDismiss: () => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined,
)

let dispatchToast:
  | ((
      message: string,
      type?: ToastType,
      title?: string,
    ) => string)
  | null = null

function createToastId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID()
  }

  return `toast-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`
}

const toastStyles: Record<
  ToastType,
  {
    border: string
    icon: string
    shadow: string
  }
> = {
  success: {
    border: "border-terminal-green",
    icon: "text-terminal-green",
    shadow: "shadow-[var(--shadow-glow-green)]",
  },
  error: {
    border: "border-terminal-danger",
    icon: "text-terminal-danger",
    shadow: "shadow-[var(--shadow-glow-danger)]",
  },
  info: {
    border: "border-terminal-cyan",
    icon: "text-terminal-cyan",
    shadow: "shadow-[var(--shadow-glow-cyan)]",
  },
  warning: {
    border: "border-terminal-warning",
    icon: "text-terminal-warning",
    shadow: "shadow-[0_0_18px_rgba(255,170,0,0.45)]",
  },
}

const toastIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
} satisfies Record<
  ToastType,
  React.ComponentType<React.SVGProps<SVGSVGElement>>
>

export function ToastProvider({
  children,
  position = "bottom-right",
  duration = 4000,
}: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const timersRef = React.useRef<
    Map<string, ReturnType<typeof setTimeout>>
  >(new Map())

  const clearToastTimer = React.useCallback((id: string) => {
    const timer = timersRef.current.get(id)

    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const dismissToast = React.useCallback(
    (id: string) => {
      clearToastTimer(id)
      setToasts((current) =>
        current.filter((toast) => toast.id !== id),
      )
    },
    [clearToastTimer],
  )

  const dismissAllToasts = React.useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer))
    timersRef.current.clear()
    setToasts([])
  }, [])

  const showToast = React.useCallback(
    (
      message: string,
      type: ToastType = "info",
      title?: string,
    ): string => {
      const id = createToastId()

      setToasts((current) => [
        {
          id,
          message,
          type,
          title,
        },
        ...current,
      ])

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissToast(id)
        }, duration)

        timersRef.current.set(id, timer)
      }

      return id
    },
    [dismissToast, duration],
  )

  React.useEffect(() => {
    dispatchToast = showToast

    return () => {
      if (dispatchToast === showToast) {
        dispatchToast = null
      }
    }
  }, [showToast])

  React.useEffect(() => {
    const timers = timersRef.current

    return () => {
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
    }
  }, [])

  const contextValue = React.useMemo<ToastContextValue>(
    () => ({
      showToast,
      dismissToast,
      dismissAllToasts,
    }),
    [dismissAllToasts, dismissToast, showToast],
  )

  const positionClasses =
    position === "bottom-right"
      ? "bottom-4 right-4"
      : "right-4 top-4"

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <div
        data-testid="toast-container"
        data-position={position}
        className={`pointer-events-none fixed z-50 flex max-h-screen w-full max-w-sm flex-col gap-3 px-4 sm:px-0 ${positionClasses}`}
        aria-label="Notifications"
        aria-live="polite"
        aria-relevant="additions removals"
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext)

  if (!context) {
    throw new Error(
      "useToast must be used within a ToastProvider",
    )
  }

  return context
}

export function showToast(
  message: string,
  type: ToastType = "info",
  title?: string,
): string | undefined {
  if (!dispatchToast) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "ToastProvider is not mounted; cannot show toast:",
        message,
      )
    }

    return undefined
  }

  return dispatchToast(message, type, title)
}

function ToastItem({
  toast,
  onDismiss,
}: ToastItemProps) {
  const { message, title, type } = toast
  const Icon = toastIcons[type]
  const styles = toastStyles[type]
  const role = type === "error" ? "alert" : "status"

  return (
    <div
      role={role}
      data-testid="toast"
      data-toast-type={type}
      className={[
        "pointer-events-auto relative flex items-start gap-3",
        "border border-l-4 bg-terminal-black/95 px-4 py-3",
        "font-terminal-mono text-sm",
        styles.border,
        styles.shadow,
      ].join(" ")}
    >
      <Icon
        data-testid={`toast-icon-${type}`}
        className={`mt-0.5 h-5 w-5 shrink-0 ${styles.icon}`}
        aria-hidden="true"
      />

      <div className="min-w-0 flex-1 space-y-1">
        {title && (
          <h4 className="font-bold leading-none tracking-tight text-foreground">
            {title}
          </h4>
        )}

        <p className="break-words leading-snug text-foreground/90">
          {message}
        </p>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="ml-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-terminal-green/40 text-terminal-green/80 transition hover:border-terminal-green hover:text-terminal-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-cyan"
        aria-label={`Dismiss${title ? ` ${title}` : ""} notification`}
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  )
}
