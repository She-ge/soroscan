import { render, screen, fireEvent } from "@testing-library/react"
import { AdvancedFilterBuilder } from "@/components/ui/AdvancedFilterBuilder"

const FIELDS = ["contractId", "eventType", "ledger", "value"]
const mockOnChange = jest.fn()
const mockOnApply  = jest.fn()

beforeEach(() => {
  mockOnChange.mockClear()
  mockOnApply.mockClear()
  localStorage.clear()
})

function renderBuilder(overrides = {}) {
  return render(
    <AdvancedFilterBuilder
      fields={FIELDS}
      onChange={mockOnChange}
      onApply={mockOnApply}
      storageKey="test_filter_templates"
      {...overrides}
    />
  )
}

describe("AdvancedFilterBuilder", () => {
  it("renders the filter builder heading", () => {
    renderBuilder()
    expect(screen.getByText("[FILTER_BUILDER]")).toBeInTheDocument()
  })

  it("renders AND and OR logic buttons", () => {
    renderBuilder()
    expect(screen.getByRole("button", { name: "AND" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "OR" })).toBeInTheDocument()
  })

  it("defaults to AND logic", () => {
    renderBuilder()
    const andBtn = screen.getByRole("button", { name: "AND" })
    expect(andBtn).toHaveAttribute("aria-pressed", "true")
  })

  it("switches to OR logic when OR is clicked", () => {
    renderBuilder()
    fireEvent.click(screen.getByRole("button", { name: "OR" }))
    expect(screen.getByRole("button", { name: "OR" })).toHaveAttribute("aria-pressed", "true")
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ logic: "OR" }))
  })

  it("renders one condition row by default", () => {
    renderBuilder()
    expect(screen.getAllByTestId("filter-condition")).toHaveLength(1)
  })

  it("adds a condition when ADD_CONDITION is clicked", () => {
    renderBuilder()
    fireEvent.click(screen.getByText("+ ADD_CONDITION"))
    expect(screen.getAllByTestId("filter-condition")).toHaveLength(2)
    expect(mockOnChange).toHaveBeenCalled()
  })

  it("removes a condition when remove button is clicked", () => {
    renderBuilder()
    fireEvent.click(screen.getByText("+ ADD_CONDITION"))
    expect(screen.getAllByTestId("filter-condition")).toHaveLength(2)
    fireEvent.click(screen.getAllByLabelText("Remove condition")[0])
    expect(screen.getAllByTestId("filter-condition")).toHaveLength(1)
  })

  it("updates field select and calls onChange", () => {
    renderBuilder()
    const fieldSelect = screen.getAllByLabelText("Filter field")[0]
    fireEvent.change(fieldSelect, { target: { value: "eventType" } })
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: expect.arrayContaining([
          expect.objectContaining({ field: "eventType" }),
        ]),
      })
    )
  })

  it("updates operator select and calls onChange", () => {
    renderBuilder()
    const opSelect = screen.getAllByLabelText("Filter operator")[0]
    fireEvent.change(opSelect, { target: { value: "contains" } })
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: expect.arrayContaining([
          expect.objectContaining({ operator: "contains" }),
        ]),
      })
    )
  })

  it("updates value input and calls onChange", () => {
    renderBuilder()
    const valueInput = screen.getAllByLabelText("Filter value")[0]
    fireEvent.change(valueInput, { target: { value: "swap" } })
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        conditions: expect.arrayContaining([
          expect.objectContaining({ value: "swap" }),
        ]),
      })
    )
  })

  it("shows filter preview", () => {
    renderBuilder()
    expect(screen.getByTestId("filter-preview")).toBeInTheDocument()
  })

  it("preview updates when value changes", () => {
    renderBuilder()
    const valueInput = screen.getAllByLabelText("Filter value")[0]
    fireEvent.change(valueInput, { target: { value: "myvalue" } })
    expect(screen.getByTestId("filter-preview").textContent).toContain("myvalue")
  })

  it("calls onApply when APPLY is clicked", () => {
    renderBuilder()
    fireEvent.click(screen.getByRole("button", { name: "APPLY" }))
    expect(mockOnApply).toHaveBeenCalledTimes(1)
  })

  it("shows save input when SAVE button is clicked", () => {
    renderBuilder()
    fireEvent.click(screen.getByRole("button", { name: "SAVE" }))
    expect(screen.getByLabelText("Template name")).toBeInTheDocument()
  })

  it("saves a template and shows it in the list", () => {
    renderBuilder()
    fireEvent.click(screen.getByRole("button", { name: "SAVE" }))
    const nameInput = screen.getByLabelText("Template name")
    fireEvent.change(nameInput, { target: { value: "My Filter" } })
    // Click the second SAVE button (inside the save form)
    const saveBtns = screen.getAllByRole("button", { name: "SAVE" })
    fireEvent.click(saveBtns[saveBtns.length - 1])
    expect(screen.getByText("My Filter")).toBeInTheDocument()
  })

  it("loads a saved template when clicked", () => {
    // Pre-populate localStorage
    const template = {
      name: "Preset",
      group: { logic: "OR", conditions: [{ id: "x", field: "ledger", operator: "gt", value: "100" }] },
    }
    localStorage.setItem("test_filter_templates", JSON.stringify([template]))
    renderBuilder()
    fireEvent.click(screen.getByText("Preset"))
    expect(mockOnChange).toHaveBeenCalledWith(
      expect.objectContaining({ logic: "OR" })
    )
  })

  it("deletes a saved template", () => {
    const template = { name: "ToDelete", group: { logic: "AND", conditions: [] } }
    localStorage.setItem("test_filter_templates", JSON.stringify([template]))
    renderBuilder()
    expect(screen.getByText("ToDelete")).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText("Delete template ToDelete"))
    expect(screen.queryByText("ToDelete")).not.toBeInTheDocument()
  })
})
