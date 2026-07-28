"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AccountSettings from "./components/AccountSettings";
import APIKeyManager from "./components/APIKeyManager";
import BillingOverview from "./components/BillingOverview";
import NotificationPrefs from "./components/NotificationPrefs";
import ThemeSelector from "./components/ThemeSelector";
import WebhookManager from "./components/WebhookManager";

const tabs = [
  { id: "account", label: "Account" },
  { id: "theme", label: "Theme" },
  { id: "notifications", label: "Notifications" },
  { id: "apiKeys", label: "API Keys" },
  { id: "webhooks", label: "Webhooks" },
  { id: "billing", label: "Billing" },
] as const;

type TabId = (typeof tabs)[number]["id"];

function getTabId(value: string | null): TabId {
  const match = tabs.find((tab) => tab.id === value);
  return match ? match.id : "account";
}

export default function SettingsShell() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Derive the active tab dynamically during render instead of storing it in state
  const tabParam = searchParams?.get("tab") ?? null;
  const activeTab = getTabId(tabParam);

  const setTab = (tabId: TabId) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("tab", tabId);

    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;

    router.replace(url);
  };

  return (
    <main className="min-h-screen bg-[#0a0e27] text-green-400 p-6 font-mono">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl border border-green-500/20 bg-[#061120]/90 p-6 shadow-lg shadow-black/20">
          <div className="mb-6 border-b border-green-500/30 pb-4 sm:flex sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-[0.25em] text-green-400">◆ SETTINGS</h1>
              <p className="mt-2 text-sm text-green-600">
                Manage your account, notifications, API keys, webhooks, and billing in one place.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="sm:hidden">
              <label htmlFor="settings-tab-select" className="sr-only">
                Select settings tab
              </label>
              <select
                id="settings-tab-select"
                value={activeTab}
                onChange={(event) => setTab(event.target.value as TabId)}
                className="w-full rounded-2xl border border-green-500/30 bg-[#08142f]/90 px-4 py-3 text-sm font-mono text-green-300 outline-none transition focus:border-green-400"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id} className="bg-[#0a0e27] text-green-300">
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden sm:block">
              <div className="flex overflow-x-auto gap-2 rounded-2xl border border-green-500/10 bg-[#08142f]/90 p-2">
                {tabs.map((tab) => {
                  const isActive = tab.id === activeTab;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setTab(tab.id)}
                      className={`min-w-[110px] whitespace-nowrap rounded-full px-4 py-2 text-sm font-mono transition-all duration-200 border-b-2 ${
                        isActive
                          ? "bg-green-400/15 text-green-100 border-green-400"
                          : "text-green-300 border-b-transparent hover:bg-green-400/10 hover:text-green-100"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] uppercase tracking-[0.3em] text-green-600">
              Selected tab is preserved in the browser URL
            </p>
          </div>
        </section>

        <section className="space-y-6">
          {activeTab === "account" && <AccountSettings />}
          {activeTab === "theme" && <ThemeSelector />}
          {activeTab === "notifications" && <NotificationPrefs />}
          {activeTab === "apiKeys" && <APIKeyManager />}
          {activeTab === "webhooks" && <WebhookManager />}
          {activeTab === "billing" && <BillingOverview />}
        </section>
      </div>
    </main>
  );
}
