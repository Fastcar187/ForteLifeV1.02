import React from "react";
import { ShieldAlert } from "lucide-react";

export function ScamBanner() {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs sm:text-sm text-amber-900 flex items-center justify-center gap-2">
      <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
      <span>
        <strong>Public Security Alert:</strong> Ghana Health Service and partner clinics will{" "}
        <span className="underline decoration-amber-500 font-semibold">never</span> ask for money, Mobile Money PINs, or sensitive health records via WhatsApp or SMS.
      </span>
    </div>
  );
}

