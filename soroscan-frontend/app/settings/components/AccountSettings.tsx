"use client";

import { useRef, useState } from "react";
import {
  ValidatedInput,
  type ValidatedInputHandle,
} from "@/components/terminal/ValidatedInput";

interface DisplayPrefs {
  rowsPerPage: number;
  fontSize: string;
}

const DEFAULT_DISPLAY = { rowsPerPage: 10, fontSize: "sm" };

export default function AccountSettings() {
  const [rowsPerPage] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const display = localStorage.getItem("display_prefs");
      if (display) {
        try {
          const parsed = JSON.parse(display) as DisplayPrefs;
          return parsed.rowsPerPage ?? DEFAULT_DISPLAY.rowsPerPage;
        } catch {
          return DEFAULT_DISPLAY.rowsPerPage;
        }
      }
    }
    return DEFAULT_DISPLAY.rowsPerPage;
  });

  const [displayName, setDisplayName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("account_display_name") ?? "";
    }
    return "";
  });
  const [contactEmail, setContactEmail] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("account_contact_email") ?? "";
    }
    return "";
  });
  const [saved, setSaved] = useState(false);

  const nameRef = useRef<ValidatedInputHandle>(null);
  const emailRef = useRef<ValidatedInputHandle>(null);

  const handleSave = () => {
    const nameOk = nameRef.current?.validate() ?? false;
    const emailOk = emailRef.current?.validate() ?? false;
    if (!nameOk || !emailOk) return;

    localStorage.setItem("account_display_name", displayName.trim());
    localStorage.setItem("account_contact_email", contactEmail.trim());
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 border border-green-500/20 bg-[#061120]/60 rounded-2xl space-y-5">
      <div>
        <h2 className="text-lg font-bold text-green-400 mb-2">Account Preference Profile</h2>
        <p className="text-sm text-green-300">
          Page sizing configuration limits: {rowsPerPage} rows per view
        </p>
      </div>

      <ValidatedInput
        ref={nameRef}
        id="account-display-name"
        label="DISPLAY_NAME"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        placeholder="Operator callsign"
        validators={{
          required: true,
          minLength: { value: 2, message: "Name must be at least 2 characters" },
          maxLength: { value: 64, message: "Name must be at most 64 characters" },
        }}
        hint="Shown across organization activity feeds"
      />

      <ValidatedInput
        ref={emailRef}
        id="account-contact-email"
        label="CONTACT_EMAIL"
        type="email"
        value={contactEmail}
        onChange={(e) => setContactEmail(e.target.value)}
        placeholder="operator@soroscan.io"
        validators={{
          required: true,
          email: true,
        }}
        hint="Used for billing and security notices"
      />

      <button
        type="button"
        onClick={handleSave}
        className="rounded-lg border border-green-400 px-4 py-2 text-sm font-mono text-green-400 hover:bg-green-400/10 transition-colors"
      >
        {saved ? "✓ PROFILE SAVED" : "SAVE ACCOUNT PROFILE"}
      </button>
    </div>
  );
}
