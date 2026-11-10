import React from "react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getDataStore } from "@/lib/data-store";
import { BookingWizard } from "./booking-wizard";

export default async function BookAppointmentPage({
  searchParams,
}: {
  searchParams?: { facilityId?: string };
}) {
  const session = await getSession();
  if (!session) {
    redirect("/auth/login");
  }

  const store = getDataStore();
  const facilities = store.getFacilities();
  const services = facilities.flatMap((f) => store.getServices(f.id));
  const slots = facilities.flatMap((f) => store.getSlots(f.id));

  return (
    <div className="space-y-6">
      <div className="text-center max-w-xl mx-auto space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          Book a Hospital Appointment
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Fast, 3-step digital queue reservation across public and private hospitals in Ghana
        </p>
      </div>

      <BookingWizard
        facilities={facilities}
        services={services}
        slots={slots}
        initialFacilityId={searchParams?.facilityId}
      />
    </div>
  );
}

