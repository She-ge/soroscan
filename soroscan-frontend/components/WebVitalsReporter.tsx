"use client"

import { useReportWebVitals } from "next/web-vitals"
import { reportWebVitals } from "@/lib/web-vitals"

/** Wires next/web-vitals into lib/web-vitals.ts's reportWebVitals callback. */
export function WebVitalsReporter() {
  useReportWebVitals(reportWebVitals)
  return null
}
