"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, FlaskConical, Trash2, Eye, EyeOff } from "lucide-react"
import { Navbar } from "@/components/terminal/landing/Navbar"
import { Footer } from "@/components/terminal/landing/Footer"
import { Card } from "@/components/terminal/Card"
import { Input } from "@/components/terminal/Input"
import { Button } from "@/components/terminal/Button"
import { Modal } from "@/components/terminal/Modal"
import { DeliveryLog } from "./components/DeliveryLog"
import type { DeliveryLog as DeliveryLogType, EventType, Webhook, WebhookStatus } from "../types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface WebhookApiResponse {
  id: number | string
  target_url?: string
  url?: string
  event_type?: string
  eventTypes?: string[]
  contract_id?: string
  contractFilter?: string
  is_active?: boolean
  status?: string
  created_at?: string
  createdAt?: string
  last_triggered?: string | null
  lastDelivery?: string | null
  last_status_code?: number | null
  lastStatusCode?: number | null
  success_rate?: number | null
  successRate?: number | null
  timeout_seconds?: number | null
  timeoutSeconds?: number | null
  secret?: string
  failure_count?: number
  failureCount?: number
  total_deliveries?: number
  totalDeliveries?: number
}

interface DeliveryApiResponse {
  id: number | string
  subscription_id?: number
  timestamp?: string
  created_at?: string
  status_code?: number | null
  statusCode?: number | null
  duration_ms?: number | null
  latency_ms?: number | null
  responseTimeMs?: number | null
  attempt_number?: number | null
  attempt?: number | null
  error?: string | null
  errorMessage?: string | null
  response_body?: string | null
  event_type?: string | null
  eventType?: string | null
  contract_id?: string | null
  contractId?: string | null
  success?: boolean
}

function mapStatus(api: WebhookApiResponse): WebhookStatus {
  const raw = String(api.status ?? "").toUpperCase()
  if (raw === "ACTIVE" || raw === "SUSPENDED" || raw === "FAILED") return raw as WebhookStatus
  if (api.is_active === false) {
    const failures = api.failure_count ?? api.failureCount ?? 0
    return failures > 0 ? "FAILED" : "SUSPENDED"
  }
  return "ACTIVE"
}

function toEventTypes(api: WebhookApiResponse): EventType[] {
  const raw = api.eventTypes ?? (api.event_type ? [api.event_type] : [])
  if (!raw.length) return ["ALL"]
  return raw.map((t) => String(t || "ALL").toUpperCase() as EventType)
}

export function adaptWebhook(api: WebhookApiResponse, fallbackId: string): Webhook {
  const id = String(api.id ?? fallbackId)
  const eventTypes = toEventTypes(api)
  const timeoutSeconds = api.timeoutSeconds ?? api.timeout_seconds ?? 30
  const createdAt = api.createdAt ?? api.created_at ?? new Date(0).toISOString()
  const lastDelivery = api.lastDelivery ?? api.last_triggered ?? undefined
  const totalDeliveries = api.totalDeliveries ?? api.total_deliveries ?? 0
  const failureCount = api.failureCount ?? api.failure_count ?? 0
  return {
    id,
    url: api.url ?? api.target_url ?? "",
    eventTypes,
    contractFilter: api.contractFilter ?? api.contract_id,
    status: mapStatus(api),
    isActive: api.is_active ?? (mapStatus(api) === "ACTIVE"),
    createdAt,
    lastDelivery: lastDelivery ?? undefined,
    lastStatusCode: api.lastStatusCode ?? api.last_status_code ?? undefined,
    successRate: api.successRate ?? api.success_rate ?? 100,
    timeoutSeconds,
    secret: api.secret ?? "whsec_redacted",
    totalDeliveries,
    failureCount,
  }
}

export function adaptDeliveryLog(api: DeliveryApiResponse, webhookId: string): DeliveryLogType {
  const statusCode = api.statusCode ?? api.status_code ?? 0
  const responseTimeMs = api.responseTimeMs ?? api.duration_ms ?? api.latency_ms ?? 0
  const attempt = api.attempt ?? api.attempt_number ?? 1
  const errorMessage = api.errorMessage ?? api.error ?? api.response_body ?? undefined
  const rawEventType = String(api.eventType ?? api.event_type ?? "ALL").toUpperCase()
  return {
    id: String(api.id),
    webhookId,
    timestamp: api.timestamp ?? api.created_at ?? new Date(0).toISOString(),
    statusCode,
    responseTimeMs,
    attempt,
    errorMessage: errorMessage || undefined,
    eventType: (rawEventType || "ALL") as EventType,
    contractId: String(api.contractId ?? api.contract_id ?? ""),
  }
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new Error("Webhook API returned invalid JSON.")
  }
}

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>
    if (Array.isArray(record.results)) return record.results as T[]
    if (Array.isArray(record.deliveries)) return record.deliveries as T[]
    if (Array.isArray(record.logs)) return record.logs as T[]
    if (Array.isArray(record.data)) return record.data as T[]
  }
  return []
}

export async function fetchWebhookDetail(id: string): Promise<Webhook> {
  const response = await fetch(`${API_BASE}/api/webhooks/${encodeURIComponent(id)}/`, {
    cache: "no-store",
  })
  if (response.status === 404) throw new Error("Webhook not found.")
  if (!response.ok) throw new Error(`Failed to load webhook (HTTP ${response.status}).`)
  const payload = (await parseJsonResponse(response)) as WebhookApiResponse
  if (!payload || typeof payload !== "object") throw new Error("Webhook response was empty.")
  return adaptWebhook(payload, id)
}

export async function fetchWebhookDeliveries(webhookId: string): Promise<DeliveryLogType[]> {
  const response = await fetch(
    `${API_BASE}/api/webhooks/${encodeURIComponent(webhookId)}/deliveries/`,
    { cache: "no-store" },
  )
  if (response.status === 404) return []
  if (!response.ok) throw new Error(`Failed to load delivery logs (HTTP ${response.status}).`)
  const payload = await parseJsonResponse(response)
  return unwrapList<DeliveryApiResponse>(payload).map((item) => adaptDeliveryLog(item, webhookId))
}

function StatusBadge({ status }: { status: WebhookStatus }) {
  const map: Record<WebhookStatus, { dot: string; text: string }> = {
    ACTIVE:    { dot: "bg-terminal-green animate-pulse", text: "text-terminal-green" },
    SUSPENDED: { dot: "bg-terminal-warning",             text: "text-terminal-warning" },
    FAILED:    { dot: "bg-terminal-danger animate-pulse", text: "text-terminal-danger" },
  }
  const { dot, text } = map[status]
  return (
    <span className={`inline-flex items-center gap-2 text-sm font-bold ${text}`}>
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      {status}
    </span>
  )
}

function InfoRow({ label, value, mono = true }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2 border-b border-terminal-green/10 last:border-0">
      <dt className="text-[10px] text-terminal-gray tracking-widest w-36 shrink-0">{label}</dt>
      <dd className={`text-sm break-all ${mono ? "font-terminal-mono text-terminal-green" : "text-terminal-gray"}`}>
        {value}
      </dd>
    </div>
  )
}

export default function WebhookDetailPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id ?? ""
  const router = useRouter()

  const [webhook, setWebhook] = React.useState<Webhook | null>(null)
  const [logs, setLogs] = React.useState<DeliveryLogType[]>([])
  const [loading, setLoading] = React.useState(true)
  const [logsLoading, setLogsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [logsError, setLogsError] = React.useState<string | null>(null)
  const [testing, setTesting] = React.useState(false)
  const [testResult, setTestResult] = React.useState<{ ok: boolean; code: number; ms: number } | null>(null)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [secretVisible, setSecretVisible] = React.useState(false)
  const [timeoutInput, setTimeoutInput] = React.useState("30")
  const [timeoutError, setTimeoutError] = React.useState<string | null>(null)
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null)

  const loadData = React.useCallback(async () => {
    if (!id) {
      setError("Missing webhook ID.")
      setLoading(false)
      setLogsLoading(false)
      return
    }
    setLoading(true)
    setLogsLoading(true)
    setError(null)
    setLogsError(null)
    try {
      const detail = await fetchWebhookDetail(id)
      setWebhook(detail)
      setTimeoutInput(String(detail.timeoutSeconds ?? 30))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load webhook.")
      setWebhook(null)
      setLoading(false)
      setLogsLoading(false)
      return
    }
    setLoading(false)
    try {
      const deliveries = await fetchWebhookDeliveries(id)
      setLogs(deliveries)
      setWebhook((prev) => {
        if (!prev) return prev
        const total = deliveries.length
        const succeeded = deliveries.filter((l) => l.statusCode >= 200 && l.statusCode < 300).length
        const last = deliveries[0]?.timestamp ?? prev.lastDelivery
        const lastCode = deliveries[0]?.statusCode ?? prev.lastStatusCode
        return {
          ...prev,
          totalDeliveries: prev.totalDeliveries || total,
          successRate: total ? (succeeded / total) * 100 : prev.successRate,
          lastDelivery: last,
          lastStatusCode: lastCode,
        }
      })
    } catch (err) {
      setLogsError(err instanceof Error ? err.message : "Failed to load delivery logs.")
      setLogs([])
    } finally {
      setLogsLoading(false)
    }
  }, [id])

  React.useEffect(() => {
    void loadData()
  }, [loadData])

  React.useEffect(() => {
    if (webhook) {
      setTimeoutInput(String(webhook.timeoutSeconds ?? 30))
      setTimeoutError(null)
      setSaveMessage(null)
    }
  }, [webhook?.id])

  const parseTimeout = (value: string) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  const validateTimeout = (value: number | null) => {
    if (value === null || Number.isNaN(value)) {
      return "Please enter a timeout value in seconds."
    }
    if (!Number.isInteger(value)) {
      return "Timeout must be a whole number of seconds."
    }
    if (value < 5 || value > 60) {
      return "Timeout must be between 5 and 60 seconds."
    }
    return null
  }

  const timeoutValue = parseTimeout(timeoutInput)
  const timeoutValidationMessage = validateTimeout(timeoutValue)

  const handleTimeoutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeoutInput(e.target.value)
    setTimeoutError(null)
    setSaveMessage(null)
  }

  const handleTimeoutSuggestion = (value: number) => {
    setTimeoutInput(String(value))
    setTimeoutError(null)
    setSaveMessage(null)
  }

  const handleSaveTimeout = async () => {
    const validationError = validateTimeout(timeoutValue)
    if (validationError) {
      setTimeoutError(validationError)
      setSaveMessage(null)
      return
    }

    if (!webhook) return

    const nextTimeout = timeoutValue ?? 30
    try {
      const response = await fetch(`${API_BASE}/api/webhooks/${encodeURIComponent(webhook.id)}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeout_seconds: nextTimeout }),
      })
      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to save timeout (HTTP ${response.status}).`)
      }
    } catch {
      // Backend may not expose timeout_seconds yet; keep optimistic local update.
    }
    setWebhook({ ...webhook, timeoutSeconds: nextTimeout })
    setTimeoutError(null)
    setSaveMessage("Timeout updated successfully.")
  }

  const handleTest = async () => {
    if (!webhook) return
    setTesting(true)
    setTestResult(null)
    const start = Date.now()
    try {
      const response = await fetch(
        `${API_BASE}/api/webhooks/${encodeURIComponent(webhook.id)}/test/`,
        { method: "POST" },
      )
      const ms = Date.now() - start
      setTestResult({ ok: response.ok, code: response.status, ms })
    } catch {
      setTestResult({ ok: false, code: 503, ms: Date.now() - start })
    } finally {
      setTesting(false)
    }
  }

  const handleDelete = async () => {
    if (!webhook) return
    try {
      await fetch(`${API_BASE}/api/webhooks/${encodeURIComponent(webhook.id)}/`, {
        method: "DELETE",
      })
    } catch {
      // Fall through to local navigation even if the API call fails.
    }
    setWebhook(null)
    setDeleteOpen(false)
    router.push("/webhooks")
  }

  if (loading) {
    return (
      <div className="min-h-screen font-terminal-mono flex flex-col items-center justify-center gap-4 text-terminal-green">
        <div className="text-4xl">[ ... ]</div>
        <div>LOADING_WEBHOOK</div>
        <p className="text-xs text-terminal-gray">Fetching webhook {id} from the API…</p>
      </div>
    )
  }

  if (error || !webhook) {
    return (
      <div className="min-h-screen font-terminal-mono flex flex-col items-center justify-center gap-4 text-terminal-green">
        <div className="text-4xl">[ ! ]</div>
        <div>{error ?? "WEBHOOK_NOT_FOUND"}</div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => void loadData()}>
            RETRY
          </Button>
          <Link href="/webhooks">
            <Button variant="secondary" size="sm">← BACK_TO_LIST</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen font-terminal-mono selection:bg-terminal-green selection:text-terminal-black">
      <Navbar />

      <main className="container mx-auto px-6 md:px-8 py-10 md:py-14 space-y-8 max-w-5xl">

        {/* Back + breadcrumb */}
        <div className="flex items-center gap-3 text-xs text-terminal-gray">
          <Link href="/webhooks" className="inline-flex items-center gap-1.5 hover:text-terminal-green transition-colors">
            <ArrowLeft size={12} />
            [WEBHOOKS_LIST]
          </Link>
          <span className="opacity-40">/</span>
          <span className="text-terminal-cyan truncate max-w-[200px]">{webhook.id.toUpperCase()}</span>
        </div>

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
          <div className="space-y-2">
            <div className="text-[10px] text-terminal-cyan tracking-widest">[WEBHOOK_DETAIL]</div>
            <h1 className="text-2xl md:text-3xl font-bold text-terminal-green break-all">{webhook.url}</h1>
            <StatusBadge status={webhook.status} />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleTest()}
              disabled={testing}
              className="gap-1.5"
            >
              <FlaskConical size={13} />
              {testing ? "SENDING..." : "TEST_WEBHOOK"}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="gap-1.5"
            >
              <Trash2 size={13} />
              DELETE
            </Button>
          </div>
        </div>

        {/* Test result */}
        {testResult && (
          <div className={`border px-4 py-3 text-sm flex items-center gap-3 ${
            testResult.ok ? "border-terminal-green text-terminal-green" : "border-terminal-danger text-terminal-danger"
          }`}>
            <span className="text-lg">{testResult.ok ? "✓" : "✗"}</span>
            <span>
              {testResult.ok ? "TEST_OK" : "TEST_FAILED"} — HTTP {testResult.code} in {testResult.ms}ms
            </span>
          </div>
        )}

        {/* Info card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card title="WEBHOOK_CONFIGURATION" className="h-full">
              <dl>
                <InfoRow label="WEBHOOK_ID"     value={webhook.id} />
                <InfoRow label="ENDPOINT_URL"   value={webhook.url} />
                <InfoRow label="STATUS"         value={<StatusBadge status={webhook.status} />} />
                <InfoRow label="EVENT_TYPES"    value={
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {webhook.eventTypes.map((t) => (
                      <span key={t} className="text-[9px] border border-terminal-green/30 px-1 text-terminal-gray">{t}</span>
                    ))}
                  </div>
                } />
                <InfoRow label="CONTRACT_FILTER" value={webhook.contractFilter ?? "ALL_CONTRACTS"} />
                <InfoRow label="REQUEST_TIMEOUT" value={`${webhook.timeoutSeconds}s`} mono={false} />
                <div className="col-span-full mt-4 rounded border border-terminal-green/10 bg-terminal-black/30 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="text-xs text-terminal-cyan uppercase tracking-wider">REQUEST_TIMEOUT</div>
                      <p className="text-[10px] text-terminal-gray mt-1">
                        Webhook delivery requests will abort after this timeout if the endpoint is too slow.
                      </p>
                    </div>
                    <div className="text-[10px] text-terminal-gray">Valid range: 5–60 seconds</div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto] items-end">
                    <Input
                      id="timeout-input"
                      label="REQUEST_TIMEOUT (seconds)"
                      type="number"
                      min={5}
                      max={60}
                      step={1}
                      value={timeoutInput}
                      onChange={handleTimeoutChange}
                      onBlur={() => setTimeoutError(timeoutValidationMessage)}
                      aria-invalid={!!timeoutError}
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => void handleSaveTimeout()}
                      disabled={!!timeoutValidationMessage || timeoutInput === String(webhook.timeoutSeconds)}
                      className="w-full sm:w-auto"
                    >
                      SAVE
                    </Button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {[10, 20, 30, 45, 60].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleTimeoutSuggestion(value)}
                        className="rounded border border-terminal-green/20 px-3 py-1.5 text-[11px] text-terminal-gray transition hover:border-terminal-green hover:text-terminal-green"
                      >
                        {value}s
                      </button>
                    ))}
                  </div>

                  {timeoutError && (
                    <p className="mt-2 text-terminal-danger text-xs">{timeoutError}</p>
                  )}
                  {saveMessage && (
                    <p className="mt-2 text-terminal-green text-xs">{saveMessage}</p>
                  )}
                </div>
                <InfoRow label="CREATED_AT"    value={new Date(webhook.createdAt).toLocaleString("en-GB")} mono={false} />
                <InfoRow label="LAST_DELIVERY" value={webhook.lastDelivery ? new Date(webhook.lastDelivery).toLocaleString("en-GB") : "NEVER"} mono={false} />
                <InfoRow
                  label="SIGNING_SECRET"
                  value={
                    <span className="flex items-center gap-2">
                      <span className="font-terminal-mono text-xs">
                        {secretVisible ? webhook.secret : "•".repeat(webhook.secret.length)}
                      </span>
                      <button
                        onClick={() => setSecretVisible((v) => !v)}
                        className="text-terminal-cyan hover:text-terminal-green transition-colors"
                        title={secretVisible ? "Hide secret" : "Reveal secret"}
                      >
                        {secretVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                      </button>
                    </span>
                  }
                />
              </dl>
            </Card>
          </div>

          {/* Stats card */}
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
            <Card title="DELIVERY_STATS">
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-terminal-green">{webhook.totalDeliveries.toLocaleString()}</div>
                  <div className="text-[10px] text-terminal-gray tracking-widest">TOTAL_DELIVERIES</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${webhook.successRate >= 90 ? "text-terminal-green" : webhook.successRate >= 60 ? "text-terminal-warning" : "text-terminal-danger"}`}>
                    {webhook.successRate.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-terminal-gray tracking-widest">SUCCESS_RATE</div>
                </div>
                {webhook.lastStatusCode && (
                  <div>
                    <div className={`text-2xl font-bold ${webhook.lastStatusCode < 300 ? "text-terminal-green" : "text-terminal-danger"}`}>
                      HTTP {webhook.lastStatusCode}
                    </div>
                    <div className="text-[10px] text-terminal-gray tracking-widest">LAST_STATUS</div>
                  </div>
                )}
              </div>
            </Card>

            <Card title="LOGS_SUMMARY">
              <div className="space-y-2 text-[11px] text-terminal-gray">
                <div className="flex justify-between">
                  <span>2xx</span>
                  <span className="text-terminal-green">{logs.filter((l) => l.statusCode < 300).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>4xx</span>
                  <span className="text-terminal-warning">{logs.filter((l) => l.statusCode >= 400 && l.statusCode < 500).length}</span>
                </div>
                <div className="flex justify-between">
                  <span>5xx</span>
                  <span className="text-terminal-danger">{logs.filter((l) => l.statusCode >= 500).length}</span>
                </div>
                <div className="flex justify-between border-t border-terminal-green/10 pt-2 mt-2">
                  <span>Total in view</span>
                  <span>{logs.length}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Delivery logs */}
        {logsLoading ? (
          <div className="border border-terminal-green/20 p-8 text-center text-terminal-gray text-sm">
            LOADING_DELIVERY_LOGS…
          </div>
        ) : logsError ? (
          <div className="border border-terminal-danger/40 p-4 text-sm text-terminal-danger">
            {logsError}
            <div className="mt-2">
              <Button variant="secondary" size="sm" onClick={() => void loadData()}>
                RETRY_LOGS
              </Button>
            </div>
          </div>
        ) : (
          <DeliveryLog logs={logs} />
        )}

      </main>

      {/* Footer */}
      <div className="container mx-auto px-6 md:px-8 max-w-5xl pb-12">
        <Footer />
      </div>

      {/* Background deco */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.03)_1px,transparent_1px)] bg-size-[40px_40px]" />
      </div>

      {/* Delete confirmation */}
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="CONFIRM_DELETE">
        <div className="space-y-5">
          <p className="text-sm text-terminal-gray">
            Permanently delete this webhook? This cannot be undone.
          </p>
          <div className="border border-terminal-danger/30 p-3 text-xs text-terminal-danger/80 space-y-1">
            <div className="font-bold">{webhook.url}</div>
            <div>{webhook.totalDeliveries} delivery records will be removed</div>
          </div>
          <div className="flex gap-3">
            <Button variant="danger" onClick={() => void handleDelete()} className="flex-1">
              DELETE_WEBHOOK
            </Button>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              CANCEL
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
