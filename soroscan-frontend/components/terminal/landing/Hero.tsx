"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "../Button"

const STATS = [
  { label: "EVENTS_INDEXED", value: "2.4M+" },
  { label: "CONTRACTS_TRACKED", value: "1,832" },
  { label: "AVG_LATENCY", value: "42ms" },
  { label: "UPTIME", value: "99.97%" },
]

const TYPED_LINES = [
  "> initialising soroscan_daemon...",
  "> connecting to stellar_horizon_api...",
  "> contract whitelist loaded: 1,832 active",
  "> indexing ledger #51_247_009...",
  "> events processed: 2,400,000+ ✓",
]

export function Hero() {
  const [lineIndex, setLineIndex] = React.useState(0)

  React.useEffect(() => {
    if (lineIndex >= TYPED_LINES.length - 1) return
    const t = setTimeout(() => setLineIndex((i) => i + 1), 900)
    return () => clearTimeout(t)
  }, [lineIndex])

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
        {TYPED_LINES.slice(0, lineIndex + 1).map((line, i) => (
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
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-terminal-green font-bold text-xl md:text-2xl font-terminal-mono">{stat.value}</div>
            <div className="text-terminal-gray text-[9px] md:text-[10px] tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
