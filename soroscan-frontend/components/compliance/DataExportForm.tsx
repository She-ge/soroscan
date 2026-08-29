"use client";

import React, { useState } from "react";
import { useRequestDataGdprExportMutation } from "../../src/generated/apollo-hooks";

export default function DataExportForm() {
  const [format, setFormat] = useState("JSON");
  const [requestExport, { data, loading, error }] = useRequestDataGdprExportMutation();

  const handleExport = async () => {
    try {
      await requestExport({
        variables: {
          organizationId: "org-1", // In a real app, retrieve from context/auth
          format,
        }
      });
    } catch (e) {
      console.error("Export request failed", e);
    }
  };

  return (
    <div className="rounded-2xl border border-green-500/20 bg-[#08142f]/50 p-6 flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold text-green-400 mb-2">GDPR Data Export</h3>
        <p className="text-sm text-green-300/70 mb-4">
          Request a complete export of all personal data associated with your organization.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-green-300 mb-2">Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full rounded-xl border border-green-500/30 bg-[#061120] px-4 py-2 text-sm font-mono text-green-300 outline-none transition focus:border-green-400 focus:ring-1 focus:ring-green-400"
          >
            <option value="JSON">JSON</option>
            <option value="CSV">CSV</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-400 mb-4">Error: {error.message}</p>}

        {data?.requestGDPRDataExport && (
          <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-green-300">Request #{data.requestGDPRDataExport.requestId.slice(0, 8)}</span>
              <span className="text-xs px-2 py-1 bg-green-500/20 rounded-full text-green-400 uppercase tracking-wider">{data.requestGDPRDataExport.status}</span>
            </div>
            
            <p className="text-xs text-green-300/70 mb-3">
              Expires: {new Date(data.requestGDPRDataExport.expiresAt).toLocaleString()}
            </p>
            
            {data.requestGDPRDataExport.downloadUrl ? (
              <a
                href={data.requestGDPRDataExport.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-sm text-green-900 bg-green-400 px-3 py-1.5 rounded-full font-semibold hover:bg-green-300 transition"
              >
                Download Export
              </a>
            ) : (
              <p className="text-xs text-green-300/70 italic border-t border-green-500/20 pt-2">
                Download link will be available within 24 hours.
              </p>
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleExport}
        disabled={loading}
        className="w-full sm:w-auto self-start rounded-full bg-green-500/20 px-6 py-2.5 text-sm font-semibold text-green-400 border border-green-500/50 hover:bg-green-500/30 transition-colors disabled:opacity-50 mt-4"
      >
        {loading ? "Requesting..." : "Request Data Export"}
      </button>
    </div>
  );
}
