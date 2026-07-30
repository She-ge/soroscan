import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { Stepper } from "@/components/ui/stepper"

const items = [
  { id: "connect", title: "Connect contract", description: "Choose a source" },
  { id: "configure", title: "Configure filters", description: "Set event rules", optional: true },
  { id: "review", title: "Review", description: "Confirm settings" },
]

describe("Stepper", () => {
  it("renders all steps", () => {
    render(<Stepper items={items} currentStep={1} />)

    expect(screen.getByText("Connect contract")).toBeInTheDocument()
    expect(screen.getByText("Configure filters")).toBeInTheDocument()
    expect(screen.getByText("Review")).toBeInTheDocument()
  })

  it("marks the current step", () => {
    render(<Stepper items={items} currentStep={2} />)

    expect(screen.getByText("Configure filters").closest("li")).toHaveAttribute(
      "aria-current",
      "step"
    )
  })

  it("marks completed steps", () => {
    render(<Stepper items={items} currentStep={3} />)
    expect(screen.getByText("Connect contract").closest("li")).toHaveAttribute(
      "data-state",
      "complete"
    )
  })

  it("shows optional metadata", () => {
    render(<Stepper items={items} currentStep={1} />)
    expect(screen.getByText("(Optional)")).toBeInTheDocument()
  })

  it("calls onStepChange when clicking a step", () => {
    const onStepChange = jest.fn()
    render(<Stepper items={items} currentStep={1} onStepChange={onStepChange} />)

    fireEvent.click(screen.getByRole("button", { name: /review/i }))
    expect(onStepChange).toHaveBeenCalledWith(3)
  })

  it("does not allow disabled steps to be selected", () => {
    const onStepChange = jest.fn()
    render(
      <Stepper
        items={[...items, { id: "done", title: "Done", disabled: true }]}
        currentStep={1}
        onStepChange={onStepChange}
      />
    )

    const disabledStep = screen.getByRole("button", { name: /done/i })
    expect(disabledStep).toBeDisabled()
    fireEvent.click(disabledStep)
    expect(onStepChange).not.toHaveBeenCalled()
  })

  it("supports vertical orientation", () => {
    render(<Stepper items={items} currentStep={1} orientation="vertical" />)
    expect(screen.getByRole("list")).toHaveClass("flex-col")
  })

  it("applies size styles", () => {
    render(<Stepper items={items} currentStep={1} size="lg" />)
    expect(screen.getByRole("button", { name: /connect contract/i })).toHaveClass("text-base")
  })
})
