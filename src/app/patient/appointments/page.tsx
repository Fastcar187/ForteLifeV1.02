import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getDataStore } from "@/lib/data-store";
import { AppointmentListClient } from "./client";
import { Calendar, Plus } from "lucide-react";

export default async function PatientAppointmentsPage() {
  const session = await getSession();
  if (!session || session.role !== "patient") {
    redirect("/auth/login");
  }

  const store = getDataStore();
  const appointments = store.getAppointments(session);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            My Appointments
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Track and manage your scheduled hospital visits and status
          </p>
        </div>

        <Link
          href="/patient/book"
          className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Book Another Visit
        </Link>
      </div>

      <AppointmentListClient appointments={appointments} />
    </div>
  );
}
