"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAppointmentStatusAction, bookWalkInAction } from "@/lib/actions";
import { AppointmentStatus, MedicalService, AppointmentSlot } from "@/lib/types";
import {
  Search,
  CheckCircle2,
  XCircle,
  Printer,
  Download,
  UserPlus,
  Clock,
  MapPin,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";

interface QueueItem {
  id: string;
  referenceCode: string;
  patientId: string;
  status: AppointmentStatus;
  patient: { fullName: string; phoneMasked: string; nhisMasked: string };
  service: { name: string; durationMinutes: number };
  slot: { id: string; startTime: string; endTime: string };
}

interface Props {
  facilityName: string;
  facilityId: string;
  initialQueue: QueueItem[];
  services: MedicalService[];
  availableSlots: AppointmentSlot[];
  selectedDate: string;
}

export function FrontDeskDashboardClient({
  facilityName,
  facilityId,
  initialQueue,
  services,
  availableSlots,
  selectedDate,
}: Props) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isPending, startTransition] = useTransition();
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [walkInError, setWalkInError] = useState<string | null>(null);

  // Walk-in form state
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInNhis, setWalkInNhis] = useState("");
  const [walkInServiceId, setWalkInServiceId] = useState(services[0]?.id || "");
  const [walkInSlotId, setWalkInSlotId] = useState("");

  const filteredSlotsForWalkIn = availableSlots.filter(
    (s) => s.serviceId === walkInServiceId && s.bookedCount < s.capacity
  );

  const handleStatusUpdate = (appointmentId: string, newStatus: AppointmentStatus) => {
    startTransition(async () => {
      await updateAppointmentStatusAction(appointmentId, newStatus);
      router.refresh();
    });
  };

  const handleWalkInSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setWalkInError(null);

    const formData = new FormData();
    formData.append("facilityId", facilityId);
    formData.append("serviceId", walkInServiceId);
    formData.append("slotId", walkInSlotId);
    formData.append("fullName", walkInName);
    formData.append("phone", walkInPhone);
    if (walkInNhis) formData.append("nhis", walkInNhis);
    formData.append("notificationChannel", "none");

    startTransition(async () => {
      const result = await bookWalkInAction(formData);
      if (result.error) {
        setWalkInError(result.error);
      } else {
        setIsWalkInOpen(false);
        setWalkInName("");
        setWalkInPhone("");
        setWalkInNhis("");
        router.refresh();
      }
    });
  };

  // Filter queue by search term and status
  const queue = initialQueue.filter((item) => {
    const matchesSearch =
      item.referenceCode.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
      item.patient.fullName.toLowerCase().includes(searchTerm.toLowerCase().trim());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Export to CSV helper
  const exportToCsv = () => {
    const headers = ["Reference Code", "Patient Name", "Phone", "NHIS", "Service", "Scheduled Time", "Status"];
    const rows = queue.map((q) => [
      q.referenceCode,
      `"${q.patient.fullName}"`,
      q.patient.phoneMasked,
      q.patient.nhisMasked,
      `"${q.service.name}"`,
      new Date(q.slot.startTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      q.status,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `queue_sheet_${facilityName.replace(/\s+/g, "_")}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Queue Sheet
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Printable Sheet Header (Only visible when printing or in print view) */}
      <div className="hidden print:block mb-6 text-center border-b pb-4">
        <h1 className="text-2xl font-bold">{facilityName} - Daily Patient Queue</h1>
        <p className="text-sm text-gray-600">
          Date: {selectedDate} • Generated for Clinic Offline Triage Backup
        </p>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        {/* Search by Reference or Name */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Ref (e.g. GH-84920) or Patient Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-xs sm:text-sm bg-white"
          />
        </div>

        {/* Buttons: Walk-in, Print Sheet, CSV */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setIsWalkInOpen(true)}
            className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm transition-colors min-h-[40px]"
          >
            <UserPlus className="w-4 h-4" />
            Book Walk-in Patient
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl shadow-sm transition-colors min-h-[40px]"
            title="Print queue sheet for poor-internet clinic fallback"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            Print Queue Sheet
          </button>

          <button
            onClick={exportToCsv}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl shadow-sm transition-colors min-h-[40px]"
            title="Export CSV for records"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Status Filter Tabs (no-print) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-print">
        {["all", "booked", "checked_in", "completed", "no_show"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              statusFilter === st
                ? "bg-navy-900 text-white"
                : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {st === "all" ? "All Visits" : st.replace("_", " ").toUpperCase()}
          </button>
        ))}
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Ref Code</th>
                <th className="py-3 px-4">Patient Details</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Slot Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right no-print">Actions</th>
                <th className="py-3 px-4 hidden print:table-cell text-center">Paper Sign-off</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No matching appointments found for this date.
                  </td>
                </tr>
              ) : (
                queue.map((item) => {
                  const startTime = new Date(item.slot.startTime);
                  const timeFormatted = startTime.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-navy-900">
                        {item.referenceCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-navy-900">{item.patient.fullName}</div>
                        <div className="text-[11px] text-slate-500">
                          {item.patient.phoneMasked} • {item.patient.nhisMasked}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {item.service.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-navy-900">
                        {timeFormatted}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            item.status === "booked"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : item.status === "checked_in"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : item.status === "completed"
                              ? "bg-slate-100 text-slate-700"
                              : "bg-rose-50 text-rose-800 border border-rose-200"
                          }`}
                        >
                          {item.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right no-print">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === "booked" && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(item.id, "checked_in")}
                                disabled={isPending}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm transition-colors"
                              >
                                Check In
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(item.id, "no_show")}
                                disabled={isPending}
                                className="px-2 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 font-medium text-xs transition-colors"
                              >
                                No Show
                              </button>
                            </>
                          )}

                          {item.status === "checked_in" && (
                            <button
                              onClick={() => handleStatusUpdate(item.id, "completed")}
                              disabled={isPending}
                              className="px-2.5 py-1 rounded-lg bg-navy-900 hover:bg-navy-800 text-white font-medium text-xs transition-colors"
                            >
                              Mark Completed
                            </button>
                          )}
                        </div>
                      </td>
                      {/* Offline Paper Backup Sign-off Column */}
                      <td className="py-3.5 px-4 hidden print:table-cell text-center">
                        <div className="w-6 h-6 border-2 border-slate-400 mx-auto rounded"></div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Walk-in Booking Modal */}
      {isWalkInOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-navy-900">
                Book Walk-In Patient
              </h3>
              <button
                onClick={() => setIsWalkInOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {walkInError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                {walkInError}
              </div>
            )}

            <form onSubmit={handleWalkInSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Patient Full Name *</label>
                <input
                  type="text"
                  required
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  placeholder="e.g. Yaw Osei"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Ghana Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  placeholder="0244123456"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">NHIS Number (Optional)</label>
                <input
                  type="text"
                  maxLength={8}
                  value={walkInNhis}
                  onChange={(e) => setWalkInNhis(e.target.value)}
                  placeholder="8 digits"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Service Department</label>
                <select
                  value={walkInServiceId}
                  onChange={(e) => {
                    setWalkInServiceId(e.target.value);
                    setWalkInSlotId("");
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Available Time Slot *</label>
                {filteredSlotsForWalkIn.length === 0 ? (
                  <p className="text-xs text-rose-600 font-medium">No open slots remaining for this service.</p>
                ) : (
                  <select
                    required
                    value={walkInSlotId}
                    onChange={(e) => setWalkInSlotId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                  >
                    <option value="">Select a free time slot</option>
                    {filteredSlotsForWalkIn.map((s) => (
                      <option key={s.id} value={s.id}>
                        {new Date(s.startTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWalkInOpen(false)}
                  className="px-4 py-2 border rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !walkInSlotId}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {isPending ? "Assigning..." : "Assign & Check In"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
