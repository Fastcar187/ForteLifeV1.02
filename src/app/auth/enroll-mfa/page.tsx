import React from "react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getDataStore } from "@/lib/data-store";
import { generateBase32Secret, generateBackupCodes, generateOtpAuthUri } from "@/lib/auth";
import { ShieldCheck, Copy, ArrowRight } from "lucide-react";
import { MfaEnrollmentClient } from "./client";

export default async function EnrollMfaPage() {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const store = getDataStore();
  const existingMfa = store.getMfaSecret(session.id);

  const secretBase32 = generateBase32Secret(20);
  const backupCodes = generateBackupCodes(8);
  const otpAuthUri = generateOtpAuthUri(session.email, secretBase32);

  // Pre-save unconfirmed secret so verification can check it
  store.saveMfaSecret(session.id, secretBase32, backupCodes);

  return (
    <div className="max-w-xl mx-auto my-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-navy-900 text-teal-400 mb-1">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-navy-900">Enroll Google Authenticator</h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Two-Factor Authentication is required for clinical and administrative staff
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
            <div className="font-semibold text-navy-900">Step 1: Scan QR or Enter Key</div>
            <p>
              Open <strong>Google Authenticator</strong> or your preferred TOTP app on your smartphone, tap <strong>(+) Add Account</strong>, and scan the key below:
            </p>
            <div className="p-3 bg-white border border-slate-200 rounded-lg font-mono text-center text-sm font-bold tracking-wider text-teal-800 break-all select-all">
              {secretBase32}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-navy-900">
              Step 2: Save Your Single-Use Backup Codes
            </div>
            <p className="text-[11px] text-slate-500">
              Store these codes in a safe place. You will need them if you lose access to your authenticator device:
            </p>
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs font-medium text-slate-800">
              {backupCodes.map((code, idx) => (
                <div key={idx} className="bg-white px-2 py-1.5 rounded border border-slate-200 text-center">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <div className="text-xs font-semibold text-navy-900 mb-2">
              Step 3: Enter the 6-Digit Code from Your App to Confirm
            </div>
            <MfaEnrollmentClient />
          </div>
        </div>
      </div>
    </div>
  );
}
