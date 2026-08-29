"use client";

import React, { useState, useEffect } from "react";

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem("soroscan-cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("soroscan-cookie-consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("soroscan-cookie-consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-10 duration-500">
      <div className="mx-auto max-w-5xl rounded-2xl border border-green-500/30 bg-[#061120]/95 p-6 shadow-2xl shadow-black/50 backdrop-blur-sm sm:flex sm:items-center sm:justify-between">
        <div className="mb-4 sm:mb-0 sm:mr-6">
          <h4 className="text-lg font-bold text-green-400 mb-1">Cookie Consent</h4>
          <p className="text-sm text-green-300/80">
            We use strictly necessary cookies to make our site work. We'd also like to set optional analytics cookies to help us improve it. We won't set optional cookies unless you enable them. Using this tool will set a cookie on your device to remember your preferences.
          </p>
        </div>
        
        <div className="flex shrink-0 space-x-3">
          <button
            onClick={handleDecline}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-green-400 border border-green-500/30 hover:bg-green-500/10 transition-colors"
          >
            Decline Optional
          </button>
          <button
            onClick={handleAccept}
            className="rounded-full bg-green-500/20 px-5 py-2.5 text-sm font-semibold text-green-400 border border-green-500/50 hover:bg-green-500/30 transition-colors"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
