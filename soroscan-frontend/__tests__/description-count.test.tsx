import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"
import { ContractForm } from "../app/contracts/[id]/components/ContractForm"

const mockContract = {
  contractId: "CA1234567890",
  name: "Test Contract",
  description: "",
  tags: [],
  status: "active",
}

describe("Description character count", () => {
  it("shows current/max character count and updates while typing", async () => {
    const user = userEvent.setup()
    render(
      <ContractForm
        contract={mockContract}
        onSave={async () => {}}
        onCancel={() => {}}
      />
    )

    const textarea = screen.getByPlaceholderText("Optional description...")
    expect(screen.getByText("0/256")).toBeInTheDocument()

    await user.type(textarea, "Hello")

    expect(screen.getByText("5/256")).toBeInTheDocument()
    expect(textarea).toHaveAttribute("maxLength", "256")
  })

  it("applies warning styling when the count is near limit", async () => {
    const user = userEvent.setup()
    render(
      <ContractForm
        contract={mockContract}
        onSave={async () => {}}
        onCancel={() => {}}
      />
    )

    const textarea = screen.getByPlaceholderText("Optional description...")
    const longText = "x".repeat(230)

    await user.type(textarea, longText)

    const counter = screen.getByText("230/256")
    expect(counter).toHaveClass("text-terminal-danger")
  })
})
