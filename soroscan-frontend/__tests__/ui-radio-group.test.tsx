import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { RadioGroup } from "@/components/ui/radio-group"

const options = [
  { value: "daily", label: "Daily", description: "Every 24 hours" },
  { value: "weekly", label: "Weekly", description: "Every 7 days" },
  { value: "monthly", label: "Monthly", disabled: true },
]

describe("RadioGroup", () => {
  it("renders a radiogroup with options", () => {
    render(<RadioGroup options={options} name="Frequency" />)

    expect(screen.getByRole("radiogroup", { name: "Frequency" })).toBeInTheDocument()
    expect(screen.getAllByRole("radio")).toHaveLength(3)
  })

  it("supports uncontrolled selection", () => {
    render(<RadioGroup options={options} defaultValue="daily" />)

    const weekly = screen.getByRole("radio", { name: /weekly/i })
    fireEvent.click(weekly)

    expect(weekly).toHaveAttribute("aria-checked", "true")
    expect(screen.getByRole("radio", { name: /daily/i })).toHaveAttribute(
      "aria-checked",
      "false"
    )
  })

  it("calls onValueChange when clicked", () => {
    const onValueChange = jest.fn()
    render(<RadioGroup options={options} onValueChange={onValueChange} />)

    fireEvent.click(screen.getByRole("radio", { name: /daily/i }))
    expect(onValueChange).toHaveBeenCalledWith("daily")
  })

  it("supports controlled mode", () => {
    const { rerender } = render(<RadioGroup options={options} value="daily" />)
    expect(screen.getByRole("radio", { name: /daily/i })).toHaveAttribute("aria-checked", "true")

    rerender(<RadioGroup options={options} value="weekly" />)
    expect(screen.getByRole("radio", { name: /weekly/i })).toHaveAttribute(
      "aria-checked",
      "true"
    )
  })

  it("supports arrow key navigation", () => {
    render(<RadioGroup options={options} defaultValue="daily" />)

    const daily = screen.getByRole("radio", { name: /daily/i })
    daily.focus()
    fireEvent.keyDown(daily, { key: "ArrowDown" })

    expect(screen.getByRole("radio", { name: /weekly/i })).toHaveFocus()
    expect(screen.getByRole("radio", { name: /weekly/i })).toHaveAttribute(
      "aria-checked",
      "true"
    )
  })

  it("skips disabled options during keyboard navigation", () => {
    render(<RadioGroup options={options} defaultValue="weekly" />)

    const weekly = screen.getByRole("radio", { name: /weekly/i })
    weekly.focus()
    fireEvent.keyDown(weekly, { key: "ArrowDown" })

    expect(screen.getByRole("radio", { name: /daily/i })).toHaveFocus()
  })

  it("does not allow disabled options to be selected", () => {
    const onValueChange = jest.fn()
    render(<RadioGroup options={options} onValueChange={onValueChange} />)

    const monthly = screen.getByRole("radio", { name: /monthly/i })
    expect(monthly).toBeDisabled()
    fireEvent.click(monthly)

    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("applies horizontal orientation and size styles", () => {
    render(<RadioGroup options={options} orientation="horizontal" size="lg" />)

    expect(screen.getByRole("radiogroup")).toHaveClass("flex-row")
    expect(screen.getByRole("radio", { name: /daily/i })).toHaveClass("px-5", "py-4")
  })
})
