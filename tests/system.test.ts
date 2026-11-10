import { test, describe } from "node:test";
import assert from "node:assert";
import { encrypt, decrypt, blindIndex, maskPhone, maskNationalId } from "../src/lib/crypto";
import {
  generateBase32Secret,
  generateTotpCode,
  verifyTotpCode,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
} from "../src/lib/auth";
import { hasRoleAccess, canAccessFacility, canAccessPatientData, isMfaRequired } from "../src/lib/rbac";
import { buildPrivacyCompliantMessage } from "../src/lib/messaging";
import { ghanaPhoneSchema, ghanaCardSchema, nhisSchema } from "../src/lib/validation";
import { getDataStore } from "../src/lib/data-store";

describe("1. Cryptography & Field Encryption (AES-256-GCM)", () => {
  test("Encrypts and decrypts sensitive PII accurately", () => {
    const originalNhis = "84920193";
    const encrypted = encrypt(originalNhis);

    assert.notStrictEqual(encrypted, originalNhis);
    assert.strictEqual(encrypted.split(":").length, 3, "Encrypted format must be iv:ciphertext:tag");

    const decrypted = decrypt(encrypted);
    assert.strictEqual(decrypted, originalNhis);
  });

  test("Generates consistent HMAC-SHA256 blind index for fast lookups", () => {
    const phone = "+233244123456";
    const index1 = blindIndex(phone);
    const index2 = blindIndex(phone);
    const index3 = blindIndex("0244123456");

    assert.strictEqual(index1, index2);
    assert.notStrictEqual(index1, index3);
  });

  test("Masks telephone and national ID for UI display", () => {
    assert.strictEqual(maskPhone("+233244123456"), "+233 ••• ••56");
    assert.strictEqual(maskNationalId("GHA-726491029-4"), "GHA••••9-4");
  });
});

describe("2. TOTP MFA & Replay Attack Prevention (RFC 6238)", () => {
  const secret = generateBase32Secret(20);

  test("Generates and verifies 6-digit TOTP code within valid time window", () => {
    const code = generateTotpCode(secret);
    assert.strictEqual(code.length, 6);

    const result = verifyTotpCode(code, secret);
    assert.strictEqual(result.valid, true);
  });

  test("Allows ±1 step clock drift (previous and next 30-second windows)", () => {
    const codePrev = generateTotpCode(secret, -1);
    const codeNext = generateTotpCode(secret, 1);

    assert.strictEqual(verifyTotpCode(codePrev, secret).valid, true);
    assert.strictEqual(verifyTotpCode(codeNext, secret).valid, true);
  });

  test("Prevents replay attacks within the same 30-second window", () => {
    const code = generateTotpCode(secret);
    const firstCheck = verifyTotpCode(code, secret);
    assert.strictEqual(firstCheck.valid, true);

    // Replay with the same timestep recorded as lastUsedTimestep
    const replayCheck = verifyTotpCode(code, secret, firstCheck.currentTimestep);
    assert.strictEqual(replayCheck.valid, false, "Replay code must be rejected");
  });

  test("Generates and verifies single-use hashed backup codes", () => {
    const codes = generateBackupCodes(8);
    assert.strictEqual(codes.length, 8);

    const hashedCodes = codes.map((c) => hashBackupCode(c));
    const firstCode = codes[0];

    const match = verifyBackupCode(firstCode, hashedCodes);
    assert.strictEqual(match.valid, true);

    const wrongMatch = verifyBackupCode("INVALID-CODE-99", hashedCodes);
    assert.strictEqual(wrongMatch.valid, false);
  });
});

describe("3. Strict RBAC & Facility Scoping", () => {
  test("Enforces MFA requirement on Doctors, Facility Admins, and Platform Admins", () => {
    assert.strictEqual(isMfaRequired("doctor"), true);
    assert.strictEqual(isMfaRequired("facility_admin"), true);
    assert.strictEqual(isMfaRequired("platform_admin"), true);
    assert.strictEqual(isMfaRequired("patient"), false);
    assert.strictEqual(isMfaRequired("frontdesk"), false);
  });

  test("Restricts staff facility scoping", () => {
    const ridgeStaff = {
      id: "usr-frontdesk-1",
      email: "staff@ridge.gov.gh",
      role: "frontdesk" as const,
      facilityId: "fac-ridge",
    };

    assert.strictEqual(canAccessFacility(ridgeStaff, "fac-ridge"), true);
    assert.strictEqual(canAccessFacility(ridgeStaff, "fac-korle-bu"), false);

    const platformAdmin = {
      id: "usr-admin-1",
      email: "director@gov.gh",
      role: "platform_admin" as const,
    };
    assert.strictEqual(canAccessFacility(platformAdmin, "fac-korle-bu"), true);
  });

  test("Restricts patient from accessing another patient's data", () => {
    const patientUser = {
      id: "usr-patient-1",
      email: "pat1@example.com",
      role: "patient" as const,
    };

    assert.strictEqual(canAccessPatientData(patientUser, "usr-patient-1"), true);
    assert.strictEqual(canAccessPatientData(patientUser, "usr-patient-2"), false);
  });
});

describe("4. Privacy-First Messaging Content Compliance (Act 843)", () => {
  test("Ensures no medical diagnoses, doctor notes, or payment requests are ever transmitted", () => {
    const payload = {
      patientId: "usr-pat-1",
      phone: "+233244123456",
      clinicName: "Ridge Hospital",
      date: "15 Nov 2026",
      time: "09:30",
      referenceCode: "GH-84920",
      actionUrl: "https://clinic.gov.gh/appointments",
      eventType: "booked" as const,
    };

    const message = buildPrivacyCompliantMessage(payload);

    assert.strictEqual(message.includes("GH-84920"), true);
    assert.strictEqual(message.includes("Ridge Hospital"), true);
    assert.strictEqual(message.includes("Mobile Money"), true); // in the scam warning context
    assert.strictEqual(message.includes("diagnosis"), false);
    assert.strictEqual(message.includes("prescription"), false);
    assert.strictEqual(message.includes("HIV"), false);
    assert.strictEqual(message.includes("cancer"), false);
  });
});

describe("5. Ghanaian Format Validation Schemas", () => {
  test("Validates valid Ghanaian phone numbers", () => {
    assert.strictEqual(ghanaPhoneSchema.safeParse("+233244123456").success, true);
    assert.strictEqual(ghanaPhoneSchema.safeParse("0244123456").success, true);
    assert.strictEqual(ghanaPhoneSchema.safeParse("0551234567").success, true);
    assert.strictEqual(ghanaPhoneSchema.safeParse("0201234567").success, true);

    // Invalid numbers
    assert.strictEqual(ghanaPhoneSchema.safeParse("123456").success, false);
    assert.strictEqual(ghanaPhoneSchema.safeParse("0123456789").success, false);
  });

  test("Validates Ghana Card format (GHA-XXXXXXXXX-X)", () => {
    assert.strictEqual(ghanaCardSchema.safeParse("GHA-123456789-0").success, true);
    assert.strictEqual(ghanaCardSchema.safeParse("GHA-726491029-4").success, true);
    assert.strictEqual(ghanaCardSchema.safeParse("INVALID-CARD").success, false);
  });

  test("Validates 8-digit NHIS ID", () => {
    assert.strictEqual(nhisSchema.safeParse("84920193").success, true);
    assert.strictEqual(nhisSchema.safeParse("1234").success, false);
  });
});

describe("6. Core Appointment Flow & Double-Booking Prevention", () => {
  const store = getDataStore();
  const testActor = {
    id: "usr-patient-1",
    email: "kwame@example.com",
    role: "patient" as const,
  };

  test("Creates appointment, increments slot booked count, and assigns unique GH-XXXXX code", () => {
    // Generate fresh test slots
    const slots = store.generateSlots(
      {
        facilityId: "fac-ridge",
        serviceId: "srv-rd-opd",
        date: "2026-11-20",
        startHour: 9,
        endHour: 10,
        slotDurationMinutes: 20,
        capacityPerSlot: 1,
      },
      { id: "admin-1", email: "admin@ridge.local", role: "facility_admin", facilityId: "fac-ridge" }
    );

    const targetSlot = slots[0];
    assert.strictEqual(targetSlot.bookedCount, 0);

    const { appointment, referenceCode } = store.createAppointment(
      {
        facilityId: "fac-ridge",
        serviceId: "srv-rd-opd",
        slotId: targetSlot.id,
        patientId: testActor.id,
      },
      testActor
    );

    assert.strictEqual(referenceCode.startsWith("GH-"), true);
    assert.strictEqual(targetSlot.bookedCount, 1);

    // Test Double-Booking Prevention: attempting to book again must fail
    assert.throws(
      () => {
        store.createAppointment(
          {
            facilityId: "fac-ridge",
            serviceId: "srv-rd-opd",
            slotId: targetSlot.id,
            patientId: "usr-other-patient",
          },
          testActor
        );
      },
      /already booked to full capacity/
    );

    // Test Slot Release on Cancellation: cancelling appointment must free the slot
    store.updateAppointmentStatus(appointment.id, "cancelled", testActor);
    assert.strictEqual(targetSlot.bookedCount, 0, "Slot must be freed upon cancellation");
  });
});

