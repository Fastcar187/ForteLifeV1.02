"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateSlotsAction, resetStaffMfaAction } from "@/lib/actions";
import { MedicalService, Staff } from "@/lib/types";
import {
  Calendar,
  Clock,
  ShieldAlert,
  UserCheck,
  Plus,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

interface Props {
  facilityId: string;
  facilityName: string;
  services: MedicalService[];
  staffMembers: (Staff & { user: { id: string; email: string } })[];
}

export function FacilityAdminClient({
  facilityId,
  facilityName,
  services,
  staffMembers,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [slotMsg, setSlotMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [mfaMsg, setMfaMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Slot generator state
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const [date, setDate] = useState(tomorrowStr);
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [startHour, setStartHour] = useState(8);
  const [endHour, setEndHour] = useState(14);
  const [slotDuration, setSlotDuration] = useState(20);
  const [capacity, setCapacity] = useState(1);

  const handleGenerateSlots = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSlotMsg(null);

    const formData = new FormData();
    formData.append("facilityId", facilityId);
    formData.append("serviceId", serviceId);
    formData.append("date", date);
    formData.append("startHour", startHour.toString());
    formData.append("endHour", endHour.toString());
    formData.append("slotDurationMinutes", slotDuration.toString());
    formData.append("capacityPerSlot", capacity.toString());

    startTransition(async () => {
      const res = await generateSlotsAction(formData);
      if (res.error) {
        setSlotMsg({ type: "error", text: res.error });
      } else {
        setSlotMsg({ type: "success", text: `Successfully generated ${res.count} time slots for ${date}!` });
        router.refresh();
      }
    });
  };

  const handleResetMfa = (targetUserId: string, staffEmail: string) => {
    if (confirm(`Authorize MFA Reset for ${staffEmail}? This action is cryptographically recorded in the audit log.`)) {
      setMfaMsg(null);
      startTransition(async () => {
        const res = await resetStaffMfaAction(targetUserId);
        if (res.error) {
          setMfaMsg({ type: "error", text: res.error });
        } else {
          setMfaMsg({ type: "success", text: `MFA reset authorized for ${staffEmail}. Logged in audit trail.` });
          router.refresh();
        }
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Slot Batch Generator */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <div>
          <h2 className="text-lg font-bold text-navy-900">
            1. Automated Slot & Capacity Generator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Create structured booking intervals to eliminate physical queue congestion at {facilityName}.
          </p>
        </div>

        {slotMsg && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              slotMsg.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}
          >
            {slotMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{slotMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleGenerateSlots} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Target Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Service Department</label>
              <select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Slot Duration (Minutes)</label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
              >
                <option value={15}>15 Minutes</option>
                <option value={20}>20 Minutes (Standard)</option>
                <option value={30}>30 Minutes (Maternal/Pediatric)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Start Time (24h)</label>
              <input
                type="number"
                min={6}
                max={16}
                value={startHour}
                onChange={(e) => setStartHour(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">End Time (24h)</label>
              <input
                type="number"
                min={8}
                max={20}
                value={endHour}
                onChange={(e) => setEndHour(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">Capacity per Slot</label>
              <input
                type="number"
                min={1}
                max={5}
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="py-2.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-colors disabled:opacity-50"
          >
            {isPending ? "Generating..." : "Generate Daily Slots"}
          </button>
        </form>
      </div>

      {/* Staff & MFA Reset Management */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-navy-900">
            2. Clinical Staff & Two-Factor Authentication (MFA) Controls
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Reset Google Authenticator MFA for clinical staff after out-of-band identity verification.
          </p>
        </div>

        {mfaMsg && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              mfaMsg.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-rose-50 border border-rose-200 text-rose-800"
            }`}
          >
            {mfaMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{mfaMsg.text}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Specialty / Title</th>
                <th className="py-2.5 px-3">Email Address</th>
                <th className="py-2.5 px-3 text-right">Security Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffMembers.map((s) => (
                <tr key={s.userId} className="hover:bg-slate-50/60">
                  <td className="py-3 px-3 font-semibold capitalize">{s.role.replace("_", " ")}</td>
                  <td className="py-3 px-3 text-slate-600">{s.titleOrSpecialty}</td>
                  <td className="py-3 px-3 font-mono text-xs">{s.user.email}</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleResetMfa(s.userId, s.user.email)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-medium transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset TOTP MFA
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
