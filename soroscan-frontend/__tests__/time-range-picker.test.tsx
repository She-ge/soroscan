import { render, screen, fireEvent } from "@testing-library/react"
import { TimeRangePicker } from "@/components/ui/TimeRangePicker"

const mockOnChange = jest.fn()

beforeEach(() => mockOnChange.mockClear())

describe("TimeRangePicker", () => {
  it("renders preset buttons", () => {
    render(<TimeRangePicker onChange={mockOnChange} />)
    expect(screen.getByText("Last 1h")).toBeInTheDocument()
    expect(screen.getByText("Last 24h")).toBeInTheDocument()
    expect(screen.getByText("Last 7d")).toBeInTheDocument()
    expect(screen.getByText("Last 30d")).toBeInTheDocument()
  })

  it("renders FROM and TO datetime inputs", () => {
    render(<TimeRangePicker onChange={mockOnChange} />)
    expect(screen.getByLabelText("From date and time")).toBeInTheDocument()
    expect(screen.getByLabelText("To date and time")).toBeInTheDocument()
  })

  it("renders timezone selector with UTC default", () => {
    render(<TimeRangePicker onChange={mockOnChange} />)
    const tzSelect = screen.getByLabelText("Timezone")
    expect(tzSelect).toBeInTheDocument()
    expect((tzSelect as HTMLSelectElement).value).toBe("UTC")
  })

  it("calls onChange when a preset is clicked", () => {
    render(<TimeRangePicker onChange={mockOnChange} />)
    fireEvent.click(screen.getByText("Last 1h"))
    expect(mockOnChange).toHaveBeenCalledTimes(1)
    const arg = mockOnChange.mock.calls[0][0]
    expect(arg).toHaveProperty("from")
    expect(arg).toHaveProperty("to")
    expect(arg.timezone).toBe("UTC")
    // from should be ~1h before to
    const diffMs = arg.to.getTime() - arg.from.getTime()
    expect(diffMs).toBeCloseTo(60 * 60 * 1000, -3)
  })

  it("calls onChange when timezone changes", () => {
    render(<TimeRangePicker onChange={mockOnChange} />)
    const tzSelect = screen.getByLabelText("Timezone")
    fireEvent.change(tzSelect, { target: { value: "Europe/London" } })
    expect(mockOnChange).toHaveBeenCalledTimes(1)
    expect(mockOnChange.mock.calls[0][0].timezone).toBe("Europe/London")
  })

  it("highlights active preset after clicking", () => {
    render(<TimeRangePicker onChange={mockOnChange} />)
    const btn = screen.getByText("Last 7d")
    fireEvent.click(btn)
    expect(btn.className).toMatch(/bg-terminal-green/)
  })

  it("shows UTC display below FROM input after preset click", () => {
    render(<TimeRangePicker onChange={mockOnChange} />)
    fireEvent.click(screen.getByText("Last 1h"))
    // UTC display should contain "UTC"
    const utcLabels = screen.getAllByText(/UTC/)
    expect(utcLabels.length).toBeGreaterThanOrEqual(1)
  })

  it("calls onChange when FROM input changes", () => {
    render(<TimeRangePicker onChange={mockOnChange} />)
    const fromInput = screen.getByLabelText("From date and time")
    fireEvent.change(fromInput, { target: { value: "2025-01-01T00:00" } })
    expect(mockOnChange).toHaveBeenCalled()
  })

  it("calls onChange when TO input changes", () => {
    render(<TimeRangePicker onChange={mockOnChange} />)
    const toInput = screen.getByLabelText("To date and time")
    fireEvent.change(toInput, { target: { value: "2025-01-02T00:00" } })
    expect(mockOnChange).toHaveBeenCalled()
  })

  it("accepts a value prop and reflects it", () => {
    const from = new Date("2025-06-01T10:00:00Z")
    const to   = new Date("2025-06-01T12:00:00Z")
    render(
      <TimeRangePicker
        value={{ from, to, timezone: "UTC" }}
        onChange={mockOnChange}
      />
    )
    const fromInput = screen.getByLabelText("From date and time") as HTMLInputElement
    expect(fromInput.value).toBe("2025-06-01T10:00")
  })
})
