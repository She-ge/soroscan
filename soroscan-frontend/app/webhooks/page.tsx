"use client"

import * as React from "react"
import { Plus, Activity, CheckCircle2, AlertTriangle } from "lucide-react"
import { Navbar } from "@/components/terminal/landing/Navbar"
import { Footer } from "@/components/terminal/landing/Footer"
import { Button } from "@/components/terminal/Button"
import { Modal } from "@/components/terminal/Modal"
import { WebhookTable } from "./components/WebhookTable"
import { CreateWebhookModal } from "./components/CreateWebhookModal"
import { MOCK_WEBHOOKS } from "./mock-data"
import type { Webhook } from "./types"

function generateId() {
  return `wh_${Math.random().toString(36).slice(2, 7)}`
}

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = React.useState<Webhook[]>(MOCK_WEBHOOKS)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null)
  const [testingId, setTestingId] = React.useState<string | null>(null)
  const [testResult, setTestResult] = React.useState<{ id: string; ok: boolean; code: number } | null>(null)
  const [toast, setToast] = React.useState<string | null>(null)

  // Stats
  const active  = webhooks.filter((w) => w.status === "ACTIVE").length
  const failed  = webhooks.filter((w) => w.status === "FAILED").length
  const avgRate = webhooks.length
    ? (webhooks.reduce((s, w) => s + w.successRate, 0) / webhooks.length).toFixed(1)
    : "0.0"
  const lastEvent = webhooks
    .map((w) => w.lastDelivery)
    .filter(Boolean)
    .sort()
    .at(-1)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleCreate = (data: Omit<Webhook, "id" | "createdAt" | "totalDeliveries" | "secret" | "successRate">) => {
    const newWh: Webhook = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      totalDeliveries: 0,
      successRate: 100,
      secret: `whsec_${Math.random().toString(36).slice(2, 14)}`,
    }
    setWebhooks((prev) => [newWh, ...prev])
    showToast("WEBHOOK_CREATED — subscription is now active")
  }

  const handleDelete = (id: string) => setDeleteTarget(id)

  const confirmDelete = () => {
    if (!deleteTarget) return
    setWebhooks((prev) => prev.filter((w) => w.id !== deleteTarget))
    setDeleteTarget(null)
    showToast("WEBHOOK_DELETED — subscription removed")
  }

  const handleTest = (id: string) => {
    setTestingId(id)
    setTestResult(null)
    setTimeout(() => {
      // Simulate: 80% success
      const ok = Math.random() > 0.2
      setTestResult({ id, ok, code: ok ? 200 : 503 })
      setTestingId(null)
      setTimeout(() => setTestResult(null), 4000)
    }, 1200)
  }

  const deleteWebhook = webhooks.find((w) => w.id === deleteTarget)

  return (
    <div className="min-h-screen font-terminal-mono selection:bg-terminal-green selection:text-terminal-black">
      <Navbar />

      <main className="container mx-auto px-6 md:px-8 py-10 md:py-14 space-y-8 max-w-7xl">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] text-terminal-cyan tracking-widest mb-1">[WEBHOOK_MANAGER]</div>
            <h1 className="text-3xl md:text-4xl font-bold text-terminal-green">
              SUBSCRIPTIONS
            </h1>
            <p className="text-terminal-gray text-xs mt-1">
              {webhooks.length} subscription{webhooks.length !== 1 ? "s" : ""} configured
            </p>
          </div>
          <Button
            data-tour="create-webhook"
            variant="primary"
            size="lg"
            onClick={() => setCreateOpen(true)}
            className="self-start sm:self-auto"
          >
            <Plus size={14} />
            NEW_WEBHOOK
          </Button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border border-terminal-green/20 p-4">
          <div className="text-center">
            <div className="text-terminal-green text-xl font-bold">{webhooks.length}</div>
            <div className="text-[9px] text-terminal-gray tracking-widest mt-0.5">TOTAL</div>
          </div>
          <div className="text-center">
            <div className="text-terminal-green text-xl font-bold flex items-center justify-center gap-1.5">
              <Activity size={14} className="animate-pulse" />
              {active}
            </div>
            <div className="text-[9px] text-terminal-gray tracking-widest mt-0.5">ACTIVE</div>
          </div>
          <div className="text-center">
            <div className={`text-xl font-bold flex items-center justify-center gap-1.5 ${failed > 0 ? "text-terminal-danger" : "text-terminal-green"}`}>
              {failed > 0 ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
              {failed}
            </div>
            <div className="text-[9px] text-terminal-gray tracking-widest mt-0.5">FAILED</div>
          </div>
          <div className="text-center">
            <div className="text-terminal-cyan text-xl font-bold">{avgRate}%</div>
            <div className="text-[9px] text-terminal-gray tracking-widest mt-0.5">AVG_SUCCESS</div>
          </div>
        </div>

        {/* Last event indicator */}
        {lastEvent && (
          <div className="text-[10px] text-terminal-gray flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse" />
            LAST_EVENT: {new Date(lastEvent).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "medium" })}
          </div>
        )}

        {/* Table */}
        <section className="space-y-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-terminal-green whitespace-nowrap">
              [WEBHOOK_LIST]
            </h2>
            <div className="h-[2px] w-full bg-terminal-green/20" />
          </div>
          <WebhookTable
            webhooks={webhooks}
            onDelete={handleDelete}
            onTest={handleTest}
            testingId={testingId}
            testResult={testResult}
          />
        </section>

      </main>

      {/* Footer */}
      <div className="container mx-auto px-6 md:px-8 max-w-7xl pb-12">
        <Footer />
      </div>

      {/* Background deco */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.03)_1px,transparent_1px)] bg-size-[40px_40px]" />
      </div>

      {/* Create modal */}
      <CreateWebhookModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />

      {/* Delete confirmation modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="CONFIRM_DELETE">
        <div className="space-y-6">
          <p className="text-sm text-terminal-gray">
            Are you sure you want to delete this webhook subscription?
          </p>
          {deleteWebhook && (
            <div className="border border-terminal-danger/30 p-3 text-xs text-terminal-danger/80 space-y-1">
              <div className="text-terminal-danger font-bold">{deleteWebhook.url}</div>
              <div>{deleteWebhook.totalDeliveries} deliveries will be lost</div>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="danger" onClick={confirmDelete} className="flex-1">
              DELETE_WEBHOOK
            </Button>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              CANCEL
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-100 border border-terminal-green bg-terminal-black px-4 py-3 text-xs text-terminal-green font-terminal-mono shadow-glow-green animate-in slide-in-from-bottom-4 duration-300 max-w-sm">
          <span className="mr-2 text-terminal-green">✓</span>
          {toast}
        </div>
      )}
    </div>
  )
}
