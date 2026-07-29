import type { Metric } from "web-vitals"

/** Sends a metric to the configured analytics endpoint via sendBeacon (falls back to fetch keepalive). */
export function sendMetricToEndpoint(endpoint: string, metric: Metric): void {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
    path: window.location.pathname,
  })

  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, body)
  } else {
    fetch(endpoint, { body, method: "POST", keepalive: true }).catch(() => {
      // Best-effort — a dropped metrics beacon must never affect the page.
    })
  }
}

/**
 * Reports Core Web Vitals (LCP, CLS, INP, plus FCP/TTFB) via
 * useReportWebVitals in app/layout.tsx.
 *
 * Dev: logged to the console. Prod: sent to NEXT_PUBLIC_WEB_VITALS_ENDPOINT
 * via sendMetricToEndpoint, if configured — a no-op otherwise, since this
 * repo has no analytics backend wired up yet.
 */
export function reportWebVitals(metric: Metric): void {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[web-vitals] ${metric.name}`, {
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
    })
    return
  }

  const endpoint = process.env.NEXT_PUBLIC_WEB_VITALS_ENDPOINT
  if (!endpoint || typeof window === "undefined") {
    return
  }

  sendMetricToEndpoint(endpoint, metric)
}
