"use client";

/**
 * CodeSampleGenerator — Multi-language code sample selector with copy-to-clipboard.
 * Shows runnable code for Python, TypeScript, JavaScript, Go, Rust, curl/bash.
 */

import * as React from "react";
import { Check, Copy, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeBlock, type CodeBlockLanguage } from "@/components/ui/CodeBlock";

// ---------- Types ----------

export type SupportedLanguage = "python" | "typescript" | "javascript" | "go" | "rust" | "bash";

export interface CodeSample {
  language: SupportedLanguage;
  label: string;
  code: string;
  filename?: string;
}

export interface CodeSampleSet {
  title: string;
  description?: string;
  samples: CodeSample[];
}

// ---------- Built-in sample sets ----------

export const SAMPLE_SETS: CodeSampleSet[] = [
  {
    title: "List Events",
    description: "Retrieve paginated contract events with optional filters.",
    samples: [
      {
        language: "python",
        label: "Python",
        filename: "list_events.py",
        code: `from soroscan import SoroScanClient

client = SoroScanClient(api_key="sk_live_...")

events = await client.events.list(
    contract_id="CABC...9X4Z",
    event_type="SWAP_COMPLETE",
    limit=50,
)

for event in events:
    print(f"Ledger {event.ledger}: {event.event_type}")
    print(f"  Data: {event.data}")
`,
      },
      {
        language: "typescript",
        label: "TypeScript",
        filename: "listEvents.ts",
        code: `import { SoroScanClient } from "@soroscan/sdk"

const client = new SoroScanClient({ apiKey: "sk_live_..." })

const { events } = await client.events.list({
  contractId: "CABC...9X4Z",
  eventType: "SWAP_COMPLETE",
  limit: 50,
})

events.forEach(event => {
  console.log(\`Ledger \${event.ledger}: \${event.eventType}\`)
})
`,
      },
      {
        language: "go",
        label: "Go",
        filename: "list_events.go",
        code: `package main

import (
    "context"
    "fmt"

    soroscan "github.com/soroscan/soroscan-go"
)

func main() {
    client := soroscan.NewClient("sk_live_...")
    ctx := context.Background()

    events, err := client.Events.List(ctx, &soroscan.EventListOptions{
        ContractID: "CABC...9X4Z",
        EventType:  "SWAP_COMPLETE",
        Limit:      50,
    })
    if err != nil {
        panic(err)
    }

    for _, event := range events {
        fmt.Printf("Ledger %d: %s\\n", event.Ledger, event.EventType)
    }
}
`,
      },
      {
        language: "bash",
        label: "cURL",
        filename: "list_events.sh",
        code: `curl 'https://soroscan.io/api/events/?contract_id=CABC...9X4Z&limit=50' \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'
`,
      },
    ],
  },
  {
    title: "Register Contract",
    description: "Register a Soroban contract address for event indexing.",
    samples: [
      {
        language: "python",
        label: "Python",
        filename: "register_contract.py",
        code: `from soroscan import SoroScanClient

client = SoroScanClient(api_key="sk_live_...")

contract = await client.contracts.create(
    contract_id="CABC...9X4Z",
    label="my-amm-contract"
)

print(f"Registered contract: {contract.id}")
`,
      },
      {
        language: "typescript",
        label: "TypeScript",
        filename: "registerContract.ts",
        code: `import { SoroScanClient } from "@soroscan/sdk"

const client = new SoroScanClient({ apiKey: "sk_live_..." })

const contract = await client.contracts.create({
  contractId: "CABC...9X4Z",
  label: "my-amm-contract",
})

console.log(\`Registered contract: \${contract.id}\`)
`,
      },
      {
        language: "go",
        label: "Go",
        filename: "register_contract.go",
        code: `package main

import (
    "context"
    "fmt"

    soroscan "github.com/soroscan/soroscan-go"
)

func main() {
    client := soroscan.NewClient("sk_live_...")
    ctx := context.Background()

    contract, err := client.Contracts.Create(ctx, &soroscan.ContractCreateInput{
        ContractID: "CABC...9X4Z",
        Label:      "my-amm-contract",
    })
    if err != nil {
        panic(err)
    }

    fmt.Printf("Registered contract: %s\\n", contract.ID)
}
`,
      },
      {
        language: "bash",
        label: "cURL",
        filename: "register_contract.sh",
        code: `curl -X POST https://soroscan.io/api/contracts/ \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{"contract_id": "CABC...9X4Z", "label": "my-amm-contract"}'
`,
      },
    ],
  },
  {
    title: "Create Webhook",
    description: "Subscribe to real-time event push notifications.",
    samples: [
      {
        language: "python",
        label: "Python",
        filename: "create_webhook.py",
        code: `from soroscan import SoroScanClient

client = SoroScanClient(api_key="sk_live_...")

webhook = await client.webhooks.create(
    url="https://your-app.com/webhook",
    event_type="SWAP_COMPLETE",
    contract_id="CABC...9X4Z",
    secret="your-hmac-secret"
)

print(f"Webhook created: {webhook.id}")
`,
      },
      {
        language: "typescript",
        label: "TypeScript",
        filename: "createWebhook.ts",
        code: `import { SoroScanClient } from "@soroscan/sdk"

const client = new SoroScanClient({ apiKey: "sk_live_..." })

const webhook = await client.webhooks.create({
  url: "https://your-app.com/webhook",
  eventType: "SWAP_COMPLETE",
  contractId: "CABC...9X4Z",
  secret: "your-hmac-secret",
})

console.log(\`Webhook created: \${webhook.id}\`)
`,
      },
      {
        language: "go",
        label: "Go",
        filename: "create_webhook.go",
        code: `package main

import (
    "context"
    "fmt"

    soroscan "github.com/soroscan/soroscan-go"
)

func main() {
    client := soroscan.NewClient("sk_live_...")
    ctx := context.Background()

    webhook, err := client.Webhooks.Create(ctx, &soroscan.WebhookCreateInput{
        URL:        "https://your-app.com/webhook",
        EventType:  "SWAP_COMPLETE",
        ContractID: "CABC...9X4Z",
        Secret:     "your-hmac-secret",
    })
    if err != nil {
        panic(err)
    }

    fmt.Printf("Webhook created: %s\\n", webhook.ID)
}
`,
      },
      {
        language: "bash",
        label: "cURL",
        filename: "create_webhook.sh",
        code: `curl -X POST https://soroscan.io/api/webhooks/ \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "url": "https://your-app.com/webhook",
    "event_type": "SWAP_COMPLETE",
    "contract_id": "CABC...9X4Z",
    "secret": "your-hmac-secret"
  }'
`,
      },
    ],
  },
  {
    title: "GraphQL Query",
    description: "Execute a GraphQL query against the SoroScan API.",
    samples: [
      {
        language: "python",
        label: "Python",
        filename: "graphql_query.py",
        code: `from soroscan import SoroScanClient

client = SoroScanClient(api_key="sk_live_...")

result = await client.graphql.query("""
    query GetRecentEvents {
        events(contractId: "CABC...9X4Z", first: 10) {
            edges {
                node {
                    id
                    eventType
                    data
                    createdAt
                }
            }
        }
    }
""")

for edge in result["events"]["edges"]:
    node = edge["node"]
    print(f"{node['createdAt']}: {node['eventType']}")
`,
      },
      {
        language: "typescript",
        label: "TypeScript",
        filename: "graphqlQuery.ts",
        code: `import { SoroScanClient } from "@soroscan/sdk"

const client = new SoroScanClient({ apiKey: "sk_live_..." })

const result = await client.graphql.query(\`
  query GetRecentEvents {
    events(contractId: "CABC...9X4Z", first: 10) {
      edges {
        node {
          id
          eventType
          data
          createdAt
        }
      }
    }
  }
\`)

result.events.edges.forEach(({ node }) => {
  console.log(\`\${node.createdAt}: \${node.eventType}\`)
})
`,
      },
      {
        language: "bash",
        label: "cURL",
        filename: "graphql_query.sh",
        code: `curl -X POST https://soroscan.io/graphql/ \\
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "query": "query GetRecentEvents { events(contractId: \\"CABC...9X4Z\\", first: 10) { edges { node { id eventType data createdAt } } } }"
  }'
`,
      },
    ],
  },
];

// ---------- Language → CodeBlockLanguage mapping ----------

const LANG_MAP: Record<SupportedLanguage, CodeBlockLanguage> = {
  python: "python",
  typescript: "typescript",
  javascript: "javascript",
  go: "text",     // text fallback since go isn't in the built-in highlight list
  rust: "rust",
  bash: "bash",
};

// ---------- Inline copy button ----------

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      aria-label={copied ? "Copied!" : "Copy code sample"}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 text-xs border transition-colors",
        copied
          ? "border-terminal-green text-terminal-green"
          : "border-terminal-green/30 text-terminal-gray hover:text-terminal-cyan hover:border-terminal-cyan",
      )}
    >
      {copied ? (
        <>
          <Check size={12} aria-hidden="true" />
          Copied!
        </>
      ) : (
        <>
          <Copy size={12} aria-hidden="true" />
          Copy
        </>
      )}
    </button>
  );
}

// ---------- Main Component ----------

interface CodeSampleGeneratorProps {
  /** Override the default sample sets */
  sampleSets?: CodeSampleSet[];
  /** Default selected sample set title */
  defaultSampleSet?: string;
  className?: string;
}

export function CodeSampleGenerator({
  sampleSets = SAMPLE_SETS,
  defaultSampleSet,
  className,
}: CodeSampleGeneratorProps) {
  const [selectedSetIndex, setSelectedSetIndex] = React.useState(0);
  const [selectedLang, setSelectedLang] = React.useState<SupportedLanguage>("python");
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  React.useEffect(() => {
    if (defaultSampleSet) {
      const idx = sampleSets.findIndex((s) => s.title === defaultSampleSet);
      if (idx !== -1) setSelectedSetIndex(idx);
    }
  }, [defaultSampleSet, sampleSets]);

  const selectedSet = sampleSets[selectedSetIndex];
  const availableLangs = selectedSet.samples.map((s) => s.language);

  // If currently selected lang isn't in this set, pick the first available
  const effectiveLang = availableLangs.includes(selectedLang)
    ? selectedLang
    : availableLangs[0];

  const currentSample = selectedSet.samples.find((s) => s.language === effectiveLang);

  return (
    <div
      className={cn("border border-terminal-green/20", className)}
      data-testid="code-sample-generator"
    >
      {/* Header row: sample selector + language switcher */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-terminal-green/20 bg-terminal-black/50">
        {/* Sample set dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2 border border-terminal-green/30 px-3 py-1.5 text-sm text-terminal-green hover:border-terminal-green transition-colors"
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
          >
            <span>{selectedSet.title}</span>
            <ChevronDown size={14} aria-hidden="true" />
          </button>
          {dropdownOpen && (
            <div
              className="absolute top-full left-0 mt-1 z-20 border border-terminal-green/30 bg-terminal-dark min-w-[200px] shadow-lg"
              role="listbox"
              aria-label="Select code sample"
            >
              {sampleSets.map((set, idx) => (
                <button
                  key={set.title}
                  type="button"
                  role="option"
                  aria-selected={idx === selectedSetIndex}
                  onClick={() => {
                    setSelectedSetIndex(idx);
                    setDropdownOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm hover:bg-terminal-green/10 transition-colors",
                    idx === selectedSetIndex
                      ? "text-terminal-green"
                      : "text-terminal-gray",
                  )}
                >
                  {set.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Language tabs */}
        <div
          className="flex gap-1"
          role="tablist"
          aria-label="Select programming language"
        >
          {selectedSet.samples.map((sample) => (
            <button
              key={sample.language}
              type="button"
              role="tab"
              aria-selected={effectiveLang === sample.language}
              onClick={() => setSelectedLang(sample.language)}
              className={cn(
                "px-3 py-1.5 text-xs border transition-colors",
                effectiveLang === sample.language
                  ? "border-terminal-cyan text-terminal-cyan bg-terminal-cyan/5"
                  : "border-terminal-green/20 text-terminal-gray hover:text-terminal-green",
              )}
            >
              {sample.label}
            </button>
          ))}
        </div>

        <div className="ml-auto">
          {currentSample && <CopyButton text={currentSample.code} />}
        </div>
      </div>

      {/* Description */}
      {selectedSet.description && (
        <div className="px-4 py-2 border-b border-terminal-green/10 text-xs text-terminal-gray">
          {selectedSet.description}
        </div>
      )}

      {/* Code */}
      {currentSample ? (
        <CodeBlock
          code={currentSample.code}
          language={LANG_MAP[currentSample.language]}
          filename={currentSample.filename}
          showHeader
          showLineNumbers
          showCopyButton={false}
        />
      ) : (
        <div className="px-4 py-8 text-center text-terminal-gray text-sm">
          No sample available for this language.
        </div>
      )}
    </div>
  );
}
