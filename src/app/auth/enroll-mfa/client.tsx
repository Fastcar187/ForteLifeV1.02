"use client";

import React, { useState } from "react";
import { verifyMfaAction } from "@/lib/actions";
import { AlertCircle, ArrowRight } from "lucide-react";

export function MfaEnrollmentClient() {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await verifyMfaAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          name="code"
          required
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="flex-1 text-center font-mono text-xl tracking-widest py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
        />
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading ? "Activating..." : "Confirm & Activate"}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}

