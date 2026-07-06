/**
 * Auth API – login, forgot password, reset password, change password (OTP), delete account (OTP), forgot email.
 */
import express from "express";
import { useDatabase } from "../db/client.js";
import { signAccessToken, extractBearerToken, verifyAccessToken } from "../services/jwt.js";
import { findUserByEmail } from "../db/repositories/users.js";
import { isDeleted, setDeleted, getPasswordOverride, setPasswordOverride } from "../services/userStore.js";
import { findStaffByEmail, staffToAuthUser, loginStaffOrDemo } from "../services/staffStore.js";
import { createOtp, verifyOtp } from "../services/otpStore.js";
import {
  sendPasswordResetOTP,
  sendPasswordChangeOTP,
  sendDeleteAccountOTP,
  sendEmailReminder,
  sendAccountChangeNotification,
} from "../services/email.js";

const router = express.Router();
type Request = express.Request;
type Response = express.Response;

const DEMO_CREDENTIALS: { email: string; password: string; user: Record<string, unknown> }[] = [
  { email: "superadmin@demo.com", password: "demo123", user: { id: "u-super", email: "superadmin@demo.com", firstName: "Super", lastName: "Admin", role: "super_admin", hospitalId: undefined, patientId: undefined, isVerified: true, createdAt: "", lastLogin: "" } },
  { email: "insurance@demo.com", password: "demo123", user: { id: "u-ins", email: "insurance@demo.com", firstName: "Insurance", lastName: "Provider", role: "insurance_provider", hospitalId: undefined, patientId: undefined, isVerified: true, createdAt: "", lastLogin: "" } },
  { email: "vendor@demo.com", password: "demo123", user: { id: "u-vendor", email: "vendor@demo.com", firstName: "Medical", lastName: "Vendor", role: "medical_vendor", hospitalId: undefined, patientId: undefined, isVerified: true, createdAt: "", lastLogin: "" } },
  { email: "hospitaladmin@demo.com", password: "demo123", user: { id: "u-ha1", email: "hospitaladmin@demo.com", firstName: "Hospital", lastName: "Admin", role: "hospital_admin", hospitalId: "org-1", patientId: undefined, isVerified: true, createdAt: "", lastLogin: "" } },
  { email: "hospitaladmin2@demo.com", password: "demo123", user: { id: "u-ha2", email: "hospitaladmin2@demo.com", firstName: "Admin", lastName: "Two", role: "hospital_admin", hospitalId: "org-2", patientId: undefined, isVerified: true, createdAt: "", lastLogin: "" } },
  { email: "doctor@demo.com", password: "demo123", user: { id: "u-doc", email: "doctor@demo.com", firstName: "Dr. Sarah", lastName: "Johnson", role: "doctor", hospitalId: "org-1", patientId: undefined, specialization: "general", gender: "female", bloodType: "O+", isVerified: true, createdAt: "", lastLogin: "" } },
  { email: "nurse@demo.com", password: "demo123", user: { id: "u-nurse", email: "nurse@demo.com", firstName: "Jane", lastName: "Miller", role: "nurse", hospitalId: "org-1", patientId: undefined, isVerified: true, createdAt: "", lastLogin: "" } },
  { email: "patient@demo.com", password: "demo123", user: { id: "u-pat", email: "patient@demo.com", firstName: "John", lastName: "Doe", role: "patient", hospitalId: undefined, patientId: "patient-1", gender: "male", bloodType: "A+", isVerified: true, createdAt: "", lastLogin: "" } },
  { email: "bloodbank@demo.com", password: "demo123", user: { id: "u-bb", email: "bloodbank@demo.com", firstName: "Blood", lastName: "Bank Admin", role: "bloodbank_admin", hospitalId: undefined, patientId: undefined, isVerified: true, createdAt: "", lastLogin: "" } },
];

function getDemoEntry(email: string) {
  return DEMO_CREDENTIALS.find((c) => c.email.toLowerCase() === String(email).toLowerCase().trim());
}

async function getEffectivePassword(email: string): Promise<string | null> {
  if (useDatabase()) {
    const user = await findUserByEmail(email);
    return user && !user.isDeleted ? user.password : null;
  }
  const override = await getPasswordOverride(email);
  if (override) return override;
  const entry = getDemoEntry(email);
  return entry ? entry.password : null;
}

async function getFirstName(email: string): Promise<string | undefined> {
  if (useDatabase()) {
    const u = await findUserByEmail(email);
    return u?.firstName;
  }
  const entry = getDemoEntry(email);
  return entry ? (entry.user as Record<string, unknown>).firstName as string : undefined;
}

router.post("/api/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Email and password required." });
  }
  const normalized = String(email).toLowerCase().trim();
  if (await isDeleted(normalized)) {
    return res.status(401).json({ success: false, error: "This account has been deleted." });
  }
  const effective = await getEffectivePassword(normalized);
  if (!effective || effective !== password) {
    return res.status(401).json({ success: false, error: "Invalid email or password." });
  }

  let user: Record<string, unknown> | null = null;

  if (useDatabase()) {
    user = await loginStaffOrDemo(normalized, password);
  } else {
    const entry = getDemoEntry(email);
    const staff = await findStaffByEmail(normalized);
    user = entry
      ? { ...entry.user, lastLogin: new Date().toISOString(), createdAt: (entry.user as Record<string, unknown>).createdAt || new Date().toISOString() }
      : staff
        ? staffToAuthUser({ ...staff, password: effective })
        : null;
  }

  if (!user) {
    return res.status(401).json({ success: false, error: "Invalid email or password." });
  }

  const token = signAccessToken({
    id: String(user.id),
    email: String(user.email),
    role: String(user.role),
    hospitalId: user.hospitalId as string | undefined,
    patientId: user.patientId as string | undefined,
  });
  res.json({ success: true, user, token, expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
});

router.get("/api/auth/me", (req: Request, res: Response) => {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) return res.status(401).json({ error: "Bearer token required." });
  const claims = verifyAccessToken(token);
  if (!claims) return res.status(401).json({ error: "Invalid or expired token." });
  res.json({
    user: {
      id: claims.sub,
      email: claims.email,
      role: claims.role,
      hospitalId: claims.hospitalId,
      patientId: claims.patientId,
    },
  });
});

router.get("/api/auth/check", (req: Request, res: Response) => {
  const token = extractBearerToken(req.headers.authorization);
  if (token) {
    const claims = verifyAccessToken(token);
    if (!claims) {
      return res.status(401).json({ ok: false, error: "Invalid or expired token." });
    }
    return res.json({
      ok: true,
      database: useDatabase(),
      jwt: true,
      user: {
        id: claims.sub,
        email: claims.email,
        role: claims.role,
        hospitalId: claims.hospitalId,
        patientId: claims.patientId,
      },
    });
  }
  res.json({ ok: true, database: useDatabase(), jwt: false });
});

router.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body || {};
  const normalized = (email && String(email).trim()) || "";
  if (!normalized) {
    return res.status(400).json({ success: false, error: "Email is required." });
  }
  const firstName = await getFirstName(normalized);
  const otp = createOtp(normalized, "password_reset", { firstName });
  const result = await sendPasswordResetOTP({ to: normalized, otp, firstName });
  if (!result.success) {
    return res.status(500).json({ success: false, error: result.error || "Failed to send email." });
  }
  res.json({ success: true, message: "If an account exists with this email, a code has been sent." });
});

router.post("/api/auth/reset-password", async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body || {};
  const normalized = (email && String(email).trim()) || "";
  if (!normalized || !otp || !newPassword) {
    return res.status(400).json({ success: false, error: "Email, OTP, and new password are required." });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ success: false, error: "Password must be at least 6 characters." });
  }
  if (!verifyOtp(normalized, String(otp).trim(), "password_reset")) {
    return res.status(400).json({ success: false, error: "Invalid or expired code." });
  }
  await setPasswordOverride(normalized, newPassword);
  res.json({ success: true, message: "Password has been reset. You can sign in with your new password." });
});

router.post("/api/auth/request-password-change-otp", async (req: Request, res: Response) => {
  const { email } = req.body || {};
  const normalized = (email && String(email).trim()) || "";
  if (!normalized) {
    return res.status(400).json({ success: false, error: "Email is required." });
  }
  const firstName = await getFirstName(normalized);
  const otp = createOtp(normalized, "password_change", { firstName });
  const result = await sendPasswordChangeOTP({ to: normalized, otp, firstName });
  if (!result.success) {
    return res.status(500).json({ success: false, error: result.error || "Failed to send email." });
  }
  res.json({ success: true, message: "A verification code has been sent to your email." });
});

router.post("/api/auth/change-password", async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body || {};
  const normalized = (email && String(email).trim()) || "";
  if (!normalized || !otp || !newPassword) {
    return res.status(400).json({ success: false, error: "Email, OTP, and new password are required." });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ success: false, error: "Password must be at least 6 characters." });
  }
  if (!verifyOtp(normalized, String(otp).trim(), "password_change")) {
    return res.status(400).json({ success: false, error: "Invalid or expired code." });
  }
  await setPasswordOverride(normalized, newPassword);
  res.json({ success: true, message: "Password has been updated." });
});

router.post("/api/auth/forgot-email", async (req: Request, res: Response) => {
  const { email } = req.body || {};
  const normalized = (email && String(email).trim()) || "";
  if (!normalized) {
    return res.status(400).json({ success: false, error: "Email is required." });
  }
  const firstName = await getFirstName(normalized);
  const result = await sendEmailReminder({ to: normalized, loginEmail: normalized, firstName });
  if (!result.success) {
    return res.status(500).json({ success: false, error: result.error || "Failed to send email." });
  }
  res.json({ success: true, message: "If an account exists, we sent your login email to that address." });
});

router.post("/api/auth/request-delete-account-otp", async (req: Request, res: Response) => {
  const { email } = req.body || {};
  const normalized = (email && String(email).trim()) || "";
  if (!normalized) {
    return res.status(400).json({ success: false, error: "Email is required." });
  }
  const firstName = await getFirstName(normalized);
  const otp = createOtp(normalized, "delete_account", { firstName });
  const result = await sendDeleteAccountOTP({ to: normalized, otp, firstName });
  if (!result.success) {
    return res.status(500).json({ success: false, error: result.error || "Failed to send email." });
  }
  res.json({ success: true, message: "A verification code has been sent to your email." });
});

router.post("/api/auth/confirm-delete-account", async (req: Request, res: Response) => {
  const { email, otp } = req.body || {};
  const normalized = (email && String(email).trim()) || "";
  if (!normalized || !otp) {
    return res.status(400).json({ success: false, error: "Email and OTP are required." });
  }
  if (!verifyOtp(normalized, String(otp).trim(), "delete_account")) {
    return res.status(400).json({ success: false, error: "Invalid or expired code." });
  }
  await setDeleted(normalized);
  const firstName = await getFirstName(normalized);
  await sendAccountChangeNotification({ to: normalized, changeType: "account_deleted", firstName });
  res.json({ success: true, message: "Your account has been permanently deleted." });
});

export default router;
