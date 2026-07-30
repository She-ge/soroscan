import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Portal — SoroScan",
  description:
    "Interactive GraphQL playground, schema browser, code samples, SDK documentation, and webhook explorer for SoroScan — the Soroban smart contract event indexer.",
  keywords: [
    "SoroScan",
    "Soroban",
    "Stellar",
    "GraphQL",
    "API",
    "SDK",
    "developer",
    "documentation",
    "events",
    "webhooks",
  ],
};

export default function DeveloperPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
