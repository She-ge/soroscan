import React from "react";

export default function DataResidencyViewer() {
  return (
    <div className="rounded-2xl border border-green-500/20 bg-[#08142f]/50 p-5">
      <h3 className="text-lg font-bold text-green-400 mb-2">Data Residency</h3>
      <p className="text-sm text-green-300/70 mb-4">
        Your organization's data is currently stored in the following region.
      </p>
      <div className="flex items-center space-x-3 text-green-300">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
          <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold">EU-West (Frankfurt)</p>
          <p className="text-xs opacity-70">AWS eu-central-1</p>
        </div>
      </div>
    </div>
  );
}
