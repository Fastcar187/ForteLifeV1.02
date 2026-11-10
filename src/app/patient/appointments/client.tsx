"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAppointmentStatusAction } from "@/lib/actions";
import { MapPin, XCircle, RotateCcw, CheckCircle2, Clock } from "lucide-react";

interface AppointmentItem {
  id: string;
  referenceCode: string;
  facility: { id: string; name: string; region: string; locationAddress: string };
  service: { name: string; durationMinutes: number };
  slot: { startTime: string; endTime: string };
  status: string;
}

export function AppointmentListClient({ appointments }: { appointments: AppointmentItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleCancel = (id: string) => {
    if (confirm("Are you sure you want to cancel this appointment? This will release the slot for other patients.")) {
      startTransition(async () => {
        await updateAppointmentStatusAction(id, "cancelled");
        router.refresh();
      });
    }
  };

  const handleReschedule = (id: string, facilityId: string) => {
    if (confirm("Rescheduling will cancel your current booking so you can select a new date. Continue?")) {
      startTransition(async () => {
        await updateAppointmentStatusAction(id, "cancelled");
        router.push(`/patient/book?facilityId=${facilityId}`);
      });
    }
  };

  if (appointments.length === 0) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
        <Clock className="w-10 h-10 text-slate-300 mx-auto" />
        <h3 className="text-base font-bold text-navy-900">No Appointments Found</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          You haven&apos;t booked any clinic visits yet. Click below to book an appointment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((app) => {
        const startTime = new Date(app.slot.startTime);
        const formattedDate = startTime.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const formattedTime = startTime.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const isBooked = app.status === "booked";

        return (
          <div
            key={app.id}
            className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold bg-navy-900 text-teal-300 px-2.5 py-0.5 rounded">
                  {app.referenceCode}
                </span>

                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    app.status === "booked"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : app.status === "checked_in"
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : app.status === "completed"
                      ? "bg-slate-100 text-slate-700"
                      : "bg-rose-50 text-rose-700 border border-rose-200"
                  }`}
                >
                  {app.status.replace("_", " ")}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-base text-navy-900">{app.facility.name}</h3>
                <div className="text-xs text-teal-800 font-medium">{app.service.name}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {app.facility.locationAddress}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:items-end justify-between gap-3 border-t sm:border-t-0 pt-3 sm:pt-0">
              <div className="sm:text-right">
                <div className="text-lg font-extrabold text-navy-900 font-mono">{formattedTime}</div>
                <div className="text-xs text-slate-600 font-medium">{formattedDate}</div>
              </div>

              {isBooked && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleReschedule(app.id, app.facility.id)}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reschedule
                  </button>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleCancel(app.id)}
                    className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 font-medium transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

