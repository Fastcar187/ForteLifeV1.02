import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { encrypt, blindIndex } from "../lib/crypto";
import { hashBackupCode } from "../lib/auth";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

export async function seed() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("No DATABASE_URL found.");
    return;
  }

  console.log("Connecting to Neon Postgres to seed live data...");
  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });

  try {
    // 1. Check if facilities already exist
    const existing = await db.select().from(schema.facilities);
    if (existing.length > 0) {
      console.log(`Database already populated with ${existing.length} facilities. Skipping seed.`);
      return;
    }

    console.log("Seeding Ghanaian healthcare facilities...");

    const korleBuId = crypto.randomUUID();
    const ridgeId = crypto.randomUUID();
    const kathId = crypto.randomUUID();
    const tamaleId = crypto.randomUUID();
    const hoId = crypto.randomUUID();

    await db.insert(schema.facilities).values([
      {
        id: korleBuId,
        name: "Korle Bu Teaching Hospital",
        region: "Greater Accra",
        locationAddress: "Guggisberg Ave, Korle Gonno, Accra",
        isActive: true,
      },
      {
        id: ridgeId,
        name: "Greater Accra Regional Hospital (Ridge)",
        region: "Greater Accra",
        locationAddress: "Castle Road, Ridge, Accra",
        isActive: true,
      },
      {
        id: kathId,
        name: "Komfo Anokye Teaching Hospital (KATH)",
        region: "Ashanti",
        locationAddress: "Bantama Road, Kumasi",
        isActive: true,
      },
      {
        id: tamaleId,
        name: "Tamale Teaching Hospital",
        region: "Northern",
        locationAddress: "Hospital Road, Tamale",
        isActive: true,
      },
      {
        id: hoId,
        name: "Ho Teaching Hospital",
        region: "Volta",
        locationAddress: "Trafalgar, Ho",
        isActive: true,
      },
    ]);

    console.log("Seeding clinical service departments...");
    const ridgeOpdId = crypto.randomUUID();
    const ridgeMatId = crypto.randomUUID();
    const kbOpdId = crypto.randomUUID();

    await db.insert(schema.services).values([
      { id: ridgeOpdId, facilityId: ridgeId, name: "General OPD Consultation", durationMinutes: 20, isActive: true },
      { id: ridgeMatId, facilityId: ridgeId, name: "Maternity & Family Planning", durationMinutes: 30, isActive: true },
      { id: kbOpdId, facilityId: korleBuId, name: "General Outpatient (OPD)", durationMinutes: 20, isActive: true },
    ]);

    console.log("Seeding users & clinical staff across 5 roles...");
    // Password123!
    const defaultPasswordHash = "$2a$10$wT/iG6l1Yk49jE2/v4qKqeuB9qgVbE3oJgXW2Vd9U1.8r8z6Z5K.6";

    const patientUserId = crypto.randomUUID();
    const frontdeskUserId = crypto.randomUUID();
    const doctorUserId = crypto.randomUUID();
    const facAdminUserId = crypto.randomUUID();
    const platformAdminUserId = crypto.randomUUID();

    await db.insert(schema.users).values([
      {
        id: patientUserId,
        role: "patient",
        email: "kwame.mensah@example.com",
        passwordHash: defaultPasswordHash,
        phoneEnc: encrypt("+233244123456"),
        phoneHash: blindIndex("+233244123456"),
        failedLoginCount: 0,
      },
      {
        id: frontdeskUserId,
        role: "frontdesk",
        email: "frontdesk.ridge@ghanahealth.gov.gh",
        passwordHash: defaultPasswordHash,
        phoneEnc: encrypt("+233201234567"),
        phoneHash: blindIndex("+233201234567"),
        failedLoginCount: 0,
      },
      {
        id: doctorUserId,
        role: "doctor",
        email: "dr.boateng@ghanahealth.gov.gh",
        passwordHash: defaultPasswordHash,
        phoneEnc: encrypt("+233277890123"),
        phoneHash: blindIndex("+233277890123"),
        failedLoginCount: 0,
      },
      {
        id: facAdminUserId,
        role: "facility_admin",
        email: "admin.ridge@ghanahealth.gov.gh",
        passwordHash: defaultPasswordHash,
        phoneEnc: encrypt("+233245678901"),
        phoneHash: blindIndex("+233245678901"),
        failedLoginCount: 0,
      },
      {
        id: platformAdminUserId,
        role: "platform_admin",
        email: "director@ghanahealth.gov.gh",
        passwordHash: defaultPasswordHash,
        phoneEnc: encrypt("+233501239876"),
        phoneHash: blindIndex("+233501239876"),
        failedLoginCount: 0,
      },
    ]);

    // Patient profile
    await db.insert(schema.patients).values([
      {
        userId: patientUserId,
        fullName: "Kwame Mensah",
        nhisEnc: encrypt("84920193"),
        ghanaCardEnc: encrypt("GHA-726491029-4"),
        consentAcceptedAt: new Date(),
      },
    ]);

    // Staff profiles
    await db.insert(schema.staff).values([
      {
        userId: frontdeskUserId,
        facilityId: ridgeId,
        role: "frontdesk",
        titleOrSpecialty: "Senior Admissions & Triage Officer",
        isActive: true,
      },
      {
        userId: doctorUserId,
        facilityId: ridgeId,
        role: "doctor",
        titleOrSpecialty: "Consultant Physician (General OPD)",
        isActive: true,
      },
      {
        userId: facAdminUserId,
        facilityId: ridgeId,
        role: "facility_admin",
        titleOrSpecialty: "Medical Superintendent & Operations Director",
        isActive: true,
      },
    ]);

    // MFA Secrets for Doctor, Facility Admin, Platform Admin
    await db.insert(schema.mfaSecrets).values([
      {
        userId: doctorUserId,
        secretEnc: encrypt("JBSWY3DPEHPK3PXP"),
        isEnrolled: true,
        failedAttempts: 0,
      },
      {
        userId: facAdminUserId,
        secretEnc: encrypt("JBSWY3DPEHPK3PXP"),
        isEnrolled: true,
        failedAttempts: 0,
      },
      {
        userId: platformAdminUserId,
        secretEnc: encrypt("JBSWY3DPEHPK3PXP"),
        isEnrolled: true,
        failedAttempts: 0,
      },
    ]);

    // Backup Codes
    await db.insert(schema.backupCodes).values([
      {
        id: crypto.randomUUID(),
        userId: doctorUserId,
        codeHash: hashBackupCode("GH72-BACKUP1"),
      },
      {
        id: crypto.randomUUID(),
        userId: doctorUserId,
        codeHash: hashBackupCode("GH84-BACKUP2"),
      },
    ]);

    // Notification Preferences
    await db.insert(schema.notificationPrefs).values([
      {
        userId: patientUserId,
        channel: "whatsapp",
        optedInAt: new Date(),
        dailyMsgCount: 0,
      },
    ]);

    // Generate initial slots for Ridge Hospital
    console.log("Generating initial slots for Ridge Hospital...");
    const slot1Id = crypto.randomUUID();
    const today = new Date();
    today.setHours(9, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setMinutes(20);

    const slot2Id = crypto.randomUUID();
    const slot2Start = new Date(today);
    slot2Start.setMinutes(30);
    const slot2End = new Date(slot2Start);
    slot2End.setMinutes(50);

    await db.insert(schema.slots).values([
      {
        id: slot1Id,
        facilityId: ridgeId,
        serviceId: ridgeOpdId,
        doctorId: doctorUserId,
        startTime: today,
        endTime: todayEnd,
        capacity: 1,
        bookedCount: 1,
      },
      {
        id: slot2Id,
        facilityId: ridgeId,
        serviceId: ridgeOpdId,
        doctorId: doctorUserId,
        startTime: slot2Start,
        endTime: slot2End,
        capacity: 1,
        bookedCount: 0,
      },
    ]);

    // Seed 1 confirmed appointment for demo
    await db.insert(schema.appointments).values([
      {
        id: crypto.randomUUID(),
        referenceCode: "GH-84920",
        patientId: patientUserId,
        facilityId: ridgeId,
        slotId: slot1Id,
        serviceId: ridgeOpdId,
        status: "booked",
        bookedByRole: "patient",
      },
    ]);

    // Initial audit log
    await db.insert(schema.auditLog).values([
      {
        actorId: platformAdminUserId,
        actorRole: "platform_admin",
        action: "NEON_DATABASE_INITIALIZED",
        recordType: "system",
        metadata: { provider: "Neon Serverless Postgres", branch: "production" },
      },
    ]);

    console.log("Neon Postgres live database seeded successfully with Ghana Health Service facilities & staff!");
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seed();
}
