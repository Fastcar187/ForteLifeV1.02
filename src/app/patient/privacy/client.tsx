"use client";

import React, { useState, useTransition } from "react";
import { updatePatientProfileAction, requestDataDeletionAction } from "@/lib/actions";
import {
  ShieldCheck,
  Lock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
} from "lucide-react";

interface Props {
  patient: {
    fullName: string;
    nhisMasked: string;
    ghanaCardMasked: string;
    consentAcceptedAt: string;
    deletionRequestedAt: string | null;
  };
  phonePlain: string;
  email: string;
  currentChannel: string;
}

export function PrivacyCenterClient({
  patient,
  phonePlain,
  email,
  currentChannel,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteMsg, setDeleteMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [fullName, setFullName] = useState(patient.fullName);
  const [phone, setPhone] = useState(phonePlain);
  const [nhis, setNhis] = useState("");
  const [ghanaCard, setGhanaCard] = useState("");
  const [channel, setChannel] = useState(currentChannel);

  const [confirmDeleteText, setConfirmDeleteText] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

  const handleUpdateProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileMsg(null);

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("phone", phone);
    if (nhis) formData.append("nhis", nhis);
    if (ghanaCard) formData.append("ghanaCard", ghanaCard);
    formData.append("notificationChannel", channel);

    startTransition(async () => {
      const res = await updatePatientProfileAction(formData);
      if (res.error) {
        setProfileMsg({ type: "error", text: res.error });
      } else {
        setProfileMsg({ type: "success", text: "Profile details updated successfully." });
      }
    });
  };

  const handleDeleteRequest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDeleteMsg(null);

    const formData = new FormData();
    formData.append("confirmationText", confirmDeleteText);
    formData.append("reason", deleteReason);

    startTransition(async () => {
      const res = await requestDataDeletionAction(formData);
      if (res.error) {
        setDeleteMsg({ type: "error", text: res.error });
      } else {
        setDeleteMsg({
          type: "success",
          text: "Data deletion and anonymization request submitted in accordance with Act 843 Section 28.",
        });
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Act 843 Trust Card */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-navy-900">
              Ghana Data Protection Act, 2012 (Act 843) Safeguards
            </h2>
            <p className="text-xs text-slate-500">
              All personal identification details (Ghana Card, NHIS, Phone) are encrypted at rest with AES-256-GCM.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium">Consent Record:</span>
            <div className="font-semibold text-navy-900 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Accepted on {new Date(patient.consentAcceptedAt).toLocaleDateString("en-GB")}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium">Field Encryption:</span>
            <div className="font-semibold text-teal-800 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-teal-600" />
              AES-256-GCM Hardware Level
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <span className="text-slate-500 font-medium">Erasure Status:</span>
            <div className="font-semibold text-navy-900">
              {patient.deletionRequestedAt ? (
                <span className="text-amber-700">Deletion Pending Review</span>
              ) : (
                <span className="text-emerald-700">Active / Retained</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile & Contact Update Form */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div>
          <h3 className="text-base font-bold text-navy-900">1. Inspect & Correct Stored Information</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Under Act 843 Section 27, you have the right to request the rectification of inaccurate or outdated data.
          </p>
        </div>

        {profileMsg && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              profileMsg.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}
          >
            {profileMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{profileMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Update NHIS Number ({patient.nhisMasked})
              </label>
              <input
                type="text"
                value={nhis}
                onChange={(e) => setNhis(e.target.value)}
                placeholder="Enter new 8-digit NHIS"
                maxLength={8}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Update Ghana Card ID ({patient.ghanaCardMasked})
              </label>
              <input
                type="text"
                value={ghanaCard}
                onChange={(e) => setGhanaCard(e.target.value)}
                placeholder="GHA-123456789-0"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm uppercase"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Notification Channel:
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="channel"
                  value="whatsapp"
                  checked={channel === "whatsapp"}
                  onChange={() => setChannel("whatsapp")}
                  className="text-teal-600 focus:ring-teal-500"
                />
                WhatsApp
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="channel"
                  value="sms"
                  checked={channel === "sms"}
                  onChange={() => setChannel("sms")}
                  className="text-teal-600 focus:ring-teal-500"
                />
                Ghana SMS
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="channel"
                  value="none"
                  checked={channel === "none"}
                  onChange={() => setChannel("none")}
                  className="text-teal-600 focus:ring-teal-500"
                />
                None (Opt Out)
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="py-2.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Update Privacy Record"}
          </button>
        </form>
      </div>

      {/* Right to Erasure / Deletion Request (Act 843 Section 28) */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-rose-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 text-rose-700">
          <Trash2 className="w-5 h-5 flex-shrink-0" />
          <h3 className="text-base font-bold text-navy-900">
            2. Request Data Erasure & Anonymization (Act 843 Section 28)
          </h3>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          You may request the deletion of your personal account data, phone numbers, and identifying records. Historical clinical appointment logs will be irreversibly anonymized for Ministry health statistics.
        </p>

        {deleteMsg && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              deleteMsg.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}
          >
            {deleteMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{deleteMsg.text}</span>
          </div>
        )}

        {patient.deletionRequestedAt ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
            <strong>Erasure Request Received:</strong> Your request submitted on{" "}
            {new Date(patient.deletionRequestedAt).toLocaleDateString("en-GB")} is in progress with the hospital data compliance officer.
          </div>
        ) : (
          <form onSubmit={handleDeleteRequest} className="space-y-4 pt-2">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                To confirm, type <span className="font-mono text-rose-700">DELETE MY PERSONAL DATA</span>:
              </label>
              <input
                type="text"
                required
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
                placeholder="DELETE MY PERSONAL DATA"
                className="w-full px-3 py-2.5 rounded-lg border border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Reason (Optional)</label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Let us know why you wish to delete your data"
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isPending || confirmDeleteText !== "DELETE MY PERSONAL DATA"}
              className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              Submit Erasure Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

