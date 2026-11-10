import React from "react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getDataStore } from "@/lib/data-store";
import { DoctorDashboardClient } from "./client";
import { Stethoscope, ShieldCheck } from "lucide-react";

export default async function DoctorDashboardPage() {
  const session = await getSession();
  if (!session || !["doctor", "facility_admin", "platform_admin"].includes(session.role)) {
    redirect("/auth/login");
  }

  const store = getDataStore();
  const facilityId = session.facilityId || "fac-ridge";
  const facility = store.getFacilityById(facilityId);
  const todayStr = new Date().toISOString().split("T")[0];

  const appointments = store.getAppointments(session, {
    facilityId,
    dateStr: todayStr,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Physician Consultation Queue
            </h1>
            <span className="px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
              MFA Verified
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {session.fullName || "Dr. Emmanuel Boateng"} • {facility?.name}
          </p>
        </div>

        <div className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
          Schedule: {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}
        </div>
      </div>

      <DoctorDashboardClient queue={appointments} />
    </div>
  );
}
