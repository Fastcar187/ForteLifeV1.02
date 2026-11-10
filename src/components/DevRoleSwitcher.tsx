"use client";

import React, { useTransition } from "react";
import { switchDemoRoleAction } from "@/lib/actions";
import { UserRole } from "@/lib/types";
import { ShieldCheck, UserCheck, Stethoscope, Building2, Globe } from "lucide-react";

interface Props {
  currentRole?: UserRole;
  currentEmail?: string;
}

export function DevRoleSwitcher({ currentRole, currentEmail }: Props) {
  const [isPending, startTransition] = useTransition();

  const roles: { role: UserRole; label: string; icon: any; desc: string }[] = [
    {
      role: "patient",
      label: "Patient",
      icon: UserCheck,
      desc: "Kwame Mensah",
    },
    {
      role: "frontdesk",
      label: "Front Desk",
      icon: ShieldCheck,
      desc: "Ridge Hospital Admissions",
    },
    {
      role: "doctor",
      label: "Doctor (MFA)",
      icon: Stethoscope,
      desc: "Dr. Boateng",
    },
    {
      role: "facility_admin",
      label: "Facility Admin",
      icon: Building2,
      desc: "Ridge Hospital Ops",
    },
    {
      role: "platform_admin",
      label: "Platform Admin",
      icon: Globe,
      desc: "GHS Ministry Level",
    },
  ];

  return (
    <aside aria-label="Interactive Demo Role Switcher" className="bg-navy-950 text-white text-xs py-2 px-3 border-b border-navy-800 no-print">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            Interactive Demo Mode
          </span>
          <span className="text-slate-400 hidden md:inline">
            Active: <strong className="text-white capitalize">{currentRole || "Guest"}</strong>
            {currentEmail && ` (${currentEmail})`}
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-1">
          <span className="text-slate-400 mr-1 hidden sm:inline">Switch Role:</span>
          {roles.map((item) => {
            const Icon = item.icon;
            const isActive = currentRole === item.role;
            return (
              <button
                key={item.role}
                onClick={() => {
                  startTransition(() => {
                    switchDemoRoleAction(item.role);
                  });
                }}
                disabled={isPending}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors font-medium ${
                  isActive
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-navy-900 text-slate-300 hover:bg-navy-800 hover:text-white"
                }`}
                title={`Switch to ${item.label} (${item.desc})`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
