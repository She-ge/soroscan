"use client";

/**
 * SchemaBrowser — Searchable, filterable GraphQL schema type/field explorer.
 * Reads schema from a static import (mock schema) or live introspection result.
 */

import * as React from "react";
import { Search, ChevronRight, ChevronDown, Type, Zap, List, Hash, ToggleLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------- Types ----------

export interface SchemaField {
  name: string;
  type: string;
  description?: string;
  args?: Array<{ name: string; type: string; description?: string }>;
  isDeprecated?: boolean;
}

export interface SchemaType {
  name: string;
  kind: "OBJECT" | "INPUT_OBJECT" | "ENUM" | "INTERFACE" | "UNION" | "SCALAR" | "QUERY" | "MUTATION" | "SUBSCRIPTION";
  description?: string;
  fields?: SchemaField[];
  enumValues?: string[];
}

// ---------- Built-in static schema (derived from src/schema.graphql) ----------

const BUILTIN_TYPES: SchemaType[] = [
  {
    name: "Query",
    kind: "QUERY",
    description: "Root query type — entry point for all read operations.",
    fields: [
      { name: "events", type: "EventConnection!", description: "Paginated list of indexed contract events.", args: [{ name: "contractId", type: "String" }, { name: "first", type: "Int!" }] },
      { name: "me", type: "User", description: "Currently authenticated user." },
      { name: "systemMetrics", type: "SystemMetrics!", description: "Admin system health metrics." },
      { name: "recentErrors", type: "[ErrorLog!]!", description: "Recent error log entries.", args: [{ name: "limit", type: "Int" }] },
      { name: "myOrganizations", type: "[Organization!]!", description: "All organizations the current user belongs to." },
      { name: "organization", type: "Organization", description: "Single organization by ID.", args: [{ name: "id", type: "String!" }] },
      { name: "teamMembers", type: "[TeamMember!]!", description: "Members of a given organization.", args: [{ name: "organizationId", type: "String!" }] },
      { name: "contracts", type: "[ContractWithDeps!]!", description: "Contract dependency graph data.", args: [{ name: "filter", type: "ContractFilter" }] },
    ],
  },
  {
    name: "Mutation",
    kind: "MUTATION",
    description: "Root mutation type — entry point for all write operations.",
    fields: [
      { name: "login", type: "AuthPayload!", description: "Authenticate with email and password.", args: [{ name: "email", type: "String!" }, { name: "password", type: "String!" }] },
      { name: "refreshToken", type: "AuthPayload!", description: "Refresh an expired access token.", args: [{ name: "refresh", type: "String!" }] },
      { name: "createOrganization", type: "Organization!", description: "Create a new organization.", args: [{ name: "input", type: "CreateOrganizationInput!" }] },
      { name: "inviteTeamMember", type: "InviteResult!", description: "Invite a user to an organization.", args: [{ name: "organizationId", type: "String!" }, { name: "email", type: "String!" }, { name: "role", type: "OrgRole!" }] },
    ],
  },
  {
    name: "Subscription",
    kind: "SUBSCRIPTION",
    description: "Real-time subscriptions via GraphQL over WebSocket.",
    fields: [
      { name: "contractEvent", type: "ContractEvent!", description: "Subscribe to live events from a contract.", args: [{ name: "contractId", type: "String!" }] },
    ],
  },
  {
    name: "Event",
    kind: "OBJECT",
    description: "A single indexed Soroban contract event.",
    fields: [
      { name: "id", type: "ID!", description: "Unique event identifier." },
      { name: "contractId", type: "String!", description: "The Soroban contract that emitted this event." },
      { name: "eventType", type: "String!", description: "Event type string (e.g. SWAP_COMPLETE)." },
      { name: "data", type: "String!", description: "JSON-encoded event payload." },
      { name: "createdAt", type: "String!", description: "ISO 8601 timestamp of when the event was indexed." },
    ],
  },
  {
    name: "EventConnection",
    kind: "OBJECT",
    description: "Relay-style paginated list of events.",
    fields: [
      { name: "edges", type: "[EventEdge!]!" },
    ],
  },
  {
    name: "EventEdge",
    kind: "OBJECT",
    fields: [
      { name: "node", type: "Event!" },
    ],
  },
  {
    name: "User",
    kind: "OBJECT",
    description: "Authenticated SoroScan user.",
    fields: [
      { name: "id", type: "ID!" },
      { name: "email", type: "String!" },
      { name: "activeOrganizationId", type: "String" },
    ],
  },
  {
    name: "Organization",
    kind: "OBJECT",
    description: "A SoroScan organization (team workspace).",
    fields: [
      { name: "id", type: "ID!" },
      { name: "name", type: "String!" },
      { name: "billingContact", type: "String!" },
      { name: "dataRegion", type: "DataRegion!" },
      { name: "createdAt", type: "String!" },
      { name: "contractCount", type: "Int!" },
      { name: "webhookLimit", type: "Int!" },
    ],
  },
  {
    name: "AuthPayload",
    kind: "OBJECT",
    description: "JWT token pair returned after login or token refresh.",
    fields: [
      { name: "access", type: "String!" },
      { name: "refresh", type: "String!" },
      { name: "user", type: "User!" },
    ],
  },
  {
    name: "ContractWithDeps",
    kind: "OBJECT",
    description: "Contract with its dependency graph data.",
    fields: [
      { name: "id", type: "ID!" },
      { name: "name", type: "String!" },
      { name: "address", type: "String!" },
      { name: "riskScore", type: "Float!" },
      { name: "vulnerabilities", type: "[ContractVulnerability!]!" },
      { name: "dependencies", type: "[ContractDependency!]!" },
      { name: "dependents", type: "[ContractDependent!]!" },
    ],
  },
  {
    name: "OrgRole",
    kind: "ENUM",
    description: "Roles within an organization.",
    enumValues: ["owner", "admin", "operator", "viewer"],
  },
  {
    name: "DataRegion",
    kind: "ENUM",
    description: "Data region for an organization's storage.",
    enumValues: ["us_east", "eu_west", "ap_southeast"],
  },
  {
    name: "VulnerabilitySeverity",
    kind: "ENUM",
    description: "Severity level of a contract vulnerability.",
    enumValues: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE"],
  },
  {
    name: "SystemMetrics",
    kind: "OBJECT",
    description: "System-wide metrics for admin dashboard.",
    fields: [
      { name: "eventsIndexedToday", type: "Int!" },
      { name: "eventsIndexedTotal", type: "Int!" },
      { name: "webhookSuccessRate", type: "Float!" },
      { name: "avgWebhookDeliveryTime", type: "Float!" },
      { name: "activeContracts", type: "Int!" },
      { name: "dbStatus", type: "String!" },
      { name: "redisStatus", type: "String!" },
    ],
  },
];

// ---------- Helpers ----------

const KIND_ICONS: Record<SchemaType["kind"], React.ComponentType<{ size?: number; className?: string }>> = {
  OBJECT: Type,
  INPUT_OBJECT: Hash,
  ENUM: ToggleLeft,
  INTERFACE: List,
  UNION: List,
  SCALAR: Zap,
  QUERY: Zap,
  MUTATION: Zap,
  SUBSCRIPTION: Zap,
};

const KIND_COLORS: Record<SchemaType["kind"], string> = {
  OBJECT: "text-terminal-green",
  INPUT_OBJECT: "text-terminal-cyan",
  ENUM: "text-terminal-warning",
  INTERFACE: "text-terminal-info",
  UNION: "text-terminal-info",
  SCALAR: "text-terminal-gray",
  QUERY: "text-terminal-green",
  MUTATION: "text-terminal-danger",
  SUBSCRIPTION: "text-terminal-cyan",
};

function TypeRow({
  type,
  isExpanded,
  onToggle,
  query,
}: {
  type: SchemaType;
  isExpanded: boolean;
  onToggle: () => void;
  query: string;
}) {
  const Icon = KIND_ICONS[type.kind];
  const colorClass = KIND_COLORS[type.kind];
  const hasChildren = (type.fields && type.fields.length > 0) || (type.enumValues && type.enumValues.length > 0);

  return (
    <div data-testid={`schema-type-${type.name}`}>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full text-left flex items-center gap-3 px-4 py-3 border-b border-terminal-green/10",
          "hover:bg-terminal-green/5 transition-colors",
          isExpanded && "bg-terminal-green/5",
        )}
        aria-expanded={isExpanded}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown size={14} className="text-terminal-gray shrink-0" aria-hidden="true" />
          ) : (
            <ChevronRight size={14} className="text-terminal-gray shrink-0" aria-hidden="true" />
          )
        ) : (
          <span className="w-[14px] shrink-0" />
        )}
        <Icon size={14} className={cn(colorClass, "shrink-0")} aria-hidden="true" />
        <span className={cn("font-bold text-sm", colorClass)}>{type.name}</span>
        <span className="text-[10px] text-terminal-gray-muted uppercase tracking-widest ml-1">{type.kind}</span>
        {type.description && (
          <span className="text-xs text-terminal-gray ml-auto truncate max-w-xs hidden md:block">
            {type.description}
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="border-b border-terminal-green/10 bg-terminal-black/40">
          {type.description && (
            <p className="px-10 py-2 text-xs text-terminal-gray border-b border-terminal-green/5">
              {type.description}
            </p>
          )}

          {type.fields && type.fields.length > 0 && (
            <div className="divide-y divide-terminal-green/5">
              {type.fields
                .filter((f) => !query || f.name.toLowerCase().includes(query) || f.type.toLowerCase().includes(query))
                .map((field) => (
                  <div key={field.name} className="px-10 py-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-sm text-terminal-cyan font-medium">{field.name}</span>
                    <span className="text-xs text-terminal-warning font-mono">{field.type}</span>
                    {field.description && (
                      <span className="text-xs text-terminal-gray w-full mt-0.5">{field.description}</span>
                    )}
                    {field.args && field.args.length > 0 && (
                      <div className="w-full mt-1 pl-3 border-l border-terminal-green/20 space-y-1">
                        {field.args.map((arg) => (
                          <div key={arg.name} className="flex gap-2 text-xs">
                            <span className="text-terminal-gray-muted">{arg.name}:</span>
                            <span className="text-terminal-warning">{arg.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

          {type.enumValues && type.enumValues.length > 0 && (
            <div className="px-10 py-3 flex flex-wrap gap-2">
              {type.enumValues.map((val) => (
                <span
                  key={val}
                  className="px-2 py-0.5 border border-terminal-warning/30 text-terminal-warning text-xs"
                >
                  {val}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Main Component ----------

interface SchemaBrowserProps {
  /** Override built-in types with custom schema types */
  types?: SchemaType[];
  className?: string;
}

export function SchemaBrowser({ types = BUILTIN_TYPES, className }: SchemaBrowserProps) {
  const [query, setQuery] = React.useState("");
  const [expandedTypes, setExpandedTypes] = React.useState<Set<string>>(
    new Set(["Query", "Mutation"]),
  );
  const [kindFilter, setKindFilter] = React.useState<string>("ALL");

  const lowerQuery = query.toLowerCase().trim();

  const filtered = types.filter((t) => {
    const matchesKind = kindFilter === "ALL" || t.kind === kindFilter;
    if (!matchesKind) return false;
    if (!lowerQuery) return true;
    return (
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description?.toLowerCase().includes(lowerQuery) ||
      t.fields?.some(
        (f) =>
          f.name.toLowerCase().includes(lowerQuery) ||
          f.type.toLowerCase().includes(lowerQuery),
      ) ||
      t.enumValues?.some((v) => v.toLowerCase().includes(lowerQuery))
    );
  });

  const toggleType = (name: string) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const expandAll = () => setExpandedTypes(new Set(filtered.map((t) => t.name)));
  const collapseAll = () => setExpandedTypes(new Set());

  const kinds = ["ALL", ...Array.from(new Set(types.map((t) => t.kind))).sort()];

  return (
    <div className={cn("flex flex-col border border-terminal-green/20", className)} data-testid="schema-browser">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-terminal-green/20 bg-terminal-black/50">
        <div>
          <div className="text-[10px] text-terminal-cyan tracking-widest">[SCHEMA_BROWSER]</div>
          <h2 className="text-sm font-bold text-terminal-green">GraphQL Schema</h2>
        </div>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={expandAll}
            className="text-terminal-cyan hover:underline"
          >
            Expand all
          </button>
          <span className="text-terminal-gray">/</span>
          <button
            type="button"
            onClick={collapseAll}
            className="text-terminal-cyan hover:underline"
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="px-4 py-3 border-b border-terminal-green/20 space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-terminal-gray pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search types and fields..."
            aria-label="Search schema types and fields"
            className="w-full pl-9 pr-3 py-2 border border-terminal-green/30 bg-terminal-black text-sm text-terminal-green placeholder:text-terminal-gray focus:outline-none focus:border-terminal-green"
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by kind">
          {kinds.map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setKindFilter(kind)}
              className={cn(
                "px-2 py-0.5 text-[10px] uppercase tracking-widest border transition-colors",
                kindFilter === kind
                  ? "border-terminal-green text-terminal-green bg-terminal-green/10"
                  : "border-terminal-green/20 text-terminal-gray hover:text-terminal-cyan",
              )}
              aria-pressed={kindFilter === kind}
            >
              {kind}
            </button>
          ))}
        </div>
      </div>

      {/* Type list */}
      <div className="overflow-y-auto flex-1 min-h-0" role="list" aria-label="Schema types">
        {filtered.length === 0 ? (
          <div className="px-4 py-8 text-center text-terminal-gray text-sm">
            No types match your search.
          </div>
        ) : (
          filtered.map((type) => (
            <TypeRow
              key={type.name}
              type={type}
              isExpanded={expandedTypes.has(type.name)}
              onToggle={() => toggleType(type.name)}
              query={lowerQuery}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-terminal-green/20 text-xs text-terminal-gray-muted">
        {filtered.length} of {types.length} types
        {lowerQuery && ` matching "${query}"`}
      </div>
    </div>
  );
}
