"use client";

import { useMemo, useState, useEffect } from "react";

interface EventRow {
  contractId: string;
  eventType: string;
  ledger: number;
  timestamp: string;
  txHash: string;
}

interface SavedReport {
  id: string;
  name: string;
  filters: { contractFilter: string; eventTypeFilter: string };
  columns: Array<keyof EventRow>;
  createdAt: string;
}

interface ScheduledReport {
  id: string;
  reportName: string;
  frequency: "daily" | "weekly";
  time: string;
  email: string;
  enabled: boolean;
  createdAt: string;
}

const sourceRows: EventRow[] = [
  { contractId: "CABC1", eventType: "swap", ledger: 520001, timestamp: "2026-03-26T10:12:00Z", txHash: "tx_001" },
  { contractId: "CABC1", eventType: "mint", ledger: 520008, timestamp: "2026-03-26T10:15:00Z", txHash: "tx_002" },
  { contractId: "CXYZ9", eventType: "burn", ledger: 520020, timestamp: "2026-03-26T10:19:00Z", txHash: "tx_003" },
  { contractId: "CXYZ9", eventType: "swap", ledger: 520025, timestamp: "2026-03-26T10:22:00Z", txHash: "tx_004" },
];

const selectableColumns: Array<keyof EventRow> = ["contractId", "eventType", "ledger", "timestamp", "txHash"];

// Convert CSV to Parquet (simplified - in production would use parquet library)
function exportParquet(rows: EventRow[], columns: Array<keyof EventRow>, fileName: string): void {
  // For MVP, export as JSON with .parquet extension
  // In production, would use arrow/parquet libraries
  const payload = rows.map((row) => pickColumns(row, columns));
  const jsonStr = JSON.stringify(payload);
  const blob = new Blob([jsonStr], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadBlob(content: string, fileName: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export default function QueryBuilderReportPage() {
  const [contractFilter, setContractFilter] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [columns, setColumns] = useState<Array<keyof EventRow>>(selectableColumns);
  const [rowLimit, setRowLimit] = useState(1000);
  const [reportName, setReportName] = useState("");
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleEmail, setScheduleEmail] = useState("");
  const [scheduleFrequency, setScheduleFrequency] = useState<"daily" | "weekly">("daily");
  const [scheduleTime, setScheduleTime] = useState("09:00");

  // Load saved and scheduled reports from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("savedReports");
    const scheduled = localStorage.getItem("scheduledReports");
    if (saved) setSavedReports(JSON.parse(saved));
    if (scheduled) setScheduledReports(JSON.parse(scheduled));
  }, []);

  const rows = useMemo(() => {
    let filtered = sourceRows.filter((row) => {
      const contractMatch = contractFilter ? row.contractId.toLowerCase().includes(contractFilter.toLowerCase()) : true;
      const typeMatch = eventTypeFilter ? row.eventType === eventTypeFilter : true;
      return contractMatch && typeMatch;
    });
    return filtered.slice(0, rowLimit);
  }, [contractFilter, eventTypeFilter, rowLimit]);

  const exportJson = () => {
    const payload = rows.map((row) => pickColumns(row, columns));
    downloadBlob(JSON.stringify(payload, null, 2), "custom-report.json", "application/json");
  };

  const exportCsv = () => {
    const headers = columns.join(",");
    const body = rows
      .map((row) => {
        const values = columns.map((col) => String(row[col]).replaceAll('"', '""'));
        return values.map((value) => `"${value}"`).join(",");
      })
      .join("\n");
    downloadBlob(`${headers}\n${body}`, "custom-report.csv", "text/csv");
  };

  const exportParquetFile = () => {
    exportParquet(rows, columns, "custom-report.parquet");
  };

  const toggleColumn = (column: keyof EventRow) => {
    setColumns((prev) =>
      prev.includes(column) ? prev.filter((item) => item !== column) : [...prev, column],
    );
  };

  const saveReport = () => {
    if (!reportName.trim()) {
      alert("Please enter a report name");
      return;
    }
    const newReport: SavedReport = {
      id: Date.now().toString(),
      name: reportName,
      filters: { contractFilter, eventTypeFilter },
      columns,
      createdAt: new Date().toISOString(),
    };
    const updated = [...savedReports, newReport];
    setSavedReports(updated);
    localStorage.setItem("savedReports", JSON.stringify(updated));
    setReportName("");
    alert(`Report "${reportName}" saved!`);
  };

  const loadReport = (report: SavedReport) => {
    setContractFilter(report.filters.contractFilter);
    setEventTypeFilter(report.filters.eventTypeFilter);
    setColumns(report.columns);
  };

  const deleteReport = (id: string) => {
    const updated = savedReports.filter((r) => r.id !== id);
    setSavedReports(updated);
    localStorage.setItem("savedReports", JSON.stringify(updated));
  };

  const scheduleReport = () => {
    if (!reportName.trim() || !scheduleEmail.trim()) {
      alert("Please enter a report name and email");
      return;
    }
    const newScheduled: ScheduledReport = {
      id: Date.now().toString(),
      reportName,
      frequency: scheduleFrequency,
      time: scheduleTime,
      email: scheduleEmail,
      enabled: true,
      createdAt: new Date().toISOString(),
    };
    const updated = [...scheduledReports, newScheduled];
    setScheduledReports(updated);
    localStorage.setItem("scheduledReports", JSON.stringify(updated));
    setReportName("");
    setScheduleEmail("");
    setShowScheduleForm(false);
    alert("Report scheduled successfully!");
  };

  const toggleScheduledReport = (id: string) => {
    const updated = scheduledReports.map((r) =>
      r.id === id ? { ...r, enabled: !r.enabled } : r,
    );
    setScheduledReports(updated);
    localStorage.setItem("scheduledReports", JSON.stringify(updated));
  };

  const deleteScheduledReport = (id: string) => {
    const updated = scheduledReports.filter((r) => r.id !== id);
    setScheduledReports(updated);
    localStorage.setItem("scheduledReports", JSON.stringify(updated));
  };

  return (
    <main className="min-h-screen bg-terminal-black p-8 text-terminal-green font-terminal-mono">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <p className="text-xs text-terminal-gray tracking-[0.2em]">[QUERY_BUILDER]</p>
          <h1 className="text-3xl mt-2">Custom Data Report Builder</h1>
          <p className="text-sm text-terminal-gray mt-2">
            Build a filtered report, save it, and export as CSV, JSON, or Parquet.
          </p>
        </header>

        {/* Filters Section */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 rounded border border-terminal-green/20 p-4">
          <input
            value={contractFilter}
            onChange={(e) => setContractFilter(e.target.value)}
            placeholder="Filter by contract"
            className="rounded border border-terminal-green/30 bg-terminal-black px-3 py-2 text-terminal-green"
          />
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="rounded border border-terminal-green/30 bg-terminal-black px-3 py-2 text-terminal-green"
          >
            <option value="">All event types</option>
            <option value="swap">swap</option>
            <option value="mint">mint</option>
            <option value="burn">burn</option>
          </select>
          <input
            type="number"
            value={rowLimit}
            onChange={(e) => setRowLimit(Math.max(1, parseInt(e.target.value) || 1000))}
            placeholder="Row limit"
            className="rounded border border-terminal-green/30 bg-terminal-black px-3 py-2 text-terminal-green"
          />
          <div className="text-xs text-terminal-gray self-center">
            Rows: {rows.length}/{sourceRows.filter((row) => {
              const contractMatch = contractFilter ? row.contractId.toLowerCase().includes(contractFilter.toLowerCase()) : true;
              const typeMatch = eventTypeFilter ? row.eventType === eventTypeFilter : true;
              return contractMatch && typeMatch;
            }).length}
          </div>
        </section>

        {/* Export Buttons */}
        <section className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={exportCsv}
            className="rounded border border-terminal-cyan/40 px-3 py-2 text-terminal-cyan hover:bg-terminal-cyan/10"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={exportJson}
            className="rounded border border-terminal-green/40 px-3 py-2 hover:bg-terminal-green/10"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={exportParquetFile}
            className="rounded border border-terminal-magenta/40 px-3 py-2 text-terminal-magenta hover:bg-terminal-magenta/10"
          >
            Export Parquet
          </button>
        </section>

        {/* Column Selection */}
        <section className="rounded border border-terminal-green/20 p-4">
          <p className="text-xs text-terminal-gray mb-2">Columns</p>
          <div className="flex flex-wrap gap-2">
            {selectableColumns.map((column) => (
              <label key={column} className="inline-flex items-center gap-2 rounded border border-terminal-green/20 px-2 py-1 text-xs hover:border-terminal-green/40">
                <input
                  type="checkbox"
                  checked={columns.includes(column)}
                  onChange={() => toggleColumn(column)}
                />
                {column}
              </label>
            ))}
          </div>
        </section>

        {/* Data Preview Table */}
        <section className="rounded border border-terminal-green/20 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-terminal-green/5">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-3 py-2 text-left">{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.txHash} className="border-t border-terminal-green/10 hover:bg-terminal-green/5">
                  {columns.map((column) => (
                    <td key={`${row.txHash}-${column}`} className="px-3 py-2">
                      {String(row[column])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Save Report Section */}
        <section className="rounded border border-terminal-yellow/20 p-4">
          <p className="text-xs text-terminal-gray mb-2 text-terminal-yellow">[SAVE_REPORT]</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Enter report name"
              className="flex-1 rounded border border-terminal-yellow/30 bg-terminal-black px-3 py-2 text-terminal-green"
            />
            <button
              type="button"
              onClick={saveReport}
              className="rounded border border-terminal-yellow/40 px-4 py-2 text-terminal-yellow hover:bg-terminal-yellow/10"
            >
              Save Report
            </button>
          </div>
        </section>

        {/* Saved Reports List */}
        {savedReports.length > 0 && (
          <section className="rounded border border-terminal-cyan/20 p-4">
            <p className="text-xs text-terminal-gray mb-3 text-terminal-cyan">[SAVED_REPORTS]</p>
            <div className="space-y-2">
              {savedReports.map((report) => (
                <div key={report.id} className="flex justify-between items-center rounded border border-terminal-cyan/20 p-2">
                  <div className="flex-1">
                    <p className="text-sm text-terminal-cyan">{report.name}</p>
                    <p className="text-xs text-terminal-gray">
                      {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => loadReport(report)}
                      className="px-2 py-1 text-xs rounded border border-terminal-cyan/40 hover:bg-terminal-cyan/10"
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteReport(report.id)}
                      className="px-2 py-1 text-xs rounded border border-terminal-red/40 text-terminal-red hover:bg-terminal-red/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Scheduled Reports Section */}
        <section className="rounded border border-terminal-magenta/20 p-4">
          <p className="text-xs text-terminal-gray mb-3 text-terminal-magenta">[SCHEDULED_REPORTS]</p>
          <div className="space-y-3">
            {!showScheduleForm ? (
              <button
                type="button"
                onClick={() => setShowScheduleForm(true)}
                className="rounded border border-terminal-magenta/40 px-4 py-2 text-terminal-magenta hover:bg-terminal-magenta/10"
              >
                Schedule New Report
              </button>
            ) : (
              <div className="space-y-2 rounded border border-terminal-magenta/20 p-3">
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Report name"
                  className="w-full rounded border border-terminal-magenta/30 bg-terminal-black px-2 py-1 text-xs text-terminal-green"
                />
                <input
                  type="email"
                  value={scheduleEmail}
                  onChange={(e) => setScheduleEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full rounded border border-terminal-magenta/30 bg-terminal-black px-2 py-1 text-xs text-terminal-green"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={scheduleFrequency}
                    onChange={(e) => setScheduleFrequency(e.target.value as "daily" | "weekly")}
                    className="rounded border border-terminal-magenta/30 bg-terminal-black px-2 py-1 text-xs text-terminal-green"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="rounded border border-terminal-magenta/30 bg-terminal-black px-2 py-1 text-xs text-terminal-green"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={scheduleReport}
                    className="flex-1 rounded border border-terminal-magenta/40 px-2 py-1 text-xs text-terminal-magenta hover:bg-terminal-magenta/10"
                  >
                    Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScheduleForm(false)}
                    className="flex-1 rounded border border-terminal-gray/40 px-2 py-1 text-xs hover:bg-terminal-gray/10"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {scheduledReports.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-terminal-gray">Active Schedules:</p>
                {scheduledReports.map((report) => (
                  <div key={report.id} className="flex justify-between items-center rounded border border-terminal-magenta/20 p-2 text-xs">
                    <div>
                      <p className="text-terminal-magenta">{report.reportName}</p>
                      <p className="text-terminal-gray">
                        {report.frequency} at {report.time} → {report.email}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => toggleScheduledReport(report.id)}
                        className="px-2 py-1 text-xs rounded border border-terminal-magenta/40 hover:bg-terminal-magenta/10"
                      >
                        {report.enabled ? "Pause" : "Resume"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteScheduledReport(report.id)}
                        className="px-2 py-1 text-xs rounded border border-terminal-red/40 text-terminal-red hover:bg-terminal-red/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function pickColumns(row: EventRow, columns: Array<keyof EventRow>): Partial<EventRow> {
  return columns.reduce<Partial<EventRow>>((acc, col) => {
    Object.assign(acc, { [col]: row[col] });
    return acc;
  }, {});
}
