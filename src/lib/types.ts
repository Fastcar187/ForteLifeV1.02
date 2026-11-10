export type UserRole =
  | "patient"
  | "frontdesk"
  | "doctor"
  | "facility_admin"
  | "platform_admin";

export type AppointmentStatus =
  | "booked"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "no_show";

export type NotificationChannel = "whatsapp" | "sms" | "none";

export type MessageDeliveryStatus = "queued" | "sent" | "delivered" | "failed";

export interface Facility {
  id: string;
  name: string;
  region: string;
  locationAddress: string;
  isActive: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  role: UserRole;
  email: string;
  passwordHash?: string | null;
  phoneEnc: string; // AES-256-GCM encrypted
  phoneHash: string; // blind index HMAC-SHA256
  failedLoginCount: number;
  lockedUntil?: string | null;
  createdAt: string;
}

export interface Patient {
  userId: string;
  fullName: string;
  nhisEnc?: string | null; // AES-256-GCM encrypted
  ghanaCardEnc?: string | null; // AES-256-GCM encrypted
  consentAcceptedAt: string;
  deletionRequestedAt?: string | null;
  createdAt: string;
}

export interface Staff {
  userId: string;
  facilityId: string;
  role: "frontdesk" | "doctor" | "facility_admin";
  titleOrSpecialty: string;
  isActive: boolean;
}

export interface MedicalService {
  id: string;
  facilityId: string;
  name: string;
  durationMinutes: number;
  isActive: boolean;
}

export interface AppointmentSlot {
  id: string;
  facilityId: string;
  doctorId?: string | null;
  serviceId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  capacity: number;
  bookedCount: number;
}

export interface Appointment {
  id: string;
  referenceCode: string; // e.g. GH-84920
  patientId: string;
  facilityId: string;
  slotId: string;
  serviceId: string;
  status: AppointmentStatus;
  bookedByRole: UserRole;
  reminderSentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MfaSecret {
  userId: string;
  secretEnc: string; // AES-256-GCM encrypted TOTP secret
  isEnrolled: boolean;
  lastUsedTimestep?: number | null;
  failedAttempts: number;
  lockedUntil?: string | null;
  updatedAt: string;
}

export interface BackupCode {
  id: string;
  userId: string;
  codeHash: string;
  usedAt?: string | null;
  createdAt: string;
}

export interface NotificationPrefs {
  userId: string;
  channel: NotificationChannel;
  optedInAt?: string | null;
  optedOutAt?: string | null;
  dailyMsgCount: number;
  lastMsgDate?: string | null;
}

export interface MessageLog {
  id: string;
  patientId: string;
  appointmentId?: string | null;
  channel: "whatsapp" | "sms";
  templateName: string; // strictly template name, never sensitive health info
  providerMsgId: string;
  status: MessageDeliveryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: number;
  actorId?: string | null;
  actorRole?: string | null;
  action: string;
  recordType?: string | null;
  recordId?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  facilityId?: string | null;
  facilityName?: string | null;
  fullName?: string | null;
  isMfaEnrolled?: boolean;
}
