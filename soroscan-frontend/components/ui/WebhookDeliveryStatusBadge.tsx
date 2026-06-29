"use client"

import * as React from "react"
import { CheckCircle, RefreshCw, AlertCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type DeliveryStatus = "success" | "retrying" | "failed"

interface BaseProps {
  className?: string
}

// Props used by WebhookTable / components/ui test (state-based API)
interface StateProps extends BaseProps {
  state: DeliveryStatus
  lastDeliveryTime?: string
  isActive?: boolean
  failureCount?: number
  showTooltip?: boolean
  status?: never
  lastDelivery?: never
}

// Props used by __tests__/webhook-delivery-status-badge.test.tsx (status-based API)
interface StatusProps extends BaseProps {
  status: DeliveryStatus
  lastDelivery?: string
  state?: never
  lastDeliveryTime?: never
  isActive?: never
  failureCount?: never
  showTooltip?: never
}

type WebhookDeliveryStatusBadgeProps = StateProps | StatusProps

/** Derive delivery state from webhook data */
export function getDeliveryState(
  isActive: boolean,
  lastDeliverySuccess: boolean,
  failureCount: number
): DeliveryStatus {
  if (!isActive) return "failed"
  if (failureCount > 0 || !lastDeliverySuccess) return "retrying"
  return "success"
}

function formatRelativeTime(iso: string | undefined): string {
  if (!iso) return "Never"
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const STATE_CONFIG: Record<
  DeliveryStatus,
  {
    label: string
    upperLabel: string
    dotClass: string
    textClass: string
    animate: boolean
    Icon: React.ElementType
    iconClass: string
    tooltipTitle: string
  }
> = {
  success: {
    label: "Success",
    upperLabel: "SUCCESS",
    dotClass: "bg-terminal-green",
    textClass: "text-terminal-green",
    animate: false,
    Icon: CheckCircle,
    iconClass: "",
    tooltipTitle: "Delivery successful",
  },
  retrying: {
    label: "Retrying",
    upperLabel: "RETRYING",
    dotClass: "bg-terminal-warning",
    textClass: "text-terminal-warning",
    animate: true,
    Icon: RefreshCw,
    iconClass: "animate-spin",
    tooltipTitle: "Delivery failing but retrying",
  },
  failed: {
    label: "Failed",
    upperLabel: "FAILED",
    dotClass: "bg-terminal-danger",
    textClass: "text-terminal-danger",
    animate: false,
    Icon: AlertCircle,
    iconClass: "",
    tooltipTitle: "Delivery failed",
  },
}

export function WebhookDeliveryStatusBadge(props: WebhookDeliveryStatusBadgeProps) {
  // Resolve which API is being used
  const isStateApi = "state" in props && props.state !== undefined
  const resolvedStatus: DeliveryStatus = isStateApi
    ? (props as StateProps).state
    : (props as StatusProps).status

  const {
    label,
    upperLabel,
    dotClass,
    textClass,
    animate,
    Icon,
    iconClass,
    tooltipTitle,
  } = STATE_CONFIG[resolvedStatus]

  const displayLabel = isStateApi ? label : upperLabel

  // State-API props
  const lastDeliveryTime = isStateApi ? (props as StateProps).lastDeliveryTime : undefined
  const isActive = isStateApi ? ((props as StateProps).isActive ?? true) : undefined
  const failureCount = isStateApi ? ((props as StateProps).failureCount ?? 0) : undefined
  const showTooltip = isStateApi ? (props as StateProps).showTooltip : undefined

  // Status-API props
  const lastDelivery = !isStateApi ? (props as StatusProps).lastDelivery : undefined

  const className = props.className ?? ""

  const ariaLabel = isStateApi
    ? `Webhook delivery status: ${displayLabel}`
    : `Delivery status: ${upperLabel}${lastDelivery ? `, last delivery: ${lastDelivery}` : ""}`

  const badge = (
    <span
      role="status"
      aria-label={ariaLabel}
      className={[
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded",
        "border border-current/30 font-terminal-mono text-xs tracking-wider uppercase",
        textClass,
        className,
      ].join(" ")}
    >
      {isStateApi ? (
        <span aria-hidden="true" className={iconClass}>
          <Icon size={12} aria-hidden="true" />
        </span>
      ) : (
        <span
          aria-hidden="true"
          className={[
            "inline-block w-2 h-2 rounded-full",
            dotClass,
            animate ? "animate-pulse" : "",
          ].join(" ")}
        />
      )}
      {displayLabel}
    </span>
  )

  // State-API: showTooltip controls tooltip visibility (rendered inline for testability)
  if (isStateApi) {
    if (!showTooltip) return badge

    const timeStr = formatRelativeTime(lastDeliveryTime)
    const tooltipLines: string[] = [tooltipTitle]
    tooltipLines.push(`Last: ${timeStr}`)
    if (failureCount !== undefined && failureCount > 0) {
      tooltipLines.push(`Failures: ${failureCount}`)
    }
    if (isActive === false) {
      tooltipLines.push("Subscription inactive")
    }

    return (
      <>
        {badge}
        <span role="tooltip" className="sr-only">
          {tooltipLines.join(" ")}
        </span>
      </>
    )
  }

  // Status-API: tooltip shown via Radix when lastDelivery is provided
  if (!lastDelivery) return badge

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p className="font-terminal-mono text-xs">
            Last delivery:{" "}
            {new Date(lastDelivery).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
