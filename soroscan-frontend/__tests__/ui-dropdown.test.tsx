import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"

import { Dropdown, type DropdownOption } from "@/components/ui/dropdown"

const options: DropdownOption[] = [
  { label: "Alpha", value: "alpha" },
  { label: "Bravo", value: "bravo", disabled: true },
  { label: "Charlie", value: "charlie" },
]

function ControlledDropdown() {
  const [value, setValue] = React.useState<string | undefined>()

  return (
    <Dropdown
      options={options}
      value={value}
      onChange={setValue}
      placeholder="Choose one"
    />
  )
}

describe("Dropdown", () => {
  it("opens and closes on click", () => {
    render(<ControlledDropdown />)

    const trigger = screen.getByRole("combobox")

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()

    fireEvent.click(trigger)
    expect(screen.getByRole("listbox")).toBeInTheDocument()
    expect(trigger).toHaveAttribute("aria-expanded", "true")

    fireEvent.click(trigger)
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    expect(trigger).toHaveAttribute("aria-expanded", "false")
  })

  it("renders the options list", () => {
    render(<ControlledDropdown />)

    fireEvent.click(screen.getByRole("combobox"))

    expect(screen.getByRole("option", { name: "Alpha" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Bravo" })).toHaveAttribute(
      "aria-disabled",
      "true"
    )
    expect(screen.getByRole("option", { name: "Charlie" })).toBeInTheDocument()
  })

  it("supports arrow key navigation and enter selection", () => {
    render(<ControlledDropdown />)

    const trigger = screen.getByRole("combobox")

    fireEvent.keyDown(trigger, { key: "ArrowDown" })
    expect(screen.getByRole("listbox")).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Alpha" })).toHaveAttribute(
      "data-highlighted",
      "true"
    )

    fireEvent.keyDown(trigger, { key: "ArrowDown" })
    expect(screen.getByRole("option", { name: "Charlie" })).toHaveAttribute(
      "data-highlighted",
      "true"
    )

    fireEvent.keyDown(trigger, { key: "Enter" })

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
    expect(trigger).toHaveTextContent("Charlie")
  })

  it("updates aria-activedescendant when navigating options", () => {
    render(<ControlledDropdown />)

    const trigger = screen.getByRole("combobox")

    fireEvent.keyDown(trigger, { key: "ArrowDown" })
    const alphaOption = screen.getByRole("option", { name: "Alpha" })
    expect(trigger).toHaveAttribute(
      "aria-activedescendant",
      alphaOption.id
    )

    fireEvent.keyDown(trigger, { key: "ArrowDown" })
    const charlieOption = screen.getByRole("option", { name: "Charlie" })
    expect(trigger).toHaveAttribute(
      "aria-activedescendant",
      charlieOption.id
    )
  })

  it("closes on escape", () => {
    render(<ControlledDropdown />)

    const trigger = screen.getByRole("combobox")

    fireEvent.click(trigger)
    expect(screen.getByRole("listbox")).toBeInTheDocument()

    fireEvent.keyDown(trigger, { key: "Escape" })
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument()
  })

  it("does not allow disabled options to be selected", () => {
    const onChange = jest.fn()

    render(
      <Dropdown
        options={options}
        value={undefined}
        onChange={onChange}
        placeholder="Choose one"
      />
    )

    fireEvent.click(screen.getByRole("combobox"))
    fireEvent.click(screen.getByRole("option", { name: "Bravo" }))

    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole("listbox")).toBeInTheDocument()
  })
})
