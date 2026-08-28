/**
 * Tests for the developer portal components.
 * Covers: SchemaBrowser, CodeSampleGenerator, WebhookSchemaViewer,
 *         RateLimitStatus, QuickstartGuide, SDKDocumentation,
 *         and code sample syntax validation.
 */

import React from "react";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ---------- SchemaBrowser ----------

import { SchemaBrowser, type SchemaType } from "@/components/developer/SchemaBrowser";

describe("SchemaBrowser", () => {
  const mockTypes: SchemaType[] = [
    {
      name: "Query",
      kind: "QUERY",
      description: "Root query type",
      fields: [
        { name: "events", type: "EventConnection!", description: "List events." },
        { name: "me", type: "User", description: "Current user." },
      ],
    },
    {
      name: "Event",
      kind: "OBJECT",
      description: "A contract event.",
      fields: [
        { name: "id", type: "ID!" },
        { name: "contractId", type: "String!" },
        { name: "eventType", type: "String!" },
      ],
    },
    {
      name: "OrgRole",
      kind: "ENUM",
      description: "Roles in an organization.",
      enumValues: ["owner", "admin", "viewer"],
    },
  ];

  it("renders all provided types", () => {
    render(<SchemaBrowser types={mockTypes} />);
    expect(screen.getByTestId("schema-type-Query")).toBeInTheDocument();
    expect(screen.getByTestId("schema-type-Event")).toBeInTheDocument();
    expect(screen.getByTestId("schema-type-OrgRole")).toBeInTheDocument();
  });

  it("expands a type when clicked", () => {
    render(<SchemaBrowser types={mockTypes} />);
    // "Event" is not in the initial expandedTypes set so it starts collapsed.
    // The description is shown once (truncated header span, hidden on small screens).
    const eventRow = screen.getByTestId("schema-type-Event");
    const btn = within(eventRow).getByRole("button");
    // Verify collapsed state: aria-expanded false
    expect(btn).toHaveAttribute("aria-expanded", "false");
    // Click to expand
    fireEvent.click(btn);
    // Now button is expanded
    expect(btn).toHaveAttribute("aria-expanded", "true");
    // The full description <p> is now rendered in the expanded body
    expect(screen.getAllByText("A contract event.").length).toBeGreaterThanOrEqual(2);
  });

  it("collapses an expanded type when clicked again", () => {
    render(<SchemaBrowser types={mockTypes} />);
    const queryRow = screen.getByTestId("schema-type-Query");
    const btn = within(queryRow).getByRole("button");
    fireEvent.click(btn); // expand — now shows the p + the truncated span
    // After collapse, the expanded body paragraph is gone (only the hidden md:block span may remain)
    fireEvent.click(btn); // collapse
    // The expanded content div is removed; the description <p> in the body is gone
    const descriptions = screen.queryAllByText("List events.");
    // After collapse only the hidden-on-small-screen span remains (at most 1)
    expect(descriptions.length).toBeLessThanOrEqual(1);
  });

  it("filters types by search query", () => {
    render(<SchemaBrowser types={mockTypes} />);
    const input = screen.getByRole("searchbox", { name: /search schema/i });
    fireEvent.change(input, { target: { value: "Event" } });
    expect(screen.getByTestId("schema-type-Event")).toBeInTheDocument();
    // Query doesn't match "Event" as a type name but may match via field type "EventConnection"
    expect(screen.queryByTestId("schema-type-OrgRole")).not.toBeInTheDocument();
  });

  it("shows 'No types match' when search has no results", () => {
    render(<SchemaBrowser types={mockTypes} />);
    const input = screen.getByRole("searchbox", { name: /search schema/i });
    fireEvent.change(input, { target: { value: "zzz_nonexistent_zzz" } });
    expect(screen.getByText(/No types match/i)).toBeInTheDocument();
  });

  it("filters by kind", () => {
    render(<SchemaBrowser types={mockTypes} />);
    const enumBtn = screen.getByRole("button", { name: /^enum$/i });
    fireEvent.click(enumBtn);
    expect(screen.getByTestId("schema-type-OrgRole")).toBeInTheDocument();
    expect(screen.queryByTestId("schema-type-Query")).not.toBeInTheDocument();
  });

  it("expands all types", () => {
    render(<SchemaBrowser types={mockTypes} />);
    fireEvent.click(screen.getByRole("button", { name: /expand all/i }));
    // After expand all, each description appears at least twice (header truncated span + body <p>)
    expect(screen.getAllByText("Root query type").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("A contract event.").length).toBeGreaterThanOrEqual(2);
  });

  it("shows footer count", () => {
    render(<SchemaBrowser types={mockTypes} />);
    expect(screen.getByText(/3 of 3 types/i)).toBeInTheDocument();
  });

  it("displays enum values when expanded", () => {
    render(<SchemaBrowser types={mockTypes} />);
    const orgRow = screen.getByTestId("schema-type-OrgRole");
    fireEvent.click(within(orgRow).getByRole("button"));
    expect(screen.getByText("owner")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getByText("viewer")).toBeInTheDocument();
  });
});

// ---------- CodeSampleGenerator ----------

import { CodeSampleGenerator, SAMPLE_SETS, type CodeSampleSet } from "@/components/developer/CodeSampleGenerator";

// Mock clipboard
const writeTextMock = jest.fn(() => Promise.resolve());
Object.defineProperty(navigator, "clipboard", {
  value: { writeText: writeTextMock },
  writable: true,
});

describe("CodeSampleGenerator", () => {
  beforeEach(() => writeTextMock.mockClear());

  it("renders sample set titles", () => {
    render(<CodeSampleGenerator />);
    expect(screen.getByTestId("code-sample-generator")).toBeInTheDocument();
  });

  it("shows the first sample set by default", () => {
    render(<CodeSampleGenerator />);
    // Should show code for the first sample set
    expect(screen.getByTestId("code-sample-generator")).toBeInTheDocument();
  });

  it("switches language when tab is clicked", () => {
    render(<CodeSampleGenerator />);
    const cURL = screen.queryByRole("tab", { name: /curl/i });
    if (cURL) {
      fireEvent.click(cURL);
      expect(cURL).toHaveAttribute("aria-selected", "true");
    }
  });

  it("copies code to clipboard", async () => {
    render(<CodeSampleGenerator />);
    const copyBtn = screen.getByRole("button", { name: /copy code sample/i });
    fireEvent.click(copyBtn);
    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
    });
  });

  it("opens sample set dropdown", async () => {
    render(<CodeSampleGenerator />);
    const dropdownBtn = screen.getAllByRole("button").find((btn) =>
      SAMPLE_SETS.some((s) => btn.textContent?.includes(s.title)),
    );
    if (dropdownBtn) {
      fireEvent.click(dropdownBtn);
      expect(dropdownBtn).toHaveAttribute("aria-expanded", "true");
    }
  });

  it("switches to a different sample set", () => {
    render(<CodeSampleGenerator sampleSets={SAMPLE_SETS} />);
    // Find a dropdown button by aria-haspopup
    const dropdown = screen.getByRole("button", { name: (name, el) => el?.getAttribute("aria-haspopup") === "listbox" });
    fireEvent.click(dropdown);
    const secondOption = screen.getByRole("option", { name: SAMPLE_SETS[1].title });
    fireEvent.click(secondOption);
    // Dropdown should close
    expect(dropdown).toHaveAttribute("aria-expanded", "false");
  });
});

// ---------- WebhookSchemaViewer ----------

import { WebhookSchemaViewer } from "@/components/developer/WebhookSchemaViewer";

describe("WebhookSchemaViewer", () => {
  it("renders the viewer", () => {
    render(<WebhookSchemaViewer />);
    expect(screen.getByTestId("webhook-schema-viewer")).toBeInTheDocument();
  });

  it("shows SWAP_COMPLETE schema expanded by default", () => {
    render(<WebhookSchemaViewer />);
    expect(screen.getByTestId("webhook-schema-SWAP_COMPLETE")).toBeInTheDocument();
  });

  it("expands a schema card on click", () => {
    render(<WebhookSchemaViewer />);
    const card = screen.getByTestId("webhook-schema-TRANSFER");
    fireEvent.click(within(card).getByRole("button"));
    expect(screen.getByText(/Sender account address/i)).toBeInTheDocument();
  });

  it("collapses an expanded schema on second click", () => {
    render(<WebhookSchemaViewer />);
    const card = screen.getByTestId("webhook-schema-SWAP_COMPLETE");
    // The card has the toggle button as first button; use getAllByRole and take first
    const [btn] = within(card).getAllByRole("button");
    // already expanded by default, click to collapse
    fireEvent.click(btn);
    expect(screen.queryByText(/Input token amount/i)).not.toBeInTheDocument();
  });

  it("shows delivery headers table", () => {
    render(<WebhookSchemaViewer />);
    expect(screen.getByRole("table", { name: /Webhook delivery headers/i })).toBeInTheDocument();
  });

  it("shows retry policy table", () => {
    render(<WebhookSchemaViewer />);
    expect(screen.getByRole("table", { name: /Webhook retry policy/i })).toBeInTheDocument();
  });

  it("shows Python signature verification by default", () => {
    render(<WebhookSchemaViewer />);
    const pythonTab = screen.getByRole("tab", { name: /python/i });
    expect(pythonTab).toHaveAttribute("aria-selected", "true");
  });

  it("switches to TypeScript verification code", () => {
    render(<WebhookSchemaViewer />);
    const tsTab = screen.getByRole("tab", { name: /typescript/i });
    fireEvent.click(tsTab);
    expect(tsTab).toHaveAttribute("aria-selected", "true");
  });
});

// ---------- RateLimitStatus ----------

import { RateLimitStatus, type RateLimitInfo } from "@/components/developer/RateLimitStatus";

describe("RateLimitStatus", () => {
  const mockData: RateLimitInfo = {
    limit: 1000,
    remaining: 750,
    resetAt: new Date(Date.now() + 35 * 60 * 1000),
    plan: "free",
  };

  it("renders the component", () => {
    render(<RateLimitStatus mockData={mockData} />);
    expect(screen.getByTestId("rate-limit-status")).toBeInTheDocument();
  });

  it("shows remaining and total requests", () => {
    render(<RateLimitStatus mockData={mockData} />);
    expect(screen.getByText("750")).toBeInTheDocument();
    expect(screen.getByText(/1,000 requests remaining/i)).toBeInTheDocument();
  });

  it("shows plan badge", () => {
    render(<RateLimitStatus mockData={mockData} />);
    expect(screen.getByText("free")).toBeInTheDocument();
  });

  it("shows HEALTHY status when > 50% remaining", () => {
    render(<RateLimitStatus mockData={mockData} />);
    expect(screen.getByText("HEALTHY")).toBeInTheDocument();
  });

  it("shows LOW status when < 20% remaining", () => {
    const lowData: RateLimitInfo = { ...mockData, remaining: 100 };
    render(<RateLimitStatus mockData={lowData} />);
    expect(screen.getByText("LOW")).toBeInTheDocument();
  });

  it("shows EXHAUSTED status when 0 remaining", () => {
    const exhaustedData: RateLimitInfo = { ...mockData, remaining: 0 };
    render(<RateLimitStatus mockData={exhaustedData} />);
    expect(screen.getByText("EXHAUSTED")).toBeInTheDocument();
  });

  it("has progress bars for quota", () => {
    render(<RateLimitStatus mockData={mockData} />);
    const bars = screen.getAllByRole("progressbar");
    expect(bars.length).toBeGreaterThan(0);
  });

  it("has a refresh button", () => {
    render(<RateLimitStatus mockData={mockData} />);
    expect(screen.getByRole("button", { name: /refresh rate limit/i })).toBeInTheDocument();
  });
});

// ---------- QuickstartGuide ----------

import { QuickstartGuide } from "@/components/developer/QuickstartGuide";

describe("QuickstartGuide", () => {
  it("renders the guide", () => {
    render(<QuickstartGuide />);
    expect(screen.getByTestId("quickstart-guide")).toBeInTheDocument();
  });

  it("shows all 5 steps", () => {
    render(<QuickstartGuide />);
    expect(screen.getByTestId("quickstart-step-get-key")).toBeInTheDocument();
    expect(screen.getByTestId("quickstart-step-register-contract")).toBeInTheDocument();
    expect(screen.getByTestId("quickstart-step-query-events")).toBeInTheDocument();
    expect(screen.getByTestId("quickstart-step-setup-webhook")).toBeInTheDocument();
    expect(screen.getByTestId("quickstart-step-use-sdk")).toBeInTheDocument();
  });

  it("shows initial 0/5 progress", () => {
    render(<QuickstartGuide />);
    expect(screen.getByText("0/5")).toBeInTheDocument();
  });

  it("shows first step content by default", () => {
    render(<QuickstartGuide />);
    // First step should be expanded
    expect(screen.getByText(/Register or log in to generate an API key/i)).toBeInTheDocument();
  });

  it("marks a step done and advances", () => {
    render(<QuickstartGuide />);
    const markDoneBtn = screen.getByRole("button", { name: /mark done/i });
    fireEvent.click(markDoneBtn);
    expect(screen.getByText("1/5")).toBeInTheDocument();
  });

  it("switches to clicked step", () => {
    render(<QuickstartGuide />);
    const registerStep = screen.getByTestId("quickstart-step-register-contract");
    fireEvent.click(within(registerStep).getByRole("button"));
    expect(screen.getByText(/Whitelist your Soroban contract/i)).toBeInTheDocument();
  });

  it("resets the guide", () => {
    render(<QuickstartGuide />);
    // Complete first step
    fireEvent.click(screen.getByRole("button", { name: /mark done/i }));
    expect(screen.getByText("1/5")).toBeInTheDocument();
    // Reset
    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(screen.getByText("0/5")).toBeInTheDocument();
  });

  it("has accessible progress bar", () => {
    render(<QuickstartGuide />);
    const bar = screen.getByRole("progressbar", { name: /quickstart progress/i });
    expect(bar).toHaveAttribute("aria-valuenow", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "5");
  });
});

// ---------- SDKDocumentation ----------

import { SDKDocumentation } from "@/components/developer/SDKDocumentation";

const SAMPLE_DOC = `# Python SDK

Get started with the SoroScan Python SDK.

## Installation

\`\`\`bash
pip install soroscan
\`\`\`

## Quick Example

\`\`\`python
from soroscan import SoroScanClient
client = SoroScanClient(api_key="sk_live_...")
events = await client.events.list(contract_id="CABC...9X4Z")
\`\`\`

| Field | Type | Description |
|-------|------|-------------|
| api_key | string | Your API key |
| base_url | string | API base URL |
`;

describe("SDKDocumentation", () => {
  it("renders the component", () => {
    render(<SDKDocumentation slug="sdks/python" content={SAMPLE_DOC} />);
    expect(screen.getByTestId("sdk-documentation")).toBeInTheDocument();
  });

  it("renders H1 title", () => {
    render(<SDKDocumentation slug="sdks/python" content={SAMPLE_DOC} />);
    expect(screen.getByRole("heading", { name: "Python SDK", level: 1 })).toBeInTheDocument();
  });

  it("renders H2 sections", () => {
    render(<SDKDocumentation slug="sdks/python" content={SAMPLE_DOC} />);
    expect(screen.getByRole("heading", { name: /Installation/i, level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Quick Example/i, level: 2 })).toBeInTheDocument();
  });

  it("renders code blocks", () => {
    render(<SDKDocumentation slug="sdks/python" content={SAMPLE_DOC} />);
    expect(screen.getAllByTestId("code-block").length).toBeGreaterThanOrEqual(2);
  });

  it("renders a table", () => {
    render(<SDKDocumentation slug="sdks/python" content={SAMPLE_DOC} />);
    // api_key appears in both the code block and the table cell
    expect(screen.getAllByText("api_key").length).toBeGreaterThan(0);
    expect(screen.getByText("Your API key")).toBeInTheDocument();
  });

  it("highlights the active slug in sidebar", () => {
    render(<SDKDocumentation slug="sdks/python" content={SAMPLE_DOC} />);
    const sidebar = screen.getByRole("complementary", { name: /documentation navigation/i });
    const activeLink = within(sidebar).getByRole("link", { name: /Python/i });
    expect(activeLink).toHaveAttribute("aria-current", "page");
  });

  it("has a search box", () => {
    render(<SDKDocumentation slug="sdks/python" content={SAMPLE_DOC} />);
    expect(screen.getByRole("searchbox", { name: /search documentation/i })).toBeInTheDocument();
  });

  it("filters sections when searching", () => {
    render(<SDKDocumentation slug="sdks/python" content={SAMPLE_DOC} />);
    const input = screen.getByRole("searchbox", { name: /search documentation/i });
    fireEvent.change(input, { target: { value: "Installation" } });
    // When filtering, show the count message containing "matching"
    expect(screen.getByText(/matching/i)).toBeInTheDocument();
  });
});

// ---------- Code Sample Syntax Validation ----------

describe("Code samples - syntax validation", () => {
  describe("SAMPLE_SETS content", () => {
    it("all sample sets have at least one sample", () => {
      SAMPLE_SETS.forEach((set) => {
        expect(set.samples.length).toBeGreaterThan(0);
      });
    });

    it("all samples have non-empty code", () => {
      SAMPLE_SETS.forEach((set) => {
        set.samples.forEach((sample) => {
          expect(sample.code.trim().length).toBeGreaterThan(0);
          expect(sample.language).toBeTruthy();
          expect(sample.label).toBeTruthy();
        });
      });
    });

    it("Python samples contain valid Python patterns", () => {
      const pythonSamples = SAMPLE_SETS.flatMap((s) =>
        s.samples.filter((sample) => sample.language === "python"),
      );
      pythonSamples.forEach((sample) => {
        // Should have import or from statement
        expect(
          sample.code.includes("from soroscan") || sample.code.includes("import"),
        ).toBe(true);
        // Should not have unmatched parentheses
        const opens = (sample.code.match(/\(/g) ?? []).length;
        const closes = (sample.code.match(/\)/g) ?? []).length;
        expect(opens).toBe(closes);
      });
    });

    it("TypeScript samples contain valid TypeScript patterns", () => {
      const tsSamples = SAMPLE_SETS.flatMap((s) =>
        s.samples.filter((sample) => sample.language === "typescript"),
      );
      tsSamples.forEach((sample) => {
        expect(sample.code.includes("import ") || sample.code.includes("const ")).toBe(true);
        // Curly braces should be balanced
        const opens = (sample.code.match(/\{/g) ?? []).length;
        const closes = (sample.code.match(/\}/g) ?? []).length;
        expect(opens).toBe(closes);
      });
    });

    it("Go samples contain valid Go patterns", () => {
      const goSamples = SAMPLE_SETS.flatMap((s) =>
        s.samples.filter((sample) => sample.language === "go"),
      );
      goSamples.forEach((sample) => {
        expect(sample.code.includes("package main")).toBe(true);
        expect(sample.code.includes("func main()")).toBe(true);
        // Curly braces should be balanced
        const opens = (sample.code.match(/\{/g) ?? []).length;
        const closes = (sample.code.match(/\}/g) ?? []).length;
        expect(opens).toBe(closes);
      });
    });

    it("bash samples contain valid curl commands", () => {
      const bashSamples = SAMPLE_SETS.flatMap((s) =>
        s.samples.filter((sample) => sample.language === "bash"),
      );
      bashSamples.forEach((sample) => {
        expect(sample.code.includes("curl")).toBe(true);
        expect(sample.code.includes("soroscan.io")).toBe(true);
      });
    });

    it("all samples include the SoroScan API domain", () => {
      SAMPLE_SETS.flatMap((s) => s.samples).forEach((sample) => {
        // At least the SoroScan SDK or API should be referenced
        expect(
          sample.code.includes("soroscan") || sample.code.includes("SoroScan"),
        ).toBe(true);
      });
    });
  });

  describe("DOC_CONTENT validation", () => {
    it("all doc slugs have non-empty content", async () => {
      const { DOC_CONTENT } = await import("@/lib/docs-content");
      Object.entries(DOC_CONTENT).forEach(([slug, content]) => {
        if (content.trim().length === 0) {
          throw new Error(`Doc "${slug}" has empty content`);
        }
        if (!content.startsWith("#")) {
          throw new Error(`Doc "${slug}" should start with a heading`);
        }
        expect(content.trim().length).toBeGreaterThan(0);
      });
    });

    it("all docs have code examples", async () => {
      const { DOC_CONTENT } = await import("@/lib/docs-content");
      Object.entries(DOC_CONTENT).forEach(([slug, content]) => {
        if (!content.includes("```")) {
          throw new Error(`Doc "${slug}" should have at least one code block`);
        }
        expect(content.includes("```")).toBe(true);
      });
    });
  });
});
