import React from "react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getDataStore } from "@/lib/data-store";
import { PlatformAdminClient } from "./client";

export default async function PlatformAdminPage() {
  const session = await getSession();
  if (!session || session.role !== "platform_admin") {
    redirect("/auth/login");
  }

  const store = getDataStore();
  const facilities = store.getFacilities();
  const auditLogs = store.getAuditLogs(session, 100);
  const metrics = store.getOperationalMetrics();

  // Log Platform Admin access as required by Section 3
  store.recordAudit("PLATFORM_PORTAL_ACCESSED", "system", null, session, {
    facilityCount: facilities.length,
  });

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          National Platform & Regulatory Oversight
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Ministry of Health / Ghana Health Service • System Health & Audit Logging
        </p>
      </div>

      <PlatformAdminClient
        facilities={facilities}
        auditLogs={auditLogs}
        metrics={metrics}
      />
    </div>
  );
}

