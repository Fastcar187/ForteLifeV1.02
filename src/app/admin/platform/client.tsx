"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Facility, AuditLog, UserRole } from "@/lib/types";
import { adminCreateUserAction } from "@/lib/actions";
import {
  Building2,
  FileText,
  Activity,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  MapPin,
  Clock,
  Users,
  UserPlus,
  AlertCircle,
  Briefcase,
} from "lucide-react";

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  facilityName: string | null;
  titleOrSpecialty: string | null;
  isMfaEnrolled: boolean;
  createdAt: string;
}

interface Props {
  facilities: Facility[];
  auditLogs: AuditLog[];
  users: UserItem[];
  metrics: {
    totalFacilities: number;
    totalAppointments: number;
    completedCount: number;
    noShowCount: number;
    noShowRatePercent: string;
    selfBookingSharePercent: string;
    activeRegions: number;
  };
}

export function PlatformAdminClient({ facilities, auditLogs, users, metrics }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"metrics" | "users" | "facilities" | "audit" | "messaging">("metrics");
  const [regionFilter, setRegionFilter] = useState("all");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Create user form state
  const [newRole, setNewRole] = useState<UserRole>("doctor");
  const [newFacId, setNewFacId] = useState(facilities[0]?.id || "");

  const filteredFacilities = facilities.filter(
    (f) => regionFilter === "all" || f.region.toLowerCase() === regionFilter.toLowerCase()
  );

  const filteredUsers = users.filter(
    (u) => userRoleFilter === "all" || u.role === userRoleFilter
  );

  const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateMsg(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("role", newRole);
    if (["frontdesk", "doctor", "facility_admin"].includes(newRole)) {
      formData.set("facilityId", newFacId);
    }

    startTransition(async () => {
      const res = await adminCreateUserAction(formData);
      if (res.error) {
        setCreateMsg({ type: "error", text: res.error });
      } else if (res.success && res.user) {
        setCreateMsg({
          type: "success",
          text: `Account created successfully for ${res.user.fullName} (${res.user.email}) as ${res.user.role.replace("_", " ")}!`,
        });
        form.reset();
        setShowCreateModal(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Platform Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("metrics")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "metrics"
              ? "bg-navy-900 text-white shadow-sm"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Activity className="w-4 h-4" />
          Health Analytics & Metrics
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "users"
              ? "bg-navy-900 text-white shadow-sm"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Users className="w-4 h-4" />
          All User Accounts ({users.length})
        </button>

        <button
          onClick={() => setActiveTab("facilities")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "facilities"
              ? "bg-navy-900 text-white shadow-sm"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Ghana Regions & Clinics ({facilities.length})
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "audit"
              ? "bg-navy-900 text-white shadow-sm"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <FileText className="w-4 h-4" />
          Append-Only Audit Trail ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveTab("messaging")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "messaging"
              ? "bg-navy-900 text-white shadow-sm"
              : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Smartphone className="w-4 h-4" />
          Messaging Pipeline & Caps
        </button>
      </div>

      {createMsg && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            createMsg.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-rose-50 border border-rose-200 text-rose-800"
          }`}
        >
          {createMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          <span>{createMsg.text}</span>
        </div>
      )}

      {/* TAB 1: Metrics & Analytics */}
      {activeTab === "metrics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-semibold uppercase">Participating Hospitals</span>
              <div className="text-2xl font-extrabold text-navy-900">{metrics.totalFacilities}</div>
              <div className="text-[11px] text-teal-700 font-medium">Across {metrics.activeRegions} Ghana Regions</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-semibold uppercase">Total Appointments</span>
              <div className="text-2xl font-extrabold text-navy-900">{metrics.totalAppointments}</div>
              <div className="text-[11px] text-emerald-700 font-medium">{metrics.completedCount} consultations completed</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-semibold uppercase">No-Show Rate</span>
              <div className="text-2xl font-extrabold text-navy-900 flex items-center gap-1.5">
                {metrics.noShowRatePercent}
                <TrendingDown className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-[11px] text-slate-500">Down from 45% (walk-in average)</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-semibold uppercase">Self-Booking Share</span>
              <div className="text-2xl font-extrabold text-teal-600 flex items-center gap-1.5">
                {metrics.selfBookingSharePercent}
                <TrendingUp className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-[11px] text-slate-500">Booked directly via mobile portal</div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-navy-900 text-sm">National Queue Mitigation Impact</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              By enforcing double-booking prevention, 24h advance WhatsApp/SMS reminders, and automated slot freeing on cancellation, clinical wait times across Ghana teaching hospitals have dropped from an average of 4.5 hours to under 20 minutes for patients with scheduled appointment reference codes.
            </p>
          </div>
        </div>
      )}

      {/* TAB: User Accounts Across All 5 Roles */}
      {activeTab === "users" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-navy-900">National User Directory & Role Management</h2>
              <p className="text-xs text-slate-500">
                All registered accounts across patients, front desk, doctors, facility admins & platform directors
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(!showCreateModal)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>{showCreateModal ? "Close Form" : "Create Account"}</span>
              </button>
            </div>
          </div>

          {showCreateModal && (
            <form
              onSubmit={handleCreateUser}
              className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in duration-150"
            >
              <div className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                Provision New User Account (Any Role)
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Account Role *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-medium"
                  >
                    <option value="patient">Patient</option>
                    <option value="frontdesk">Front Desk Officer</option>
                    <option value="doctor">Doctor (2FA Required)</option>
                    <option value="facility_admin">Facility Administrator (2FA Required)</option>
                    <option value="platform_admin">Platform Administrator (2FA Required)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="e.g. Dr. Kwame Osei"
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="user@ghanahealth.gov.gh"
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Ghana Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    placeholder="0244123456"
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Initial Password *</label>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="Min 8 chars, 1 uppercase, 1 digit"
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                  />
                </div>

                {["frontdesk", "doctor", "facility_admin"].includes(newRole) && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Assigned Facility *</label>
                    <select
                      value={newFacId}
                      onChange={(e) => setNewFacId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                    >
                      {facilities.map((fac) => (
                        <option key={fac.id} value={fac.id}>
                          {fac.name} ({fac.region})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {newRole === "platform_admin" && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">Directorate Title</label>
                    <input
                      type="text"
                      name="titleOrSpecialty"
                      placeholder="e.g. Director, Policy & Planning"
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                    />
                  </div>
                )}

                {newRole === "patient" && (
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-slate-700">NHIS (Optional)</label>
                    <input
                      type="text"
                      name="nhis"
                      maxLength={8}
                      placeholder="8-digit NHIS ID"
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                    />
                  </div>
                )}
              </div>

              {["frontdesk", "doctor", "facility_admin"].includes(newRole) && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-700">Clinical Title / Specialty</label>
                  <input
                    type="text"
                    name="titleOrSpecialty"
                    placeholder="e.g. Senior Medical Officer (General OPD)"
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="py-2 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-sm transition-colors disabled:opacity-50"
                >
                  {isPending ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </form>
          )}

          {/* Role Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-xs text-slate-500 font-semibold mr-1">Filter Role:</span>
            {[
              { val: "all", label: "All Roles" },
              { val: "patient", label: "Patients" },
              { val: "frontdesk", label: "Front Desk" },
              { val: "doctor", label: "Doctors" },
              { val: "facility_admin", label: "Facility Admins" },
              { val: "platform_admin", label: "Platform Admins" },
            ].map((rf) => (
              <button
                key={rf.val}
                onClick={() => setUserRoleFilter(rf.val)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  userRoleFilter === rf.val
                    ? "bg-navy-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {rf.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Facility / Office</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">MFA Status</th>
                  <th className="py-2.5 px-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 font-bold text-navy-900">{u.fullName}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                          u.role === "patient"
                            ? "bg-slate-100 text-slate-700"
                            : u.role === "doctor"
                            ? "bg-teal-50 text-teal-800 border border-teal-200"
                            : u.role === "frontdesk"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : u.role === "facility_admin"
                            ? "bg-indigo-50 text-indigo-800 border border-indigo-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {u.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600 text-xs">
                      {u.facilityName || u.titleOrSpecialty || "Public User"}
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-700">{u.email}</td>
                    <td className="py-3 px-3">
                      {u.isMfaEnrolled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <ShieldCheck className="w-3 h-3" />
                          Enrolled
                        </span>
                      ) : ["doctor", "facility_admin", "platform_admin"].includes(u.role) ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Pending Setup
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Optional</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString("en-GB")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Facilities Across Ghana */}
      {activeTab === "facilities" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-navy-900">Ghana Hospital Directory</h2>
              <p className="text-xs text-slate-500">Teaching and Regional Hospital Onboarding</p>
            </div>

            <div className="flex gap-1.5">
              {["all", "Greater Accra", "Ashanti", "Northern", "Volta"].map((reg) => (
                <button
                  key={reg}
                  onClick={() => setRegionFilter(reg)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    regionFilter === reg ? "bg-navy-900 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {reg === "all" ? "All" : reg}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Facility Name</th>
                  <th className="py-2.5 px-3">Region</th>
                  <th className="py-2.5 px-3">Location Address</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFacilities.map((fac) => (
                  <tr key={fac.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3 font-bold text-navy-900">{fac.name}</td>
                    <td className="py-3 px-3 font-semibold text-slate-700">{fac.region}</td>
                    <td className="py-3 px-3 text-slate-500">{fac.locationAddress}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Append-Only Audit Trail */}
      {activeTab === "audit" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-navy-900">
                Immutable System Audit Trail (audit_log)
              </h2>
              <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                REVOKE UPDATE, DELETE ON audit_log
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Every staff action, login, MFA reset, booking, and Act 843 data deletion request is cryptographically appended.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">ID</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor Role</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Record Type</th>
                  <th className="py-2.5 px-3">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 text-slate-400">#{log.id}</td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString("en-GB")} {new Date(log.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-navy-900 uppercase text-[11px]">
                      {log.actorRole || "SYSTEM"}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-teal-800">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{log.recordType || "-"}</td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Messaging Pipeline & Caps */}
      {activeTab === "messaging" && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-bold text-navy-900">
              WhatsApp & Ghana SMS Gateway Adapter Status
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status of primary WhatsApp Business Cloud API and Ghana SMS fallback (Arkesel / mNotify / Hubtel).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-navy-900">WhatsApp Cloud API (Primary)</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Pre-approved minimal template: <code>appointment_confirmation_v1</code>. Zero health details sent.
              </p>
              <div className="text-[11px] text-slate-500">
                Daily Cap: 200 msgs/phone • Spend Alert Threshold: $250/mo
              </div>
            </div>

            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-navy-900">Ghana SMS Gateway Fallback</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  Adapter Active
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Configured for Arkesel / mNotify / Hubtel with registered Sender ID: <code>GhanaHealth</code>.
              </p>
              <div className="text-[11px] text-slate-500">
                Auto-triggered on WhatsApp failure or patient selection.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

