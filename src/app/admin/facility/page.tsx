import React from "react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getDataStore } from "@/lib/data-store";
import { FacilityAdminClient } from "./client";

export default async function FacilityAdminPage() {
  const session = await getSession();
  if (
    !session ||
    !["facility_admin", "platform_admin"].includes(session.role)
  ) {
    redirect("/auth/login");
  }

  const store = getDataStore();
  const facilityId = session.facilityId || "fac-ridge";
  const facility = store.getFacilityById(facilityId);
  const services = store.getServices(facilityId);
  const staff = store.getStaffForFacility(facilityId);

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          Facility Operations Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          {facility?.name || "Ridge Hospital"} • Capacity Scheduling & Staff Security
        </p>
      </div>

      <FacilityAdminClient
        facilityId={facilityId}
        facilityName={facility?.name || "Hospital Facility"}
        services={services}
        staffMembers={staff}
      />
    </div>
  );
}
