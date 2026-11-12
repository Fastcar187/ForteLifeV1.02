"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession, setSession, destroySession } from "./session";
import { getDataStore } from "./data-store";
import {
  loginSchema,
  registerPatientSchema,
  registerUserSchema,
  adminCreateUserSchema,
  bookingWizardSchema,
  walkInBookingSchema,
  generateSlotsSchema,
  updateProfileSchema,
  requestDataDeletionSchema,
  verifyMfaSchema,
  verifyBackupCodeSchema,
} from "./validation";
import { hashPassword, verifyPassword, generateBase32Secret, generateBackupCodes } from "./auth";
import { isMfaRequired } from "./rbac";
import { SessionUser, UserRole, AppointmentStatus } from "./types";

const store = getDataStore();

// --- Authentication Actions ---

export async function loginAction(formData: FormData) {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Invalid input" };
  }

  const user = store.getUserByEmail(parsed.data.email);
  if (!user || !user.passwordHash) {
    return { error: "Invalid email or password" };
  }

  // Check lockout
  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    return { error: "Account temporarily locked due to multiple failed logins. Please try again later." };
  }

  const isValid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!isValid) {
    user.failedLoginCount += 1;
    if (user.failedLoginCount >= 5) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 15);
      user.lockedUntil = lockUntil.toISOString();
    }
    return { error: "Invalid email or password" };
  }

  // Reset failed login counter on success
  user.failedLoginCount = 0;
  user.lockedUntil = null;

  const patient = store.getPatientByUserId(user.id);
  const staff = store.getStaffByUserId(user.id);
  const resolvedFullName = user.fullName || patient?.fullName || staff?.fullName || user.email.split("@")[0];

  // Check MFA Requirement for Staff/Admins
  if (isMfaRequired(user.role)) {
    const mfa = store.getMfaSecret(user.id);
    if (!mfa || !mfa.isEnrolled) {
      // Must enroll in MFA first
      const sessionUser: SessionUser = {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: resolvedFullName,
        isMfaEnrolled: false,
      };
      await setSession(sessionUser);
      redirect("/auth/enroll-mfa");
    } else {
      // Redirect to MFA verification challenge
      const sessionUser: SessionUser = {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: resolvedFullName,
        isMfaEnrolled: false, // Temporary until 6-digit code verified
      };
      await setSession(sessionUser);
      redirect("/auth/verify-mfa");
    }
  }

  // Patient or Front Desk (direct login)
  let staffFacilityId: string | null = null;
  let staffFacilityName: string | null = null;

  if (staff) {
    staffFacilityId = staff.facilityId;
    staffFacilityName = store.getFacilityById(staff.facilityId)?.name || null;
  }

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    facilityId: staffFacilityId,
    facilityName: staffFacilityName,
    fullName: resolvedFullName,
    isMfaEnrolled: true,
  };

  await setSession(sessionUser);
  store.recordAudit("USER_LOGIN", "users", user.id, sessionUser, { method: "password" });

  if (user.role === "patient") redirect("/patient/dashboard");
  if (user.role === "frontdesk") redirect("/frontdesk/dashboard");
  redirect("/");
}

export async function verifyMfaAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const code = formData.get("code") as string;
  const parsed = verifyMfaSchema.safeParse({ code });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Invalid code" };
  }

  const existingMfa = store.getMfaSecret(session.id);
  const result =
    existingMfa && !existingMfa.isEnrolled
      ? store.verifyAndEnrollMfa(session.id, parsed.data.code)
      : store.verifyMfaLogin(session.id, parsed.data.code);

  if (!result.success) {
    return { error: result.message || "Invalid 6-digit code" };
  }

  // Elevate session with completed MFA
  const user = store.getUserById(session.id);
  const staff = store.getStaffByUserId(session.id);
  const facility = staff ? store.getFacilityById(staff.facilityId) : null;

  const elevatedSession: SessionUser = {
    ...session,
    fullName: session.fullName || user?.fullName || staff?.fullName || session.email.split("@")[0],
    facilityId: staff?.facilityId || null,
    facilityName: facility?.name || null,
    isMfaEnrolled: true,
  };

  await setSession(elevatedSession);
  store.recordAudit("MFA_CHALLENGE_VERIFIED", "users", session.id, elevatedSession, { method: "totp" });

  if (session.role === "doctor") redirect("/doctor/dashboard");
  if (session.role === "facility_admin") redirect("/admin/facility");
  if (session.role === "platform_admin") redirect("/admin/platform");
  redirect("/");
}

export async function verifyBackupCodeAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const raw = formData.get("backupCode") as string;
  const parsed = verifyBackupCodeSchema.safeParse({ backupCode: raw });
  if (!parsed.success) {
    return { error: "Invalid backup code format" };
  }

  const result = store.verifyBackupCodeLogin(session.id, parsed.data.backupCode);
  if (!result.success) {
    return { error: result.message || "Invalid backup code" };
  }

  const user = store.getUserById(session.id);
  const staff = store.getStaffByUserId(session.id);
  const facility = staff ? store.getFacilityById(staff.facilityId) : null;

  const elevatedSession: SessionUser = {
    ...session,
    fullName: session.fullName || user?.fullName || staff?.fullName || session.email.split("@")[0],
    facilityId: staff?.facilityId || null,
    facilityName: facility?.name || null,
    isMfaEnrolled: true,
  };

  await setSession(elevatedSession);
  store.recordAudit("MFA_BACKUP_CODE_LOGIN", "users", session.id, elevatedSession);

  if (session.role === "doctor") redirect("/doctor/dashboard");
  if (session.role === "facility_admin") redirect("/admin/facility");
  if (session.role === "platform_admin") redirect("/admin/platform");
  redirect("/");
}

export async function registerUserAction(formData: FormData) {
  const roleVal = (formData.get("role") as UserRole) || "patient";
  const raw = {
    role: roleVal,
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    facilityId: formData.get("facilityId") || "",
    titleOrSpecialty: formData.get("titleOrSpecialty") || "",
    nhis: formData.get("nhis") || "",
    ghanaCard: formData.get("ghanaCard") || "",
    consentAccepted: formData.get("consentAccepted") === "true" || formData.get("consentAccepted") === "on",
    notificationChannel: formData.get("notificationChannel") || "whatsapp",
  };

  const parsed = registerUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Invalid registration information" };
  }

  if (["frontdesk", "doctor", "facility_admin"].includes(parsed.data.role) && !parsed.data.facilityId) {
    return { error: "Please select an assigned hospital facility for clinical/facility staff" };
  }

  // Check if email already registered
  const existing = store.getUserByEmail(parsed.data.email);
  if (existing) {
    return { error: "An account with this email address already exists" };
  }

  const hashedPassword = await hashPassword(parsed.data.password);
  const { user, facilityId, facilityName, fullName } = store.registerUser({
    role: parsed.data.role,
    fullName: parsed.data.fullName,
    email: parsed.data.email,
    phone: parsed.data.phone,
    passwordHash: hashedPassword,
    facilityId: parsed.data.facilityId || undefined,
    titleOrSpecialty: parsed.data.titleOrSpecialty || undefined,
    nhis: parsed.data.nhis,
    ghanaCard: parsed.data.ghanaCard,
    notificationChannel: parsed.data.notificationChannel,
  });

  if (isMfaRequired(user.role)) {
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      facilityId,
      facilityName,
      fullName,
      isMfaEnrolled: false,
    };
    await setSession(sessionUser);
    redirect("/auth/enroll-mfa");
  }

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    facilityId,
    facilityName,
    fullName,
    isMfaEnrolled: true,
  };

  await setSession(sessionUser);
  if (user.role === "patient") redirect("/patient/dashboard");
  if (user.role === "frontdesk") redirect("/frontdesk/dashboard");
  redirect("/");
}

export async function registerPatientAction(formData: FormData) {
  if (!formData.get("role")) {
    formData.set("role", "patient");
  }
  return registerUserAction(formData);
}

export async function adminCreateUserAction(formData: FormData) {
  const session = await getSession();
  if (!session || !["facility_admin", "platform_admin"].includes(session.role)) {
    return { error: "Unauthorized: Only administrators can provision accounts" };
  }

  const roleVal = (formData.get("role") as UserRole) || "frontdesk";
  if (session.role === "facility_admin" && roleVal === "platform_admin") {
    return { error: "Facility Administrators cannot create Platform Administrator accounts" };
  }

  const targetFacilityId =
    session.role === "facility_admin"
      ? session.facilityId || (formData.get("facilityId") as string)
      : (formData.get("facilityId") as string) || "";

  const raw = {
    role: roleVal,
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    facilityId: targetFacilityId,
    titleOrSpecialty: formData.get("titleOrSpecialty") || "",
    nhis: formData.get("nhis") || "",
    ghanaCard: formData.get("ghanaCard") || "",
  };

  const parsed = adminCreateUserSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Invalid account details" };
  }

  if (["frontdesk", "doctor", "facility_admin"].includes(parsed.data.role) && !parsed.data.facilityId) {
    return { error: "Please select a hospital facility for this staff member" };
  }

  const existing = store.getUserByEmail(parsed.data.email);
  if (existing) {
    return { error: "An account with this email address already exists" };
  }

  const hashedPassword = await hashPassword(parsed.data.password);
  const { user, fullName } = store.registerUser(
    {
      role: parsed.data.role,
      fullName: parsed.data.fullName,
      email: parsed.data.email,
      phone: parsed.data.phone,
      passwordHash: hashedPassword,
      facilityId: parsed.data.facilityId || undefined,
      titleOrSpecialty: parsed.data.titleOrSpecialty || undefined,
      nhis: parsed.data.nhis,
      ghanaCard: parsed.data.ghanaCard,
      notificationChannel: "whatsapp",
    },
    session
  );

  revalidatePath("/admin/facility");
  revalidatePath("/admin/platform");

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      fullName,
      role: user.role,
    },
  };
}

export async function logoutAction() {
  await destroySession();
  redirect("/auth/login");
}

// --- Patient Booking Wizard Actions ---

export async function bookAppointmentAction(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/auth/login");

  const raw = {
    facilityId: formData.get("facilityId"),
    serviceId: formData.get("serviceId"),
    slotId: formData.get("slotId"),
    consentAccepted: formData.get("consentAccepted") === "true" || formData.get("consentAccepted") === "on",
    notificationChannel: formData.get("notificationChannel") || "whatsapp",
  };

  const parsed = bookingWizardSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Invalid booking data" };
  }

  try {
    const { appointment, referenceCode } = store.createAppointment(
      {
        facilityId: parsed.data.facilityId,
        serviceId: parsed.data.serviceId,
        slotId: parsed.data.slotId,
        patientId: session.id,
        notificationChannel: parsed.data.notificationChannel,
      },
      session
    );

    revalidatePath("/patient/appointments");
    revalidatePath("/patient/dashboard");
    return { success: true, referenceCode, appointmentId: appointment.id };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to book appointment" };
  }
}

// --- Front Desk Walk-In Booking Action ---
export async function bookWalkInAction(formData: FormData) {
  const session = await getSession();
  if (!session || !["frontdesk", "facility_admin", "platform_admin"].includes(session.role)) {
    return { error: "Unauthorized" };
  }

  const raw = {
    facilityId: formData.get("facilityId") || session.facilityId,
    serviceId: formData.get("serviceId"),
    slotId: formData.get("slotId"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    nhis: formData.get("nhis") || "",
    notificationChannel: formData.get("notificationChannel") || "none",
  };

  const parsed = walkInBookingSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Invalid walk-in information" };
  }

  try {
    // Register temporary walk-in patient record
    const dummyPasswordHash = await hashPassword("WalkInAutoPatientPass1!");
    const { user } = store.registerPatient({
      fullName: parsed.data.fullName,
      email: `walkin.${Date.now()}@clinic.local`,
      phone: parsed.data.phone,
      passwordHash: dummyPasswordHash,
      nhis: parsed.data.nhis,
      notificationChannel: parsed.data.notificationChannel === "none" ? "sms" : parsed.data.notificationChannel,
    });

    const { referenceCode, appointment } = store.createAppointment(
      {
        facilityId: parsed.data.facilityId,
        serviceId: parsed.data.serviceId,
        slotId: parsed.data.slotId,
        patientId: user.id,
        notificationChannel: parsed.data.notificationChannel === "none" ? "sms" : parsed.data.notificationChannel,
      },
      session
    );

    // Automatically mark walk-in as checked-in
    store.updateAppointmentStatus(appointment.id, "checked_in", session);

    revalidatePath("/frontdesk/dashboard");
    return { success: true, referenceCode };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to register walk-in" };
  }
}

// --- Appointment Status Actions (Check-in, No-show, Complete, Cancel) ---

export async function updateAppointmentStatusAction(
  appointmentId: string,
  newStatus: AppointmentStatus
) {
  const session = await getSession();
  if (!session) return { error: "Authentication required" };

  try {
    store.updateAppointmentStatus(appointmentId, newStatus, session);
    revalidatePath("/patient/appointments");
    revalidatePath("/frontdesk/dashboard");
    revalidatePath("/doctor/dashboard");
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to update status" };
  }
}

// --- Facility Management Actions (Slot Generation, Services) ---

export async function generateSlotsAction(formData: FormData) {
  const session = await getSession();
  if (!session || !["facility_admin", "platform_admin"].includes(session.role)) {
    return { error: "Unauthorized" };
  }

  const raw = {
    facilityId: formData.get("facilityId") || session.facilityId,
    serviceId: formData.get("serviceId"),
    doctorId: formData.get("doctorId") || null,
    date: formData.get("date"),
    startHour: parseInt(formData.get("startHour") as string, 10),
    endHour: parseInt(formData.get("endHour") as string, 10),
    slotDurationMinutes: parseInt(formData.get("slotDurationMinutes") as string, 10) || 20,
    capacityPerSlot: parseInt(formData.get("capacityPerSlot") as string, 10) || 1,
  };

  const parsed = generateSlotsSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Invalid slot configuration" };
  }

  try {
    const slots = store.generateSlots(parsed.data, session);
    revalidatePath("/admin/facility");
    return { success: true, count: slots.length };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to generate slots" };
  }
}

export async function resetStaffMfaAction(targetUserId: string) {
  const session = await getSession();
  if (!session || !["facility_admin", "platform_admin"].includes(session.role)) {
    return { error: "Unauthorized" };
  }

  try {
    store.resetStaffMfa(targetUserId, session);
    revalidatePath("/admin/facility");
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to reset MFA" };
  }
}

// --- Ghana Act 843 Privacy Center Actions ---

export async function updatePatientProfileAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "patient") {
    return { error: "Unauthorized" };
  }

  const raw = {
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    nhis: formData.get("nhis") || "",
    ghanaCard: formData.get("ghanaCard") || "",
    notificationChannel: formData.get("notificationChannel") || "whatsapp",
  };

  const parsed = updateProfileSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Invalid profile data" };
  }

  try {
    store.updatePatientProfile(session.id, parsed.data, session);
    revalidatePath("/patient/privacy");
    revalidatePath("/patient/dashboard");
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to update profile" };
  }
}

export async function requestDataDeletionAction(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "patient") {
    return { error: "Unauthorized" };
  }

  const raw = {
    confirmationText: formData.get("confirmationText"),
    reason: formData.get("reason") || "",
  };

  const parsed = requestDataDeletionSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || "Confirmation text does not match" };
  }

  try {
    store.requestDataDeletion(session.id, parsed.data.reason, session);
    revalidatePath("/patient/privacy");
    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to submit request" };
  }
}

