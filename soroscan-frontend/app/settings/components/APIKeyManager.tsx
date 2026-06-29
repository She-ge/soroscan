"use client";
import { useState } from "react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

type APIKey = {
  id: string;
  key: string;
  createdAt: string;
};

function generateKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const random = Array.from({ length: 32 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
  return `sk_live_${random}`;
}

export default function APIKeyManager() {
  const [keys, setKeys] = useState<APIKey[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("apiKeys");
      if (saved) {
        try {
          return JSON.parse(saved) as APIKey[];
        } catch {
          return [];
        }
      }
    }
    return [];
  });
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmingKey, setConfirmingKey] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const saveKeys = (newKeys: APIKey[]) => {
    setKeys(newKeys);
    localStorage.setItem("apiKeys", JSON.stringify(newKeys));
  };

  const handleGenerate = () => {
    const newKey: APIKey = {
      id: Date.now().toString(),
      key: generateKey(),
      createdAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
    saveKeys([...keys, newKey]);
  };

  const requestRevoke = (id: string) => setConfirmingKey(id);

  const handleConfirmRevoke = () => {
    if (!confirmingKey) return;
    setIsRevoking(true);
    const nextKeys = keys.filter((k) => k.id !== confirmingKey);
    saveKeys(nextKeys);
    setConfirmingKey(null);
    setIsRevoking(false);
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="border border-green-500/30 rounded-xl bg-[#08102a]/80 p-5">
      <h2 className="text-green-400 text-sm font-mono mb-4">[ API KEYS ]</h2>
      <div className="space-y-4">
        <button
          onClick={handleGenerate}
          className="w-full rounded-xl border border-green-400 px-4 py-2 text-sm font-mono text-green-400 hover:bg-green-400/10 transition-colors"
        >
          + Generate New Key
        </button>

        {keys.length === 0 ? (
          <p className="text-green-600 text-sm">No API keys yet.</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-[1.8fr_0.8fr_1fr] gap-3 rounded-xl border border-green-500/10 bg-[#09132f]/80 px-4 py-3 text-xs text-green-500 uppercase tracking-[0.15em]">
              <span>Key</span>
              <span>Created</span>
              <span>Actions</span>
            </div>
            {keys.map((key) => (
              <div
                key={key.id}
                className="grid grid-cols-[1.8fr_0.8fr_1fr] gap-3 items-center rounded-xl border border-green-500/10 bg-[#08162f]/80 px-4 py-3 text-sm text-green-300"
              >
                <span className="truncate">{key.key.slice(0, 16)}...</span>
                <span className="text-green-500 text-xs">{key.createdAt}</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCopy(key.key)}
                    className="rounded-lg border border-green-500/30 px-3 py-1 text-xs text-green-400 hover:text-green-300"
                  >
                    {copied === key.key ? "✓" : "COPY"}
                  </button>
                  <button
                    onClick={() => handleRevoke(key.id)}
                    className="rounded-lg border border-red-500/30 px-3 py-1 text-xs text-red-400 hover:border-red-400"
                  >
                    DEL
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
