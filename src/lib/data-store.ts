import {
  Facility,
  User,
  Patient,
  Staff,
  MedicalService,
  AppointmentSlot,
  Appointment,
  MfaSecret,
  BackupCode,
  NotificationPrefs,
  MessageLog,
  AuditLog,
  SessionUser,
  AppointmentStatus,
  UserRole,
} from "./types";
import { encrypt, decrypt, blindIndex, maskPhone } from "./crypto";
import { verifyTotpCode, verifyBackupCode as verifyBackupCodeMatch, hashBackupCode } from "./auth";
import { dispatchAppointmentNotification } from "./messaging";

// Realistic Ghanaian Seed Data
const INITIAL_FACILITIES: Facility[] = [
  {
    id: "fac-korle-bu",
    name: "Korle Bu Teaching Hospital",
    region: "Greater Accra",
    locationAddress: "Guggisberg Ave, Korle Gonno, Accra",
    isActive: true,
    createdAt: new Date("2024-01-01").toISOString(),
  },
  {
    id: "fac-ridge",
    name: "Greater Accra Regional Hospital (Ridge)",
    region: "Greater Accra",
    locationAddress: "Castle Road, Ridge, Accra",
    isActive: true,
    createdAt: new Date("2024-01-01").toISOString(),
  },
  {
    id: "fac-kath",
    name: "Komfo Anokye Teaching Hospital (KATH)",
    region: "Ashanti",
    locationAddress: "Bantama Road, Kumasi",
    isActive: true,
    createdAt: new Date("2024-01-01").toISOString(),
  },
  {
    id: "fac-tamale",
    name: "Tamale Teaching Hospital",
    region: "Northern",
    locationAddress: "Hospital Road, Tamale",
    isActive: true,
    createdAt: new Date("2024-01-01").toISOString(),
  },
  {
    id: "fac-ho",
    name: "Ho Teaching Hospital",
    region: "Volta",
    locationAddress: "Trafalgar, Ho",
    isActive: true,
    createdAt: new Date("2024-01-01").toISOString(),
  },
];

const INITIAL_SERVICES: MedicalService[] = [
  // Korle Bu Services
  { id: "srv-kb-opd", facilityId: "fac-korle-bu", name: "General Outpatient (OPD)", durationMinutes: 20, isActive: true },
  { id: "srv-kb-mat", facilityId: "fac-korle-bu", name: "Antenatal & Maternal Health", durationMinutes: 30, isActive: true },
  { id: "srv-kb-ped", facilityId: "fac-korle-bu", name: "Pediatrics & Child Wellness", durationMinutes: 20, isActive: true },
  { id: "srv-kb-eye", facilityId: "fac-korle-bu", name: "Eye & Optometry Clinic", durationMinutes: 25, isActive: true },
  { id: "srv-kb-den", facilityId: "fac-korle-bu", name: "Dental Surgery & Care", durationMinutes: 30, isActive: true },

  // Ridge Hospital Services
  { id: "srv-rd-opd", facilityId: "fac-ridge", name: "General OPD Consultation", durationMinutes: 20, isActive: true },
  { id: "srv-rd-mat", facilityId: "fac-ridge", name: "Maternity & Family Planning", durationMinutes: 30, isActive: true },
  { id: "srv-rd-cardio", facilityId: "fac-ridge", name: "Cardiology & Hypertension Clinic", durationMinutes: 30, isActive: true },

  // KATH Kumasi Services
  { id: "srv-kt-opd", facilityId: "fac-kath", name: "General Medicine OPD", durationMinutes: 20, isActive: true },
  { id: "srv-kt-ped", facilityId: "fac-kath", name: "Pediatric Clinic", durationMinutes: 20, isActive: true },

  // Tamale Teaching Hospital
  { id: "srv-tm-opd", facilityId: "fac-tamale", name: "General OPD", durationMinutes: 20, isActive: true },
  { id: "srv-tm-mat", facilityId: "fac-tamale", name: "Maternal Health & Child Care", durationMinutes: 30, isActive: true },

  // Ho Teaching Hospital
  { id: "srv-ho-opd", facilityId: "fac-ho", name: "General Outpatient Consultation", durationMinutes: 20, isActive: true },
];

// Pre-seeded Users across all 5 roles
// Default Password for all pre-seeded accounts: Password123!
const VALID_DEMO_PASSWORD_HASH = "$2a$10$gyUwQkaPFZS2l6qdaTmj.Oz0N/rkY6L/TTVY/xH3lqWA/K1U3OcZu";

const INITIAL_USERS: User[] = [
  {
    id: "usr-patient-1",
    role: "patient",
    email: "kwame.mensah@example.com",
    passwordHash: VALID_DEMO_PASSWORD_HASH,
    phoneEnc: encrypt("+233244123456"),
    phoneHash: blindIndex("+233244123456"),
    failedLoginCount: 0,
    createdAt: new Date("2024-01-05").toISOString(),
  },
  {
    id: "usr-frontdesk-1",
    role: "frontdesk",
    email: "frontdesk.ridge@ghanahealth.gov.gh",
    passwordHash: VALID_DEMO_PASSWORD_HASH,
    phoneEnc: encrypt("+233201234567"),
    phoneHash: blindIndex("+233201234567"),
    failedLoginCount: 0,
    createdAt: new Date("2024-01-02").toISOString(),
  },
  {
    id: "usr-doctor-1",
    role: "doctor",
    email: "dr.boateng@ghanahealth.gov.gh",
    passwordHash: VALID_DEMO_PASSWORD_HASH,
    phoneEnc: encrypt("+233277890123"),
    phoneHash: blindIndex("+233277890123"),
    failedLoginCount: 0,
    createdAt: new Date("2024-01-02").toISOString(),
  },
  {
    id: "usr-facadmin-1",
    role: "facility_admin",
    email: "admin.ridge@ghanahealth.gov.gh",
    passwordHash: VALID_DEMO_PASSWORD_HASH,
    phoneEnc: encrypt("+233245678901"),
    phoneHash: blindIndex("+233245678901"),
    failedLoginCount: 0,
    createdAt: new Date("2024-01-01").toISOString(),
  },
  {
    id: "usr-platformadmin-1",
    role: "platform_admin",
    email: "director@ghanahealth.gov.gh",
    passwordHash: VALID_DEMO_PASSWORD_HASH,
    phoneEnc: encrypt("+233501239876"),
    phoneHash: blindIndex("+233501239876"),
    failedLoginCount: 0,
    createdAt: new Date("2024-01-01").toISOString(),
  },
];

const INITIAL_PATIENTS: Patient[] = [
  {
    userId: "usr-patient-1",
    fullName: "Kwame Mensah",
    nhisEnc: encrypt("84920193"),
    ghanaCardEnc: encrypt("GHA-726491029-4"),
    consentAcceptedAt: new Date("2024-01-05").toISOString(),
    createdAt: new Date("2024-01-05").toISOString(),
  },
];

const INITIAL_STAFF: Staff[] = [
  {
    userId: "usr-frontdesk-1",
    facilityId: "fac-ridge",
    role: "frontdesk",
    titleOrSpecialty: "Senior Admissions & Triage Officer",
    isActive: true,
  },
  {
    userId: "usr-doctor-1",
    facilityId: "fac-ridge",
    role: "doctor",
    titleOrSpecialty: "Consultant Physician (General OPD)",
    isActive: true,
  },
  {
    userId: "usr-facadmin-1",
    facilityId: "fac-ridge",
    role: "facility_admin",
    titleOrSpecialty: "Medical Superintendent & Operations Director",
    isActive: true,
  },
];

// Helper to generate today/tomorrow dates in UTC format
function getFutureDate(daysAhead: number, hours: number, minutes = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

// Generate realistic slots for Ridge Hospital & Korle Bu for Today and Next 3 Days
function generateInitialSlots(): AppointmentSlot[] {
  const slots: AppointmentSlot[] = [];
  const facilityIds = ["fac-ridge", "fac-korle-bu"];

  facilityIds.forEach((facId) => {
    const serviceId = facId === "fac-ridge" ? "srv-rd-opd" : "srv-kb-opd";
    const doctorId = facId === "fac-ridge" ? "usr-doctor-1" : null;

    // Days 0 (Today), 1 (Tomorrow), 2, 3
    for (let day = 0; day <= 4; day++) {
      const times = [
        { h: 8, m: 0 },
        { h: 8, m: 30 },
        { h: 9, m: 0 },
        { h: 9, m: 30 },
        { h: 10, m: 0 },
        { h: 10, m: 30 },
        { h: 11, m: 0 },
        { h: 11, m: 30 },
        { h: 14, m: 0 },
        { h: 14, m: 30 },
        { h: 15, m: 0 },
      ];

      times.forEach((t, index) => {
        const start = getFutureDate(day, t.h, t.m);
        const end = getFutureDate(day, t.h, t.m + 20);
        slots.push({
          id: `slot-${facId}-${day}-${index}`,
          facilityId: facId,
          doctorId,
          serviceId,
          startTime: start,
          endTime: end,
          capacity: 1,
          bookedCount: day === 0 && index === 0 ? 1 : 0, // Book first slot for demo
        });
      });
    }
  });

  return slots;
}

const INITIAL_SLOTS = generateInitialSlots();

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "app-ridge-001",
    referenceCode: "GH-84920",
    patientId: "usr-patient-1",
    facilityId: "fac-ridge",
    slotId: INITIAL_SLOTS[0].id,
    serviceId: "srv-rd-opd",
    status: "booked",
    bookedByRole: "patient",
    reminderSentAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_NOTIF_PREFS: NotificationPrefs[] = [
  {
    userId: "usr-patient-1",
    channel: "whatsapp",
    optedInAt: new Date().toISOString(),
    dailyMsgCount: 1,
    lastMsgDate: new Date().toISOString().split("T")[0],
  },
];

const INITIAL_MFA_SECRETS: MfaSecret[] = [
  {
    userId: "usr-doctor-1",
    secretEnc: encrypt("JBSWY3DPEHPK3PXP"), // standard test base32
    isEnrolled: true,
    lastUsedTimestep: null,
    failedAttempts: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    userId: "usr-facadmin-1",
    secretEnc: encrypt("JBSWY3DPEHPK3PXP"),
    isEnrolled: true,
    lastUsedTimestep: null,
    failedAttempts: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    userId: "usr-platformadmin-1",
    secretEnc: encrypt("JBSWY3DPEHPK3PXP"),
    isEnrolled: true,
    lastUsedTimestep: null,
    failedAttempts: 0,
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_BACKUP_CODES: BackupCode[] = [
  {
    id: "bc-1",
    userId: "usr-doctor-1",
    codeHash: hashBackupCode("GH72-BACKUP1"),
    usedAt: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "bc-2",
    userId: "usr-doctor-1",
    codeHash: hashBackupCode("GH84-BACKUP2"),
    usedAt: null,
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 1,
    actorId: "usr-platformadmin-1",
    actorRole: "platform_admin",
    action: "SYSTEM_INITIALIZED",
    recordType: "system",
    recordId: null,
    ip: "127.0.0.1",
    metadata: { note: "Hospital appointment system seeded with Ghana Health Service facilities" },
    createdAt: new Date("2024-01-01").toISOString(),
  },
  {
    id: 2,
    actorId: "usr-patient-1",
    actorRole: "patient",
    action: "APPOINTMENT_BOOKED",
    recordType: "appointments",
    recordId: "app-ridge-001",
    ip: "127.0.0.1",
    metadata: { referenceCode: "GH-84920", facility: "Greater Accra Regional Hospital (Ridge)" },
    createdAt: new Date().toISOString(),
  },
];

/**
 * In-Memory & Resilient Local Repository
 * Implements full RLS logic, transaction locking simulation, and Act 843 compliance
 */
class DataStore {
  private facilities: Facility[] = [...INITIAL_FACILITIES];
  private users: User[] = [...INITIAL_USERS];
  private patients: Patient[] = [...INITIAL_PATIENTS];
  private staff: Staff[] = [...INITIAL_STAFF];
  private services: MedicalService[] = [...INITIAL_SERVICES];
  private slots: AppointmentSlot[] = [...INITIAL_SLOTS];
  private appointments: Appointment[] = [...INITIAL_APPOINTMENTS];
  private mfaSecrets: MfaSecret[] = [...INITIAL_MFA_SECRETS];
  private backupCodes: BackupCode[] = [...INITIAL_BACKUP_CODES];
  private notificationPrefs: NotificationPrefs[] = [...INITIAL_NOTIF_PREFS];
  private messageLogs: MessageLog[] = [];
  private auditLogs: AuditLog[] = [...INITIAL_AUDIT_LOGS];
  private auditCounter = 3;

  // --- Facilities ---
  getFacilities(region?: string): Facility[] {
    if (!region || region === "all") return this.facilities.filter((f) => f.isActive);
    return this.facilities.filter((f) => f.isActive && f.region.toLowerCase() === region.toLowerCase());
  }

  getFacilityById(id: string): Facility | undefined {
    return this.facilities.find((f) => f.id === id);
  }

  createFacility(data: Omit<Facility, "id" | "createdAt">, actor: SessionUser): Facility {
    const newFacility: Facility = {
      id: `fac-${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString(),
    };
    this.facilities.push(newFacility);
    this.recordAudit("FACILITY_CREATED", "facilities", newFacility.id, actor, { name: data.name, region: data.region });
    return newFacility;
  }

  // --- Services ---
  getServices(facilityId: string): MedicalService[] {
    return this.services.filter((s) => s.facilityId === facilityId && s.isActive);
  }

  getServiceById(id: string): MedicalService | undefined {
    return this.services.find((s) => s.id === id);
  }

  createService(data: Omit<MedicalService, "id">, actor: SessionUser): MedicalService {
    const srv: MedicalService = {
      id: `srv-${Date.now()}`,
      ...data,
    };
    this.services.push(srv);
    this.recordAudit("SERVICE_CREATED", "services", srv.id, actor, { name: data.name, facilityId: data.facilityId });
    return srv;
  }

  // --- Slots & Capacity (with Double-Booking Lock Prevention) ---
  getSlots(facilityId: string, dateStr?: string, serviceId?: string): AppointmentSlot[] {
    return this.slots.filter((s) => {
      if (s.facilityId !== facilityId) return false;
      if (serviceId && s.serviceId !== serviceId) return false;
      if (dateStr) {
        const slotDate = s.startTime.split("T")[0];
        if (slotDate !== dateStr) return false;
      }
      return true;
    });
  }

  getSlotById(id: string): AppointmentSlot | undefined {
    return this.slots.find((s) => s.id === id);
  }

  generateSlots(
    params: {
      facilityId: string;
      serviceId: string;
      doctorId?: string | null;
      date: string; // YYYY-MM-DD
      startHour: number;
      endHour: number;
      slotDurationMinutes: number;
      capacityPerSlot: number;
    },
    actor: SessionUser
  ): AppointmentSlot[] {
    const created: AppointmentSlot[] = [];
    let currentMin = params.startHour * 60;
    const endMin = params.endHour * 60;

    while (currentMin + params.slotDurationMinutes <= endMin) {
      const h = Math.floor(currentMin / 60);
      const m = currentMin % 60;

      const startDate = new Date(`${params.date}T00:00:00Z`);
      startDate.setUTCHours(h, m, 0, 0);

      const endDate = new Date(`${params.date}T00:00:00Z`);
      endDate.setUTCHours(h, m + params.slotDurationMinutes, 0, 0);

      const slot: AppointmentSlot = {
        id: `slot-${params.facilityId}-${params.date}-${h}-${m}`,
        facilityId: params.facilityId,
        serviceId: params.serviceId,
        doctorId: params.doctorId || null,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        capacity: params.capacityPerSlot,
        bookedCount: 0,
      };

      this.slots.push(slot);
      created.push(slot);
      currentMin += params.slotDurationMinutes;
    }

    this.recordAudit("SLOTS_GENERATED", "slots", null, actor, {
      facilityId: params.facilityId,
      date: params.date,
      count: created.length,
    });

    return created;
  }

  // --- Users & Patients ---
  getUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  getPatientByUserId(userId: string): Patient | undefined {
    return this.patients.find((p) => p.userId === userId);
  }

  getStaffByUserId(userId: string): Staff | undefined {
    return this.staff.find((s) => s.userId === userId);
  }

  getStaffForFacility(facilityId: string): (Staff & { user: User })[] {
    return this.staff
      .filter((s) => s.facilityId === facilityId && s.isActive)
      .map((s) => ({
        ...s,
        user: this.users.find((u) => u.id === s.userId)!,
      }))
      .filter((s) => !!s.user);
  }

  registerPatient(data: {
    fullName: string;
    email: string;
    phone: string;
    passwordHash: string;
    nhis?: string;
    ghanaCard?: string;
    notificationChannel: "whatsapp" | "sms";
  }): { user: User; patient: Patient } {
    const userId = `usr-pat-${Date.now()}`;
    const user: User = {
      id: userId,
      role: "patient",
      email: data.email,
      passwordHash: data.passwordHash,
      phoneEnc: encrypt(data.phone),
      phoneHash: blindIndex(data.phone),
      failedLoginCount: 0,
      createdAt: new Date().toISOString(),
    };

    const patient: Patient = {
      userId,
      fullName: data.fullName,
      nhisEnc: data.nhis ? encrypt(data.nhis) : null,
      ghanaCardEnc: data.ghanaCard ? encrypt(data.ghanaCard) : null,
      consentAcceptedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const notifPref: NotificationPrefs = {
      userId,
      channel: data.notificationChannel,
      optedInAt: new Date().toISOString(),
      dailyMsgCount: 0,
    };

    this.users.push(user);
    this.patients.push(patient);
    this.notificationPrefs.push(notifPref);

    this.recordAudit("PATIENT_REGISTERED", "patients", userId, { id: userId, email: data.email, role: "patient" }, {
      channel: data.notificationChannel,
    });

    return { user, patient };
  }

  findOrCreateGoogleUser(data: { email: string; fullName: string }): { user: User; fullName: string } {
    const existing = this.users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (existing) {
      const patient = this.patients.find((p) => p.userId === existing.id);
      return { user: existing, fullName: patient?.fullName || data.fullName };
    }

    const { user, patient } = this.registerPatient({
      fullName: data.fullName || data.email.split("@")[0],
      email: data.email,
      phone: "+233000000000",
      passwordHash: "",
      notificationChannel: "whatsapp",
    });

    return { user, fullName: patient.fullName };
  }

  updatePatientProfile(
    userId: string,
    data: {
      fullName?: string;
      phone?: string;
      nhis?: string;
      ghanaCard?: string;
      notificationChannel?: "whatsapp" | "sms" | "none";
    },
    actor: SessionUser
  ): boolean {
    const patient = this.patients.find((p) => p.userId === userId);
    const user = this.users.find((u) => u.id === userId);
    if (!patient || !user) return false;

    if (data.fullName) patient.fullName = data.fullName;
    if (data.nhis !== undefined) patient.nhisEnc = data.nhis ? encrypt(data.nhis) : null;
    if (data.ghanaCard !== undefined) patient.ghanaCardEnc = data.ghanaCard ? encrypt(data.ghanaCard) : null;

    if (data.phone) {
      user.phoneEnc = encrypt(data.phone);
      user.phoneHash = blindIndex(data.phone);
    }

    if (data.notificationChannel) {
      let pref = this.notificationPrefs.find((np) => np.userId === userId);
      if (!pref) {
        pref = { userId, channel: data.notificationChannel, dailyMsgCount: 0 };
        this.notificationPrefs.push(pref);
      } else {
        pref.channel = data.notificationChannel;
      }
    }

    this.recordAudit("PATIENT_PROFILE_UPDATED", "patients", userId, actor, { updatedFields: Object.keys(data) });
    return true;
  }

  requestDataDeletion(userId: string, reason: string | undefined, actor: SessionUser): boolean {
    const patient = this.patients.find((p) => p.userId === userId);
    if (!patient) return false;

    patient.deletionRequestedAt = new Date().toISOString();
    this.recordAudit("PATIENT_DELETION_REQUESTED", "patients", userId, actor, {
      act843Compliance: true,
      reason: reason || "User initiated self-service deletion request",
    });
    return true;
  }

  // --- Appointments & Double-Booking Prevention ---
  createAppointment(
    data: {
      facilityId: string;
      serviceId: string;
      slotId: string;
      patientId: string;
      notificationChannel?: "whatsapp" | "sms";
    },
    actor: SessionUser
  ): { appointment: Appointment; referenceCode: string } {
    // 1. Double-booking check: lock slot and verify capacity
    const slot = this.slots.find((s) => s.id === data.slotId);
    if (!slot) {
      throw new Error("Selected appointment slot not found");
    }
    if (slot.bookedCount >= slot.capacity) {
      throw new Error("Slot already booked to full capacity. Please select another slot.");
    }

    // 2. Increment bookedCount inside simulated atomic lock
    slot.bookedCount += 1;

    // 3. Generate Ghanaian Reference Code (e.g. GH-84920)
    const refNumber = Math.floor(10000 + Math.random() * 90000);
    const referenceCode = `GH-${refNumber}`;
    const appointmentId = `app-${Date.now()}`;

    const newAppointment: Appointment = {
      id: appointmentId,
      referenceCode,
      patientId: data.patientId,
      facilityId: data.facilityId,
      slotId: data.slotId,
      serviceId: data.serviceId,
      status: "booked",
      bookedByRole: actor.role,
      reminderSentAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.appointments.push(newAppointment);

    // 4. Update notification preferences if requested
    if (data.notificationChannel) {
      const pref = this.notificationPrefs.find((np) => np.userId === data.patientId);
      if (pref) {
        pref.channel = data.notificationChannel;
      }
    }

    // 5. Trigger Privacy-First Notification Dispatch (WhatsApp default + Ghana SMS fallback)
    const patientUser = this.users.find((u) => u.id === data.patientId);
    const facility = this.facilities.find((f) => f.id === data.facilityId);
    const pref = this.notificationPrefs.find((np) => np.userId === data.patientId);

    if (patientUser) {
      const phonePlain = decrypt(patientUser.phoneEnc);
      const slotStartTime = new Date(slot.startTime);
      const dateStr = slotStartTime.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const timeStr = slotStartTime.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });

      dispatchAppointmentNotification(
        pref?.channel || "whatsapp",
        {
          patientId: data.patientId,
          phone: phonePlain,
          appointmentId: newAppointment.id,
          clinicName: facility?.name || "Ghana Health Service Clinic",
          date: dateStr,
          time: timeStr,
          referenceCode,
          eventType: "booked",
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/patient/appointments`,
        },
        !!pref?.optedOutAt
      ).then((res) => {
        this.messageLogs.push({
          id: `msg-${Date.now()}`,
          patientId: data.patientId,
          appointmentId: newAppointment.id,
          channel: res.channel === "none" ? "sms" : res.channel,
          templateName: "appointment_confirmation_v1",
          providerMsgId: res.providerMsgId,
          status: res.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
    }

    // 6. Append-only Audit Log
    this.recordAudit("APPOINTMENT_BOOKED", "appointments", newAppointment.id, actor, {
      referenceCode,
      facilityId: data.facilityId,
      serviceId: data.serviceId,
      slotId: data.slotId,
    });

    return { appointment: newAppointment, referenceCode };
  }

  // --- Strict Scoped Appointment Fetching (RLS Enforcement) ---
  getAppointments(
    actor: SessionUser,
    filters?: {
      facilityId?: string;
      status?: AppointmentStatus;
      dateStr?: string;
      searchRef?: string;
    }
  ): (Appointment & {
    facility: Facility;
    service: MedicalService;
    slot: AppointmentSlot;
    patient: { fullName: string; phoneMasked: string; nhisMasked: string };
  })[] {
    return this.appointments
      .filter((app) => {
        // RLS Policy 1: Patient can only view their own
        if (actor.role === "patient") {
          if (app.patientId !== actor.id) return false;
        }

        // RLS Policy 2: Staff can only view their assigned facility
        if (["frontdesk", "doctor", "facility_admin"].includes(actor.role)) {
          if (actor.facilityId && app.facilityId !== actor.facilityId) return false;
        }

        // Optional query filters
        if (filters?.facilityId && app.facilityId !== filters.facilityId) return false;
        if (filters?.status && app.status !== filters.status) return false;
        if (filters?.searchRef && !app.referenceCode.toLowerCase().includes(filters.searchRef.toLowerCase().trim())) {
          return false;
        }

        const slot = this.slots.find((s) => s.id === app.slotId);
        if (filters?.dateStr && slot) {
          const slotDate = slot.startTime.split("T")[0];
          if (slotDate !== filters.dateStr) return false;
        }

        return true;
      })
      .map((app) => {
        const facility = this.facilities.find((f) => f.id === app.facilityId)!;
        const service = this.services.find((s) => s.id === app.serviceId)!;
        const slot = this.slots.find((s) => s.id === app.slotId)!;
        const patient = this.patients.find((p) => p.userId === app.patientId);
        const user = this.users.find((u) => u.id === app.patientId);

        const phonePlain = user ? decrypt(user.phoneEnc) : "";
        const nhisPlain = patient?.nhisEnc ? decrypt(patient.nhisEnc) : "";

        return {
          ...app,
          facility,
          service,
          slot,
          patient: {
            fullName: patient?.fullName || "Walk-in Patient",
            phoneMasked: phonePlain ? maskPhone(phonePlain) : "N/A",
            nhisMasked: nhisPlain ? `NHIS: ••••${nhisPlain.slice(-4)}` : "None",
          },
        };
      })
      .sort((a, b) => new Date(b.slot.startTime).getTime() - new Date(a.slot.startTime).getTime());
  }

  updateAppointmentStatus(
    appointmentId: string,
    newStatus: AppointmentStatus,
    actor: SessionUser
  ): boolean {
    const app = this.appointments.find((a) => a.id === appointmentId);
    if (!app) return false;

    // Scoping check
    if (actor.role === "patient" && app.patientId !== actor.id) {
      throw new Error("Unauthorized access to appointment");
    }
    if (["frontdesk", "doctor", "facility_admin"].includes(actor.role)) {
      if (actor.facilityId && app.facilityId !== actor.facilityId) {
        throw new Error("Unauthorized facility access");
      }
    }

    const previousStatus = app.status;
    app.status = newStatus;
    app.updatedAt = new Date().toISOString();

    // If cancelled or marked no-show, immediately decrement slot booked_count so others can book!
    if ((newStatus === "cancelled" || newStatus === "no_show") && previousStatus === "booked") {
      const slot = this.slots.find((s) => s.id === app.slotId);
      if (slot && slot.bookedCount > 0) {
        slot.bookedCount -= 1;
      }
    }

    this.recordAudit("APPOINTMENT_STATUS_UPDATED", "appointments", app.id, actor, {
      from: previousStatus,
      to: newStatus,
      referenceCode: app.referenceCode,
    });

    return true;
  }

  // --- Daily Queue Sheet (with 1-Click Print & CSV Export data) ---
  getDailyQueue(facilityId: string, dateStr: string, actor: SessionUser) {
    if (actor.role !== "platform_admin" && actor.facilityId !== facilityId) {
      throw new Error("Unauthorized facility access");
    }

    const facility = this.getFacilityById(facilityId);
    const appointments = this.getAppointments(actor, { facilityId, dateStr });

    return {
      facilityName: facility?.name || "Facility",
      region: facility?.region || "",
      date: dateStr,
      generatedAt: new Date().toISOString(),
      queue: appointments.sort(
        (a, b) => new Date(a.slot.startTime).getTime() - new Date(b.slot.startTime).getTime()
      ),
    };
  }

  // --- MFA (TOTP + Backup Codes) Management ---
  getMfaSecret(userId: string): MfaSecret | undefined {
    return this.mfaSecrets.find((m) => m.userId === userId);
  }

  saveMfaSecret(userId: string, secretBase32: string, backupCodesList: string[]): void {
    let mfa = this.mfaSecrets.find((m) => m.userId === userId);
    if (!mfa) {
      mfa = {
        userId,
        secretEnc: encrypt(secretBase32),
        isEnrolled: false,
        failedAttempts: 0,
        updatedAt: new Date().toISOString(),
      };
      this.mfaSecrets.push(mfa);
    } else {
      mfa.secretEnc = encrypt(secretBase32);
      mfa.isEnrolled = false;
      mfa.failedAttempts = 0;
      mfa.updatedAt = new Date().toISOString();
    }

    // Remove old backup codes and insert new hashed ones
    this.backupCodes = this.backupCodes.filter((bc) => bc.userId !== userId);
    backupCodesList.forEach((code) => {
      this.backupCodes.push({
        id: `bc-${Date.now()}-${Math.random()}`,
        userId,
        codeHash: hashBackupCode(code),
        usedAt: null,
        createdAt: new Date().toISOString(),
      });
    });
  }

  verifyAndEnrollMfa(userId: string, code: string): { success: boolean; message?: string } {
    const mfa = this.mfaSecrets.find((m) => m.userId === userId);
    if (!mfa) return { success: false, message: "MFA setup not found" };

    const secretBase32 = decrypt(mfa.secretEnc);
    const result = verifyTotpCode(code, secretBase32, mfa.lastUsedTimestep);

    if (result.valid) {
      mfa.isEnrolled = true;
      mfa.lastUsedTimestep = result.currentTimestep;
      mfa.failedAttempts = 0;
      mfa.updatedAt = new Date().toISOString();

      const user = this.users.find((u) => u.id === userId);
      this.recordAudit("MFA_ENROLLED", "mfa_secrets", userId, { id: userId, email: user?.email || "", role: user?.role || "doctor" }, {
        method: "totp_authenticator",
      });

      return { success: true };
    }

    return { success: false, message: "Invalid 6-digit code. Please try again." };
  }

  verifyMfaLogin(userId: string, code: string): { success: boolean; message?: string } {
    const mfa = this.mfaSecrets.find((m) => m.userId === userId);
    if (!mfa || !mfa.isEnrolled) {
      return { success: false, message: "MFA not configured" };
    }

    // Check account lockout
    if (mfa.lockedUntil && new Date(mfa.lockedUntil) > new Date()) {
      return { success: false, message: "Account temporarily locked due to failed MFA attempts. Try again later." };
    }

    const secretBase32 = decrypt(mfa.secretEnc);
    const result = verifyTotpCode(code, secretBase32, mfa.lastUsedTimestep);

    if (result.valid) {
      mfa.lastUsedTimestep = result.currentTimestep;
      mfa.failedAttempts = 0;
      mfa.lockedUntil = null;
      mfa.updatedAt = new Date().toISOString();
      return { success: true };
    }

    mfa.failedAttempts += 1;
    if (mfa.failedAttempts >= 5) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 15);
      mfa.lockedUntil = lockUntil.toISOString();
    }
    mfa.updatedAt = new Date().toISOString();

    return { success: false, message: "Invalid code. Progressive lockout enforced." };
  }

  verifyBackupCodeLogin(userId: string, rawCode: string): { success: boolean; message?: string } {
    const unusedCodes = this.backupCodes.filter((bc) => bc.userId === userId && !bc.usedAt);
    const hashes = unusedCodes.map((c) => c.codeHash);
    const match = verifyBackupCodeMatch(rawCode, hashes);

    if (match.valid && match.matchedHash) {
      const target = unusedCodes.find((c) => c.codeHash === match.matchedHash);
      if (target) {
        target.usedAt = new Date().toISOString();
        const user = this.users.find((u) => u.id === userId);
        this.recordAudit("MFA_BACKUP_CODE_USED", "backup_codes", target.id, { id: userId, email: user?.email || "", role: user?.role || "doctor" });
        return { success: true };
      }
    }

    return { success: false, message: "Invalid or already used backup code." };
  }

  resetStaffMfa(targetUserId: string, adminActor: SessionUser): boolean {
    if (!["facility_admin", "platform_admin"].includes(adminActor.role)) {
      throw new Error("Only Facility Admins or Platform Admins can reset staff MFA");
    }

    const mfa = this.mfaSecrets.find((m) => m.userId === targetUserId);
    if (mfa) {
      mfa.isEnrolled = false;
      mfa.failedAttempts = 0;
      mfa.lockedUntil = null;
      mfa.lastUsedTimestep = null;
    }

    this.recordAudit("STAFF_MFA_RESET", "mfa_secrets", targetUserId, adminActor, {
      targetUserId,
      reason: "MFA reset authorized by administrator after identity verification",
    });

    return true;
  }

  // --- Audit Logging (Append-Only) ---
  recordAudit(
    action: string,
    recordType: string | null,
    recordId: string | null,
    actor?: SessionUser | { id: string; email: string; role: string } | null,
    metadata?: Record<string, unknown>,
    ip = "127.0.0.1"
  ): void {
    const entry: AuditLog = {
      id: this.auditCounter++,
      actorId: actor?.id || null,
      actorRole: actor?.role || null,
      action,
      recordType,
      recordId,
      ip,
      metadata: metadata || null,
      createdAt: new Date().toISOString(),
    };
    this.auditLogs.unshift(entry); // newest first
  }

  getAuditLogs(actor: SessionUser, limit = 50): AuditLog[] {
    if (!["facility_admin", "platform_admin"].includes(actor.role)) {
      throw new Error("Unauthorized to access audit logs");
    }
    return this.auditLogs.slice(0, limit);
  }

  // --- Aggregate Operational Metrics ---
  getOperationalMetrics() {
    const totalBookings = this.appointments.length;
    const completed = this.appointments.filter((a) => a.status === "completed").length;
    const noShows = this.appointments.filter((a) => a.status === "no_show").length;
    const selfBooked = this.appointments.filter((a) => a.bookedByRole === "patient").length;

    const noShowRate = totalBookings > 0 ? ((noShows / totalBookings) * 100).toFixed(1) : "0.0";
    const selfBookingShare = totalBookings > 0 ? ((selfBooked / totalBookings) * 100).toFixed(1) : "0.0";

    return {
      totalFacilities: this.facilities.filter((f) => f.isActive).length,
      totalAppointments: totalBookings,
      completedCount: completed,
      noShowCount: noShows,
      noShowRatePercent: `${noShowRate}%`,
      selfBookingSharePercent: `${selfBookingShare}%`,
      activeRegions: Array.from(new Set(this.facilities.map((f) => f.region))).length,
    };
  }
}

// Global Singleton for in-memory and request handling
const globalStore = new DataStore();
export function getDataStore(): DataStore {
  return globalStore;
}

