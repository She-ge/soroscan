import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import "@testing-library/jest-dom"

import { Checkbox } from "@/components/ui/Checkbox"

interface CheckboxHarnessProps {
  disabled?: boolean
  initialChecked?: boolean
}

function CheckboxHarness({
  disabled = false,
  initialChecked = false,
}: CheckboxHarnessProps) {
  const [checked, setChecked] = React.useState(initialChecked)

  return (
    <Checkbox
      id="terms"
      label="Accept terms"
      checked={checked}
      disabled={disabled}
      onCheckedChange={setChecked}
    />
  )
}

describe("Checkbox", () => {
  it("renders an accessible unchecked state", () => {
    render(
      <Checkbox
        id="newsletter"
        label="Subscribe"
        checked={false}
        onCheckedChange={jest.fn()}
      />,
    )

    const input = screen.getByRole("checkbox", {
      name: "Subscribe",
    })

    expect(input).not.toBeChecked()
    expect(input).toHaveAttribute("aria-checked", "false")
    expect(input).toHaveAttribute("data-state", "unchecked")
    expect(
      screen.getByTestId("checkbox-indicator"),
    ).toHaveAttribute("data-state", "unchecked")
    expect(
      screen.queryByTestId("checked-icon"),
    ).not.toBeInTheDocument()
  })

  it("renders an accessible checked state", () => {
    render(
      <Checkbox
        id="newsletter"
        label="Subscribe"
        checked
        onCheckedChange={jest.fn()}
      />,
    )

    const input = screen.getByRole("checkbox", {
      name: "Subscribe",
    })

    expect(input).toBeChecked()
    expect(input).toHaveAttribute("aria-checked", "true")
    expect(input).toHaveAttribute("data-state", "checked")
    expect(
      screen.getByTestId("checkbox-indicator"),
    ).toHaveAttribute("data-state", "checked")
    expect(screen.getByTestId("checked-icon")).toBeInTheDocument()
  })

  it("associates the label and toggles when the label is clicked", async () => {
    const user = userEvent.setup()

    render(<CheckboxHarness />)

    const input = screen.getByRole("checkbox", {
      name: "Accept terms",
    })
    const label = screen.getByText("Accept terms").closest("label")

    expect(input).toHaveAttribute("id", "terms")
    expect(label).toHaveAttribute("for", "terms")
    expect(input).not.toBeChecked()

    await user.click(screen.getByText("Accept terms"))

    expect(input).toBeChecked()

    await user.click(screen.getByText("Accept terms"))

    expect(input).not.toBeChecked()
  })

  it("calls onCheckedChange with the next checked value", () => {
    const onCheckedChange = jest.fn()

    render(
      <Checkbox
        id="updates"
        label="Product updates"
        checked={false}
        onCheckedChange={onCheckedChange}
      />,
    )

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Product updates",
      }),
    )

    expect(onCheckedChange).toHaveBeenCalledTimes(1)
    expect(onCheckedChange).toHaveBeenCalledWith(true)
  })

  it("exposes the indeterminate state through ARIA and the DOM property", () => {
    render(
      <Checkbox
        id="filters"
        label="Select all"
        checked={false}
        indeterminate
        onCheckedChange={jest.fn()}
      />,
    )

    const input = screen.getByRole("checkbox", {
      name: "Select all",
    }) as HTMLInputElement

    expect(input).not.toBeChecked()
    expect(input.indeterminate).toBe(true)
    expect(input).toHaveAttribute("aria-checked", "mixed")
    expect(input).toHaveAttribute("data-state", "indeterminate")
    expect(
      screen.getByTestId("checkbox-indicator"),
    ).toHaveAttribute("data-state", "indeterminate")
    expect(
      screen.getByTestId("indeterminate-icon"),
    ).toBeInTheDocument()
  })

  it("can be focused and toggled using the Space key", async () => {
    const user = userEvent.setup()

    render(<CheckboxHarness />)

    const input = screen.getByRole("checkbox", {
      name: "Accept terms",
    })

    await user.tab()

    expect(input).toHaveFocus()

    await user.keyboard("[Space]")

    expect(input).toBeChecked()

    await user.keyboard("[Space]")

    expect(input).not.toBeChecked()
  })

  it("prevents mouse and keyboard interaction when disabled", async () => {
    const user = userEvent.setup()

    render(<CheckboxHarness disabled />)

    const input = screen.getByRole("checkbox", {
      name: "Accept terms",
    })
    const label = screen.getByText("Accept terms").closest("label")

    expect(input).toBeDisabled()
    expect(input).toHaveAttribute("aria-disabled", "true")
    expect(label).toHaveClass("cursor-not-allowed")

    await user.click(screen.getByText("Accept terms"))

    expect(input).not.toBeChecked()

    await user.tab()

    expect(input).not.toHaveFocus()
  })

  it("forwards additional ARIA attributes", () => {
    render(
      <Checkbox
        id="marketing"
        label="Marketing emails"
        checked={false}
        aria-describedby="marketing-description"
        onCheckedChange={jest.fn()}
      />,
    )

    const input = screen.getByRole("checkbox", {
      name: "Marketing emails",
    })

    expect(input).toHaveAttribute(
      "aria-describedby",
      "marketing-description",
    )
  })
})
