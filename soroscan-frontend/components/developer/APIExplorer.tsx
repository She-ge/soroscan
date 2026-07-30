"use client";

/**
 * APIExplorer — Interactive GraphQL query builder and inspector.
 * Uses graphiql@^5 which supports React 19.
 * Falls back gracefully when the backend is not available.
 */

import * as React from "react";
import { createGraphiQLFetcher } from "@graphiql/toolkit";
import { explorerPlugin } from "@graphiql/plugin-explorer";
import { GraphiQL } from "graphiql";
import { cn } from "@/lib/utils";

// GraphiQL CSS is loaded lazily via dynamic import in parent page to avoid SSR issues.
// Consumers must import 'graphiql/style.css' in a Client Component or global CSS.

const API_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ||
  process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/graphql/`
    : "http://localhost:8000/graphql/";

const DEFAULT_QUERY = `# Welcome to the SoroScan GraphQL Playground
#
# Type queries here and press Ctrl+Enter (or the ▶ button) to run.
# The Explorer panel on the left lists all available fields.

query GetRecentEvents {
  events(contractId: "CABC...9X4Z", first: 10) {
    edges {
      node {
        id
        contractId
        eventType
        data
        createdAt
      }
    }
  }
}
`;

interface APIExplorerProps {
  /** Override the GraphQL endpoint URL */
  url?: string;
  /** Override the initial query */
  defaultQuery?: string;
  className?: string;
}

export function APIExplorer({
  url = API_URL,
  defaultQuery = DEFAULT_QUERY,
  className,
}: APIExplorerProps) {
  const fetcher = React.useMemo(
    () =>
      createGraphiQLFetcher({
        url,
        headers: {
          "Content-Type": "application/json",
        },
      }),
    [url],
  );

  const explorer = React.useMemo(
    () =>
      explorerPlugin({
        showAttribution: false,
      }),
    [],
  );

  return (
    <div
      className={cn(
        "graphiql-portal border border-terminal-green/20 overflow-hidden",
        "h-[80vh] min-h-[600px]",
        className,
      )}
      data-testid="api-explorer"
    >
      {/* Override graphiql colours to match terminal theme */}
      <style>{`
        .graphiql-portal .graphiql-container {
          --color-primary: #00ff41;
          --color-secondary: #00d4ff;
          --color-tertiary: #94a3b8;
          --color-info: #38bdf8;
          --color-success: #00ff41;
          --color-warning: #ffaa00;
          --color-error: #ff3366;
          --color-neutral: #94a3b8;
          --color-base: #0a0e27;
          --color-base-100: #1a1f3a;
          --color-base-200: #2d3748;
          --color-base-300: #3d4a5c;
          --popover-shadow: 0 2px 16px rgba(0,255,65,0.15);
          font-family: "JetBrains Mono", "IBM Plex Mono", monospace;
        }
        .graphiql-portal .graphiql-container .graphiql-editor-tools button,
        .graphiql-portal .graphiql-container .graphiql-toolbar button {
          color: #94a3b8;
        }
        .graphiql-portal .graphiql-container .graphiql-execute-button {
          background: #00ff41;
          color: #0a0e27;
        }
      `}</style>
      <GraphiQL
        fetcher={fetcher}
        defaultQuery={defaultQuery}
        plugins={[explorer]}
        shouldPersistHeaders
        editorTheme="dracula"
      />
    </div>
  );
}
