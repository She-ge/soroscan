"use client";

/**
 * WebhookSchemaViewer — Displays webhook payload schemas for all event types.
 * Includes signature verification guide and delivery header reference.
 */

import * as React from "react";
import { ChevronDown, ChevronRight, Webhook, Shield, RefreshCcw, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeBlock } from "@/components/ui/CodeBlock";

// ---------- Schema definitions ----------

interface FieldDef {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface EventSchema {
  eventType: string;
  description: string;
  fields: FieldDef[];
  examplePayload: string;
}

const WEBHOOK_EVENT_SCHEMAS: EventSchema[] = [
  {
    eventType: "SWAP_COMPLETE",
    description: "Emitted when a DEX swap is successfully executed.",
    fields: [
      { name: "webhook_id", type: "string", required: true, description: "Webhook subscription ID." },
      { name: "event_id", type: "string", required: true, description: "Unique event ID for deduplication." },
      { name: "contract_id", type: "string", required: true, description: "Soroban contract address." },
      { name: "event_type", type: "string", required: true, description: 'Always "SWAP_COMPLETE".' },
      { name: "ledger", type: "integer", required: true, description: "Ledger sequence number." },
      { name: "timestamp", type: "ISO 8601", required: true, description: "Time of the event." },
      { name: "data.amount_in", type: "string", required: true, description: "Input token amount (stroops)." },
      { name: "data.amount_out", type: "string", required: true, description: "Output token amount (stroops)." },
      { name: "data.token_in", type: "string", required: true, description: "Input token symbol." },
      { name: "data.token_out", type: "string", required: true, description: "Output token symbol." },
    ],
    examplePayload: JSON.stringify(
      {
        webhook_id: "wh_abc123",
        event_id: "evt_xyz789",
        contract_id: "CABC...9X4Z",
        event_type: "SWAP_COMPLETE",
        ledger: 12345678,
        timestamp: "2024-01-15T10:05:32Z",
        data: {
          amount_in: "1000000",
          amount_out: "950000",
          token_in: "XLM",
          token_out: "USDC",
        },
      },
      null,
      2,
    ),
  },
  {
    eventType: "TRANSFER",
    description: "Emitted when tokens are transferred between accounts.",
    fields: [
      { name: "webhook_id", type: "string", required: true, description: "Webhook subscription ID." },
      { name: "event_id", type: "string", required: true, description: "Unique event ID." },
      { name: "contract_id", type: "string", required: true, description: "Token contract address." },
      { name: "event_type", type: "string", required: true, description: 'Always "TRANSFER".' },
      { name: "ledger", type: "integer", required: true, description: "Ledger sequence number." },
      { name: "timestamp", type: "ISO 8601", required: true, description: "Time of the event." },
      { name: "data.from", type: "string", required: true, description: "Sender account address." },
      { name: "data.to", type: "string", required: true, description: "Receiver account address." },
      { name: "data.amount", type: "string", required: true, description: "Amount transferred (stroops)." },
      { name: "data.token", type: "string", required: true, description: "Token symbol." },
    ],
    examplePayload: JSON.stringify(
      {
        webhook_id: "wh_abc123",
        event_id: "evt_transfer001",
        contract_id: "CABC...TOKEN",
        event_type: "TRANSFER",
        ledger: 12345680,
        timestamp: "2024-01-15T10:06:00Z",
        data: {
          from: "GABC...SENDER",
          to: "GXYZ...RECEIVER",
          amount: "5000000",
          token: "USDC",
        },
      },
      null,
      2,
    ),
  },
  {
    eventType: "LIQUIDITY_ADDED",
    description: "Emitted when liquidity is provided to a pool.",
    fields: [
      { name: "webhook_id", type: "string", required: true, description: "Webhook subscription ID." },
      { name: "event_id", type: "string", required: true, description: "Unique event ID." },
      { name: "contract_id", type: "string", required: true, description: "AMM contract address." },
      { name: "event_type", type: "string", required: true, description: 'Always "LIQUIDITY_ADDED".' },
      { name: "ledger", type: "integer", required: true, description: "Ledger sequence number." },
      { name: "timestamp", type: "ISO 8601", required: true, description: "Time of the event." },
      { name: "data.provider", type: "string", required: true, description: "Liquidity provider address." },
      { name: "data.amount_a", type: "string", required: true, description: "Amount of token A added." },
      { name: "data.amount_b", type: "string", required: true, description: "Amount of token B added." },
      { name: "data.lp_tokens_minted", type: "string", required: true, description: "LP tokens issued to provider." },
    ],
    examplePayload: JSON.stringify(
      {
        webhook_id: "wh_abc123",
        event_id: "evt_liq001",
        contract_id: "CABC...AMM",
        event_type: "LIQUIDITY_ADDED",
        ledger: 12345685,
        timestamp: "2024-01-15T10:07:00Z",
        data: {
          provider: "GABC...PROVIDER",
          amount_a: "10000000",
          amount_b: "9500000",
          lp_tokens_minted: "9750000",
        },
      },
      null,
      2,
    ),
  },
];

const SIGNATURE_VERIFY_PY = `import hmac
import hashlib

def verify_signature(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode("utf-8"),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)

# In your Django/FastAPI view:
signature = request.headers.get("X-SoroScan-Signature", "")
if not verify_signature(request.body, signature, "your-webhook-secret"):
    return HttpResponse(status=401)
`;

const SIGNATURE_VERIFY_TS = `import * as crypto from "crypto"

export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex")

  return crypto.timingSafeEqual(
    Buffer.from(\`sha256=\${expected}\`, "ascii"),
    Buffer.from(signature, "ascii")
  )
}

// Express.js middleware:
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["x-soroscan-signature"] as string
  if (!verifyWebhookSignature(req.body.toString(), sig, process.env.WEBHOOK_SECRET!)) {
    return res.status(401).send("Invalid signature")
  }
  const payload = JSON.parse(req.body.toString())
  console.log("Verified event:", payload.event_type)
  res.status(200).send("OK")
})
`;

const DELIVERY_HEADERS = [
  { header: "Content-Type", value: "application/json", description: "Always JSON." },
  { header: "X-SoroScan-Signature", value: "sha256=<hmac_hex>", description: "HMAC-SHA256 of the raw request body." },
  { header: "X-SoroScan-Webhook-Id", value: "wh_abc123", description: "Your webhook subscription ID." },
  { header: "X-SoroScan-Event-Id", value: "evt_xyz789", description: "Unique event ID for idempotency." },
  { header: "X-SoroScan-Timestamp", value: "1705312000", description: "Unix timestamp of the delivery." },
];

// ---------- Subcomponents ----------

function EventSchemaCard({ schema, isExpanded, onToggle }: {
  schema: EventSchema;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-terminal-green/20" data-testid={`webhook-schema-${schema.eventType}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-terminal-green/5 transition-colors"
        aria-expanded={isExpanded}
      >
        {isExpanded ? (
          <ChevronDown size={14} className="text-terminal-gray shrink-0" aria-hidden="true" />
        ) : (
          <ChevronRight size={14} className="text-terminal-gray shrink-0" aria-hidden="true" />
        )}
        <Webhook size={14} className="text-terminal-cyan shrink-0" aria-hidden="true" />
        <span className="font-bold text-sm text-terminal-cyan">{schema.eventType}</span>
        <span className="text-xs text-terminal-gray ml-2">{schema.description}</span>
      </button>

      {isExpanded && (
        <div className="border-t border-terminal-green/20">
          {/* Fields table */}
          <div className="p-4 space-y-3">
            <h3 className="text-xs text-terminal-gray tracking-widest">PAYLOAD_FIELDS</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse" aria-label={`${schema.eventType} payload fields`}>
                <thead>
                  <tr className="border-b border-terminal-green/20">
                    <th className="text-left py-2 pr-4 text-terminal-gray font-normal">Field</th>
                    <th className="text-left py-2 pr-4 text-terminal-gray font-normal">Type</th>
                    <th className="text-left py-2 pr-4 text-terminal-gray font-normal">Required</th>
                    <th className="text-left py-2 text-terminal-gray font-normal">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {schema.fields.map((field) => (
                    <tr key={field.name} className="border-b border-terminal-green/10">
                      <td className="py-2 pr-4 text-terminal-cyan font-mono">{field.name}</td>
                      <td className="py-2 pr-4 text-terminal-warning">{field.type}</td>
                      <td className="py-2 pr-4">
                        {field.required ? (
                          <span className="text-terminal-danger">✓ yes</span>
                        ) : (
                          <span className="text-terminal-gray">no</span>
                        )}
                      </td>
                      <td className="py-2 text-terminal-gray">{field.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Example payload */}
            <div className="mt-4">
              <h3 className="text-xs text-terminal-gray tracking-widest mb-2">EXAMPLE_PAYLOAD</h3>
              <CodeBlock
                code={schema.examplePayload}
                language="json"
                showHeader
                showLineNumbers
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Main Component ----------

interface WebhookSchemaViewerProps {
  className?: string;
}

export function WebhookSchemaViewer({ className }: WebhookSchemaViewerProps) {
  const [expandedEvents, setExpandedEvents] = React.useState<Set<string>>(
    new Set(["SWAP_COMPLETE"]),
  );
  const [verifyTab, setVerifyTab] = React.useState<"python" | "typescript">("python");

  const toggleEvent = (eventType: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventType)) {
        next.delete(eventType);
      } else {
        next.add(eventType);
      }
      return next;
    });
  };

  return (
    <div className={cn("space-y-8", className)} data-testid="webhook-schema-viewer">
      {/* Event Schemas */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="text-[10px] text-terminal-cyan tracking-widest">[EVENT_SCHEMAS]</div>
        </div>
        <div className="space-y-2">
          {WEBHOOK_EVENT_SCHEMAS.map((schema) => (
            <EventSchemaCard
              key={schema.eventType}
              schema={schema}
              isExpanded={expandedEvents.has(schema.eventType)}
              onToggle={() => toggleEvent(schema.eventType)}
            />
          ))}
        </div>
      </section>

      {/* Delivery Headers */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="text-[10px] text-terminal-cyan tracking-widest">[DELIVERY_HEADERS]</div>
        </div>
        <div className="border border-terminal-green/20 overflow-x-auto">
          <table className="w-full text-xs border-collapse" aria-label="Webhook delivery headers">
            <thead>
              <tr className="border-b border-terminal-green/20 bg-terminal-black/50">
                <th className="text-left px-4 py-3 text-terminal-gray font-normal">Header</th>
                <th className="text-left px-4 py-3 text-terminal-gray font-normal">Example Value</th>
                <th className="text-left px-4 py-3 text-terminal-gray font-normal">Description</th>
              </tr>
            </thead>
            <tbody>
              {DELIVERY_HEADERS.map((row) => (
                <tr key={row.header} className="border-b border-terminal-green/10">
                  <td className="px-4 py-2.5 text-terminal-cyan font-mono">{row.header}</td>
                  <td className="px-4 py-2.5 text-terminal-warning font-mono">{row.value}</td>
                  <td className="px-4 py-2.5 text-terminal-gray">{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Signature Verification */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <Shield size={14} className="text-terminal-green" aria-hidden="true" />
          <div className="text-[10px] text-terminal-cyan tracking-widest">[SIGNATURE_VERIFICATION]</div>
        </div>

        <div className="border border-terminal-green/20 p-4 mb-4 flex items-start gap-3">
          <CheckCircle size={16} className="text-terminal-green shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-terminal-gray">
            Always verify the <code className="text-terminal-cyan">X-SoroScan-Signature</code> header
            before processing webhook payloads. Use a timing-safe comparison to prevent timing attacks.
          </p>
        </div>

        <div className="flex gap-2 mb-2" role="tablist" aria-label="Select signature verification language">
          {(["python", "typescript"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              role="tab"
              aria-selected={verifyTab === lang}
              onClick={() => setVerifyTab(lang)}
              className={cn(
                "px-3 py-1.5 text-xs border transition-colors",
                verifyTab === lang
                  ? "border-terminal-cyan text-terminal-cyan bg-terminal-cyan/5"
                  : "border-terminal-green/20 text-terminal-gray hover:text-terminal-green",
              )}
            >
              {lang === "python" ? "Python" : "TypeScript"}
            </button>
          ))}
        </div>

        <CodeBlock
          code={verifyTab === "python" ? SIGNATURE_VERIFY_PY : SIGNATURE_VERIFY_TS}
          language={verifyTab === "python" ? "python" : "typescript"}
          filename={verifyTab === "python" ? "verify_webhook.py" : "verifyWebhook.ts"}
          showHeader
          showLineNumbers
        />
      </section>

      {/* Retry policy */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <RefreshCcw size={14} className="text-terminal-warning" aria-hidden="true" />
          <div className="text-[10px] text-terminal-cyan tracking-widest">[RETRY_POLICY]</div>
        </div>
        <div className="border border-terminal-green/20 overflow-x-auto">
          <table className="w-full text-xs border-collapse" aria-label="Webhook retry policy">
            <thead>
              <tr className="border-b border-terminal-green/20 bg-terminal-black/50">
                <th className="text-left px-4 py-3 text-terminal-gray font-normal">Attempt</th>
                <th className="text-left px-4 py-3 text-terminal-gray font-normal">Delay</th>
                <th className="text-left px-4 py-3 text-terminal-gray font-normal">Cumulative Wait</th>
              </tr>
            </thead>
            <tbody>
              {[
                { attempt: "1st retry", delay: "1 minute", cumulative: "~1 min" },
                { attempt: "2nd retry", delay: "5 minutes", cumulative: "~6 min" },
                { attempt: "3rd retry", delay: "30 minutes", cumulative: "~36 min" },
                { attempt: "4th retry", delay: "2 hours", cumulative: "~2.6 hours" },
                { attempt: "Final retry", delay: "8 hours", cumulative: "~10.6 hours" },
              ].map((row) => (
                <tr key={row.attempt} className="border-b border-terminal-green/10">
                  <td className="px-4 py-2.5 text-terminal-cyan">{row.attempt}</td>
                  <td className="px-4 py-2.5 text-terminal-gray">{row.delay}</td>
                  <td className="px-4 py-2.5 text-terminal-gray-muted">{row.cumulative}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-terminal-gray px-1">
          After 5 failed attempts the subscription is marked <span className="text-terminal-danger">suspended</span>.
          Re-enable it from the Webhooks dashboard.
        </p>
      </section>
    </div>
  );
}
