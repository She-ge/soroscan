import { render } from "@testing-library/react"
import { WebVitalsReporter } from "@/components/WebVitalsReporter"

const useReportWebVitalsMock = jest.fn()
jest.mock("next/web-vitals", () => ({
  useReportWebVitals: (fn: unknown) => useReportWebVitalsMock(fn),
}))
jest.mock("@/lib/web-vitals", () => ({
  reportWebVitals: jest.fn(),
}))

describe("WebVitalsReporter", () => {
  it("wires reportWebVitals into useReportWebVitals and renders nothing", () => {
    const { reportWebVitals } = jest.requireMock("@/lib/web-vitals")
    const { container } = render(<WebVitalsReporter />)

    expect(useReportWebVitalsMock).toHaveBeenCalledWith(reportWebVitals)
    expect(container).toBeEmptyDOMElement()
  })
})
