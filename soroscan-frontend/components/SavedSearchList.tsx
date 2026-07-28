"use client";

import type { AdvancedSearchCriteria } from "@/components/AdvancedSearchForm";

export type SavedSearch = {
  id: string;
  name: string;
  criteria: AdvancedSearchCriteria;
  createdAt: string;
};

type Props = {
  items: SavedSearch[];
  onLoad: (item: SavedSearch) => void;
};

export function SavedSearchList({ items, onLoad }: Props) {
  return (
    <section className="border border-terminal-green/20 p-4">
      <h2 className="text-terminal-green text-sm tracking-widest mb-3">SAVED_SEARCHES</h2>
      {items.length === 0 ? (
        <p className="text-terminal-gray text-sm">No saved searches.</p>
      ) : (
        <ul className="space-y-2 text-xs">
          {items.map((item) => (
            <li key={item.id} className="border border-terminal-green/15 p-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-terminal-cyan">{item.name}</p>
                <p className="text-terminal-gray">{new Date(item.createdAt).toLocaleString()}</p>
              </div>
              <button type="button" onClick={() => onLoad(item)} className="border border-terminal-green/40 px-2 py-1 text-terminal-green hover:bg-terminal-green/10">
                LOAD
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
