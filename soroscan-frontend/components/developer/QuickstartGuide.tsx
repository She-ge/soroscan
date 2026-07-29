"use client";

/**
 * QuickstartGuide — Step-by-step onboarding wizard for new developers.
 */

import * as React from "react";
import { CheckCircle2, Circle, ArrowRight, Terminal, Key, FileCode2, Webhook, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeBlock } from "@/components/ui/CodeBlock";

// ---------- Step definitions ----------

interface Step {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  code?: { language: "bash" | "python" | "typescript" | "json"; content: string; filename?: string };
  tip?: string;
  links?: Array<{ label: string; href: string }>;
}

const STEPS: Step[] = [
  {
    id: "get-key",
    number: "01",
    title: "Get Your API Key",
    description:
      "Register or log in to generate an API key. Keys are scoped per project and auto-refreshed on expiry.",
    icon: Key,
    code: {
      language: "bash",
      filename: "auth.sh",
      content: `# Obtain access + refresh tokens
curl -X POST https://soroscan.io/api/auth/token/ \\
  -H 'Content-Type: application/json' \\
  -d '{"email": "you@example.com", "password": "yourpassword"}'

# Response: { "access": "eyJ...", "refresh": "eyJ..." }`,
    },
    tip: "Store your refresh token securely. Access tokens expire in 15 minutes.",
    links: [
      { label: "Authentication guide →", href: "/developer-portal/docs/authentication" },
    ],
  },
  {
    id: "register-contract",
    number: "02",
    title: "Register a Contract",
    description:
      "Whitelist your Soroban contract address. SoroScan will begin polling Horizon for events emitted by your contract.",
    icon: FileCode2,
    code: {
      language: "bash",
      filename: "register.sh",
      content: `curl -X POST https://soroscan.io/api/contracts/ \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{"contract_id": "CABC...9X4Z", "label": "my-amm"}'`,
    },
    tip: "The label is for your reference only — use something descriptive.",
  },
  {
    id: "query-events",
    number: "03",
    title: "Query Events",
    description:
      "Immediately start querying indexed events via REST or GraphQL. Filter by contract, event type, ledger range, or timestamp.",
    icon: Terminal,
    code: {
      language: "bash",
      filename: "query.sh",
      content: `# REST: list recent events
curl 'https://soroscan.io/api/events/?contract_id=CABC...9X4Z&limit=10' \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'

# GraphQL
curl -X POST https://soroscan.io/graphql/ \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{"query": "{ events(contractId: \\"CABC...9X4Z\\", first: 10) { edges { node { id eventType data createdAt } } } }"}'`,
    },
    links: [
      { label: "Events API reference →", href: "/developer-portal/docs/api-reference/events" },
      { label: "GraphQL playground →", href: "/developer-portal" },
    ],
  },
  {
    id: "setup-webhook",
    number: "04",
    title: "Subscribe to Webhooks",
    description:
      "Get real-time push notifications when events are indexed. All payloads are HMAC-SHA256 signed.",
    icon: Webhook,
    code: {
      language: "bash",
      filename: "webhook.sh",
      content: `curl -X POST https://soroscan.io/api/webhooks/ \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "url": "https://your-app.com/webhook",
    "event_type": "SWAP_COMPLETE",
    "contract_id": "CABC...9X4Z",
    "secret": "your-hmac-secret"
  }'`,
    },
    tip: "Always verify the X-SoroScan-Signature header in your webhook handler.",
    links: [
      { label: "Webhook guide →", href: "/developer-portal/docs/webhooks" },
    ],
  },
  {
    id: "use-sdk",
    number: "05",
    title: "Install the SDK",
    description:
      "Use a typed SDK for seamless integration — available for Python, TypeScript, and Go.",
    icon: Zap,
    code: {
      language: "python",
      filename: "sdk_example.py",
      content: `from soroscan import SoroScanClient

client = SoroScanClient(api_key="sk_live_...")

events = await client.events.list(
    contract_id="CABC...9X4Z",
    event_type="SWAP_COMPLETE",
    limit=50,
)

for event in events:
    print(f"Ledger {event.ledger}: {event.event_type}")`,
    },
    links: [
      { label: "Python SDK →", href: "/developer-portal/docs/sdks/python" },
      { label: "TypeScript SDK →", href: "/developer-portal/docs/sdks/javascript" },
      { label: "Go SDK →", href: "/developer-portal/docs/sdks/go" },
    ],
  },
];

// ---------- Step component ----------

function StepCard({
  step,
  isCompleted,
  isActive,
  onClick,
}: {
  step: Step;
  isCompleted: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = step.icon;

  return (
    <div
      className={cn(
        "border transition-colors",
        isActive
          ? "border-terminal-green bg-terminal-green/5"
          : isCompleted
          ? "border-terminal-green/30"
          : "border-terminal-green/15",
      )}
      data-testid={`quickstart-step-${step.id}`}
    >
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center gap-4 px-4 py-4 text-left"
        aria-expanded={isActive}
      >
        {/* Step indicator */}
        <div className="shrink-0">
          {isCompleted ? (
            <CheckCircle2 size={22} className="text-terminal-green" aria-label="Completed" />
          ) : isActive ? (
            <div className="w-[22px] h-[22px] border-2 border-terminal-green flex items-center justify-center">
              <span className="text-terminal-green text-[10px] font-bold">{step.number}</span>
            </div>
          ) : (
            <Circle size={22} className="text-terminal-gray/40" aria-hidden="true" />
          )}
        </div>

        {/* Icon + title */}
        <Icon
          size={16}
          className={cn(isActive ? "text-terminal-green" : "text-terminal-gray")}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm font-bold",
                isActive ? "text-terminal-green" : isCompleted ? "text-terminal-green/70" : "text-terminal-gray",
              )}
            >
              {step.title}
            </span>
            {isCompleted && (
              <span className="text-[10px] text-terminal-green/60 border border-terminal-green/20 px-1.5 py-0.5 uppercase tracking-widest">
                done
              </span>
            )}
          </div>
          {!isActive && (
            <p className="text-xs text-terminal-gray-muted mt-0.5 truncate">{step.description}</p>
          )}
        </div>

        <ArrowRight
          size={14}
          className={cn(
            "shrink-0 transition-transform",
            isActive ? "rotate-90 text-terminal-green" : "text-terminal-gray/40",
          )}
          aria-hidden="true"
        />
      </button>

      {/* Expanded content */}
      {isActive && (
        <div className="px-4 pb-5 space-y-4 border-t border-terminal-green/20 pt-4">
          <p className="text-sm text-terminal-gray">{step.description}</p>

          {step.code && (
            <CodeBlock
              code={step.code.content}
              language={step.code.language}
              filename={step.code.filename}
              showHeader
              showLineNumbers
            />
          )}

          {step.tip && (
            <div className="border-l-2 border-terminal-warning pl-3 text-xs text-terminal-warning">
              <span className="font-bold">TIP: </span>
              {step.tip}
            </div>
          )}

          {step.links && step.links.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-1">
              {step.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-xs text-terminal-cyan hover:underline"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Main Component ----------

interface QuickstartGuideProps {
  className?: string;
}

export function QuickstartGuide({ className }: QuickstartGuideProps) {
  const [activeStep, setActiveStep] = React.useState<string>(STEPS[0].id);
  const [completedSteps, setCompletedSteps] = React.useState<Set<string>>(new Set());

  const currentIndex = STEPS.findIndex((s) => s.id === activeStep);

  const markDoneAndNext = () => {
    setCompletedSteps((prev) => new Set([...prev, activeStep]));
    const next = STEPS[currentIndex + 1];
    if (next) {
      setActiveStep(next.id);
    }
  };

  const resetGuide = () => {
    setCompletedSteps(new Set());
    setActiveStep(STEPS[0].id);
  };

  const allDone = completedSteps.size === STEPS.length;

  return (
    <div className={cn("space-y-4", className)} data-testid="quickstart-guide">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] text-terminal-cyan tracking-widest mb-1">[QUICKSTART]</div>
          <h2 className="text-xl font-bold text-terminal-green">5-Minute Integration Guide</h2>
          <p className="text-sm text-terminal-gray mt-1">
            Follow these steps to go from zero to querying live Soroban events.
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold font-mono text-terminal-green">
            {completedSteps.size}/{STEPS.length}
          </div>
          <div className="text-xs text-terminal-gray">steps done</div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-1.5 bg-terminal-dark border border-terminal-green/20 overflow-hidden"
        role="progressbar"
        aria-valuenow={completedSteps.size}
        aria-valuemin={0}
        aria-valuemax={STEPS.length}
        aria-label="Quickstart progress"
      >
        <div
          className="h-full bg-terminal-green transition-all duration-500"
          style={{ width: `${(completedSteps.size / STEPS.length) * 100}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {STEPS.map((step) => (
          <StepCard
            key={step.id}
            step={step}
            isCompleted={completedSteps.has(step.id)}
            isActive={activeStep === step.id}
            onClick={() => setActiveStep(step.id)}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        {allDone ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} className="text-terminal-green" aria-hidden="true" />
            <span className="text-terminal-green font-bold text-sm">
              Integration complete! You&apos;re ready to index Soroban events.
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={markDoneAndNext}
            className="flex items-center gap-2 border border-terminal-green px-4 py-2 text-terminal-green text-sm hover:bg-terminal-green/10 transition-colors"
          >
            Mark Done &amp; Continue
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={resetGuide}
          className="text-xs text-terminal-gray hover:text-terminal-cyan underline"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
