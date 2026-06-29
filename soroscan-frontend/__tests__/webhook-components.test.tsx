import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { WebhookTable } from "@/app/webhooks/components/WebhookTable"
import { CreateWebhookModal } from "@/app/webhooks/components/CreateWebhookModal"
import WebhookDetailPage from "@/app/webhooks/[id]/page"
import { DeliveryLog } from "@/app/webhooks/[id]/components/DeliveryLog"
import { MOCK_WEBHOOKS, MOCK_DELIVERY_LOGS } from "@/app/webhooks/mock-data"
import type { Webhook } from "@/app/webhooks/types"

// ── Mocks ─────────────────────────────────────────────────────────────────
jest.mock("next/navigation", () => ({
  usePathname: () => "/webhooks",
  useRouter: () => ({ push: jest.fn() }),
  useParams: () => ({ id: "wh_001" }),
}))

jest.mock("next/link", () => {
  const MockLink = ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
  MockLink.displayName = "MockLink"
  return MockLink
})

// ── WebhookTable ───────────────────────────────────────────────────────────
describe("WebhookTable", () => {
  const mockDelete = jest.fn()
  const mockTest = jest.fn()

  it("renders one row per webhook", () => {
    render(
      <WebhookTable
        webhooks={MOCK_WEBHOOKS}
        onDelete={mockDelete}
        onTest={mockTest}
      />
    )
    expect(screen.getAllByRole("link").length).toBeGreaterThanOrEqual(MOCK_WEBHOOKS.length)
  })

  it("shows ACTIVE status badge for active webhooks", () => {
    render(
      <WebhookTable webhooks={MOCK_WEBHOOKS} onDelete={mockDelete} onTest={mockTest} />
    )
    expect(screen.getAllByText("ACTIVE").length).toBeGreaterThanOrEqual(1)
  })

  it("shows FAILED status badge", () => {
    render(
      <WebhookTable webhooks={MOCK_WEBHOOKS} onDelete={mockDelete} onTest={mockTest} />
    )
    expect(screen.getAllByText("FAILED").length).toBeGreaterThanOrEqual(1)
  })

  it("shows empty state when no webhooks", () => {
    render(
      <WebhookTable webhooks={[]} onDelete={mockDelete} onTest={mockTest} />
    )
    expect(screen.getByText("NO_SUBSCRIPTIONS_FOUND")).toBeInTheDocument()
  })

  it("calls onDelete when trash button is clicked", () => {
    render(
      <WebhookTable
        webhooks={[MOCK_WEBHOOKS[0]]}
        onDelete={mockDelete}
        onTest={mockTest}
      />
    )
    fireEvent.click(screen.getAllByTitle("Delete webhook")[0])
    expect(mockDelete).toHaveBeenCalledWith(MOCK_WEBHOOKS[0].id)
  })

  it("calls onTest when test button is clicked", () => {
    render(
      <WebhookTable
        webhooks={[MOCK_WEBHOOKS[0]]}
        onDelete={mockDelete}
        onTest={mockTest}
      />
    )
    fireEvent.click(screen.getAllByTitle("Test webhook")[0])
    expect(mockTest).toHaveBeenCalledWith(MOCK_WEBHOOKS[0].id)
  })

  it("shows test result inline when testResult matches", () => {
    render(
      <WebhookTable
        webhooks={[MOCK_WEBHOOKS[0]]}
        onDelete={mockDelete}
        onTest={mockTest}
        testResult={{ id: MOCK_WEBHOOKS[0].id, ok: true, code: 200 }}
      />
    )
    expect(screen.getAllByText(/TEST_OK/).length).toBeGreaterThanOrEqual(1)
  })

  // ── Responsive / mobile ──────────────────────────────────────────────────

  it("renders mobile card list container", () => {
    render(
      <WebhookTable webhooks={MOCK_WEBHOOKS} onDelete={mockDelete} onTest={mockTest} />
    )
    expect(screen.getByTestId("webhook-mobile-list")).toBeInTheDocument()
  })

  it("renders desktop table container", () => {
    render(
      <WebhookTable webhooks={MOCK_WEBHOOKS} onDelete={mockDelete} onTest={mockTest} />
    )
    expect(screen.getByTestId("webhook-desktop-table")).toBeInTheDocument()
  })

  it("renders one mobile card per webhook", () => {
    render(
      <WebhookTable webhooks={MOCK_WEBHOOKS} onDelete={mockDelete} onTest={mockTest} />
    )
    expect(screen.getAllByTestId("webhook-card")).toHaveLength(MOCK_WEBHOOKS.length)
  })

  it("mobile card shows expand/collapse button", () => {
    render(
      <WebhookTable
        webhooks={[MOCK_WEBHOOKS[0]]}
        onDelete={mockDelete}
        onTest={mockTest}
      />
    )
    expect(screen.getByLabelText("Expand details")).toBeInTheDocument()
  })

  it("mobile card expands to show details on toggle", () => {
    render(
      <WebhookTable
        webhooks={[MOCK_WEBHOOKS[0]]}
        onDelete={mockDelete}
        onTest={mockTest}
      />
    )
    const expandBtn = screen.getByLabelText("Expand details")
    fireEvent.click(expandBtn)
    expect(screen.getByLabelText("Collapse details")).toBeInTheDocument()
    // After expand, action buttons appear in the card
    expect(screen.getAllByTitle("Delete webhook").length).toBeGreaterThanOrEqual(1)
  })

  it("mobile action buttons have touch-friendly size (min-h-[44px])", () => {
    render(
      <WebhookTable
        webhooks={[MOCK_WEBHOOKS[0]]}
        onDelete={mockDelete}
        onTest={mockTest}
      />
    )
    fireEvent.click(screen.getByLabelText("Expand details"))
    const deleteBtn = screen.getAllByTitle("Delete webhook")[0]
    expect(deleteBtn.className).toMatch(/min-h-\[44px\]/)
  })
})

// ── CreateWebhookModal ─────────────────────────────────────────────────────
describe("CreateWebhookModal", () => {
  const mockClose = jest.fn()
  const mockCreate = jest.fn()

  it("renders all form fields when open", () => {
    render(
      <CreateWebhookModal isOpen onClose={mockClose} onCreate={mockCreate} />
    )
    expect(screen.getByPlaceholderText(/https:\/\/yourapp.io/)).toBeInTheDocument()
    expect(screen.getByText("ALL")).toBeInTheDocument()
    expect(screen.getByText("SWAP_COMPLETE")).toBeInTheDocument()
  })

  it("does not render when closed", () => {
    render(
      <CreateWebhookModal isOpen={false} onClose={mockClose} onCreate={mockCreate} />
    )
    expect(screen.queryByPlaceholderText(/https:\/\/yourapp.io/)).not.toBeInTheDocument()
  })

  it("shows URL validation error on invalid input + blur", () => {
    render(
      <CreateWebhookModal isOpen onClose={mockClose} onCreate={mockCreate} />
    )
    const input = screen.getByPlaceholderText(/https:\/\/yourapp.io/)
    fireEvent.change(input, { target: { value: "not-a-url" } })
    fireEvent.blur(input)
    expect(screen.getByText(/valid https:\/\//)).toBeInTheDocument()
  })

  it("shows no error for a valid URL", () => {
    render(
      <CreateWebhookModal isOpen onClose={mockClose} onCreate={mockCreate} />
    )
    const input = screen.getByPlaceholderText(/https:\/\/yourapp.io/)
    fireEvent.change(input, { target: { value: "https://example.com/hook" } })
    fireEvent.blur(input)
    expect(screen.queryByText(/valid https:\/\//)).not.toBeInTheDocument()
  })

  it("renders ACTIVE and SUSPENDED status radio options", () => {
    render(
      <CreateWebhookModal isOpen onClose={mockClose} onCreate={mockCreate} />
    )
    expect(screen.getByText("ACTIVE")).toBeInTheDocument()
    expect(screen.getByText("SUSPENDED")).toBeInTheDocument()
  })

  it("shows timeout validation error on invalid input + blur", () => {
    render(
      <CreateWebhookModal isOpen onClose={mockClose} onCreate={mockCreate} />
    )
    const timeoutInput = screen.getByLabelText("REQUEST_TIMEOUT (seconds)") as HTMLInputElement
    fireEvent.change(timeoutInput, { target: { value: "3" } })
    fireEvent.blur(timeoutInput)
    expect(screen.getByText(/Timeout must be a whole number between 5 and 60 seconds./)).toBeInTheDocument()
  })

  it("accepts a valid timeout value", () => {
    render(
      <CreateWebhookModal isOpen onClose={mockClose} onCreate={mockCreate} />
    )
    const timeoutInput = screen.getByLabelText("REQUEST_TIMEOUT (seconds)") as HTMLInputElement
    fireEvent.change(timeoutInput, { target: { value: "35" } })
    fireEvent.blur(timeoutInput)
    expect(screen.queryByText(/Timeout must be a whole number between 5 and 60 seconds./)).not.toBeInTheDocument()
  })

  it("submits valid timeout value when creating a webhook", async () => {
    render(
      <CreateWebhookModal isOpen onClose={mockClose} onCreate={mockCreate} />
    )

    const urlInput = screen.getByPlaceholderText(/https:\/\/yourapp.io\/webhook/)
    fireEvent.change(urlInput, { target: { value: "https://example.com/hook" } })
    fireEvent.blur(urlInput)

    const timeoutInput = screen.getByLabelText("REQUEST_TIMEOUT (seconds)") as HTMLInputElement
    fireEvent.change(timeoutInput, { target: { value: "45" } })
    fireEvent.blur(timeoutInput)

    fireEvent.click(screen.getByText("CREATE_WEBHOOK"))

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        url: "https://example.com/hook",
        eventTypes: ["ALL"],
        contractFilter: undefined,
        status: "ACTIVE",
        timeoutSeconds: 45,
        filterExpression: undefined,
      })
    }, { timeout: 1200 })
  })

  it("displays timeout explanation text", () => {
    render(
      <CreateWebhookModal isOpen onClose={mockClose} onCreate={mockCreate} />
    )
    expect(screen.getByText(/Maximum time to wait for webhook response/)).toBeInTheDocument()
  })

  it("shows timeout quick suggestion buttons", () => {
    render(
      <CreateWebhookModal isOpen onClose={mockClose} onCreate={mockCreate} />
    )
    const suggestionButtons = screen.getAllByRole("button").filter((btn) =>
      ["10s", "20s", "30s", "45s", "60s"].includes(btn.textContent || "")
    )
    expect(suggestionButtons).toHaveLength(5)
  })

  it("sets timeout value when suggestion button is clicked", () => {
    render(
      <CreateWebhookModal isOpen onClose={mockClose} onCreate={mockCreate} />
    )
    const suggestionButton = screen.getByRole("button", { name: "45s" })
    fireEvent.click(suggestionButton)
    const timeoutInput = screen.getByLabelText("REQUEST_TIMEOUT (seconds)") as HTMLInputElement
    expect(timeoutInput.value).toBe("45")
  })

  it("validates timeout at minimum boundary (5 seconds)", () => {
    render(
      <CreateWebhookModal isOpen onClose={mockClose} onCreate={mockCreate} />
    )
    const timeoutInput = screen.getByLabelText("REQUEST_TIMEOUT (seconds)") as HTMLInputElement
    fireEvent.change(timeoutInput, { target: { value: "5" } })
    fireEvent.blur(timeoutInput)
    expect(screen.queryByText(/Timeout must be a whole number between 5 and 60 seconds./)).not.toBeInTheDocument()
  })

  it("validates timeout at maximum boundary (60 seconds)", () => {
    render(
      <CreateWebhookModal isOpen onClose={mockClose} onCreate={mockCreate} />
    )
    const timeoutInput = screen.getByLabelText("REQUEST_TIMEOUT (seconds)") as HTMLInputElement
    fireEvent.change(timeoutInput, { target: { value: "60" } })
    fireEvent.blur(timeoutInput)
    expect(screen.queryByText(/Timeout must be a whole number between 5 and 60 seconds./)).not.toBeInTheDocument()
  })

  it("rejects timeout below minimum (4 seconds)", () => {
    render(
      <CreateWebhookModal isOpen onClose={mockClose} onCreate={mockCreate} />
    )
    const timeoutInput = screen.getByLabelText("REQUEST_TIMEOUT (seconds)") as HTMLInputElement
    fireEvent.change(timeoutInput, { target: { value: "4" } })
    fireEvent.blur(timeoutInput)
    expect(screen.getByText(/Timeout must be a whole number between 5 and 60 seconds./)).toBeInTheDocument()
  })

  it("rejects timeout above maximum (61 seconds)", () => {
    render(
      <CreateWebhookModal isOpen onClose={mockClose} onCreate={mockCreate} />
    )
    const timeoutInput = screen.getByLabelText("REQUEST_TIMEOUT (seconds)") as HTMLInputElement
    fireEvent.change(timeoutInput, { target: { value: "61" } })
    fireEvent.blur(timeoutInput)
    expect(screen.getByText(/Timeout must be a whole number between 5 and 60 seconds./)).toBeInTheDocument()
  })
})

// ── WebhookDetailPage ───────────────────────────────────────────────────────
describe("WebhookDetailPage", () => {
  it("renders timeout editor and updates the configured timeout", () => {
    render(<WebhookDetailPage />)
    const timeoutInput = screen.getByLabelText("REQUEST_TIMEOUT (seconds)") as HTMLInputElement

    expect(timeoutInput.value).toBe("30")

    fireEvent.change(timeoutInput, { target: { value: "25" } })
    fireEvent.blur(timeoutInput)
    fireEvent.click(screen.getByText("SAVE"))

    expect(screen.queryByText(/Timeout must be between 5 and 60 seconds./)).not.toBeInTheDocument()
    expect(screen.getByText("Timeout updated successfully.")).toBeInTheDocument()
    expect(screen.getByText("25s")).toBeInTheDocument()
  })

  it("prevents saving an out-of-range timeout", () => {
    render(<WebhookDetailPage />)
    const timeoutInput = screen.getByLabelText("REQUEST_TIMEOUT (seconds)") as HTMLInputElement

    fireEvent.change(timeoutInput, { target: { value: "2" } })
    fireEvent.blur(timeoutInput)
    fireEvent.click(screen.getByText("SAVE"))

    expect(screen.getByText(/Timeout must be between 5 and 60 seconds./)).toBeInTheDocument()
  })
})

// ── DeliveryLog ────────────────────────────────────────────────────────────
describe("DeliveryLog", () => {
  const logs = MOCK_DELIVERY_LOGS.filter((l) => l.webhookId === "wh_001")

  it("renders the heading", () => {
    render(<DeliveryLog logs={logs} />)
    expect(screen.getByText("[DELIVERY_LOGS]")).toBeInTheDocument()
  })

  it("renders column headers", () => {
    render(<DeliveryLog logs={logs} />)
    expect(screen.getByText("TIMESTAMP")).toBeInTheDocument()
    expect(screen.getByText("STATUS")).toBeInTheDocument()
    expect(screen.getByText("ATTEMPT")).toBeInTheDocument()
  })

  it("renders filter buttons", () => {
    render(<DeliveryLog logs={logs} />)
    expect(screen.getByRole("button", { name: "ALL" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "2xx" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "4xx" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "5xx" })).toBeInTheDocument()
  })

  it("filters to 2xx only when 2xx button clicked", () => {
    render(<DeliveryLog logs={logs} />)
    const btn = screen.getByRole("button", { name: "2xx" })
    fireEvent.click(btn)
    const statusCells = screen.queryAllByText(/^[45]\d\d$/)
    expect(statusCells).toHaveLength(0)
  })

  it("shows empty state message when no logs match filter", () => {
    const emptyWebhook: Webhook = { ...MOCK_WEBHOOKS[0], id: "wh_empty" }
    void emptyWebhook
    render(<DeliveryLog logs={[]} />)
    expect(screen.getByText(/NO_LOGS_FOUND/)).toBeInTheDocument()
  })
})
