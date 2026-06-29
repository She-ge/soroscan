import React from "react"
import { render, screen } from "@testing-library/react"
import { WebhookDeliveryStatusBadge } from "@/components/ui/WebhookDeliveryStatusBadge"
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip"

// Wrap with open tooltip so tooltip content is visible in tests
function renderWithTooltip(ui: React.ReactElement) {
  return render(ui)
}

describe("WebhookDeliveryStatusBadge", () => {
  // ── Label rendering ────────────────────────────────────────────────────

  it("renders SUCCESS label", () => {
    renderWithTooltip(<WebhookDeliveryStatusBadge status="success" />)
    expect(screen.getByText("SUCCESS")).toBeInTheDocument()
  })

  it("renders RETRYING label", () => {
    renderWithTooltip(<WebhookDeliveryStatusBadge status="retrying" />)
    expect(screen.getByText("RETRYING")).toBeInTheDocument()
  })

  it("renders FAILED label", () => {
    renderWithTooltip(<WebhookDeliveryStatusBadge status="failed" />)
    expect(screen.getByText("FAILED")).toBeInTheDocument()
  })

  // ── Color classes ──────────────────────────────────────────────────────

  it("applies green text class for success", () => {
    renderWithTooltip(<WebhookDeliveryStatusBadge status="success" />)
    const badge = screen.getByRole("status")
    expect(badge.className).toMatch(/text-terminal-green/)
  })

  it("applies warning text class for retrying", () => {
    renderWithTooltip(<WebhookDeliveryStatusBadge status="retrying" />)
    const badge = screen.getByRole("status")
    expect(badge.className).toMatch(/text-terminal-warning/)
  })

  it("applies danger text class for failed", () => {
    renderWithTooltip(<WebhookDeliveryStatusBadge status="failed" />)
    const badge = screen.getByRole("status")
    expect(badge.className).toMatch(/text-terminal-danger/)
  })

  // ── Dot animation ──────────────────────────────────────────────────────

  it("does not animate dot for success", () => {
    renderWithTooltip(<WebhookDeliveryStatusBadge status="success" />)
    const dot = screen.getByRole("status").querySelector("[aria-hidden]")
    expect(dot?.className).not.toMatch(/animate-pulse/)
  })

  it("animates dot for retrying", () => {
    renderWithTooltip(<WebhookDeliveryStatusBadge status="retrying" />)
    const dot = screen.getByRole("status").querySelector("[aria-hidden]")
    expect(dot?.className).toMatch(/animate-pulse/)
  })

  it("does not animate dot for failed", () => {
    renderWithTooltip(<WebhookDeliveryStatusBadge status="failed" />)
    const dot = screen.getByRole("status").querySelector("[aria-hidden]")
    expect(dot?.className).not.toMatch(/animate-pulse/)
  })

  // ── Accessibility ──────────────────────────────────────────────────────

  it("has aria-label with status for success", () => {
    renderWithTooltip(<WebhookDeliveryStatusBadge status="success" />)
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Delivery status: SUCCESS"
    )
  })

  it("has aria-label with status for retrying", () => {
    renderWithTooltip(<WebhookDeliveryStatusBadge status="retrying" />)
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Delivery status: RETRYING"
    )
  })

  it("has aria-label with status for failed", () => {
    renderWithTooltip(<WebhookDeliveryStatusBadge status="failed" />)
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Delivery status: FAILED"
    )
  })

  it("includes lastDelivery in aria-label when provided", () => {
    renderWithTooltip(
      <WebhookDeliveryStatusBadge
        status="success"
        lastDelivery="2026-02-23T22:34:01Z"
      />
    )
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Delivery status: SUCCESS, last delivery: 2026-02-23T22:34:01Z"
    )
  })

  // ── Tooltip ────────────────────────────────────────────────────────────

  it("shows tooltip with last delivery time when open", () => {
    render(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger asChild>
            <span>
              <WebhookDeliveryStatusBadge
                status="success"
                lastDelivery="2026-02-23T22:34:01Z"
              />
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Last delivery: {new Date("2026-02-23T22:34:01Z").toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    expect(screen.getByRole("tooltip")).toHaveTextContent("Last delivery:")
  })

  it("renders without tooltip when lastDelivery is omitted", () => {
    renderWithTooltip(<WebhookDeliveryStatusBadge status="failed" />)
    // Badge still renders, no tooltip wrapper
    expect(screen.getByRole("status")).toBeInTheDocument()
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument()
  })

  // ── className passthrough ──────────────────────────────────────────────

  it("applies custom className", () => {
    renderWithTooltip(
      <WebhookDeliveryStatusBadge status="success" className="my-custom-class" />
    )
    expect(screen.getByRole("status").className).toMatch(/my-custom-class/)
  })
})
