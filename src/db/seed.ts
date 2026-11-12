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
    const kathOpdId = crypto.randomUUID();
    const tamaleOpdId = crypto.randomUUID();
    const hoOpdId = crypto.randomUUID();

    await db.insert(schema.services).values([
      { id: ridgeOpdId, facilityId: ridgeId, name: "General OPD Consultation", durationMinutes: 20, isActive: true },
      { id: ridgeMatId, facilityId: ridgeId, name: "Maternity & Family Planning", durationMinutes: 30, isActive: true },
      { id: kbOpdId, facilityId: korleBuId, name: "General Outpatient (OPD)", durationMinutes: 20, isActive: true },
      { id: kathOpdId, facilityId: kathId, name: "General Medicine OPD", durationMinutes: 20, isActive: true },
      { id: tamaleOpdId, facilityId: tamaleId, name: "General OPD", durationMinutes: 20, isActive: true },
      { id: hoOpdId, facilityId: hoId, name: "General Outpatient Consultation", durationMinutes: 20, isActive: true },
    ]);

    console.log("Seeding users & clinical staff across all 5 roles and hospitals...");
    // Password123!
    const defaultPasswordHash = "$2a$10$Dr73GvDK.Cj2I4puVEmxYuByiv1obl9SxQrYGzljV1tMXXIaXyKAC";

    const patientUserId = crypto.randomUUID();
    const patient2UserId = crypto.randomUUID();
    const patient3UserId = crypto.randomUUID();

    // Ridge
    const frontdeskUserId = crypto.randomUUID();
    const doctorUserId = crypto.randomUUID();
    const facAdminUserId = crypto.randomUUID();

    // Korle Bu
    const kbFrontdeskId = crypto.randomUUID();
    const kbDoctorId = crypto.randomUUID();
    const kbAdminId = crypto.randomUUID();

    // KATH
    const kathFrontdeskId = crypto.randomUUID();
    const kathDoctorId = crypto.randomUUID();
    const kathAdminId = crypto.randomUUID();

    // Tamale
    const tamaleFrontdeskId = crypto.randomUUID();
    const tamaleDoctorId = crypto.randomUUID();
    const tamaleAdminId = crypto.randomUUID();

    // Ho
    const hoFrontdeskId = crypto.randomUUID();
    const hoDoctorId = crypto.randomUUID();
    const hoAdminId = crypto.randomUUID();

    // Platform Admin
    const platformAdminUserId = crypto.randomUUID();

    await db.insert(schema.users).values([
      // Patients
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
        id: patient2UserId,
        role: "patient",
        email: "ama.ofori@example.com",
        passwordHash: defaultPasswordHash,
        phoneEnc: encrypt("+233244987654"),
        phoneHash: blindIndex("+233244987654"),
        failedLoginCount: 0,
      },
      {
        id: patient3UserId,
        role: "patient",
        email: "ibrahim.abdulai@example.com",
        passwordHash: defaultPasswordHash,
        phoneEnc: encrypt("+233208765432"),
        phoneHash: blindIndex("+233208765432"),
        failedLoginCount: 0,
      },
      // Ridge Hospital
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
      // Korle Bu
      {
        id: kbFrontdeskId,
        role: "frontdesk",
        email: "frontdesk.korlebu@ghanahealth.gov.gh",
        passwordHash: defaultPasswordHash,
        phoneEnc: encrypt("+233202345678"),
        phoneHash: blindIndex("+233202345678"),
        failedLoginCount: 0,
      },
      {
        id: kbDoctorId,
        role: "doctor",
        email: "dr.owusu@ghanahealth.gov.gh",
        passwordHash: defaultPasswordHash,
        phoneEnc: encrypt("+233243456789"),
        phoneHash: blindIndex("+233243456789"),
        failedLoginCount: 0,
      },
      {
        id: kbAdminId,
        role: "facility_admin",
        email: "admin.korlebu@ghanahealth.gov.gh",
        passwordHash: defaultPasswordHash,
        phoneEnc: encrypt("+233244567890"),
        phoneHash: blindIndex("+233244567890"),
        failedLoginCount: 0,
      },
      // KATH
      {
        id: kathFrontdeskId,
        role: "frontdesk",
        email: "frontdesk.kath@ghanahealth.gov.gh",
        passwordHash: defaultPasswordHash,
        phoneEnc: encrypt("+233203456789"),
        phoneHash: blindIndex("+233203456789"),
        failedLoginCount: 0,
      },
      {
        id: kathDoctorId,
        role: "doctor",
        email: "dr.agyeman@ghanahealth.gov.gh",
        passwordHash: defaultPasswordHash,
        phoneEnc: encrypt("+233246789012"),
        phoneHash: blindIndex("+233246789012"),
        failedLoginCount: 0,
      },
      {
        id: kathAdminId,
        role: "facility_admin",
        email: "admin.kath@ghanahealth.gov.gh",
        passwordHash: defaultPasswordHash,
        phoneEnc: encrypt("+233247890123"),
        phoneHash: blindIndex("+233247890123"),
        failedLoginCount: 0,
      },
      // Tamale
      {
        id: tamaleFrontdeskId,
        role: "frontdesk",
        email: "frontdesk.tamale@ghanahealth.gov.gh",
        passwordHash: defaultPasswordHash,
        phoneEnc: encrypt("+233204567890"),
        phoneHash: blindIndex("+233204567890"),
        failedLoginCount: 0,
      },
      {
        id: tamaleDoctorId,
        role: "doctor",
        email: "dr.yakubu@ghanahealth.gov.gh",
        passwordHash: defaultPasswordHash,
        phoneEnc: encrypt("+233248901234"),
        phoneHash: blindIndex("+233248901234"),
        failedLoginCount: 0,
      },
      {
        id: tamaleAdminId,
        role: "facility_admin",
        email: "admin.tamale@ghanahealth.gov.gh",
        passwordHash: defaultPasswordHash,
        phoneEnc: encrypt("+233249012345"),
        phoneHash: blindIndex("+233249012345"),
        failedLoginCount: 0,
      },
      // Ho
      {
        id: hoFrontdeskId,
        role: "frontdesk",
        email: "frontdesk.ho@ghanahealth.gov.gh",
        passwordHash: defaultPasswordHash,
        phoneEnc: encrypt("+233205678901"),
        phoneHash: blindIndex("+233205678901"),
        failedLoginCount: 0,
      },
      {
        id: hoDoctorId,
        role: "doctor",
        email: "dr.kpodo@ghanahealth.gov.gh",
        passwordHash: defaultPasswordHash,
        phoneEnc: encrypt("+233240123456"),
        phoneHash: blindIndex("+233240123456"),
        failedLoginCount: 0,
      },
      {
        id: hoAdminId,
        role: "facility_admin",
        email: "admin.ho@ghanahealth.gov.gh",
        passwordHash: defaultPasswordHash,
        phoneEnc: encrypt("+233241234560"),
        phoneHash: blindIndex("+233241234560"),
        failedLoginCount: 0,
      },
      // Platform Admin
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

    // Patient profiles
    await db.insert(schema.patients).values([
      {
        userId: patientUserId,
        fullName: "Kwame Mensah",
        nhisEnc: encrypt("84920193"),
        ghanaCardEnc: encrypt("GHA-726491029-4"),
        consentAcceptedAt: new Date(),
      },
      {
        userId: patient2UserId,
        fullName: "Ama Serwaa Ofori",
        nhisEnc: encrypt("58291044"),
        ghanaCardEnc: encrypt("GHA-491827364-1"),
        consentAcceptedAt: new Date(),
      },
      {
        userId: patient3UserId,
        fullName: "Ibrahim Abdulai",
        nhisEnc: encrypt("39104825"),
        ghanaCardEnc: encrypt("GHA-839201746-8"),
        consentAcceptedAt: new Date(),
      },
    ]);

    // Staff profiles across all 5 hospitals
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
      {
        userId: kbFrontdeskId,
        facilityId: korleBuId,
        role: "frontdesk",
        titleOrSpecialty: "Principal Admissions Officer",
        isActive: true,
      },
      {
        userId: kbDoctorId,
        facilityId: korleBuId,
        role: "doctor",
        titleOrSpecialty: "Senior Specialist Physician (OPD)",
        isActive: true,
      },
      {
        userId: kbAdminId,
        facilityId: korleBuId,
        role: "facility_admin",
        titleOrSpecialty: "Director of Medical Affairs",
        isActive: true,
      },
      {
        userId: kathFrontdeskId,
        facilityId: kathId,
        role: "frontdesk",
        titleOrSpecialty: "OPD Records & Triage Supervisor",
        isActive: true,
      },
      {
        userId: kathDoctorId,
        facilityId: kathId,
        role: "doctor",
        titleOrSpecialty: "Consultant Family Physician",
        isActive: true,
      },
      {
        userId: kathAdminId,
        facilityId: kathId,
        role: "facility_admin",
        titleOrSpecialty: "Hospital Operations Administrator",
        isActive: true,
      },
      {
        userId: tamaleFrontdeskId,
        facilityId: tamaleId,
        role: "frontdesk",
        titleOrSpecialty: "Admissions & Patient Registration Officer",
        isActive: true,
      },
      {
        userId: tamaleDoctorId,
        facilityId: tamaleId,
        role: "doctor",
        titleOrSpecialty: "Senior Medical Officer (General OPD)",
        isActive: true,
      },
      {
        userId: tamaleAdminId,
        facilityId: tamaleId,
        role: "facility_admin",
        titleOrSpecialty: "Clinical Services Coordinator",
        isActive: true,
      },
      {
        userId: hoFrontdeskId,
        facilityId: hoId,
        role: "frontdesk",
        titleOrSpecialty: "Front Desk & Queue Triage Officer",
        isActive: true,
      },
      {
        userId: hoDoctorId,
        facilityId: hoId,
        role: "doctor",
        titleOrSpecialty: "Specialist Outpatient Physician",
        isActive: true,
      },
      {
        userId: hoAdminId,
        facilityId: hoId,
        role: "facility_admin",
        titleOrSpecialty: "Head of Clinical Administration",
        isActive: true,
      },
    ]);

    // MFA Secrets for all Doctors, Facility Admins, Platform Admin
    const mfaUserIds = [
      doctorUserId,
      facAdminUserId,
      kbDoctorId,
      kbAdminId,
      kathDoctorId,
      kathAdminId,
      tamaleDoctorId,
      tamaleAdminId,
      hoDoctorId,
      hoAdminId,
      platformAdminUserId,
    ];

    await db.insert(schema.mfaSecrets).values(
      mfaUserIds.map((uid) => ({
        userId: uid,
        secretEnc: encrypt("JBSWY3DPEHPK3PXP"),
        isEnrolled: true,
        failedAttempts: 0,
      }))
    );

    // Backup Codes
    await db.insert(schema.backupCodes).values(
      mfaUserIds.flatMap((uid) => [
        {
          id: crypto.randomUUID(),
          userId: uid,
          codeHash: hashBackupCode("GH72-BACKUP1"),
        },
        {
          id: crypto.randomUUID(),
          userId: uid,
          codeHash: hashBackupCode("GH84-BACKUP2"),
        },
      ])
    );

    // Notification Preferences
    await db.insert(schema.notificationPrefs).values([
      {
        userId: patientUserId,
        channel: "whatsapp",
        optedInAt: new Date(),
        dailyMsgCount: 0,
      },
      {
        userId: patient2UserId,
        channel: "whatsapp",
        optedInAt: new Date(),
        dailyMsgCount: 0,
      },
      {
        userId: patient3UserId,
        channel: "sms",
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

    // Seed 1 confirmed appointment
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
