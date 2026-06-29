"use client";
import { useState } from "react";

type Prefs = {
  email: boolean;
  inApp: boolean;
  webhook: boolean;
  webhookUrl: string;
};

const DEFAULT_PREFS: Prefs = {
  email: true,
  inApp: true,
  webhook: false,
  webhookUrl: "",
};

export default function NotificationPrefs() {
  const [prefs, setPrefs] = useState<Prefs>(() => {
    if (typeof window !== "undefined") {
      const savedPrefs = localStorage.getItem("notificationPrefs");
      if (savedPrefs) {
        try {
          return JSON.parse(savedPrefs) as Prefs;
        } catch {
          return DEFAULT_PREFS;
        }
      }
    }
    return DEFAULT_PREFS;
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof Omit<Prefs, "webhookUrl">) => {
    setPrefs((current) => ({ ...current, [key]: !current[key] }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("notificationPrefs", JSON.stringify(prefs));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="border border-green-500/30 rounded-xl bg-[#08102a]/80 p-5">
      <h2 className="text-green-400 text-sm font-mono mb-4">[ NOTIFICATIONS ]</h2>
      <div className="space-y-4">
        {([
          { key: "email", label: "Email Notifications" },
          { key: "inApp", label: "In-App Notifications" },
          { key: "webhook", label: "Webhook" },
        ] as const).map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between gap-3 rounded-xl border border-green-500/10 bg-[#09132f]/80 px-4 py-3">
            <span className="font-mono text-sm text-green-300">{label}</span>
            <button
              aria-pressed={prefs[key]}
              onClick={() => toggle(key)}
              className={`w-14 rounded-full border px-3 py-1 text-[11px] font-mono transition-colors ${
                prefs[key]
                  ? "border-green-400 bg-green-400/20 text-green-400"
                  : "border-green-500/30 text-green-600 hover:border-green-400"
              }`}
            >
              {prefs[key] ? "ON" : "OFF"}
            </button>
          </div>
        ))}

        {prefs.webhook && (
          <input
            type="text"
            placeholder="https://your-webhook-url.com"
            value={prefs.webhookUrl}
            onChange={(event) => setPrefs((current) => ({ ...current, webhookUrl: event.target.value }))}
            className="w-full rounded-lg border border-green-500/30 bg-transparent px-3 py-2 font-mono text-sm text-green-300 placeholder-green-700 focus:outline-none focus:border-green-400"
          />
        )}

        <button
          onClick={handleSave}
          className="w-full rounded-xl border border-green-500/30 bg-transparent px-4 py-2 text-sm font-mono text-green-400 transition-colors hover:border-green-400 hover:bg-green-400/10"
        >
          {saved ? "✓ SAVED" : "SAVE PREFERENCES"}
        </button>
      </div>
    </div>
  );
}
