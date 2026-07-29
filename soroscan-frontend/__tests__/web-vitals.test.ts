import { reportWebVitals, sendMetricToEndpoint } from "@/lib/web-vitals"
import type { Metric } from "web-vitals"

const baseMetric: Metric = {
  name: "LCP",
  value: 1234,
  rating: "good",
  id: "v1-123",
  delta: 1234,
  entries: [],
  navigationType: "navigate",
}

describe("reportWebVitals", () => {
  afterEach(() => {
    jest.restoreAllMocks()
    delete process.env.NEXT_PUBLIC_WEB_VITALS_ENDPOINT
  })

  // NODE_ENV is statically inlined by next/jest's SWC transform (jest always
  // runs with NODE_ENV="test", i.e. !== "production"), so this exercises the
  // same "not production" branch real local/CI test runs take — the
  // production branch itself is covered directly via sendMetricToEndpoint
  // below, since that logic is NODE_ENV-independent.
  it("logs to the console outside production", () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {})

    reportWebVitals(baseMetric)

    expect(logSpy).toHaveBeenCalledWith(
      "[web-vitals] LCP",
      expect.objectContaining({ value: 1234, rating: "good", id: "v1-123" })
    )
  })

  it("does not throw when NEXT_PUBLIC_WEB_VITALS_ENDPOINT is unset", () => {
    delete process.env.NEXT_PUBLIC_WEB_VITALS_ENDPOINT
    expect(() => reportWebVitals(baseMetric)).not.toThrow()
  })
})

describe("sendMetricToEndpoint", () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("sends the metric via sendBeacon when available", () => {
    const beaconSpy = jest.fn()
    Object.defineProperty(window.navigator, "sendBeacon", {
      value: beaconSpy,
      configurable: true,
    })

    sendMetricToEndpoint("https://example.com/vitals", baseMetric)

    expect(beaconSpy).toHaveBeenCalledTimes(1)
    const [url, body] = beaconSpy.mock.calls[0]
    expect(url).toBe("https://example.com/vitals")
    expect(JSON.parse(body)).toEqual(
      expect.objectContaining({ name: "LCP", value: 1234, rating: "good", id: "v1-123" })
    )
  })

  it("falls back to fetch keepalive when sendBeacon is unavailable", () => {
    Object.defineProperty(window.navigator, "sendBeacon", {
      value: undefined,
      configurable: true,
    })
    const fetchSpy = jest.fn().mockResolvedValue(undefined)
    global.fetch = fetchSpy

    sendMetricToEndpoint("https://example.com/vitals", baseMetric)

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://example.com/vitals",
      expect.objectContaining({ method: "POST", keepalive: true })
    )
  })

  it("swallows a rejected fetch (dropped beacon must not affect the page)", async () => {
    Object.defineProperty(window.navigator, "sendBeacon", {
      value: undefined,
      configurable: true,
    })
    global.fetch = jest.fn().mockRejectedValue(new Error("network down"))

    expect(() => sendMetricToEndpoint("https://example.com/vitals", baseMetric)).not.toThrow()
  })
})
