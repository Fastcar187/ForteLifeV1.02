"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Facility, MedicalService, AppointmentSlot } from "@/lib/types";
import { bookAppointmentAction } from "@/lib/actions";
import {
  Calendar,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Smartphone,
  MapPin,
} from "lucide-react";

interface Props {
  facilities: Facility[];
  services: MedicalService[];
  slots: AppointmentSlot[];
  initialFacilityId?: string;
}

export function BookingWizard({
  facilities,
  services,
  slots,
  initialFacilityId,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(
    initialFacilityId || (facilities[0]?.id ?? "")
  );
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [notificationChannel, setNotificationChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [bookingSuccess, setBookingSuccess] = useState<{
    referenceCode: string;
    appointmentId: string;
  } | null>(null);

  // Filter facilities by region
  const filteredFacilities = facilities.filter(
    (f) => selectedRegion === "all" || f.region.toLowerCase() === selectedRegion.toLowerCase()
  );

  // Filter services for the selected facility
  const availableServices = services.filter((s) => s.facilityId === selectedFacilityId);

  // Auto-select first service if none selected
  React.useEffect(() => {
    if (availableServices.length > 0 && !selectedServiceId) {
      setSelectedServiceId(availableServices[0].id);
    }
  }, [selectedFacilityId, availableServices, selectedServiceId]);

  // Extract unique available dates from slots for the selected facility
  const facilitySlots = slots.filter((s) => s.facilityId === selectedFacilityId);
  const uniqueDates = Array.from(
    new Set(facilitySlots.map((s) => s.startTime.split("T")[0]))
  ).sort();

  // Auto-select first date
  React.useEffect(() => {
    if (uniqueDates.length > 0 && !selectedDate) {
      setSelectedDate(uniqueDates[0]);
    }
  }, [uniqueDates, selectedDate]);

  // Slots for selected date and service
  const filteredSlots = facilitySlots.filter((s) => {
    const slotDate = s.startTime.split("T")[0];
    return (
      slotDate === selectedDate &&
      (!selectedServiceId || s.serviceId === selectedServiceId)
    );
  });

  const selectedFacility = facilities.find((f) => f.id === selectedFacilityId);
  const selectedService = services.find((s) => s.id === selectedServiceId);
  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  const handleConfirmBooking = () => {
    if (!consentAccepted) {
      setError("Please check the Ghana Data Protection Act (Act 843) consent box to proceed.");
      return;
    }
    setError(null);

    const formData = new FormData();
    formData.append("facilityId", selectedFacilityId);
    formData.append("serviceId", selectedServiceId);
    formData.append("slotId", selectedSlotId);
    formData.append("consentAccepted", "true");
    formData.append("notificationChannel", notificationChannel);

    startTransition(async () => {
      const result = await bookAppointmentAction(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.success && result.referenceCode) {
        setBookingSuccess({
          referenceCode: result.referenceCode,
          appointmentId: result.appointmentId || "",
        });
      }
    });
  };

  // If Booking is successful, show confirmation screen with Reference Code
  if (bookingSuccess) {
    const slotStartTime = selectedSlot ? new Date(selectedSlot.startTime) : new Date();
    const formattedDate = slotStartTime.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const formattedTime = slotStartTime.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <div className="max-w-xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
            Appointment Confirmed
          </span>
          <h2 className="text-2xl font-extrabold text-navy-900">
            Your Visit Is Booked!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Show this booking reference code at the hospital reception or triage desk.
          </p>
        </div>

        {/* Reference Code Card */}
        <div className="bg-slate-50 border-2 border-dashed border-teal-600 p-6 rounded-2xl space-y-2">
          <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">
            Booking Reference Code
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-navy-900 font-mono tracking-wider">
            {bookingSuccess.referenceCode}
          </div>
          <div className="text-xs text-emerald-700 font-medium">
            ✓ Sent via {notificationChannel === "whatsapp" ? "WhatsApp" : "SMS"}
          </div>
        </div>

        {/* Details Summary */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2.5">
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500">Hospital:</span>
            <span className="font-semibold text-navy-900">{selectedFacility?.name}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500">Service:</span>
            <span className="font-semibold text-navy-900">{selectedService?.name}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span className="text-slate-500">Date:</span>
            <span className="font-semibold text-navy-900">{formattedDate}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Time Slot:</span>
            <span className="font-semibold text-navy-900">{formattedTime}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => router.push("/patient/appointments")}
            className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors shadow-sm"
          >
            View My Appointments
          </button>
          <button
            onClick={() => {
              setBookingSuccess(null);
              setStep(1);
              setSelectedSlotId("");
            }}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors"
          >
            Book Another Visit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Wizard Step Progress Header */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-3 gap-2">
          <div className={`flex flex-col items-center sm:items-start p-2 rounded-lg ${step === 1 ? "bg-teal-50 border border-teal-200 text-teal-900" : "text-slate-400"}`}>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Step 1</span>
            <span className="text-xs sm:text-sm font-semibold truncate">Facility & Service</span>
          </div>
          <div className={`flex flex-col items-center sm:items-start p-2 rounded-lg ${step === 2 ? "bg-teal-50 border border-teal-200 text-teal-900" : "text-slate-400"}`}>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Step 2</span>
            <span className="text-xs sm:text-sm font-semibold truncate">Date & Time Slot</span>
          </div>
          <div className={`flex flex-col items-center sm:items-start p-2 rounded-lg ${step === 3 ? "bg-teal-50 border border-teal-200 text-teal-900" : "text-slate-400"}`}>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">Step 3</span>
            <span className="text-xs sm:text-sm font-semibold truncate">Act 843 & Confirm</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Facility & Service Selection */}
      {step === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-navy-900">1. Select Hospital & Clinic Service</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Choose your preferred facility and outpatient department
            </p>
          </div>

          {/* Region Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Filter by Ghana Region:</label>
            <div className="flex flex-wrap gap-1.5">
              {["all", "Greater Accra", "Ashanti", "Northern", "Volta"].map((reg) => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => setSelectedRegion(reg)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    selectedRegion === reg
                      ? "bg-navy-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {reg === "all" ? "All Regions" : reg}
                </button>
              ))}
            </div>
          </div>

          {/* Facility Cards */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Select Clinic / Hospital:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredFacilities.map((fac) => {
                const isSelected = selectedFacilityId === fac.id;
                return (
                  <button
                    key={fac.id}
                    type="button"
                    onClick={() => {
                      setSelectedFacilityId(fac.id);
                      setSelectedSlotId("");
                    }}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-teal-600 bg-teal-50/50 shadow-sm ring-1 ring-teal-500"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {fac.region}
                      </span>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      )}
                    </div>
                    <div className="font-bold text-sm text-navy-900 mt-2">{fac.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {fac.locationAddress}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Service Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Choose Department / Service:</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {availableServices.map((srv) => {
                const isSelected = selectedServiceId === srv.id;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => {
                      setSelectedServiceId(srv.id);
                      setSelectedSlotId("");
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-teal-600 bg-teal-600 text-white font-medium shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-xs font-bold leading-tight">{srv.name}</div>
                    <div className={`text-[11px] mt-1 ${isSelected ? "text-teal-100" : "text-slate-500"}`}>
                      {srv.durationMinutes} min consultation
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              disabled={!selectedFacilityId || !selectedServiceId}
              onClick={() => {
                setError(null);
                setStep(2);
              }}
              className="py-3 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 min-h-[48px]"
            >
              Continue to Date & Slot
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Date & Slot Selection */}
      {step === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-navy-900">2. Pick Date & Available Slot</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                {selectedFacility?.name} • {selectedService?.name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-slate-500 hover:text-navy-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          {/* Horizontal Date Strip */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Select Date:</label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {uniqueDates.map((dateStr, idx) => {
                const dateObj = new Date(`${dateStr}T00:00:00Z`);
                const isSelected = selectedDate === dateStr;
                const weekday = dateObj.toLocaleDateString("en-GB", { weekday: "short" });
                const dayNum = dateObj.getUTCDate();
                const month = dateObj.toLocaleDateString("en-GB", { month: "short" });

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setSelectedSlotId("");
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border min-w-[76px] transition-all ${
                      isSelected
                        ? "border-teal-600 bg-teal-600 text-white shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-[11px] font-bold uppercase">{weekday}</span>
                    <span className="text-xl font-extrabold my-0.5">{dayNum}</span>
                    <span className="text-[10px] font-medium">{month}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Slots Grid with Real-time Capacity Badges */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">Available Time Slots:</label>
              <span className="text-[11px] text-slate-500">
                {filteredSlots.length} slots found
              </span>
            </div>

            {filteredSlots.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-200">
                No slots available on this date for {selectedService?.name}. Please select another date.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {filteredSlots.map((slot) => {
                  const startTime = new Date(slot.startTime);
                  const timeFormatted = startTime.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const isFull = slot.bookedCount >= slot.capacity;
                  const isSelected = selectedSlotId === slot.id;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={isFull}
                      onClick={() => setSelectedSlotId(slot.id)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isFull
                          ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                          : isSelected
                          ? "border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-500 font-bold"
                          : "border-slate-200 bg-white hover:border-teal-400 hover:bg-slate-50 text-navy-900"
                      }`}
                    >
                      <div className="text-sm font-bold font-mono">{timeFormatted}</div>
                      <div className="text-[10px] mt-1">
                        {isFull ? (
                          <span className="text-rose-600 font-medium">Full</span>
                        ) : (
                          <span className="text-emerald-700 font-medium">Available</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-medium text-xs sm:text-sm hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!selectedSlotId}
              onClick={() => {
                setError(null);
                setStep(3);
              }}
              className="py-3 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 min-h-[48px]"
            >
              Proceed to Confirmation
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Consent & Notification Channel Confirmation */}
      {step === 3 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-navy-900">3. Review & Confirm Booking</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Final step: Select your notification channel and accept Act 843 terms
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs text-slate-500 hover:text-navy-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          </div>

          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="font-bold text-navy-900 text-sm mb-2">Appointment Summary:</div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Hospital:</span>
              <span className="font-semibold text-navy-900">{selectedFacility?.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Department:</span>
              <span className="font-semibold text-navy-900">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500">Date:</span>
              <span className="font-semibold text-navy-900">{selectedDate}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Slot Time:</span>
              <span className="font-semibold text-navy-900">
                {selectedSlot ? new Date(selectedSlot.startTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : ""}
              </span>
            </div>
          </div>

          {/* Notification Channel Preference */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Where would you like to receive your booking code & reminder?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setNotificationChannel("whatsapp")}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                  notificationChannel === "whatsapp"
                    ? "border-teal-600 bg-teal-50 text-teal-950 font-semibold"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div>
                  <div className="text-xs font-bold">WhatsApp (Default)</div>
                  <div className="text-[11px] text-slate-500 font-normal">Official Cloud API notice</div>
                </div>
                <div className={`w-3.5 h-3.5 rounded-full border ${notificationChannel === "whatsapp" ? "border-4 border-teal-600" : "border-slate-300"}`} />
              </button>

              <button
                type="button"
                onClick={() => setNotificationChannel("sms")}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                  notificationChannel === "sms"
                    ? "border-teal-600 bg-teal-50 text-teal-950 font-semibold"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div>
                  <div className="text-xs font-bold">Ghana SMS</div>
                  <div className="text-[11px] text-slate-500 font-normal">Standard text message</div>
                </div>
                <div className={`w-3.5 h-3.5 rounded-full border ${notificationChannel === "sms" ? "border-4 border-teal-600" : "border-slate-300"}`} />
              </button>
            </div>
          </div>

          {/* Ghana Data Protection Act 843 Consent Checkbox */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consentAccepted}
                onChange={(e) => setConsentAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-teal-600 border-slate-300 focus:ring-teal-500"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                <strong>Ghana Data Protection Act, 2012 (Act 843) Consent:</strong> I agree to the processing of my appointment details solely for scheduling and queue notifications by the clinic. No medical diagnosis or financial requests will ever be sent via chat.
              </span>
            </label>
          </div>

          {/* Scam Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Scam Warning:</strong> The clinic will never ask for Mobile Money or health notes via chat.
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-medium text-xs sm:text-sm hover:bg-slate-50"
            >
              Back
            </button>

            <button
              type="button"
              disabled={isPending || !consentAccepted}
              onClick={handleConfirmBooking}
              className="py-3 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm transition-colors shadow-sm disabled:opacity-50 min-h-[48px]"
            >
              {isPending ? "Confirming Slot..." : "Confirm & Book Slot"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

