import Link from "next/link";
import { Hospital, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mb-4">
        <Hospital className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold text-navy-900 mb-2">404 - Page Not Found</h1>
      <p className="text-sm text-slate-600 max-w-md mb-6">
        The clinic department or medical record page you are looking for does not exist or has been relocated.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors shadow-sm"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Patient Sign In</span>
        </Link>
      </div>
    </div>
  );
}
