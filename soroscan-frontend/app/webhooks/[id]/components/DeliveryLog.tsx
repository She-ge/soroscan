"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption,
  SortDirectionIndicator,
  type SortDirection,
} from "@/components/terminal/Table"
import type { DeliveryLog, SortField, StatusFilter } from "../../types"

type SortDir = SortDirection

interface DeliveryLogProps {
  logs: DeliveryLog[]
}

interface RetryOutcome {
  id: string
  ok: boolean
  details: string
}

function StatusCodeBadge({ code }: { code: number }) {
  const cls =
    code < 300 ? "text-terminal-green border-terminal-green/40" :
    code < 500 ? "text-terminal-warning border-terminal-warning/40" :
                 "text-terminal-danger border-terminal-danger/40"
  return (
    <span className={`inline-flex items-center border px-1.5 py-0.5 text-[10px] font-terminal-mono ${cls}`}>
      {code}
    </span>
  )
}

function ExpandableError({ message }: { message: string }) {
  const [expanded, setExpanded] = React.useState(false)
  const short = message.length > 40 && !expanded ? message.slice(0, 40) + "…" : message
  return (
    <span className="text-terminal-danger text-[10px]">
      {short}
      {message.length > 40 && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="ml-1 text-terminal-cyan hover:text-terminal-green transition-colors underline underline-offset-2"
        >
          {expanded ? "[less]" : "[more]"}
        </button>
      )}
    </span>
  )
}

const PAGE_SIZE = 10

export function DeliveryLog({ logs }: DeliveryLogProps) {
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL")
  const [sortField, setSortField] = React.useState<SortField>("timestamp")
  const [sortDir, setSortDir] = React.useState<SortDir>("desc")
  const [page, setPage] = React.useState(1)
  const [selectedLogIds, setSelectedLogIds] = React.useState<string[]>([])
  const [confirmRetryOpen, setConfirmRetryOpen] = React.useState(false)
  const [retrying, setRetrying] = React.useState(false)
  const [retryFeedback, setRetryFeedback] = React.useState<string | null>(null)
  const [retryOutcomes, setRetryOutcomes] = React.useState<RetryOutcome[]>([])

  const toggleSort = (f: SortField) => {
    if (f === sortField) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortField(f); setSortDir("desc") }
    setPage(1)
  }

  const filtered = logs.filter((l) => {
    if (statusFilter === "ALL") return true
    if (statusFilter === "2xx") return l.statusCode >= 200 && l.statusCode < 300
    if (statusFilter === "4xx") return l.statusCode >= 400 && l.statusCode < 500
    if (statusFilter === "5xx") return l.statusCode >= 500
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0
    if (sortField === "timestamp")     cmp = a.timestamp.localeCompare(b.timestamp)
    if (sortField === "statusCode")    cmp = a.statusCode - b.statusCode
    if (sortField === "responseTimeMs") cmp = a.responseTimeMs - b.responseTimeMs
    if (sortField === "attempt")       cmp = a.attempt - b.attempt
    return sortDir === "asc" ? cmp : -cmp
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const failedInView = sorted.filter((log) => log.statusCode >= 400)
  const selectedCount = selectedLogIds.length
  const allFailedSelected = failedInView.length > 0 && failedInView.every((log) => selectedLogIds.includes(log.id))

  const toggleSelection = (id: string, checked: boolean) => {
    setSelectedLogIds((prev) => {
      if (checked) {
        if (prev.includes(id)) {
          return prev
        }
        return [...prev, id]
      }
      return prev.filter((entry) => entry !== id)
    })
  }

  const toggleSelectAllFailed = (checked: boolean) => {
    if (!checked) {
      setSelectedLogIds([])
      return
    }
    setSelectedLogIds(failedInView.map((log) => log.id))
  }

  const executeBatchRetry = async () => {
    setRetrying(true)
    setRetryFeedback(null)

    await new Promise((resolve) => setTimeout(resolve, 900))

    const outcomes = selectedLogIds.map((id) => {
      const log = logs.find((entry) => entry.id === id)
      const shouldFail = !log || log.statusCode >= 500
      return shouldFail
        ? { id, ok: false, details: `Retry failed (${log?.statusCode ?? "N/A"}) due to downstream endpoint timeout.` }
        : { id, ok: true, details: "Retry accepted and queued for delivery." }
    })

    const successCount = outcomes.filter((result) => result.ok).length
    const failureCount = outcomes.length - successCount

    setRetryOutcomes(outcomes)
    setRetryFeedback(`Batch retry completed: ${successCount} succeeded, ${failureCount} failed.`)
    setSelectedLogIds([])
    setConfirmRetryOpen(false)
    setRetrying(false)
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-terminal-green whitespace-nowrap">
            [DELIVERY_LOGS]
          </h2>
          <div className="h-[2px] w-24 bg-terminal-green/20" />
          <span className="text-[10px] text-terminal-gray">{filtered.length} entries</span>
        </div>

        {/* Filter pill buttons */}
        <div className="flex gap-1.5 text-[10px]">
          {(["ALL", "2xx", "4xx", "5xx"] as StatusFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => { setStatusFilter(f); setPage(1) }}
              className={`px-2.5 py-1 border transition-colors font-terminal-mono ${
                statusFilter === f
                  ? f === "ALL" ? "border-terminal-green text-terminal-green bg-terminal-green/10"
                    : f === "2xx" ? "border-terminal-green text-terminal-green bg-terminal-green/10"
                    : f === "4xx" ? "border-terminal-warning text-terminal-warning bg-terminal-warning/10"
                    : "border-terminal-danger text-terminal-danger bg-terminal-danger/10"
                  : "border-terminal-gray/30 text-terminal-gray hover:border-terminal-green/50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="border border-terminal-cyan/30 bg-terminal-cyan/5 p-3 text-xs text-terminal-cyan flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>{selectedCount} failed delivery{selectedCount > 1 ? "ies" : ""} selected</span>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-1 border border-terminal-cyan/40 hover:border-terminal-cyan transition-colors"
              onClick={() => setSelectedLogIds([])}
            >
              Clear Selection
            </button>
            <button
              type="button"
              className="px-3 py-1 border border-terminal-warning/50 text-terminal-warning hover:border-terminal-warning transition-colors"
              onClick={() => setConfirmRetryOpen(true)}
            >
              Retry Selected
            </button>
          </div>
        </div>
      )}

      {confirmRetryOpen && (
        <div className="border border-terminal-warning/50 bg-terminal-warning/10 p-3 text-xs text-terminal-warning flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>Retry {selectedCount} failed delivery{selectedCount > 1 ? "ies" : ""}? This will requeue webhook attempts.</span>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-1 border border-terminal-gray/30 text-terminal-gray hover:border-terminal-green hover:text-terminal-green transition-colors"
              onClick={() => setConfirmRetryOpen(false)}
              disabled={retrying}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-3 py-1 border border-terminal-warning text-terminal-warning hover:bg-terminal-warning/10 transition-colors disabled:opacity-50"
              onClick={executeBatchRetry}
              disabled={retrying}
            >
              {retrying ? "Retrying..." : "Confirm Retry"}
            </button>
          </div>
        </div>
      )}

      {retryFeedback && (
        <div className="border border-terminal-green/30 bg-terminal-green/10 p-3 text-xs text-terminal-green">
          {retryFeedback}
        </div>
      )}

      {retryOutcomes.some((result) => !result.ok) && (
        <div className="border border-terminal-danger/40 bg-terminal-danger/10 p-3 text-xs text-terminal-danger space-y-2">
          <div className="font-bold">Retry Errors</div>
          {retryOutcomes
            .filter((result) => !result.ok)
            .map((result) => (
              <div key={result.id}>
                <span className="text-terminal-gray">{result.id}</span>: {result.details}
              </div>
            ))}
        </div>
      )}

      {paginated.length === 0 ? (
        <div className="border border-terminal-green/20 p-8 text-center text-terminal-gray text-sm">
          NO_LOGS_FOUND — try adjusting the filter
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <input
                      type="checkbox"
                      aria-label="Select all failed deliveries"
                      checked={allFailedSelected}
                      onChange={(e) => toggleSelectAllFailed(e.target.checked)}
                    />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-terminal-green transition-colors"
                    onClick={() => toggleSort("timestamp")}
                  >
                    <span className="inline-flex items-center gap-1">
                      TIMESTAMP
                      <SortDirectionIndicator
                        active={sortField === "timestamp"}
                        direction={sortDir}
                      />
                    </span>
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">EVENT_TYPE</TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-terminal-green transition-colors"
                    onClick={() => toggleSort("statusCode")}
                  >
                    <span className="inline-flex items-center gap-1">
                      STATUS
                      <SortDirectionIndicator
                        active={sortField === "statusCode"}
                        direction={sortDir}
                      />
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-terminal-green transition-colors"
                    onClick={() => toggleSort("responseTimeMs")}
                  >
                    <span className="inline-flex items-center gap-1">
                      RESP_TIME
                      <SortDirectionIndicator
                        active={sortField === "responseTimeMs"}
                        direction={sortDir}
                      />
                    </span>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none hover:text-terminal-green transition-colors"
                    onClick={() => toggleSort("attempt")}
                  >
                    <span className="inline-flex items-center gap-1">
                      ATTEMPT
                      <SortDirectionIndicator
                        active={sortField === "attempt"}
                        direction={sortDir}
                      />
                    </span>
                  </TableHead>
                  <TableHead>ERROR_MSG</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        aria-label={`Select delivery ${log.id}`}
                        checked={selectedLogIds.includes(log.id)}
                        disabled={log.statusCode < 400}
                        onChange={(e) => toggleSelection(log.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell className="text-[10px] whitespace-nowrap text-terminal-gray">
                      {new Date(log.timestamp).toLocaleString("en-GB", {
                        dateStyle: "short",
                        timeStyle: "medium",
                      })}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-[10px] text-terminal-cyan">
                      {log.eventType}
                    </TableCell>
                    <TableCell>
                      <StatusCodeBadge code={log.statusCode} />
                    </TableCell>
                    <TableCell className="text-[10px]">
                      <span className={log.responseTimeMs > 600 ? "text-terminal-warning" : "text-terminal-gray"}>
                        {log.responseTimeMs}ms
                      </span>
                    </TableCell>
                    <TableCell className="text-[10px] text-terminal-gray">
                      #{log.attempt}
                    </TableCell>
                    <TableCell>
                      {log.errorMessage
                        ? <ExpandableError message={log.errorMessage} />
                        : <span className="text-terminal-green text-[10px]">OK</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {paginated.length > 0 && (
                <TableCaption>
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length} delivery attempts
                </TableCaption>
              )}
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-[10px] text-terminal-gray">
              <span>Page {page} of {totalPages}</span>
              <div className="flex gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(1)}
                  className="px-2 py-1 border border-terminal-gray/30 hover:border-terminal-green hover:text-terminal-green transition-colors disabled:opacity-30"
                >
                  «
                </button>
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-2 py-1 border border-terminal-gray/30 hover:border-terminal-green hover:text-terminal-green transition-colors disabled:opacity-30"
                >
                  <ChevronLeft size={10} />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2 py-1 border border-terminal-gray/30 hover:border-terminal-green hover:text-terminal-green transition-colors disabled:opacity-30"
                >
                  <ChevronRight size={10} />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(totalPages)}
                  className="px-2 py-1 border border-terminal-gray/30 hover:border-terminal-green hover:text-terminal-green transition-colors disabled:opacity-30"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
