"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { BookOpen, Code2, Webhook, Activity, Zap, FileCode2, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/terminal/landing/Navbar";
import { Footer } from "@/components/terminal/landing/Footer";
import { SchemaBrowser } from "@/components/developer/SchemaBrowser";
import { CodeSampleGenerator } from "@/components/developer/CodeSampleGenerator";
import { WebhookSchemaViewer } from "@/components/developer/WebhookSchemaViewer";
import { RateLimitStatus } from "@/components/developer/RateLimitStatus";
import { QuickstartGuide } from "@/components/developer/QuickstartGuide";

// GraphiQL must be dynamically imported (uses browser APIs)
const APIExplorer = dynamic(
  () => import("@/components/developer/APIExplorer").then((m) => m.APIExplorer),
  {
    ssr: false,
    loading: () => (
      <div className="border border-terminal-green/20 h-[80vh] flex items-center justify-center">
        <div className="text-terminal-gray text-sm animate-pulse">Loading GraphQL Playground...</div>
      </div>
    ),
  },
);

// Import graphiql CSS (must be in a client component or global)
import "graphiql/style.css";

// ---------- Tab definitions ----------

type TabId = "playground" | "schema" | "code-samples" | "webhooks" | "quickstart" | "rate-limits";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

const TABS: Tab[] = [
  { id: "playground", label: "API Playground", icon: Zap },
  { id: "schema", label: "Schema Browser", icon: Code2 },
  { id: "code-samples", label: "Code Samples", icon: FileCode2 },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "quickstart", label: "Quickstart", icon: BookOpen, badge: "NEW" },
  { id: "rate-limits", label: "Rate Limits", icon: Activity },
];

// ---------- Quick-access doc links ----------

const DOC_LINKS = [
  { label: "Quickstart Guide", href: "/developer-portal/docs/quickstart", description: "Get running in 5 minutes" },
  { label: "Authentication", href: "/developer-portal/docs/authentication", description: "JWT tokens & refresh flow" },
  { label: "Webhooks Guide", href: "/developer-portal/docs/webhooks", description: "Real-time event push" },
  { label: "Python SDK", href: "/developer-portal/docs/sdks/python", description: "pip install soroscan" },
  { label: "TypeScript SDK", href: "/developer-portal/docs/sdks/javascript", description: "npm install @soroscan/sdk" },
  { label: "Go SDK", href: "/developer-portal/docs/sdks/go", description: "go get soroscan-go" },
  { label: "Contracts API", href: "/developer-portal/docs/api-reference/contracts", description: "REST + GraphQL reference" },
  { label: "Events API", href: "/developer-portal/docs/api-reference/events", description: "Filter & paginate events" },
];

// ---------- Page component ----------

export default function DeveloperPortalPage() {
  const [activeTab, setActiveTab] = React.useState<TabId>("quickstart");

  return (
    <div className="min-h-screen font-terminal-mono selection:bg-terminal-green selection:text-terminal-black bg-terminal-black">
      <Navbar />

      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-8xl space-y-8">

        {/* Hero */}
        <header className="space-y-3">
          <div className="text-[10px] text-terminal-cyan tracking-widest">[DEVELOPER_PORTAL]</div>
          <h1 className="text-3xl md:text-4xl font-bold text-terminal-green">
            Developer Portal & API Playground
          </h1>
          <p className="text-terminal-gray text-sm md:text-base max-w-2xl">
            Explore the SoroScan GraphQL schema, execute live queries, generate code samples in
            your language, and browse webhook event schemas — all in one place.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href="/api/docs/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs border border-terminal-green/40 px-3 py-1.5 text-terminal-green hover:bg-terminal-green/10 transition-colors"
            >
              Swagger UI ↗
            </a>
            <a
              href="/api/redoc/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs border border-terminal-green/20 px-3 py-1.5 text-terminal-gray hover:text-terminal-cyan transition-colors"
            >
              ReDoc ↗
            </a>
            <a
              href="https://github.com/SoroScan/soroscan"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs border border-terminal-green/20 px-3 py-1.5 text-terminal-gray hover:text-terminal-cyan transition-colors"
            >
              GitHub ↗
            </a>
          </div>
        </header>

        {/* Main layout: tabs + doc links */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-6">

          {/* Left: Tabs */}
          <div className="space-y-4">
            {/* Tab bar */}
            <div
              className="flex flex-wrap gap-1 border-b border-terminal-green/20 pb-0"
              role="tablist"
              aria-label="Developer portal sections"
            >
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`tabpanel-${tab.id}`}
                    id={`tab-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-3 py-2 text-xs border-b-2 transition-colors
                      ${isActive
                        ? "border-terminal-green text-terminal-green"
                        : "border-transparent text-terminal-gray hover:text-terminal-green hover:border-terminal-green/30"
                      }
                    `}
                  >
                    <Icon size={13} aria-hidden="true" />
                    {tab.label}
                    {tab.badge && (
                      <span className="ml-1 px-1 py-0.5 text-[8px] bg-terminal-cyan text-terminal-black font-bold uppercase tracking-widest">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab panels */}
            <div
              role="tabpanel"
              id={`tabpanel-${activeTab}`}
              aria-labelledby={`tab-${activeTab}`}
            >
              {activeTab === "playground" && <APIExplorer />}
              {activeTab === "schema" && (
                <SchemaBrowser className="h-[70vh] min-h-[500px]" />
              )}
              {activeTab === "code-samples" && (
                <CodeSampleGenerator />
              )}
              {activeTab === "webhooks" && (
                <WebhookSchemaViewer />
              )}
              {activeTab === "quickstart" && (
                <QuickstartGuide />
              )}
              {activeTab === "rate-limits" && (
                <RateLimitStatus />
              )}
            </div>
          </div>

          {/* Right: doc navigation */}
          <aside className="space-y-4">
            <div>
              <div className="text-[10px] text-terminal-cyan tracking-widest mb-2">[DOCUMENTATION]</div>
              <h2 className="text-sm font-bold text-terminal-green mb-3">Quick Links</h2>
              <nav aria-label="Documentation links">
                <ul className="space-y-1">
                  {DOC_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="flex items-center justify-between px-3 py-2 border border-terminal-green/10 hover:border-terminal-green/30 hover:bg-terminal-green/5 transition-colors group"
                      >
                        <div>
                          <div className="text-xs text-terminal-green group-hover:text-terminal-cyan transition-colors">
                            {link.label}
                          </div>
                          <div className="text-[10px] text-terminal-gray-muted mt-0.5">
                            {link.description}
                          </div>
                        </div>
                        <ChevronRight
                          size={12}
                          className="text-terminal-gray/40 group-hover:text-terminal-cyan transition-colors shrink-0"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Rate limit widget (compact) */}
            <RateLimitStatus pollIntervalMs={60_000} />
          </aside>
        </div>
      </main>

      <div className="container mx-auto px-4 md:px-6 max-w-8xl pb-12">
        <Footer />
      </div>

      {/* Grid overlay */}
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-[0.02]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,1)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>
    </div>
  );
}
