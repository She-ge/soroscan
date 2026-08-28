"use client";

import React from "react";

export default function ComplianceStatusCard() {
  const handleDownload = () => {
    // Generate a simple PDF or open print dialog as a mockup for report generation
    window.print();
  };

  return (
    <div className="rounded-2xl border border-green-500/20 bg-[#08142f]/50 p-5 flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold text-green-400 mb-2">Compliance Status</h3>
        <ul className="space-y-2 text-sm text-green-300/80 mb-4">
          <li className="flex items-center space-x-2">
            <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>GDPR Ready</span>
          </li>
          <li className="flex items-center space-x-2">
            <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Data encrypted at rest</span>
          </li>
          <li className="flex items-center space-x-2">
            <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Automated data retention enforcement</span>
          </li>
        </ul>
      </div>
      <button
        onClick={handleDownload}
        className="w-full sm:w-auto self-start rounded-full bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-colors"
      >
        Download Report (PDF)
      </button>
    </div>
  );
}
