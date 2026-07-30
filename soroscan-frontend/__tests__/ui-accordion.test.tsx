import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { Accordion } from "@/components/ui/accordion"

const items = [
  {
    id: "overview",
    title: "Overview",
    content: <p>Overview content</p>,
  },
  {
    id: "details",
    title: "Details",
    content: <p>Details content</p>,
  },
]

describe("Accordion", () => {
  it("renders triggers and keeps panels collapsed by default", () => {
    render(<Accordion items={items} />)

    expect(screen.getByRole("button", { name: /overview/i })).toHaveAttribute(
      "aria-expanded",
      "false"
    )
    expect(screen.queryByText("Overview content")).not.toBeVisible()
  })

  it("opens and closes a panel when clicked", () => {
    render(<Accordion items={items} />)

    const trigger = screen.getByRole("button", { name: /overview/i })
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText("Overview content")).toBeVisible()

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "false")
  })

  it("supports single mode by default", () => {
    render(<Accordion items={items} />)

    fireEvent.click(screen.getByRole("button", { name: /overview/i }))
    fireEvent.click(screen.getByRole("button", { name: /details/i }))

    expect(screen.getByRole("button", { name: /overview/i })).toHaveAttribute(
      "aria-expanded",
      "false"
    )
    expect(screen.getByRole("button", { name: /details/i })).toHaveAttribute(
      "aria-expanded",
      "true"
    )
  })

  it("supports multiple open items", () => {
    render(<Accordion items={items} type="multiple" />)

    fireEvent.click(screen.getByRole("button", { name: /overview/i }))
    fireEvent.click(screen.getByRole("button", { name: /details/i }))

    expect(screen.getByRole("button", { name: /overview/i })).toHaveAttribute(
      "aria-expanded",
      "true"
    )
    expect(screen.getByRole("button", { name: /details/i })).toHaveAttribute(
      "aria-expanded",
      "true"
    )
  })

  it("honors defaultValue", () => {
    render(<Accordion items={items} defaultValue={["details"]} />)

    expect(screen.getByRole("button", { name: /details/i })).toHaveAttribute(
      "aria-expanded",
      "true"
    )
    expect(screen.getByText("Details content")).toBeVisible()
  })

  it("calls onValueChange with the next state", () => {
    const onValueChange = jest.fn()
    render(<Accordion items={items} onValueChange={onValueChange} />)

    fireEvent.click(screen.getByRole("button", { name: /overview/i }))
    expect(onValueChange).toHaveBeenLastCalledWith(["overview"])
  })

  it("supports controlled usage", () => {
    const { rerender } = render(<Accordion items={items} value={["overview"]} />)
    expect(screen.getByText("Overview content")).toBeVisible()

    rerender(<Accordion items={items} value={["details"]} />)
    expect(screen.queryByText("Overview content")).not.toBeVisible()
    expect(screen.getByText("Details content")).toBeVisible()
  })

  it("does not toggle disabled items", () => {
    render(
      <Accordion
        items={[
          ...items,
          { id: "disabled", title: "Disabled", content: <p>Disabled content</p>, disabled: true },
        ]}
      />
    )

    const disabledTrigger = screen.getByRole("button", { name: /disabled/i })
    expect(disabledTrigger).toBeDisabled()
    fireEvent.click(disabledTrigger)
    expect(disabledTrigger).toHaveAttribute("aria-expanded", "false")
  })

  it("applies size variants", () => {
    render(<Accordion items={items} size="lg" />)
    expect(screen.getByRole("button", { name: /overview/i })).toHaveClass("px-5", "py-4")
  })
})
