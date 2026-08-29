"use client";

import React, { useState } from "react";

export default function RetentionPolicyEditor() {
  const [retentionDays, setRetentionDays] = useState("30");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  };

  return (
    <div className="rounded-2xl border border-green-500/20 bg-[#08142f]/50 p-6">
      <h3 className="text-xl font-bold text-green-400 mb-2">Data Retention Policy</h3>
      <p className="text-sm text-green-300/70 mb-6">
        Configure how long event data is retained before being automatically deleted.
      </p>

      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-green-300 mb-2">
            Retention Period
          </label>
          <select
            value={retentionDays}
            onChange={(e) => setRetentionDays(e.target.value)}
            className="w-full rounded-xl border border-green-500/30 bg-[#061120] px-4 py-2.5 text-sm font-mono text-green-300 outline-none transition focus:border-green-400 focus:ring-1 focus:ring-green-400"
          >
            <option value="30">30 Days</option>
            <option value="90">90 Days</option>
            <option value="365">365 Days</option>
            <option value="forever">Keep Forever</option>
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-full bg-green-500/20 px-6 py-2.5 text-sm font-semibold text-green-400 border border-green-500/50 hover:bg-green-500/30 transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Policy"}
          </button>
          {saved && <span className="text-sm text-green-400">Saved successfully!</span>}
        </div>
      </div>
    </div>
  );
}
