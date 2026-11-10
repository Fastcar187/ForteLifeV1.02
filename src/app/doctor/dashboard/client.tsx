"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAppointmentStatusAction } from "@/lib/actions";
import { AppointmentStatus } from "@/lib/types";
import { CheckCircle2, UserCheck, Stethoscope, ShieldCheck } from "lucide-react";

interface DoctorQueueItem {
  id: string;
  referenceCode: string;
  patientId: string;
  status: AppointmentStatus;
  patient: { fullName: string; phoneMasked: string; nhisMasked: string };
  service: { name: string; durationMinutes: number };
  slot: { startTime: string; endTime: string };
}

export function DoctorDashboardClient({ queue }: { queue: DoctorQueueItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleComplete = (id: string) => {
    startTransition(async () => {
      await updateAppointmentStatusAction(id, "completed");
      router.refresh();
    });
  };

  const checkedInPatients = queue.filter((q) => q.status === "checked_in");
  const upcomingPatients = queue.filter((q) => q.status === "booked");
  const completedPatients = queue.filter((q) => q.status === "completed");

  return (
    <div className="space-y-6">
      {/* Waiting Room Queue (Checked in by Front Desk) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base font-bold text-navy-900">
              Ready for Consultation ({checkedInPatients.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Checked-in at triage</span>
        </div>

        {checkedInPatients.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No patients currently waiting in the triage queue.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {checkedInPatients.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-navy-900 text-teal-300 px-2 py-0.5 rounded">
                      {item.referenceCode}
                    </span>
                    <span className="text-xs font-bold text-navy-900">{item.patient.fullName}</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {item.service.name} • {item.patient.nhisMasked}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Slot: {new Date(item.slot.startTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>

                <button
                  onClick={() => handleComplete(item.id)}
                  disabled={isPending}
                  className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Complete Visit
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Today Schedule */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-navy-900 border-b pb-3">
          Today&apos;s Full Roster ({queue.length} Total Patients)
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">Ref Code</th>
                <th className="py-2.5 px-3">Patient</th>
                <th className="py-2.5 px-3">Service</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queue.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-3 font-mono font-bold text-navy-900">
                    {new Date(item.slot.startTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="py-3 px-3 font-mono">{item.referenceCode}</td>
                  <td className="py-3 px-3 font-medium">{item.patient.fullName}</td>
                  <td className="py-3 px-3 text-slate-600">{item.service.name}</td>
                  <td className="py-3 px-3 capitalize">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        item.status === "completed"
                          ? "bg-slate-100 text-slate-700"
                          : item.status === "checked_in"
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {item.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {item.status !== "completed" && (
                      <button
                        onClick={() => handleComplete(item.id)}
                        disabled={isPending}
                        className="text-xs text-teal-600 hover:text-teal-800 font-semibold"
                      >
                        Finish Consultation
                      </button>
                    )}
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

