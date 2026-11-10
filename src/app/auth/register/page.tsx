"use client";

import React, { useState } from "react";
import Link from "next/link";
import { registerPatientAction } from "@/lib/actions";
import { ShieldCheck, UserCheck, AlertCircle, Smartphone, Lock, Mail, CreditCard } from "lucide-react";

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("notificationChannel", channel);

    const result = await registerPatientAction(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto my-8 space-y-6">
      <div className="text-center space-y-3">
        <div className="inline-block bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm mb-1">
          <img
            src="/logo.png"
            alt="Fortelife Logo"
            className="h-12 w-auto object-contain mx-auto"
          />
        </div>
        <h1 className="text-2xl font-bold text-navy-900">Patient Registration</h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Create your Fortelife profile for faster hospital check-in across Ghana
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-Up Button */}
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
            <span>Sign up with Google</span>
          </a>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500 font-medium">Or register with email</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Full Name *</label>
            <input
              type="text"
              name="fullName"
              required
              placeholder="e.g. Abena Serwaa Boateng"
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="abena@example.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Ghana Phone Number *</label>
              <div className="relative">
                <Smartphone className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="0244123456"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <span className="text-[10px] text-slate-500">Format: 0244123456 or +233244123456</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Create Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="password"
                name="password"
                required
                placeholder="At least 8 chars, 1 uppercase, 1 number"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                NHIS Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <CreditCard className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  name="nhis"
                  placeholder="8-digit NHIS ID"
                  maxLength={8}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Ghana Card ID <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                name="ghanaCard"
                placeholder="GHA-123456789-0"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm uppercase"
              />
            </div>
          </div>

          {/* Preferred Notification Channel */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-slate-700">
              Preferred Appointment Notifications:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setChannel("whatsapp")}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                  channel === "whatsapp"
                    ? "border-teal-600 bg-teal-50 text-teal-950 font-semibold"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div>
                  <div className="text-xs font-bold">WhatsApp</div>
                  <div className="text-[11px] text-slate-500 font-normal">Recommended (Low-data)</div>
                </div>
                <div className={`w-3.5 h-3.5 rounded-full border ${channel === "whatsapp" ? "border-4 border-teal-600" : "border-slate-300"}`} />
              </button>

              <button
                type="button"
                onClick={() => setChannel("sms")}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                  channel === "sms"
                    ? "border-teal-600 bg-teal-50 text-teal-950 font-semibold"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div>
                  <div className="text-xs font-bold">SMS Text</div>
                  <div className="text-[11px] text-slate-500 font-normal">Ghana network SMS</div>
                </div>
                <div className={`w-3.5 h-3.5 rounded-full border ${channel === "sms" ? "border-4 border-teal-600" : "border-slate-300"}`} />
              </button>
            </div>
          </div>

          {/* Explicit Ghana Data Protection Act (Act 843) Consent */}
          <div className="pt-2">
            <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                name="consentAccepted"
                required
                className="mt-1 w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                <strong>Ghana Data Protection Act, 2012 (Act 843) Consent:</strong> I hereby give explicit consent to Ghana Health Service and the selected clinic to securely process and store my contact details solely for appointment booking, queue reminders, and clinical triage. Sensitive health details are never transmitted via chat.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 min-h-[48px]"
          >
            {loading ? "Creating Account..." : "Create Account & Continue"}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-600">
          Already registered?{" "}
          <Link href="/auth/login" className="text-teal-600 hover:underline font-semibold">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}

