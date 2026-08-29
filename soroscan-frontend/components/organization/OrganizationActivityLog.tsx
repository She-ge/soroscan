"use client";

import { Card } from "@/components/terminal/Card";
import type { OrgActivityEntry } from "@/lib/organization";

interface OrganizationActivityLogProps {
  entries: OrgActivityEntry[];
}

export function OrganizationActivityLog({
  entries,
}: OrganizationActivityLogProps) {
  if (!entries.length) {
    return (
      <Card title="ACTIVITY_LOG">
        <p className="text-sm text-terminal-gray">No activity yet.</p>
      </Card>
    );
  }

  return (
    <Card title="ACTIVITY_LOG" className="animate-terminal-fade-in">
      <ol className="space-y-3" aria-label="Organization activity">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="border-l-2 border-terminal-green/40 pl-3 text-xs"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-bold uppercase tracking-wider text-terminal-cyan">
                {entry.action.replaceAll("_", " ")}
              </span>
              <time
                dateTime={entry.timestamp}
                className="text-terminal-gray"
              >
                {new Date(entry.timestamp).toLocaleString()}
              </time>
            </div>
            <p className="mt-1 text-terminal-green">{entry.detail}</p>
            <p className="mt-1 text-terminal-gray">
              by {entry.actorEmail}
              {entry.targetEmail ? ` → ${entry.targetEmail}` : ""}
            </p>
          </li>
        ))}
      </ol>
    </Card>
  );
}
