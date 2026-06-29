"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle2, Info, XCircle, X, Copy } from "lucide-react"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid grid-cols-[auto_1fr_auto_auto] gap-3 items-start [&>svg]:size-5 transition-all",
  {
    variants: {
      variant: {
        info: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
        success: "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
        warning: "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
        error: "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
)

const variantIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertCircle,
  error: XCircle,
}

interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string
  description?: string
  dismissible?: boolean
  onDismiss?: () => void
  copyable?: boolean
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "info", title, description, dismissible = false, onDismiss, copyable = true, ...props }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true)
    const [copied, setCopied] = React.useState(false)
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>()
    const Icon = variantIcons[variant || "info"]

    const handleDismiss = () => {
      setIsVisible(false)
      if (onDismiss) onDismiss()
    }

    const handleCopy = React.useCallback(async () => {
      const textToCopy = [title, description].filter(Boolean).join("\n")
      if (!textToCopy) return

      try {
        await navigator.clipboard.writeText(textToCopy)
      } catch {
        // Fallback for environments without clipboard API
        const textarea = document.createElement('textarea')
        textarea.value = textToCopy
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }

      setCopied(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    }, [title, description])

    if (!isVisible) return null

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <Icon className="mt-0.5 shrink-0" aria-hidden="true" />
        <div className="flex flex-col gap-1 flex-1">
          {title && <h5 className="font-semibold leading-none tracking-tight">{title}</h5>}
          {description && <div className="text-sm opacity-90">{description}</div>}
        </div>
        {copyable && (title || description) && (
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label={copied ? "Copied!" : "Copy alert text"}
            data-testid="copy-alert-button"
          >
            {copied ? <CheckCircle2 className="size-4" /> : <Copy className="size-4" />}
          </button>
        )}
        {(dismissible || onDismiss) && (
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Dismiss alert"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    )
  }
)
Alert.displayName = "Alert"

export { Alert, alertVariants }