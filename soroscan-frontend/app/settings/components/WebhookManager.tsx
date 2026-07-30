"use client";
import { useRef, useState } from "react";
import {
  ValidatedInput,
  type ValidatedInputHandle,
} from "@/components/terminal/ValidatedInput";

type Webhook = {
  id: string;
  url: string;
  active: boolean;
  createdAt: string;
};

const defaultWebhooks: Webhook[] = [];

export default function WebhookManager() {
  const [webhooks, setWebhooks] = useState<Webhook[]>(() => {
    if (typeof window !== "undefined") {
      const savedData = localStorage.getItem("webhooks");
      if (savedData) {
        try {
          return JSON.parse(savedData) as Webhook[];
        } catch {
          return defaultWebhooks;
        }
      }
    }
    return defaultWebhooks;
  });
  const [newUrl, setNewUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [urlKey, setUrlKey] = useState(0);
  const urlRef = useRef<ValidatedInputHandle>(null);

  const persist = (next: Webhook[]) => {
    setWebhooks(next);
    localStorage.setItem("webhooks", JSON.stringify(next));
  };

  const handleAddWebhook = () => {
    const ok = urlRef.current?.validate() ?? false;
    if (!ok) return;
    const nextWebhook: Webhook = {
      id: Date.now().toString(),
      url: newUrl.trim(),
      active: true,
      createdAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
    persist([nextWebhook, ...webhooks]);
    setNewUrl("");
    setUrlKey((k) => k + 1);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const toggleWebhook = (id: string) => {
    persist(
      webhooks.map((webhook) =>
        webhook.id === id ? { ...webhook, active: !webhook.active } : webhook
      )
    );
  };

  const removeWebhook = (id: string) => {
    persist(webhooks.filter((webhook) => webhook.id !== id));
  };

  return (
    <div className="border border-green-500/30 rounded-xl p-5 bg-[#08102a]/80">
      <h2 className="text-green-400 text-sm font-mono mb-3">[ WEBHOOKS ]</h2>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
          <ValidatedInput
            key={urlKey}
            ref={urlRef}
            id="settings-webhook-url"
            label="WEBHOOK_URL"
            type="url"
            value={newUrl}
            onChange={(event) => setNewUrl(event.target.value)}
            placeholder="https://hooks.example.com/events"
            validators={{
              required: "Enter a valid webhook URL.",
              url: "Enter a valid webhook URL.",
            }}
            hint="HTTPS endpoint for delivery callbacks"
            containerClassName="min-w-0"
          />
          <button
            onClick={handleAddWebhook}
            className="rounded-lg border border-green-400 px-4 py-2 text-sm font-mono text-green-400 hover:bg-green-400/10 transition-colors h-11"
          >
            + Add Webhook
          </button>
        </div>

        {webhooks.length === 0 ? (
          <p className="text-green-600 text-sm font-mono">No webhook subscriptions configured yet.</p>
        ) : (
          <div className="space-y-3">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="rounded-xl border border-green-500/20 bg-[#09132f]/80 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-green-300 text-sm break-words">{webhook.url}</p>
                    <p className="text-green-600 text-xs">Created {webhook.createdAt}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleWebhook(webhook.id)}
                      className={`rounded-lg border px-3 py-2 text-xs font-mono transition-colors ${webhook.active ? "border-green-400 text-green-400 hover:bg-green-400/10" : "border-green-500/30 text-green-600 hover:border-green-400"}`}
                    >
                      {webhook.active ? "ACTIVE" : "PAUSED"}
                    </button>
                    <button
                      onClick={() => removeWebhook(webhook.id)}
                      className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-mono text-red-400 hover:border-red-400"
                    >
                      REMOVE
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          disabled={webhooks.length === 0}
          onClick={() => {
            persist(webhooks);
            setSaved(true);
            window.setTimeout(() => setSaved(false), 2000);
          }}
          className="w-full rounded-lg border border-green-500/30 px-4 py-2 text-sm font-mono text-green-400 hover:border-green-400 hover:bg-green-400/10 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saved ? "✓ SAVED" : "SAVE WEBHOOK SETTINGS"}
        </button>
      </div>
    </div>
  );
}
