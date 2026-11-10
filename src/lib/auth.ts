import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { SessionUser, UserRole } from "./types";
import { encrypt, decrypt } from "./crypto";

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "development-jwt-secret-key-32-chars-long-for-testing"
);

// --- Password Hashing ---
export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

// --- TOTP RFC 6238 Implementation (Zero-dependency & RFC 6238 compliant) ---
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateBase32Secret(length = 20): string {
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < bytes.length; i++) {
    result += BASE32_CHARS[bytes[i] % 32];
  }
  return result;
}

function base32ToBuffer(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/=+$/, "");
  let bits = "";
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_CHARS.indexOf(clean.charAt(i));
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }
  return Buffer.from(bytes);
}

export function generateTotpCode(secretBase32: string, timeStepWindow = 0): string {
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / 30) + timeStepWindow;
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeBigInt64BE(BigInt(timeStep));

  const secretBuffer = base32ToBuffer(secretBase32);
  const hmac = crypto.createHmac("sha1", secretBuffer);
  hmac.update(timeBuffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0xf;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, "0");
}

/**
 * Verify TOTP code allowing ±1 step clock drift (previous, current, next 30s)
 * Rejects replay if matching step <= lastUsedTimestep
 */
export function verifyTotpCode(
  inputCode: string,
  secretBase32: string,
  lastUsedTimestep?: number | null
): { valid: boolean; currentTimestep: number } {
  const epoch = Math.floor(Date.now() / 1000);
  const currentStep = Math.floor(epoch / 30);

  // Check windows: 0 (current), -1 (30s ago), +1 (30s future)
  for (const drift of [0, -1, 1]) {
    const step = currentStep + drift;
    if (lastUsedTimestep && step <= lastUsedTimestep) {
      continue; // Replay attack prevention: already used in this or earlier window
    }
    const generated = generateTotpCode(secretBase32, drift);
    if (generated === inputCode.trim()) {
      return { valid: true, currentTimestep: step };
    }
  }

  return { valid: false, currentTimestep: currentStep };
}

export function generateOtpAuthUri(email: string, secretBase32: string, issuer = "Ghana Health Service"): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secretBase32}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

// --- Backup Codes Generation & Verification ---
export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const raw = crypto.randomBytes(5).toString("hex").toUpperCase();
    codes.push(`${raw.slice(0, 5)}-${raw.slice(5)}`);
  }
  return codes;
}

export function hashBackupCode(code: string): string {
  const normalized = code.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

export function verifyBackupCode(inputCode: string, storedHashes: string[]): { valid: boolean; matchedHash?: string } {
  const hash = hashBackupCode(inputCode);
  const match = storedHashes.find((h) => h === hash);
  return { valid: !!match, matchedHash: match };
}

// --- JWT Session Tokens ---
export async function createSessionToken(user: SessionUser): Promise<string> {
  return await new SignJWT({
    id: user.id,
    email: user.email,
    role: user.role,
    facilityId: user.facilityId || null,
    facilityName: user.facilityName || null,
    fullName: user.fullName || null,
    isMfaEnrolled: user.isMfaEnrolled || false,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SESSION_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    return {
      id: payload.id as string,
      email: payload.email as string,
      role: payload.role as UserRole,
      facilityId: (payload.facilityId as string) || null,
      facilityName: (payload.facilityName as string) || null,
      fullName: (payload.fullName as string) || null,
      isMfaEnrolled: !!payload.isMfaEnrolled,
    };
  } catch {
    return null;
  }
}
