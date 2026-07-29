"use client";

import * as React from "react";
import { Navbar } from "@/components/terminal/landing/Navbar";
import { Footer } from "@/components/terminal/landing/Footer";
import { AdvancedSearchForm, type AdvancedSearchCriteria } from "@/components/AdvancedSearchForm";
import { SavedSearchList, type SavedSearch } from "@/components/SavedSearchList";
import { SearchHistory, type SearchHistoryItem } from "@/components/SearchHistory";

const SAVED_KEY = "advanced_saved_searches";
const HISTORY_KEY = "advanced_search_history";

const EMPTY_CRITERIA: AdvancedSearchCriteria = {
  contract: "",
  eventType: "",
  dateFrom: "",
  dateTo: "",
  minAmount: "",
  maxAmount: "",
  text: "",
};

export default function AdvancedSearchPage() {
  const [criteria, setCriteria] = React.useState<AdvancedSearchCriteria>(EMPTY_CRITERIA);
  const [savedSearches, setSavedSearches] = React.useState<SavedSearch[]>([]);
  const [history, setHistory] = React.useState<SearchHistoryItem[]>([]);
  const [shareUrl, setShareUrl] = React.useState("");

  React.useEffect(() => {
    try {
      const savedRaw = localStorage.getItem(SAVED_KEY);
      const historyRaw = localStorage.getItem(HISTORY_KEY);

      if (savedRaw) {
        setSavedSearches(JSON.parse(savedRaw) as SavedSearch[]);
      }

      if (historyRaw) {
        setHistory(JSON.parse(historyRaw) as SearchHistoryItem[]);
      }

      const params = new URLSearchParams(window.location.search);
      if (Array.from(params.keys()).length > 0) {
        setCriteria({
          contract: params.get("contract") || "",
          eventType: params.get("eventType") || "",
          dateFrom: params.get("dateFrom") || "",
          dateTo: params.get("dateTo") || "",
          minAmount: params.get("minAmount") || "",
          maxAmount: params.get("maxAmount") || "",
          text: params.get("text") || "",
        });
      }
    } catch {
      // Ignore bad local storage payloads.
    }
  }, []);

  const persistSaved = (next: SavedSearch[]) => {
    setSavedSearches(next);
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  };

  const persistHistory = (next: SearchHistoryItem[]) => {
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const handleSearch = (nextCriteria: AdvancedSearchCriteria) => {
    setCriteria(nextCriteria);

    const params = new URLSearchParams();
    Object.entries(nextCriteria).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    const url = `${window.location.origin}${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    setShareUrl(url);
    window.history.replaceState({}, "", `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`);

    persistHistory([
      {
        id: crypto.randomUUID(),
        at: new Date().toISOString(),
        criteria: nextCriteria,
      },
      ...history,
    ].slice(0, 20));
  };

  const handleSave = (nextCriteria: AdvancedSearchCriteria) => {
    const name = window.prompt("Name this search");
    if (!name) return;

    persistSaved([
      {
        id: crypto.randomUUID(),
        name,
        criteria: nextCriteria,
        createdAt: new Date().toISOString(),
      },
      ...savedSearches,
    ]);
  };

  const exportSaved = () => {
    const blob = new Blob([JSON.stringify(savedSearches, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "saved-searches.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen font-terminal-mono selection:bg-terminal-green selection:text-terminal-black">
      <Navbar />
      <main className="container mx-auto px-6 md:px-8 py-10 md:py-14 space-y-6 max-w-7xl">
        <header>
          <div className="text-[10px] text-terminal-cyan tracking-widest mb-2">[ADVANCED_SEARCH]</div>
          <h1 className="text-3xl md:text-4xl font-bold text-terminal-green">Advanced Search</h1>
          <p className="text-terminal-gray text-sm mt-2">Compose multi-criteria searches, save bookmarks, and reuse history.</p>
        </header>

        <AdvancedSearchForm initialValue={criteria} onSearch={handleSearch} onSave={handleSave} />

        <section className="border border-terminal-green/20 p-4 space-y-3">
          <h2 className="text-terminal-green text-sm tracking-widest">SHARE_AND_EXPORT</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={exportSaved} className="border border-terminal-cyan px-4 py-2 text-terminal-cyan text-sm hover:bg-terminal-cyan/10">
              EXPORT_SAVED_SEARCHES
            </button>
          </div>
          <div>
            <p className="text-xs text-terminal-gray mb-1">SHAREABLE_URL</p>
            <input readOnly value={shareUrl} className="w-full border border-terminal-green/30 bg-terminal-black px-3 py-2 text-xs text-terminal-green" placeholder="Run a search to generate a shareable link" />
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SavedSearchList
            items={savedSearches}
            onLoad={(item) => {
              setCriteria(item.criteria);
              handleSearch(item.criteria);
            }}
          />
          <SearchHistory
            items={history}
            onLoad={(item) => {
              setCriteria(item.criteria);
              handleSearch(item.criteria);
            }}
          />
        </section>
      </main>

      <div className="container mx-auto px-6 md:px-8 max-w-7xl pb-12">
        <Footer />
      </div>
    </div>
  );
}
