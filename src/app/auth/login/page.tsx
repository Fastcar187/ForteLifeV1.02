"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/lib/actions";
import { Lock, Mail, ShieldCheck, AlertCircle } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (urlError) {
      setError(urlError);
    }
  }, [urlError]);

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
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Google Sign-In Button */}
      <div className="space-y-3">
        <a
          href="/api/auth/google"
          className="w-full py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-3 min-h-[48px] hover:border-slate-400"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </a>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500 font-medium">Or email sign in</span>
          </div>
        </div>
      </div>

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
  );
}

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto my-8 space-y-6">
      <div className="text-center space-y-3">
        <div className="inline-block bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm mb-1">
          <img
            src="/logo.png"
            alt="Fortelife Logo"
            className="h-12 w-auto object-contain mx-auto"
          />
        </div>
        <h1 className="text-2xl font-bold text-navy-900">Sign in to Fortelife</h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Access your appointment records or clinical staff portal
        </p>
      </div>

      <Suspense fallback={<div className="bg-white p-8 rounded-2xl border border-slate-200 animate-pulse h-96" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

