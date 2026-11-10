import React from "react";
import Link from "next/link";
import { getDataStore } from "@/lib/data-store";
import {
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  ChevronRight,
  Smartphone,
  PhoneCall,
  Activity,
} from "lucide-react";

export default function HomePage({
  searchParams,
}: {
  searchParams?: { region?: string };
}) {
  const store = getDataStore();
  const selectedRegion = searchParams?.region || "all";
  const facilities = store.getFacilities(selectedRegion);
  const metrics = store.getOperationalMetrics();

  const regions = [
    "all",
    "Greater Accra",
    "Ashanti",
    "Northern",
    "Volta",
  ];

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-navy-900 to-navy-800 text-white rounded-2xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-teal-300 text-xs font-semibold backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            Fortelife • Ghana&apos;s Healthcare Booking Partner
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Skip the Walk-in Queue. <br />
            <span className="text-teal-400">Book Your Hospital Visit</span> in 60 Seconds.
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl leading-relaxed">
            Eliminate 4–6 hour waiting times at public and private hospitals across Ghana. Choose your facility, pick a confirmed time slot, and receive instant WhatsApp and SMS reminders.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              href="/patient/book"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3.5 rounded-xl shadow-md transition-all text-base min-h-[48px]"
            >
              <Calendar className="w-5 h-5" />
              Book Appointment Now
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>

            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-5 py-3.5 rounded-xl border border-white/20 transition-all text-sm min-h-[48px]"
            >
              Patient Sign Up
            </Link>
          </div>

          {/* Trust Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-navy-700/60 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Zero-Cost Booking</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span>Low-Data &lt; 50KB for 3G</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0" />
              <span>Act 843 Privacy Encrypted</span>
            </div>
          </div>
        </div>
      </section>

      {/* Operational Highlights / Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="text-2xl sm:text-3xl font-extrabold text-navy-900">{metrics.totalFacilities}</div>
          <div className="text-xs text-slate-600 font-medium mt-1">Teaching & Regional Hospitals</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-600">{metrics.totalAppointments}+</div>
          <div className="text-xs text-slate-600 font-medium mt-1">Confirmed Digital Appointments</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{metrics.selfBookingSharePercent}</div>
          <div className="text-xs text-slate-600 font-medium mt-1">Patient Self-Booking Adoption</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="text-2xl sm:text-3xl font-extrabold text-navy-900">&lt; 15 min</div>
          <div className="text-xs text-slate-600 font-medium mt-1">Average Wait Time with Booking</div>
        </div>
      </section>

      {/* Hospital Directory & Instant Availability */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-navy-900 tracking-tight">
              Participating Hospitals in Ghana
            </h2>
            <p className="text-sm text-slate-600">
              Filter by region to discover verified clinics and check consultation slots.
            </p>
          </div>

          {/* Region Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
            {regions.map((reg) => {
              const isActive = selectedRegion.toLowerCase() === reg.toLowerCase();
              return (
                <Link
                  key={reg}
                  href={reg === "all" ? "/" : `/?region=${encodeURIComponent(reg)}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-navy-900 text-white"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {reg === "all" ? "All Regions" : reg}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Facilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {facilities.map((fac) => {
            const facServices = store.getServices(fac.id);
            const facSlots = store.getSlots(fac.id);
            const availableSlotsCount = facSlots.filter((s) => s.bookedCount < s.capacity).length;

            return (
              <div
                key={fac.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {fac.region}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {availableSlotsCount} slots available
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-navy-900 leading-snug">
                      {fac.name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                      {fac.locationAddress}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-xs font-medium text-slate-600 mb-1.5">Services:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {facServices.slice(0, 3).map((srv) => (
                        <span
                          key={srv.id}
                          className="text-[11px] bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-100"
                        >
                          {srv.name}
                        </span>
                      ))}
                      {facServices.length > 3 && (
                        <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          +{facServices.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100">
                  <Link
                    href={`/patient/book?facilityId=${fac.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs sm:text-sm py-2.5 px-4 rounded-lg transition-colors min-h-[44px]"
                  >
                    <Calendar className="w-4 h-4" />
                    Book at this Hospital
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3-Step Guided Flow Preview */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-navy-900">
            How Digital Clinic Booking Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Simple 3-step process designed for any smartphone or slow mobile connection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="font-bold text-navy-900 text-base">Select Facility & Service</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Choose General OPD, Antenatal, Pediatrics, Eye, or Dental care at your regional or teaching hospital.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="font-bold text-navy-900 text-base">Pick Date & Time Slot</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              View guaranteed available slots and capacity chips with clear morning and afternoon sessions.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-bold text-navy-900 text-base">Get WhatsApp / SMS Code</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Receive a unique reference code (`GH-XXXXX`) to show at admissions. No paperwork or long wait needed.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

