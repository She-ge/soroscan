"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileCode2,
  Webhook,
  Settings,
  Shield,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Drawer } from "@/components/ui/drawer";
import { HamburgerToggle } from "@/components/ui/hamburger-toggle";
import { OrganizationSwitcher } from "@/components/organization/OrganizationSwitcher";

const navItems = [
  { href: "/dashboard", label: "Events", icon: LayoutDashboard },
  { href: "/contracts", label: "Contracts", icon: FileCode2 },
  { href: "/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/organization", label: "Org", icon: Building2 },
  { href: "/admin", label: "Admin", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

interface AppShellProps {
  children: React.ReactNode;
}

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  pathname: string;
  onNavigate?: () => void;
}) {
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 min-h-[44px] px-4 py-2 text-sm font-terminal-mono transition-colors rounded-sm",
        "border-l-4",
        isActive
          ? "border-terminal-green bg-terminal-green/10 text-terminal-green shadow-[0_0_12px_rgba(0,255,65,0.15)]"
          : "border-transparent text-terminal-gray hover:text-terminal-green hover:bg-terminal-green/5 hover:border-terminal-green/40",
      )}
    >
      <Icon size={18} aria-hidden="true" />
      {label}
    </Link>
  );
}

function SidebarNav({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav
      className={cn("flex flex-col gap-1", className)}
      aria-label="App navigation"
    >
      {navItems.map((item) => (
        <NavLink
          key={item.href}
          {...item}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      ))}
    </nav>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-terminal-black text-terminal-green font-terminal-mono">
      {/* Top header */}
      <header className="sticky top-0 z-30 flex h-[60px] items-center gap-3 border-b border-terminal-green/30 bg-gradient-to-r from-terminal-black to-[#1a1f3a] px-4">
        <HamburgerToggle
          isOpen={sidebarOpen}
          onClick={() => setSidebarOpen((open) => !open)}
          ariaControls="app-sidebar"
          className="sm:hidden shrink-0"
        />

        <Link
          href="/dashboard"
          className="text-lg font-bold tracking-wider text-terminal-green hover:text-terminal-cyan transition-colors min-h-[44px] inline-flex items-center"
        >
          ◆ SoroScan
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <OrganizationSwitcher className="hidden sm:block" />
          <div className="hidden sm:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-3 text-xs uppercase tracking-wider transition-colors",
                    isActive
                      ? "text-terminal-green border-b-2 border-terminal-green"
                      : "text-terminal-gray hover:text-terminal-green",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop sidebar — always visible ≥640px */}
        <aside
          id="app-sidebar"
          className="hidden sm:block w-60 shrink-0 border-r border-terminal-green/20 bg-terminal-black/95 min-h-[calc(100vh-60px)] p-4"
          aria-label="Sidebar navigation"
        >
          <SidebarNav pathname={pathname} />
        </aside>

        {/* Mobile sidebar drawer */}
        <Drawer
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          position="left"
          title="Navigation"
          className="sm:hidden"
        >
          <SidebarNav
            pathname={pathname}
            onNavigate={() => setSidebarOpen(false)}
          />
        </Drawer>

        {/* Main content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
