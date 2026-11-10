"use client";

import React, { useState } from "react";
import Link from "next/link";
import { loginAction } from "@/lib/actions";
import { Lock, Mail, ShieldCheck, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("Password123!");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-navy-900 text-teal-400 mb-1">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-navy-900">Sign in to Ghana Health</h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Access your appointment records or clinical staff portal
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@ghanahealth.gov.gh"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="password"
                name="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 min-h-[48px]"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        {/* Demo One-Click Fill Helpers */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Quick Demo Autofill Credentials (Password: Password123!):
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleDemoFill("kwame.mensah@example.com")}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded text-left border border-slate-200 text-slate-700 font-medium truncate"
            >
              👤 Patient (Kwame)
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill("frontdesk.ridge@ghanahealth.gov.gh")}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded text-left border border-slate-200 text-slate-700 font-medium truncate"
            >
              🏢 Front Desk (Ridge)
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill("dr.boateng@ghanahealth.gov.gh")}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded text-left border border-slate-200 text-slate-700 font-medium truncate"
            >
              🩺 Doctor (MFA)
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill("director@ghanahealth.gov.gh")}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded text-left border border-slate-200 text-slate-700 font-medium truncate"
            >
              🌐 Platform Admin
            </button>
          </div>
        </div>

        <div className="text-center pt-2 text-xs text-slate-600">
          New patient?{" "}
          <Link href="/auth/register" className="text-teal-600 hover:underline font-semibold">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
