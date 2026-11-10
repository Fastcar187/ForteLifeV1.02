import { z } from "zod";

// Phone validation: Ghanaian phone format (+233XX... or 02/03/05...)
export const ghanaPhoneSchema = z
  .string()
  .trim()
  .regex(
    /^(\+233|0)[235][0-9]{8}$/,
    "Invalid Ghana phone number. Must be a valid 10-digit number (e.g., 0244123456 or +233244123456)"
  );

// Ghana National ID (Ghana Card): GHA-XXXXXXXXX-X
export const ghanaCardSchema = z
  .string()
  .trim()
  .regex(
    /^GHA-[0-9]{9}-[0-9]$/,
    "Invalid Ghana Card format. Expected format: GHA-123456789-0"
  )
  .optional()
  .or(z.literal(""));

// NHIS Number: 8 digits
export const nhisSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{8}$/, "Invalid NHIS number. Must be an 8-digit number")
  .optional()
  .or(z.literal(""));

// Patient Registration
export const registerPatientSchema = z.object({
  fullName: z.string().trim().min(3, "Full name must be at least 3 characters").max(100),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: ghanaPhoneSchema,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  nhis: nhisSchema,
  ghanaCard: ghanaCardSchema,
  consentAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Ghana Data Protection Act (Act 843) consent" }),
  }),
  notificationChannel: z.enum(["whatsapp", "sms"]),
});

// Staff / Patient Login
export const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// TOTP Verification
export const verifyMfaSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^[0-9]{6}$/, "TOTP code must be exactly 6 digits"),
});

// Backup Code Verification
export const verifyBackupCodeSchema = z.object({
  backupCode: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9]{8,12}$/, "Invalid backup code format"),
});

// 3-Step Guided Booking Wizard Schema
export const bookingWizardSchema = z.object({
  facilityId: z.string().uuid("Invalid facility selection"),
  serviceId: z.string().uuid("Invalid service selection"),
  slotId: z.string().uuid("Invalid slot selection"),
  consentAccepted: z.literal(true, {
    errorMap: () => ({ message: "Act 843 data processing consent is required to book an appointment" }),
  }),
  notificationChannel: z.enum(["whatsapp", "sms"]),
});

// Front Desk Walk-In Booking Schema
export const walkInBookingSchema = z.object({
  facilityId: z.string().uuid(),
  serviceId: z.string().uuid(),
  slotId: z.string().uuid(),
  fullName: z.string().trim().min(3, "Full name required"),
  phone: ghanaPhoneSchema,
  nhis: nhisSchema,
  notificationChannel: z.enum(["whatsapp", "sms", "none"]),
});

// Facility Slot Generation Schema
export const generateSlotsSchema = z.object({
  facilityId: z.string().uuid(),
  serviceId: z.string().uuid(),
  doctorId: z.string().uuid().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
  startHour: z.number().int().min(6).max(18),
  endHour: z.number().int().min(7).max(20),
  slotDurationMinutes: z.number().int().min(10).max(60).default(20),
  capacityPerSlot: z.number().int().min(1).max(10).default(1),
});

// Patient Profile & Data Rights Update
export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(3).max(100),
  phone: ghanaPhoneSchema,
  nhis: nhisSchema,
  ghanaCard: ghanaCardSchema,
  notificationChannel: z.enum(["whatsapp", "sms", "none"]),
});

// Patient Data Deletion Request (Act 843)
export const requestDataDeletionSchema = z.object({
  confirmationText: z.literal("DELETE MY PERSONAL DATA", {
    errorMap: () => ({ message: 'You must type "DELETE MY PERSONAL DATA" to confirm' }),
  }),
  reason: z.string().trim().max(500).optional(),
});

