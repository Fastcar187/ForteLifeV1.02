import crypto from "crypto";

// Fallback 32-byte key for local dev if not supplied in environment
const DEFAULT_KEY_HEX = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function getEncryptionKey(): Buffer {
  const hexKey = process.env.ENCRYPTION_KEY || DEFAULT_KEY_HEX;
  if (hexKey.length === 64) {
    return Buffer.from(hexKey, "hex");
  }
  // If string is 32 characters, take buffer directly, or hash to 32 bytes
  return crypto.createHash("sha256").update(hexKey).digest();
}

/**
 * AES-256-GCM authenticated encryption for sensitive PII (Phone, NHIS, Ghana Card, TOTP Secrets)
 * Returns format: iv:ciphertext:authTag (all hex-encoded)
 */
export function encrypt(text: string): string {
  if (!text) return "";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // standard 96-bit IV for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

/**
 * AES-256-GCM authenticated decryption
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText || !encryptedText.includes(":")) return "";
  try {
    const [ivHex, ciphertext, tagHex] = encryptedText.split(":");
    if (!ivHex || !ciphertext || !tagHex) return "";

    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));

    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Decryption failed:", err);
    return "";
  }
}

/**
 * Blind Index using HMAC-SHA256 for exact match lookups and rate limiting without exposing plaintext
 */
export function blindIndex(value: string): string {
  if (!value) return "";
  const normalized = value.trim().toLowerCase();
  const key = getEncryptionKey();
  return crypto.createHmac("sha256", key).update(normalized).digest("hex");
}

/**
 * Mask PII for UI display (e.g. +233 ••• ••34 or GHA-••••-1)
 */
export function maskPhone(phone: string): string {
  if (!phone) return "";
  const clean = phone.trim();
  if (clean.length <= 4) return clean;
  const start = clean.slice(0, 4);
  const end = clean.slice(-2);
  return `${start} ••• ••${end}`;
}

export function maskNationalId(id: string): string {
  if (!id) return "";
  const clean = id.trim();
  if (clean.length <= 4) return "••••";
  return `${clean.slice(0, 3)}••••${clean.slice(-3)}`;
}

