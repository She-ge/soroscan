"use client";

import type { AdvancedSearchCriteria } from "@/components/AdvancedSearchForm";

export type SearchHistoryItem = {
  id: string;
  at: string;
  criteria: AdvancedSearchCriteria;
};

type Props = {
  items: SearchHistoryItem[];
  onLoad: (item: SearchHistoryItem) => void;
};

export function SearchHistory({ items, onLoad }: Props) {
  return (
    <section className="border border-terminal-green/20 p-4">
      <h2 className="text-terminal-green text-sm tracking-widest mb-3">SEARCH_HISTORY</h2>
      {items.length === 0 ? (
        <p className="text-terminal-gray text-sm">No history yet.</p>
      ) : (
        <ul className="space-y-2 text-xs">
          {items.map((item) => (
            <li key={item.id} className="border border-terminal-green/15 p-2 flex items-center justify-between gap-2">
              <div className="text-terminal-gray">{new Date(item.at).toLocaleString()}</div>
              <button type="button" onClick={() => onLoad(item)} className="border border-terminal-cyan/40 px-2 py-1 text-terminal-cyan hover:bg-terminal-cyan/10">
                LOAD
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
