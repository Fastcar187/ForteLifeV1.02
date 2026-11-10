"use client";

import React, { useState } from "react";
import { verifyMfaAction, verifyBackupCodeAction } from "@/lib/actions";
import { ShieldAlert, KeyRound, AlertCircle, ArrowRight } from "lucide-react";

export default function VerifyMfaPage() {
  const [useBackup, setUseBackup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [backupCode, setBackupCode] = useState("");

  const handleMfaSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

  const handleBackupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await verifyBackupCodeAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-navy-900 text-teal-400 mb-1">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-navy-900">Two-Factor Authentication</h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Mandatory MFA security for clinical staff and administration
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!useBackup ? (
          <form onSubmit={handleMfaSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Enter 6-Digit Authenticator Code
              </label>
              <input
                type="text"
                name="code"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full text-center tracking-widest text-2xl font-mono py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-bold"
              />
              <p className="text-[11px] text-slate-500 text-center">
                Open Google Authenticator on your mobile device
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 min-h-[48px] flex items-center justify-center gap-2"
            >
              {loading ? "Verifying Token..." : "Verify & Continue"}
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Google Authenticator Setup & Demo Helpers */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-navy-900">Google Authenticator Setup Key:</span>
                <span className="px-2 py-0.5 bg-teal-50 text-teal-700 font-mono font-bold rounded border border-teal-200 text-[11px]">
                  JBSWY3DPEHPK3PXP
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                In your Google Authenticator app, tap <strong>+</strong> &rarr; <strong>Enter a setup key</strong>, enter key <code className="bg-slate-200 px-1 py-0.5 rounded font-mono font-semibold text-slate-800">JBSWY3DPEHPK3PXP</code>, and choose <strong>Time-based</strong>.
              </p>
              <div className="pt-1.5 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Or bypass with backup code:</span>
                <button
                  type="button"
                  onClick={() => {
                    setUseBackup(true);
                    setBackupCode("GH72-BACKUP1");
                  }}
                  className="text-teal-600 font-semibold hover:underline"
                >
                  Use Backup Code (GH72-BACKUP1) &rarr;
                </button>
              </div>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setUseBackup(true);
                  setBackupCode("GH72-BACKUP1");
                }}
                className="text-xs text-teal-600 hover:underline font-semibold"
              >
                Lost authenticator? Use single-use backup code
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleBackupSubmit} className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Enter Single-Use Backup Code
                </label>
                <button
                  type="button"
                  onClick={() => setBackupCode("GH72-BACKUP1")}
                  className="text-[11px] text-teal-600 font-medium hover:underline"
                >
                  Autofill GH72-BACKUP1
                </button>
              </div>
              <input
                type="text"
                name="backupCode"
                required
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                placeholder="e.g. GH72-BACKUP1"
                className="w-full text-center tracking-wider text-lg font-mono py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
              />
              <p className="text-[11px] text-slate-500 text-center">
                Backup codes are hashed and can each only be used once
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 min-h-[48px]"
            >
              {loading ? "Verifying..." : "Verify Backup Code"}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setUseBackup(false)}
                className="text-xs text-slate-600 hover:underline"
              >
                Back to 6-digit Authenticator code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

