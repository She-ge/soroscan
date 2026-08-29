"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "../Button"

const INITIAL_TYPED_LINES = [
  "> initialising soroscan_daemon...",
  "> connecting to stellar_horizon_api...",
  "> loading active contracts...",
  "> indexing ledger events...",
]

function formatStatValue(key: string, rawVal: number): string {
  if (key === "eventsIndexed") {
    return rawVal >= 1_000_000 ? `${(rawVal / 1_000_000).toFixed(1)}M+` : rawVal.toLocaleString();
  }
  if (key === "contractsTracked") {
    return rawVal.toLocaleString();
  }
  if (key === "avgLatencyMs") {
    return `${rawVal}ms`;
  }
  if (key === "uptimePercentage") {
    return `${rawVal}%`;
  }
  return String(rawVal);
}

export function Hero() {
  const [lineIndex, setLineIndex] = React.useState(0)
  const [typedLines, setTypedLines] = React.useState(INITIAL_TYPED_LINES)
  const [stats, setStats] = React.useState([
    { label: "EVENTS_INDEXED", value: "---" },
    { label: "CONTRACTS_TRACKED", value: "---" },
    { label: "AVG_LATENCY", value: "---" },
    { label: "UPTIME", value: "---" },
  ])

  React.useEffect(() => {
    if (lineIndex >= typedLines.length - 1) return
    const t = setTimeout(() => setLineIndex((i) => i + 1), 750)
    return () => clearTimeout(t)
  }, [lineIndex, typedLines])

  React.useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/graphql", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `{ publicStats { eventsIndexed contractsTracked avgLatencyMs uptimePercentage } }`,
          }),
        });
        const json = await res.json();
        const data = json?.data?.publicStats;
        if (data) {
          const eventsVal = data.eventsIndexed ?? 0;
          const contractsVal = data.contractsTracked ?? 0;
          const latencyVal = data.avgLatencyMs ?? 42;
          const uptimeVal = data.uptimePercentage ?? 99.97;

          setStats([
            { label: "EVENTS_INDEXED", value: formatStatValue("eventsIndexed", eventsVal) },
            { label: "CONTRACTS_TRACKED", value: formatStatValue("contractsTracked", contractsVal) },
            { label: "AVG_LATENCY", value: formatStatValue("avgLatencyMs", latencyVal) },
            { label: "UPTIME", value: formatStatValue("uptimePercentage", uptimeVal) },
          ]);

          setTypedLines([
            "> initialising soroscan_daemon...",
            "> connecting to stellar_horizon_api...",
            `> contract whitelist loaded: ${contractsVal.toLocaleString()} active`,
            `> indexing live soroban ledger events...`,
            `> total events processed: ${eventsVal.toLocaleString()} ✓`,
          ]);
        }
      } catch {
        setStats([
          { label: "EVENTS_INDEXED", value: "0" },
          { label: "CONTRACTS_TRACKED", value: "0" },
          { label: "AVG_LATENCY", value: "42ms" },
          { label: "UPTIME", value: "99.9%" },
        ]);
      }
    }
    fetchStats();
  }, []);

  return (
    <section className="flex flex-col items-center text-center space-y-10 py-8 md:py-16">
      {/* Headline */}
      <div className="relative">
        <div className="text-[10px] md:text-xs text-terminal-cyan tracking-[0.3em] uppercase mb-3">
          Soroban Event Indexing, Reimagined
        </div>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-terminal-green font-terminal-mono leading-none">
          SOROSCAN
        </h1>
        <div className="absolute -top-2 -right-6 md:-right-10 text-[9px] bg-terminal-cyan text-terminal-black px-1.5 py-0.5 font-bold">
          v1.0 STABLE
        </div>
        <p className="text-terminal-cyan text-base md:text-xl mt-4 border-y border-terminal-cyan/20 py-3 max-w-xl mx-auto font-terminal-mono">
          &gt; THE_GRAPH_FOR_SOROBAN
        </p>
        <p className="text-terminal-gray text-sm md:text-base max-w-lg mx-auto mt-3 leading-relaxed">
          Index, query, and subscribe to smart contract events on the Stellar blockchain.
          Reliable event ingestion for high-availability decentralised applications.
        </p>
      </div>

      {/* Animated terminal preview */}
      <div className="w-full max-w-xl text-left bg-black/40 border border-terminal-green/30 p-4 rounded-sm font-terminal-mono text-xs text-terminal-gray space-y-1">
        {typedLines.slice(0, lineIndex + 1).map((line, i) => (
          <div
            key={i}
            className={i < lineIndex ? "text-terminal-gray" : "text-terminal-green"}
          >
            {line}
            {i === lineIndex && <span className="cursor-blink" />}
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <Link href="/docs">
          <Button size="lg" variant="primary">START_INDEXING</Button>
        </Link>
        <Link href="/docs">
          <Button size="lg" variant="secondary">VIEW_DOCUMENTATION</Button>
        </Link>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl pt-4 border-t border-terminal-green/20">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-terminal-green font-bold text-xl md:text-2xl font-terminal-mono">{stat.value}</div>
            <div className="text-terminal-gray text-[9px] md:text-[10px] tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
