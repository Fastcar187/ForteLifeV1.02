import {
  pgTable,
  text,
  uuid,
  boolean,
  integer,
  timestamp,
  bigserial,
  bigint,
  date,
  inet,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Facilities
export const facilities = pgTable("facilities", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  region: text("region").notNull(), // e.g. Greater Accra, Ashanti, Northern, Volta
  locationAddress: text("location_address").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Users (Authentication & Identity)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  role: text("role", {
    enum: ["patient", "frontdesk", "doctor", "facility_admin", "platform_admin"],
  }).notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  phoneEnc: text("phone_enc").notNull(), // AES-256-GCM encrypted
  phoneHash: text("phone_hash").notNull(), // blind index HMAC-SHA256
  failedLoginCount: integer("failed_login_count").default(0).notNull(),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. Patients (Ghana Act 843 compliant PII & Consent)
export const patients = pgTable("patients", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  nhisEnc: text("nhis_enc"), // AES-256-GCM encrypted
  ghanaCardEnc: text("ghana_card_enc"), // AES-256-GCM encrypted
  consentAcceptedAt: timestamp("consent_accepted_at", { withTimezone: true }).notNull(),
  deletionRequestedAt: timestamp("deletion_requested_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. Staff (Front Desk, Doctors, Facility Admins)
export const staff = pgTable("staff", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  facilityId: uuid("facility_id")
    .references(() => facilities.id, { onDelete: "cascade" })
    .notNull(),
  role: text("role", { enum: ["frontdesk", "doctor", "facility_admin"] }).notNull(),
  titleOrSpecialty: text("title_or_specialty").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// 5. Medical Services
export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  facilityId: uuid("facility_id")
    .references(() => facilities.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  durationMinutes: integer("duration_minutes").default(20).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

// 6. Slots (Schedule & Capacity Management)
export const slots = pgTable("slots", {
  id: uuid("id").primaryKey().defaultRandom(),
  facilityId: uuid("facility_id")
    .references(() => facilities.id, { onDelete: "cascade" })
    .notNull(),
  doctorId: uuid("doctor_id").references(() => users.id, { onDelete: "set null" }),
  serviceId: uuid("service_id")
    .references(() => services.id, { onDelete: "cascade" })
    .notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  capacity: integer("capacity").default(1).notNull(),
  bookedCount: integer("booked_count").default(0).notNull(),
});

// 7. Appointments
export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    referenceCode: text("reference_code").notNull().unique(), // e.g. GH-84920
    patientId: uuid("patient_id")
      .references(() => patients.userId, { onDelete: "cascade" })
      .notNull(),
    facilityId: uuid("facility_id")
      .references(() => facilities.id, { onDelete: "cascade" })
      .notNull(),
    slotId: uuid("slot_id")
      .references(() => slots.id, { onDelete: "cascade" })
      .notNull(),
    serviceId: uuid("service_id")
      .references(() => services.id, { onDelete: "cascade" })
      .notNull(),
    status: text("status", {
      enum: ["booked", "checked_in", "completed", "cancelled", "no_show"],
    })
      .default("booked")
      .notNull(),
    bookedByRole: text("booked_by_role").notNull(),
    reminderSentAt: timestamp("reminder_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueSlotBooking: uniqueIndex("uniq_appointment_slot_idx").on(table.slotId),
  })
);

// 8. MFA Secrets (TOTP Google Authenticator)
export const mfaSecrets = pgTable("mfa_secrets", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  secretEnc: text("secret_enc").notNull(), // AES-256-GCM encrypted
  isEnrolled: boolean("is_enrolled").default(false).notNull(),
  lastUsedTimestep: bigint("last_used_timestep", { mode: "number" }),
  failedAttempts: integer("failed_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 9. Single-Use Hashed Backup Codes
export const backupCodes = pgTable("backup_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  codeHash: text("code_hash").notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 10. Notification Preferences & Rate Limiting
export const notificationPrefs = pgTable("notification_prefs", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  channel: text("channel", { enum: ["whatsapp", "sms", "none"] })
    .default("whatsapp")
    .notNull(),
  optedInAt: timestamp("opted_in_at", { withTimezone: true }),
  optedOutAt: timestamp("opted_out_at", { withTimezone: true }),
  dailyMsgCount: integer("daily_msg_count").default(0).notNull(),
  lastMsgDate: date("last_msg_date"),
});

// 11. Message Delivery Log (Privacy Safe - No Health Details)
export const messageLog = pgTable("message_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id")
    .references(() => patients.userId, { onDelete: "cascade" })
    .notNull(),
  appointmentId: uuid("appointment_id").references(() => appointments.id, {
    onDelete: "set null",
  }),
  channel: text("channel", { enum: ["whatsapp", "sms"] }).notNull(),
  templateName: text("template_name").notNull(),
  providerMsgId: text("provider_msg_id").notNull().unique(),
  status: text("status", {
    enum: ["queued", "sent", "delivered", "failed"],
  })
    .default("queued")
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 12. Audit Log (Strictly Append-Only)
export const auditLog = pgTable("audit_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  actorId: uuid("actor_id"),
  actorRole: text("actor_role"),
  action: text("action").notNull(),
  recordType: text("record_type"),
  recordId: uuid("record_id"),
  ip: inet("ip"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const facilitiesRelations = relations(facilities, ({ many }) => ({
  staff: many(staff),
  services: many(services),
  slots: many(slots),
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.userId],
  }),
  facility: one(facilities, {
    fields: [appointments.facilityId],
    references: [facilities.id],
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
  slot: one(slots, {
    fields: [appointments.slotId],
    references: [slots.id],
  }),
}));

