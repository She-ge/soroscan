"use client"

import * as React from "react"
import { 
  Database, 
  HardDrive, 
  Activity, 
  ShieldCheck, 
  Webhook, 
  AlertTriangle, 
  Server, 
  RefreshCw,
  Layers
} from "lucide-react"
import { Button } from "@/components/terminal/Button"
import { MetricsCard } from "./components/MetricsCard"
import { EventChart } from "./components/EventChart"
import { WebhookStats } from "./components/WebhookStats"
import { ErrorLog } from "./components/ErrorLog"
import { fetchSystemMetrics, SystemMetricsData } from "@/components/ingest/graphql"
import { AdminDashboardLayout } from "@/components/layout/DashboardWorkspace"
import { DashboardPanel } from "@/components/layout/DashboardPanel"

export default function AdminDashboard() {
  const [data, setData] = React.useState<SystemMetricsData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const loadData = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    
    try {
      const result = await fetchSystemMetrics()
      setData(result)
      setError(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "UNAUTHORIZED_ACCESS: Admin role required."
      console.error("Failed to fetch admin metrics:", err)
      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
    const interval = setInterval(() => loadData(true), 30000)
    return () => clearInterval(interval)
  }, [loadData])

  // Mock data for the chart (last 24h) — deterministic for stable visuals/tests
  const chartData = React.useMemo(() => {
    if (!data) return Array(24).fill(0).map((_, i) => ({ label: `${i}:00`, value: 0 }))

    const seed = data.systemMetrics?.eventsIndexedTotal ?? 0
    return Array(24).fill(0).map((_, i) => ({
      label: `${(i + 1)}h ago`,
      value: 100 + ((seed + i * 37) % 500)
    })).reverse()
  }, [data])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-6 min-h-[60vh]">
        <div className="border border-terminal-danger p-8 max-w-md bg-terminal-danger/5">
          <AlertTriangle size={48} className="text-terminal-danger mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-terminal-danger mb-2">ACCESS_DENIED</h2>
          <p className="text-xs text-terminal-gray mb-6 uppercase tracking-widest">
            {error}
          </p>
          <Button variant="secondary" onClick={() => window.location.href = "/"}>
            RETURN_TO_BASE
          </Button>
        </div>
      </div>
    )
  }

  const metrics = data?.systemMetrics

  return (
    <AdminDashboardLayout
      header={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] text-terminal-cyan tracking-widest mb-1 items-center flex gap-2">
              <ShieldCheck size={10} />
              [ADMIN_OVERSIGHT_V1.0]
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-terminal-green uppercase m-0">
              System Dashboard
            </h1>
            <p className="text-terminal-gray text-[10px] mt-1 uppercase tracking-widest m-0">
              Last Synced: {metrics?.lastSynced ? new Date(metrics.lastSynced).toLocaleString() : "NEVER"}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => loadData(true)}
              disabled={refreshing}
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "REFRESHING..." : "FORCE_SYNC"}
            </Button>
          </div>
        </div>
      }
      metrics={
        <>
          <MetricsCard 
            title="Events Today" 
            value={metrics?.eventsIndexedToday ?? 0} 
            icon={Activity} 
            loading={loading}
          />
          <MetricsCard 
            title="Total Events" 
            value={metrics?.eventsIndexedTotal ?? 0} 
            icon={HardDrive} 
            color="cyan"
            loading={loading}
          />
          <MetricsCard 
            title="Webhook Health" 
            value={`${Math.round(metrics?.webhookSuccessRate ?? 0)}%`} 
            subValue="Last 24h Success Rate"
            icon={Webhook} 
            color={metrics && metrics.webhookSuccessRate < 90 ? "warning" : "green"}
            loading={loading}
          />
          <MetricsCard 
            title="Active Contracts" 
            value={metrics?.activeContracts ?? 0} 
            icon={Layers} 
            color="gray"
            loading={loading}
          />
        </>
      }
      charts={
        <>
          <div className="lg:col-span-2 min-w-0">
            <EventChart 
              title="Ingestion Timeline" 
              data={chartData} 
              loading={loading} 
            />
          </div>
          <div className="min-w-0">
            <WebhookStats 
              successRate={metrics?.webhookSuccessRate ?? 0} 
              avgTime={metrics?.avgWebhookDeliveryTime ?? 0}
              loading={loading}
            />
          </div>
        </>
      }
      logs={
        <>
          <div className="lg:col-span-2 min-h-[400px] min-w-0">
            <ErrorLog 
              errors={data?.recentErrors ?? []} 
              loading={loading} 
            />
          </div>
          <div className="space-y-6 min-w-0">
            <DashboardPanel elevation="elevated" title="[SYSTEM_STATUS]">
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-terminal-green/5 p-3 border border-terminal-green/10">
                  <div className="flex items-center gap-3">
                    <Database size={16} className="text-terminal-green" />
                    <span className="text-[10px] text-terminal-gray uppercase">Database</span>
                  </div>
                  <span className="text-[10px] text-terminal-green font-bold">[{metrics?.dbStatus ?? "ONLINE"}]</span>
                </div>

                <div className="flex justify-between items-center bg-terminal-green/5 p-3 border border-terminal-green/10">
                  <div className="flex items-center gap-3">
                    <Server size={16} className="text-terminal-green" />
                    <span className="text-[10px] text-terminal-gray uppercase">Redis Cache</span>
                  </div>
                  <span className="text-[10px] text-terminal-green font-bold">[{metrics?.redisStatus ?? "ONLINE"}]</span>
                </div>

                <div className="pt-4 border-t border-terminal-green/20">
                  <h4 className="text-[9px] text-terminal-gray tracking-widest uppercase mb-3 m-0">Feature Flags</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-terminal-green/80">LIVE_INGESTION_V2</span>
                      <div className="w-8 h-4 bg-terminal-green/20 border border-terminal-green rounded-full relative cursor-pointer opacity-50" aria-hidden="true">
                        <div className="absolute top-0.5 left-0.5 w-2.5 h-2.5 bg-terminal-green rounded-full shadow-glow-green" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-terminal-green/80">WEBHOOK_RETRY_BACKOFF</span>
                      <div className="w-8 h-4 bg-terminal-green/20 border border-terminal-green rounded-full relative cursor-pointer opacity-50" aria-hidden="true">
                         <div className="absolute top-0.5 w-2.5 h-2.5 bg-terminal-green rounded-full shadow-glow-green" style={{ left: 'calc(100% - 14px)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DashboardPanel>

            <DashboardPanel elevation="default" title="Indexing Progress">
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] text-terminal-gray uppercase mb-1">
                    <span>Ledger Sync</span>
                    <span>99.9%</span>
                  </div>
                  <div className="h-1 w-full bg-terminal-green/10 rounded-full overflow-hidden">
                    <div className="h-full bg-terminal-green shadow-glow-green w-[99.9%]" />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[8px] text-terminal-gray uppercase mb-1">
                    <span>Backfill Workers</span>
                    <span>Active (3/3)</span>
                  </div>
                  <div className="h-1 w-full bg-terminal-green/10 rounded-full overflow-hidden">
                    <div className="h-full bg-terminal-green shadow-glow-green w-[100%]" />
                  </div>
                </div>
              </div>
            </DashboardPanel>
          </div>
        </>
      }
    />
  )
}
