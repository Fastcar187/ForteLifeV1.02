import React from "react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getDataStore } from "@/lib/data-store";
import { decrypt, maskNationalId } from "@/lib/crypto";
import { PrivacyCenterClient } from "./client";

export default async function PatientPrivacyPage() {
  const session = await getSession();
  if (!session || session.role !== "patient") {
    redirect("/auth/login");
  }

  const store = getDataStore();
  const user = store.getUserById(session.id);
  const patient = store.getPatientByUserId(session.id);
  const notifPref = store.getUserById(session.id); // prefs

  if (!user || !patient) {
    redirect("/auth/login");
  }

  const phonePlain = decrypt(user.phoneEnc);
  const nhisPlain = patient.nhisEnc ? decrypt(patient.nhisEnc) : "";
  const ghanaCardPlain = patient.ghanaCardEnc ? decrypt(patient.ghanaCardEnc) : "";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          Privacy & Data Rights Center
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Self-service compliance with the Republic of Ghana Data Protection Act, 2012 (Act 843)
        </p>
      </div>

      <PrivacyCenterClient
        patient={{
          fullName: patient.fullName,
          nhisMasked: nhisPlain ? maskNationalId(nhisPlain) : "Not registered",
          ghanaCardMasked: ghanaCardPlain ? maskNationalId(ghanaCardPlain) : "Not registered",
          consentAcceptedAt: patient.consentAcceptedAt,
          deletionRequestedAt: patient.deletionRequestedAt || null,
        }}
        phonePlain={phonePlain}
        email={user.email}
        currentChannel={"whatsapp"}
      />
    </div>
  );
}
