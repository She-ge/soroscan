"use client";

import * as React from "react";
import Link from "next/link";
import { Check, ChevronsUpDown, Plus, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Organization } from "@/lib/organization";
import {
  getActiveOrganizationId,
  listOrganizations,
  switchOrganization,
} from "@/lib/organization-store";

interface OrganizationSwitcherProps {
  className?: string;
  onChanged?: (org: Organization) => void;
}

export function OrganizationSwitcher({
  className,
  onChanged,
}: OrganizationSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const [orgs, setOrgs] = React.useState<Organization[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const refresh = React.useCallback(() => {
    setOrgs(listOrganizations());
    setActiveId(getActiveOrganizationId());
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  React.useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const active = orgs.find((org) => org.id === activeId) ?? orgs[0];
  const showSwitcher = orgs.length > 1;

  if (!showSwitcher && !active) {
    return null;
  }

  const handleSelect = (orgId: string) => {
    const org = switchOrganization(orgId);
    setActiveId(org.id);
    setOpen(false);
    onChanged?.(org);
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch organization"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex min-h-[44px] items-center gap-2 border border-terminal-green/40 bg-terminal-black/80 px-3 text-xs font-terminal-mono text-terminal-green transition-terminal-normal hover:shadow-glow-green",
          open && "shadow-glow-green",
        )}
      >
        <Building2 size={14} aria-hidden="true" />
        <span className="max-w-[140px] truncate">{active?.name ?? "Organization"}</span>
        <ChevronsUpDown size={14} className="opacity-70" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Organizations"
          className="absolute right-0 z-50 mt-2 min-w-[240px] animate-terminal-scale-in border border-terminal-green/40 bg-terminal-black p-1 shadow-glow-green"
        >
          {orgs.map((org) => {
            const selected = org.id === active?.id;
            return (
              <button
                key={org.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => handleSelect(org.id)}
                className={cn(
                  "flex w-full min-h-[44px] items-center gap-2 px-3 text-left text-xs font-terminal-mono transition-terminal-fast",
                  selected
                    ? "bg-terminal-green/15 text-terminal-green"
                    : "text-terminal-gray hover:bg-terminal-green/10 hover:text-terminal-green",
                )}
              >
                <span className="w-4 shrink-0">
                  {selected ? <Check size={14} aria-hidden="true" /> : null}
                </span>
                <span className="truncate">{org.name}</span>
              </button>
            );
          })}

          <div className="my-1 border-t border-terminal-green/20" />

          <Link
            href="/organization?tab=settings"
            onClick={() => setOpen(false)}
            className="flex min-h-[40px] items-center gap-2 px-3 text-xs text-terminal-cyan hover:bg-terminal-cyan/10"
          >
            Organization settings
          </Link>
          <Link
            href="/organization?tab=create"
            onClick={() => setOpen(false)}
            className="flex min-h-[40px] items-center gap-2 px-3 text-xs text-terminal-green hover:bg-terminal-green/10"
          >
            <Plus size={14} aria-hidden="true" />
            Create organization
          </Link>
        </div>
      ) : null}
    </div>
  );
}
