import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"
import AccountSettings from "@/app/settings/components/AccountSettings"
import APIKeyManager from "@/app/settings/components/APIKeyManager"
import BillingOverview from "@/app/settings/components/BillingOverview"
import ComplianceSettings from "@/app/settings/components/ComplianceSettings"
import NotificationPrefs from "@/app/settings/components/NotificationPrefs"
import ThemeSelector from "@/app/settings/components/ThemeSelector"
import WebhookManager from "@/app/settings/components/WebhookManager"

jest.mock("@/components/compliance/ComplianceDashboard", () => ({
  __esModule: true,
  default: () => <div data-testid="compliance-dashboard" />,
}))

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove("dark")
})

describe("AccountSettings", () => {
  it("renders stored profile values and rows-per-page preference", () => {
    localStorage.setItem("account_display_name", "Ada")
    localStorage.setItem("account_contact_email", "ada@example.com")
    localStorage.setItem("display_prefs", JSON.stringify({ rowsPerPage: 25, fontSize: "sm" }))

    render(<AccountSettings />)

    expect(screen.getByLabelText("DISPLAY_NAME")).toHaveValue("Ada")
    expect(screen.getByLabelText("CONTACT_EMAIL")).toHaveValue("ada@example.com")
    expect(screen.getByText(/25 rows per view/)).toBeInTheDocument()
  })

  it("shows validation errors and does not save invalid input", async () => {
    const user = userEvent.setup()
    render(<AccountSettings />)

    await user.type(screen.getByLabelText("DISPLAY_NAME"), "A")
    await user.type(screen.getByLabelText("CONTACT_EMAIL"), "not-an-email")
    await user.click(screen.getByRole("button", { name: "SAVE ACCOUNT PROFILE" }))

    expect(screen.getByText("Name must be at least 2 characters")).toBeInTheDocument()
    expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    expect(localStorage.getItem("account_display_name")).toBeNull()
    expect(localStorage.getItem("account_contact_email")).toBeNull()
  })

  it("persists trimmed values on a valid save", async () => {
    const user = userEvent.setup()
    render(<AccountSettings />)

    await user.type(screen.getByLabelText("DISPLAY_NAME"), "  Ada  ")
    await user.type(screen.getByLabelText("CONTACT_EMAIL"), "ada@example.com")
    await user.click(screen.getByRole("button", { name: "SAVE ACCOUNT PROFILE" }))

    expect(localStorage.getItem("account_display_name")).toBe("Ada")
    expect(localStorage.getItem("account_contact_email")).toBe("ada@example.com")
    expect(screen.getByRole("button", { name: "✓ PROFILE SAVED" })).toBeInTheDocument()
  })
})

describe("ThemeSelector", () => {
  it("defaults to dark and applies the dark class", () => {
    render(<ThemeSelector />)

    expect(document.documentElement).toHaveClass("dark")
  })

  it("switches theme and persists the choice", async () => {
    const user = userEvent.setup()
    render(<ThemeSelector />)

    await user.click(screen.getByRole("button", { name: "◇ LIGHT" }))

    expect(localStorage.getItem("theme")).toBe("light")
    expect(document.documentElement).not.toHaveClass("dark")
  })
})

describe("NotificationPrefs", () => {
  it("renders default toggles and hides the webhook URL field", () => {
    render(<NotificationPrefs />)

    const toggles = screen.getAllByRole("button", { pressed: true })
    expect(toggles).toHaveLength(2)
    expect(screen.queryByPlaceholderText("https://your-webhook-url.com")).not.toBeInTheDocument()
  })

  it("saves toggled preferences including the webhook URL", async () => {
    const user = userEvent.setup()
    render(<NotificationPrefs />)

    const [emailToggle, , webhookToggle] = screen.getAllByRole("button", { name: /^(ON|OFF)$/ })
    await user.click(emailToggle)
    await user.click(webhookToggle)
    await user.type(screen.getByPlaceholderText("https://your-webhook-url.com"), "https://hooks.example.com")
    await user.click(screen.getByRole("button", { name: "SAVE PREFERENCES" }))

    expect(JSON.parse(localStorage.getItem("notificationPrefs") ?? "{}")).toEqual({
      email: false,
      inApp: true,
      webhook: true,
      webhookUrl: "https://hooks.example.com",
    })
    expect(screen.getByRole("button", { name: "✓ SAVED" })).toBeInTheDocument()
  })
})

describe("APIKeyManager", () => {
  it("shows the empty state when no keys exist", () => {
    render(<APIKeyManager />)

    expect(screen.getByText("No API keys yet.")).toBeInTheDocument()
  })

  it("generates and persists a new key", async () => {
    const user = userEvent.setup()
    render(<APIKeyManager />)

    await user.click(screen.getByRole("button", { name: "+ Generate New Key" }))

    const stored = JSON.parse(localStorage.getItem("apiKeys") ?? "[]")
    expect(stored).toHaveLength(1)
    expect(stored[0].key).toMatch(/^sk_live_[a-z0-9]{32}$/)
    expect(screen.queryByText("No API keys yet.")).not.toBeInTheDocument()
  })

  it("revokes a key only after confirmation", async () => {
    localStorage.setItem(
      "apiKeys",
      JSON.stringify([{ id: "1", key: "sk_live_abcdefghijklmnop", createdAt: "Jan 1, 2026" }])
    )
    const user = userEvent.setup()
    render(<APIKeyManager />)

    await user.click(screen.getByRole("button", { name: "DEL" }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }))
    expect(JSON.parse(localStorage.getItem("apiKeys") ?? "[]")).toHaveLength(1)

    await user.click(screen.getByRole("button", { name: "DEL" }))
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Revoke" }))

    expect(JSON.parse(localStorage.getItem("apiKeys") ?? "[]")).toEqual([])
    expect(screen.getByText("No API keys yet.")).toBeInTheDocument()
  })
})

describe("WebhookManager", () => {
  it("rejects an invalid URL", async () => {
    const user = userEvent.setup()
    render(<WebhookManager />)

    await user.type(screen.getByLabelText("WEBHOOK_URL"), "not-a-url")
    await user.click(screen.getByRole("button", { name: "+ Add Webhook" }))

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid webhook URL.")
    expect(localStorage.getItem("webhooks")).toBeNull()
  })

  it("adds, toggles and removes a webhook", async () => {
    const user = userEvent.setup()
    render(<WebhookManager />)

    expect(screen.getByRole("button", { name: "SAVE WEBHOOK SETTINGS" })).toBeDisabled()

    await user.type(screen.getByLabelText("WEBHOOK_URL"), "https://hooks.example.com/events")
    await user.click(screen.getByRole("button", { name: "+ Add Webhook" }))

    expect(screen.getByText("https://hooks.example.com/events")).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem("webhooks") ?? "[]")[0]).toMatchObject({
      url: "https://hooks.example.com/events",
      active: true,
    })

    await user.click(screen.getByRole("button", { name: "ACTIVE" }))
    expect(JSON.parse(localStorage.getItem("webhooks") ?? "[]")[0].active).toBe(false)

    await user.click(screen.getByRole("button", { name: "REMOVE" }))
    expect(JSON.parse(localStorage.getItem("webhooks") ?? "[]")).toEqual([])
    expect(screen.getByText("No webhook subscriptions configured yet.")).toBeInTheDocument()
  })
})

describe("BillingOverview", () => {
  it("falls back to the free plan", () => {
    render(<BillingOverview />)

    expect(screen.getByText("Plan: Free")).toBeInTheDocument()
    expect(screen.getByText("Payment: None")).toBeInTheDocument()
  })

  it("renders stored billing info", () => {
    localStorage.setItem("billing_info", JSON.stringify({ plan: "Pro", paymentMethod: "Visa •••• 4242" }))
    render(<BillingOverview />)

    expect(screen.getByText("Plan: Pro")).toBeInTheDocument()
    expect(screen.getByText("Payment: Visa •••• 4242")).toBeInTheDocument()
  })
})

describe("ComplianceSettings", () => {
  it("renders the section heading and compliance dashboard", () => {
    render(<ComplianceSettings />)

    expect(screen.getByRole("heading", { name: "Data Governance & Compliance" })).toBeInTheDocument()
    expect(screen.getByTestId("compliance-dashboard")).toBeInTheDocument()
  })
})
