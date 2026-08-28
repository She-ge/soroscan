"use client";

import * as React from "react";

export type AdvancedSearchCriteria = {
  contract: string;
  eventType: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
  text: string;
};

type Props = {
  initialValue: AdvancedSearchCriteria;
  onSearch: (criteria: AdvancedSearchCriteria) => void;
  onSave: (criteria: AdvancedSearchCriteria) => void;
};

export function AdvancedSearchForm({ initialValue, onSearch, onSave }: Props) {
  const [criteria, setCriteria] = React.useState<AdvancedSearchCriteria>(initialValue);

  React.useEffect(() => {
    setCriteria(initialValue);
  }, [initialValue]);

  const update = (key: keyof AdvancedSearchCriteria, value: string) => {
    setCriteria((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <section className="border border-terminal-green/20 p-4 space-y-4">
      <h2 className="text-terminal-green text-sm tracking-widest">ADVANCED_SEARCH</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <input aria-label="Contract" value={criteria.contract} onChange={(event) => update("contract", event.target.value)} placeholder="Contract" className="border border-terminal-green/30 bg-terminal-black px-3 py-2 text-sm" />
        <input aria-label="Event type" value={criteria.eventType} onChange={(event) => update("eventType", event.target.value)} placeholder="Event type" className="border border-terminal-green/30 bg-terminal-black px-3 py-2 text-sm" />
        <input aria-label="Free text" value={criteria.text} onChange={(event) => update("text", event.target.value)} placeholder="Free text" className="border border-terminal-green/30 bg-terminal-black px-3 py-2 text-sm" />
        <input aria-label="Date from" type="date" value={criteria.dateFrom} onChange={(event) => update("dateFrom", event.target.value)} className="border border-terminal-green/30 bg-terminal-black px-3 py-2 text-sm" />
        <input aria-label="Date to" type="date" value={criteria.dateTo} onChange={(event) => update("dateTo", event.target.value)} className="border border-terminal-green/30 bg-terminal-black px-3 py-2 text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <input aria-label="Minimum amount" value={criteria.minAmount} onChange={(event) => update("minAmount", event.target.value)} placeholder="Min amount" className="border border-terminal-green/30 bg-terminal-black px-3 py-2 text-sm" />
          <input aria-label="Maximum amount" value={criteria.maxAmount} onChange={(event) => update("maxAmount", event.target.value)} placeholder="Max amount" className="border border-terminal-green/30 bg-terminal-black px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onSearch(criteria)} className="border border-terminal-cyan px-4 py-2 text-terminal-cyan text-sm hover:bg-terminal-cyan/10">
          RUN_SEARCH
        </button>
        <button type="button" onClick={() => onSave(criteria)} className="border border-terminal-green px-4 py-2 text-terminal-green text-sm hover:bg-terminal-green/10">
          SAVE_SEARCH
        </button>
      </div>
    </section>
  );
}
