"use client";

import React, { useState } from "react";
import { useRequestRightToBeForgottenMutation } from "../../src/generated/apollo-hooks";

export default function DeletionRequestForm() {
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [requestDeletion, { data, loading, error }] = useRequestRightToBeForgottenMutation();

  const handleDeletion = async () => {
    if (!confirm) {
      alert("Please confirm that you understand the consequences.");
      return;
    }
    
    try {
      await requestDeletion({
        variables: {
          userId: "user-1", // In a real app, retrieve from context/auth
          reason,
        }
      });
    } catch (e) {
      console.error("Deletion request failed", e);
    }
  };

  // Display logic for the countdown
  const getDeletionMessage = () => {
    if (!data?.requestRightToBeForgotten) return null;
    const { status } = data.requestRightToBeForgotten;
    
    if (status === "PENDING" || status === "APPROVED") {
      return (
        <div className="mt-4 p-4 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300">
          <p className="font-bold text-red-400 mb-1">Deletion Request {status}</p>
          <p className="text-sm">
            Will be fully deleted in 30 days. An email confirmation has been sent to your registered address.
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-bold text-red-400 mb-2">Right to be Forgotten</h3>
        <p className="text-sm text-red-300/80 mb-6">
          Submit a request to permanently delete all personal data associated with your account. This action cannot be undone once the 30-day notice period expires.
        </p>

        {!data?.requestRightToBeForgotten && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-red-300 mb-2">Reason (Optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please let us know why you are leaving..."
                className="w-full rounded-xl border border-red-500/30 bg-[#061120] p-3 text-sm font-mono text-red-300 outline-none transition focus:border-red-400 focus:ring-1 focus:ring-red-400 min-h-[80px]"
              />
            </div>
            
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirm}
                onChange={(e) => setConfirm(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-red-500/30 bg-[#061120] text-red-500 focus:ring-red-500 focus:ring-offset-0"
              />
              <span className="text-sm text-red-300/80 leading-tight">
                I understand that my data will be permanently deleted after a 30-day waiting period, and I will receive an email to confirm this request.
              </span>
            </label>
          </div>
        )}

        {error && <p className="text-sm text-red-400 mt-4">Error: {error.message}</p>}
        {getDeletionMessage()}
      </div>

      {!data?.requestRightToBeForgotten && (
        <button
          onClick={handleDeletion}
          disabled={loading || !confirm}
          className="w-full sm:w-auto self-start rounded-full bg-red-500/20 px-6 py-2.5 text-sm font-semibold text-red-400 border border-red-500/50 hover:bg-red-500/30 transition-colors disabled:opacity-50 mt-6"
        >
          {loading ? "Submitting..." : "Submit Deletion Request"}
        </button>
      )}
    </div>
  );
}
