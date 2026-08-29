"use client";

import React, { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Filter,
  ArrowDownCircle,
  Terminal,
  Radio,
  X,
} from "lucide-react";

interface StreamEvent {
  id: string;
  contractId: string;
  eventType: string;
  timestamp: string;
  ledgerSequence: number;
  txHash: string;
  topics: string[];
  payload: Record<string, unknown>;
}

const initialEvents: StreamEvent[] = [
  {
    id: "evt_1001",
    contractId: "CA3D525C2...77A2",
    eventType: "transfer",
    timestamp: new Date(Date.now() - 12000).toISOString(),
    ledgerSequence: 4982104,
    txHash: "0a1b2c3d4e5f...",
    topics: ["transfer", "from:GBX...", "to:GAY..."],
    payload: { amount: "50000000", asset: "USDC", from: "GBX...123", to: "GAY...456" },
  },
  {
    id: "evt_1002",
    contractId: "CB8E119A4...33F1",
    eventType: "swap",
    timestamp: new Date(Date.now() - 9000).toISOString(),
    ledgerSequence: 4982105,
    txHash: "9f8e7d6c5b4a...",
    topics: ["swap", "pool:XLM/USDC"],
    payload: { amountIn: "100.00 XLM", amountOut: "42.15 USDC", trader: "GCT...789" },
  },
  {
    id: "evt_1003",
    contractId: "CA3D525C2...77A2",
    eventType: "mint",
    timestamp: new Date(Date.now() - 5000).toISOString(),
    ledgerSequence: 4982106,
    txHash: "123456789abc...",
    topics: ["mint", "to:GCT...789"],
    payload: { amount: "1000000", recipient: "GCT...789" },
  },
];

function LiveStreamingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [events, setEvents] = useState<StreamEvent[]>(initialEvents);
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters read from URL params or state
  const [contractFilter, setContractFilter] = useState(searchParams.get("contract") || "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "");
  const [dateFilter, setDateFilter] = useState(searchParams.get("date") || "");

  const streamContainerRef = useRef<HTMLDivElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  // Update URL params when filters change
  const updateUrlParams = useCallback(
    (contract: string, type: string, date: string) => {
      const params = new URLSearchParams();
      if (contract) params.set("contract", contract);
      if (type) params.set("type", type);
      if (date) params.set("date", date);

      const queryString = params.toString();
      router.replace(queryString ? `/live?${queryString}` : "/live", { scroll: false });
    },
    [router]
  );

  const handleContractChange = (val: string) => {
    setContractFilter(val);
    updateUrlParams(val, typeFilter, dateFilter);
  };

  const handleTypeChange = (val: string) => {
    setTypeFilter(val);
    updateUrlParams(contractFilter, val, dateFilter);
  };

  const handleDateChange = (val: string) => {
    setDateFilter(val);
    updateUrlParams(contractFilter, typeFilter, val);
  };

  const clearFilters = () => {
    setContractFilter("");
    setTypeFilter("");
    setDateFilter("");
    updateUrlParams("", "", "");
  };

  // Simulate streaming events when not paused
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const eventTypes = ["transfer", "swap", "mint", "deposit", "withdraw", "approve"];
      const contracts = ["CA3D525C2...77A2", "CB8E119A4...33F1", "CC99112F8...11AA"];
      const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const randomContract = contracts[Math.floor(Math.random() * contracts.length)];
      const newId = `evt_${Date.now()}`;

      const newEvent: StreamEvent = {
        id: newId,
        contractId: randomContract,
        eventType: randomType,
        timestamp: new Date().toISOString(),
        ledgerSequence: 4982107 + Math.floor(Math.random() * 50),
        txHash: `${Math.random().toString(16).substring(2, 12)}...`,
        topics: [randomType, `contract:${randomContract.substring(0, 6)}`],
        payload: {
          value: (Math.random() * 1000).toFixed(2),
          status: "SUCCESS",
          nonce: Math.floor(Math.random() * 10000),
        },
      };

      setEvents((prev) => [...prev.slice(-150), newEvent]);
    }, 2500);

    return () => clearInterval(interval);
  }, [isPaused]);

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && streamContainerRef.current) {
      streamContainerRef.current.scrollTop = streamContainerRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  // Fullscreen API toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      pageContainerRef.current?.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable fullscreen:", err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => {
        console.error("Error attempting to exit fullscreen:", err);
      });
      setIsFullscreen(false);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Spacebar toggles pause/resume (if not typing in input)
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
      // ESC key updates state if exiting fullscreen
      if (e.code === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Copy event JSON helper
  const copyEventJson = (event: StreamEvent) => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopiedId(event.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered events
  const filteredEvents = events.filter((evt) => {
    if (contractFilter && !evt.contractId.toLowerCase().includes(contractFilter.toLowerCase())) {
      return false;
    }
    if (typeFilter && evt.eventType !== typeFilter) {
      return false;
    }
    if (dateFilter && !evt.timestamp.startsWith(dateFilter)) {
      return false;
    }
    return true;
  });

  return (
    <div
      ref={pageContainerRef}
      className={`min-h-screen bg-terminal-black text-terminal-green font-terminal-mono flex flex-col ${
        isFullscreen ? "p-4 sm:p-6" : "p-4 sm:p-8"
      }`}
    >
      {/* Top Header Control Bar */}
      <div className="flex flex-col gap-4 mb-4 border-b border-terminal-green/30 pb-4 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Radio className={`h-6 w-6 text-terminal-green ${!isPaused ? "animate-pulse" : ""}`} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-terminal-green">
                  Live Event Stream
                </h1>
                <span
                  className={`px-2 py-0.5 text-xs font-bold rounded ${
                    isPaused
                      ? "bg-terminal-warning/20 text-terminal-warning border border-terminal-warning/40"
                      : "bg-terminal-green/20 text-terminal-green border border-terminal-green/40"
                  }`}
                >
                  {isPaused ? "PAUSED" : "LIVE STREAMING"}
                </span>
              </div>
              <p className="text-xs text-terminal-gray">
                Real-time Soroban smart contract event log feed. Press [Space] to pause/resume.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsPaused((prev) => !prev)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded border transition-colors ${
                isPaused
                  ? "bg-terminal-green text-terminal-black border-terminal-green hover:bg-terminal-green/90"
                  : "bg-terminal-dark text-terminal-warning border-terminal-warning/40 hover:bg-terminal-warning/10"
              }`}
            >
              {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {isPaused ? "Resume Stream" : "Pause Stream"}
            </button>

            <button
              onClick={() => setAutoScroll((prev) => !prev)}
              className={`flex items-center gap-2 px-3 py-2 text-xs rounded border transition-colors ${
                autoScroll
                  ? "bg-terminal-cyan/20 text-terminal-cyan border-terminal-cyan/40"
                  : "bg-terminal-dark text-terminal-gray border-terminal-green/20"
              }`}
            >
              <ArrowDownCircle className="h-4 w-4" />
              Auto-Scroll: {autoScroll ? "ON" : "OFF"}
            </button>

            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-2 px-3 py-2 text-xs rounded border border-terminal-green/30 bg-terminal-dark text-terminal-green hover:bg-terminal-green/10 transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs border-t border-terminal-green/10">
          <div className="flex items-center gap-1.5 text-terminal-gray">
            <Filter className="h-4 w-4 text-terminal-cyan" />
            <span>Filters:</span>
          </div>

          {/* Contract Filter */}
          <div className="relative">
            <input
              type="text"
              placeholder="Filter by Contract ID..."
              value={contractFilter}
              onChange={(e) => handleContractChange(e.target.value)}
              className="bg-terminal-dark border border-terminal-green/30 text-terminal-green px-3 py-1.5 rounded w-48 text-xs focus:outline-none focus:border-terminal-cyan"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="bg-terminal-dark border border-terminal-green/30 text-terminal-green px-3 py-1.5 rounded text-xs focus:outline-none focus:border-terminal-cyan"
          >
            <option value="">All Event Types</option>
            <option value="transfer">transfer</option>
            <option value="swap">swap</option>
            <option value="mint">mint</option>
            <option value="deposit">deposit</option>
            <option value="withdraw">withdraw</option>
            <option value="approve">approve</option>
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-terminal-dark border border-terminal-green/30 text-terminal-green px-3 py-1.5 rounded text-xs focus:outline-none focus:border-terminal-cyan"
          />

          {(contractFilter || typeFilter || dateFilter) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-terminal-danger hover:underline px-2 py-1"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}

          <div className="ml-auto text-terminal-gray text-[11px]">
            Showing <span className="text-terminal-cyan font-bold">{filteredEvents.length}</span> / {events.length} events
          </div>
        </div>
      </div>

      {/* Main Stream Console Window */}
      <div
        ref={streamContainerRef}
        className="flex-1 overflow-y-auto rounded border border-terminal-green/30 bg-terminal-dark/80 p-4 space-y-3 font-mono text-xs"
        style={{ maxHeight: isFullscreen ? "calc(100vh - 140px)" : "calc(100vh - 240px)" }}
      >
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-terminal-gray space-y-2">
            <Terminal className="h-8 w-8 text-terminal-gray/50" />
            <p>No streaming events match the active filters.</p>
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="group rounded border border-terminal-green/15 bg-terminal-black/60 p-3 hover:border-terminal-green/40 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-terminal-green/10 pb-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-terminal-cyan uppercase bg-terminal-cyan/10 px-2 py-0.5 rounded border border-terminal-cyan/30">
                    {evt.eventType}
                  </span>
                  <span className="text-terminal-gray">Ledger #{evt.ledgerSequence}</span>
                  <span className="text-terminal-green font-semibold">Contract: {evt.contractId}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-terminal-gray">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                  <button
                    onClick={() => copyEventJson(evt)}
                    className="flex items-center gap-1 text-[11px] text-terminal-gray hover:text-terminal-green transition-colors px-2 py-0.5 rounded border border-terminal-green/20"
                    title="Copy Event JSON"
                  >
                    {copiedId === evt.id ? (
                      <>
                        <Check className="h-3 w-3 text-terminal-green" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Copy JSON
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Event Payload Details */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-[11px]">
                <div>
                  <span className="text-terminal-gray">Tx Hash: </span>
                  <span className="text-terminal-light">{evt.txHash}</span>
                </div>
                <div>
                  <span className="text-terminal-gray">Topics: </span>
                  <span className="text-terminal-warning">[{evt.topics.join(", ")}]</span>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-terminal-green/5 text-[11px] text-terminal-gray">
                <span className="text-terminal-cyan">Payload: </span>
                <code className="text-terminal-light">{JSON.stringify(evt.payload)}</code>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function LiveStreamingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-terminal-black p-8 text-terminal-green font-terminal-mono flex items-center justify-center">
          <p className="text-sm text-terminal-gray animate-pulse">Loading live stream...</p>
        </div>
      }
    >
      <LiveStreamingContent />
    </Suspense>
  );
}

