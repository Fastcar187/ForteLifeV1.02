"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SessionUser } from "@/lib/types";
import { logoutAction } from "@/lib/actions";
import {
  Calendar,
  Clock,
  Shield,
  LogOut,
  Hospital,
  Activity,
  Layers,
  FileText,
  Menu,
  X,
  User,
} from "lucide-react";

interface Props {
  user: SessionUser | null;
}

export function Navbar({ user }: Props) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-navy-900 text-white border-b border-navy-800 sticky top-0 z-40 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 bg-white px-2 py-0.5 rounded-lg flex items-center justify-center shadow-sm">
              <Image
                src="/logo.png"
                alt="Fortelife - Hospital Bookings & Health"
                width={120}
                height={32}
                className="h-8 w-auto object-contain"
                priority
              />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-base tracking-tight text-white leading-tight">
                Fortelife
              </div>
              <div className="text-[11px] text-teal-300 font-medium">
                Hospital Bookings • Ghana&apos;s Healthcare Partner
              </div>
            </div>
          </Link>

          {/* Navigation Links based on Role */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {user?.role === "patient" && (
              <>
                <Link
                  href="/patient/dashboard"
                  className={`px-3 py-2 rounded-md transition-colors ${
                    pathname === "/patient/dashboard"
                      ? "bg-navy-800 text-teal-300"
                      : "text-slate-200 hover:bg-navy-800 hover:text-white"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/patient/book"
                  className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 ${
                    pathname === "/patient/book"
                      ? "bg-teal-600 text-white font-semibold"
                      : "text-slate-200 hover:bg-navy-800 hover:text-white"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  Book Appointment
                </Link>
                <Link
                  href="/patient/appointments"
                  className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 ${
                    pathname === "/patient/appointments"
                      ? "bg-navy-800 text-teal-300"
                      : "text-slate-200 hover:bg-navy-800 hover:text-white"
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  My Appointments
                </Link>
                <Link
                  href="/patient/privacy"
                  className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 ${
                    pathname === "/patient/privacy"
                      ? "bg-navy-800 text-teal-300"
                      : "text-slate-200 hover:bg-navy-800 hover:text-white"
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Data Rights (Act 843)
                </Link>
              </>
            )}

            {user?.role === "frontdesk" && (
              <>
                <Link
                  href="/frontdesk/dashboard"
                  className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 ${
                    pathname === "/frontdesk/dashboard"
                      ? "bg-navy-800 text-teal-300"
                      : "text-slate-200 hover:bg-navy-800 hover:text-white"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Daily Queue & Triage
                </Link>
              </>
            )}

            {user?.role === "doctor" && (
              <>
                <Link
                  href="/doctor/dashboard"
                  className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 ${
                    pathname === "/doctor/dashboard"
                      ? "bg-navy-800 text-teal-300"
                      : "text-slate-200 hover:bg-navy-800 hover:text-white"
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  Doctor Schedule & Queue
                </Link>
              </>
            )}

            {user?.role === "facility_admin" && (
              <>
                <Link
                  href="/admin/facility"
                  className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 ${
                    pathname === "/admin/facility"
                      ? "bg-navy-800 text-teal-300"
                      : "text-slate-200 hover:bg-navy-800 hover:text-white"
                  }`}
                >
                  <Hospital className="w-4 h-4" />
                  Facility Management
                </Link>
              </>
            )}

            {user?.role === "platform_admin" && (
              <>
                <Link
                  href="/admin/platform"
                  className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 ${
                    pathname === "/admin/platform"
                      ? "bg-navy-800 text-teal-300"
                      : "text-slate-200 hover:bg-navy-800 hover:text-white"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Platform & Audit Logs
                </Link>
              </>
            )}
          </nav>

          {/* User Profile, Auth CTA & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-semibold text-white">
                    {user.fullName || user.email.split("@")[0]}
                  </div>
                  <div className="text-[11px] text-teal-300 capitalize">
                    {user.facilityName ? `${user.role.replace("_", " ")} • ${user.facilityName}` : user.role.replace("_", " ")}
                  </div>
                </div>
                <form action={logoutAction} className="hidden sm:block">
                  <button
                    type="submit"
                    className="p-2 text-slate-300 hover:text-white hover:bg-navy-800 rounded-lg transition-colors"
                    title="Log Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="text-xs sm:text-sm text-slate-200 hover:text-white px-3 py-2 rounded-lg font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="text-xs sm:text-sm bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-lg font-medium shadow-sm transition-colors"
                >
                  Register as Patient
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-200 hover:text-white hover:bg-navy-800 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-navy-800 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            {user && (
              <div className="px-3 py-2 bg-navy-950 rounded-xl border border-navy-800 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">
                    {user.fullName || user.email.split("@")[0]}
                  </div>
                  <div className="text-xs text-teal-300 capitalize">
                    {user.facilityName ? `${user.role.replace("_", " ")} • ${user.facilityName}` : user.role.replace("_", " ")}
                  </div>
                </div>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-rose-300 text-xs font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </form>
              </div>
            )}

            <nav className="flex flex-col space-y-1 text-sm font-medium">
              {user?.role === "patient" && (
                <>
                  <Link
                    href="/patient/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 ${
                      pathname === "/patient/dashboard"
                        ? "bg-navy-800 text-teal-300 font-semibold"
                        : "text-slate-200 hover:bg-navy-800 hover:text-white"
                    }`}
                  >
                    <Hospital className="w-4 h-4 text-teal-400" />
                    <span>Patient Dashboard</span>
                  </Link>
                  <Link
                    href="/patient/book"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 ${
                      pathname === "/patient/book"
                        ? "bg-teal-600 text-white font-semibold"
                        : "text-slate-200 hover:bg-navy-800 hover:text-white"
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-teal-400" />
                    <span>Book Appointment</span>
                  </Link>
                  <Link
                    href="/patient/appointments"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 ${
                      pathname === "/patient/appointments"
                        ? "bg-navy-800 text-teal-300 font-semibold"
                        : "text-slate-200 hover:bg-navy-800 hover:text-white"
                    }`}
                  >
                    <Clock className="w-4 h-4 text-teal-400" />
                    <span>My Appointments</span>
                  </Link>
                  <Link
                    href="/patient/privacy"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 ${
                      pathname === "/patient/privacy"
                        ? "bg-navy-800 text-teal-300 font-semibold"
                        : "text-slate-200 hover:bg-navy-800 hover:text-white"
                    }`}
                  >
                    <Shield className="w-4 h-4 text-teal-400" />
                    <span>Data Rights (Act 843)</span>
                  </Link>
                </>
              )}

              {user?.role === "frontdesk" && (
                <Link
                  href="/frontdesk/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 ${
                    pathname === "/frontdesk/dashboard"
                      ? "bg-navy-800 text-teal-300 font-semibold"
                      : "text-slate-200 hover:bg-navy-800 hover:text-white"
                  }`}
                >
                  <Layers className="w-4 h-4 text-teal-400" />
                  <span>Daily Queue & Triage</span>
                </Link>
              )}

              {user?.role === "doctor" && (
                <Link
                  href="/doctor/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 ${
                    pathname === "/doctor/dashboard"
                      ? "bg-navy-800 text-teal-300 font-semibold"
                      : "text-slate-200 hover:bg-navy-800 hover:text-white"
                  }`}
                >
                  <Activity className="w-4 h-4 text-teal-400" />
                  <span>Doctor Schedule & Queue</span>
                </Link>
              )}

              {user?.role === "facility_admin" && (
                <Link
                  href="/admin/facility"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 ${
                    pathname === "/admin/facility"
                      ? "bg-navy-800 text-teal-300 font-semibold"
                      : "text-slate-200 hover:bg-navy-800 hover:text-white"
                  }`}
                >
                  <Hospital className="w-4 h-4 text-teal-400" />
                  <span>Facility Management</span>
                </Link>
              )}

              {user?.role === "platform_admin" && (
                <Link
                  href="/admin/platform"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 ${
                    pathname === "/admin/platform"
                      ? "bg-navy-800 text-teal-300 font-semibold"
                      : "text-slate-200 hover:bg-navy-800 hover:text-white"
                  }`}
                >
                  <FileText className="w-4 h-4 text-teal-400" />
                  <span>Platform & Audit Logs</span>
                </Link>
              )}

              {!user && (
                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 px-4 rounded-xl border border-slate-700 bg-navy-800 text-white font-semibold text-sm"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-sm"
                  >
                    Register as Patient
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

