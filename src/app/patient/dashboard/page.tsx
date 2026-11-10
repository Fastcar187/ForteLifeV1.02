import React from "react";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getDataStore } from "@/lib/data-store";
import {
  Calendar,
  Clock,
  ShieldCheck,
  ChevronRight,
  MapPin,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";

export default async function PatientDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== "patient") {
    redirect("/auth/login");
  }

  const store = getDataStore();
  const appointments = store.getAppointments(session);
  const upcomingAppointment = appointments.find(
    (a) => a.status === "booked" || a.status === "checked_in"
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Akwaaba, {session.fullName || "Patient"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Ghana Health Service Patient Portal • National Clinic Appointment System
          </p>
        </div>

        <Link
          href="/patient/book"
          className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-sm transition-colors min-h-[44px]"
        >
          <Calendar className="w-4 h-4" />
          Book New Appointment
        </Link>
      </div>

      {/* Next Upcoming Appointment Highlight */}
      {upcomingAppointment ? (
        <div className="bg-gradient-to-r from-navy-900 to-navy-800 text-white p-6 sm:p-8 rounded-2xl shadow-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              Upcoming Scheduled Visit
            </span>

            <div className="text-xs font-mono bg-white/10 px-3 py-1 rounded-lg border border-white/15">
              Reference: <strong className="text-white text-sm">{upcomingAppointment.referenceCode}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold leading-snug">
                {upcomingAppointment.facility.name}
              </h2>
              <p className="text-xs text-teal-200 font-medium mt-1">
                {upcomingAppointment.service.name}
              </p>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-2">
                <MapPin className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                {upcomingAppointment.facility.locationAddress}
              </p>
            </div>

            <div className="flex flex-col justify-center sm:items-end">
              <div className="text-xs text-slate-300">Appointment Date & Time:</div>
              <div className="text-2xl font-extrabold text-white mt-1">
                {new Date(upcomingAppointment.slot.startTime).toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
              <div className="text-sm font-medium text-teal-300">
                {new Date(upcomingAppointment.slot.startTime).toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-navy-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="text-slate-300">
              Status: <span className="text-emerald-400 font-semibold capitalize">{upcomingAppointment.status.replace("_", " ")}</span>
            </div>
            <Link
              href="/patient/appointments"
              className="text-teal-300 hover:text-white font-medium flex items-center gap-1"
            >
              Manage, Reschedule or Cancel Visit <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-navy-900">No Upcoming Appointments</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            You currently have no scheduled clinic visits. Book ahead to reserve your time slot and avoid long queues.
          </p>
          <Link
            href="/patient/book"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Book an Appointment Now
          </Link>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/patient/book"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-500 transition-colors group space-y-2"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <Calendar className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-navy-900 text-sm">Book New Appointment</h3>
          <p className="text-xs text-slate-500">
            Select a public or private clinic across Greater Accra, Ashanti, Northern, or Volta.
          </p>
        </Link>

        <Link
          href="/patient/appointments"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-500 transition-colors group space-y-2"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-navy-900 text-sm">My Appointment History</h3>
          <p className="text-xs text-slate-500">
            View all past consultations, reference codes, check-in timestamps, and statuses.
          </p>
        </Link>

        <Link
          href="/patient/privacy"
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-teal-500 transition-colors group space-y-2"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-navy-900 text-sm">Act 843 Privacy Center</h3>
          <p className="text-xs text-slate-500">
            Exercise your rights under Ghana Act 843: inspect data, update NHIS, or request erasure.
          </p>
        </Link>
      </div>
    </div>
  );
}
