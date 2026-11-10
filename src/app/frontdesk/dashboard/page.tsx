import React from "react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getDataStore } from "@/lib/data-store";
import { FrontDeskDashboardClient } from "./client";

export default async function FrontDeskDashboardPage() {
  const session = await getSession();
  if (
    !session ||
    !["frontdesk", "facility_admin", "platform_admin"].includes(session.role)
  ) {
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
  const services = store.getServices(facilityId);
  const slots = store.getSlots(facilityId, todayStr);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-4 no-print">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Front Desk Queue & Triage
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            {facility?.name || "Ridge Hospital"} • Admissions Desk
          </p>
        </div>

        <div className="text-xs font-semibold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
          Today: {new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
        </div>
      </div>

      <FrontDeskDashboardClient
        facilityName={facility?.name || "Facility"}
        facilityId={facilityId}
        initialQueue={appointments}
        services={services}
        availableSlots={slots}
        selectedDate={todayStr}
      />
    </div>
  );
}

