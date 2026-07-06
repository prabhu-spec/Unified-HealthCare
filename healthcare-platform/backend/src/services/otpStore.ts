/**
 * In-memory OTP store for password reset, password change, and account deletion.
 * For production, use Redis or a database with TTL.
 */
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export type OtpType = "password_reset" | "password_change" | "delete_account";

interface OtpEntry {
  otp: string;
  expiresAt: number;
  type: OtpType;
  meta?: { firstName?: string };
}

const store = new Map<string, OtpEntry>();

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function cleanup(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}

export function createOtp(
  email: string,
  type: OtpType,
  meta?: { firstName?: string }
): string {
  cleanup();
  const normalized = email.toLowerCase().trim();
  const otp = generateOtp();
  store.set(normalized, {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    type,
    meta,
  });
  return otp;
}

export function verifyOtp(
  email: string,
  otp: string,
  type: OtpType
): boolean {
  cleanup();
  const normalized = email.toLowerCase().trim();
  const entry = store.get(normalized);
  if (!entry || entry.type !== type || entry.otp !== otp || entry.expiresAt <= Date.now()) {
    return false;
  }
  store.delete(normalized);
  return true;
}

export function getOtpMeta(email: string): { firstName?: string } | null {
  const normalized = email.toLowerCase().trim();
  const entry = store.get(normalized);
  return entry?.meta ?? null;
}
