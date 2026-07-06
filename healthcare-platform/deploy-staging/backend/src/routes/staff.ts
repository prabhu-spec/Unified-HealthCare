import express from "express";
import {
  createStaff,
  findStaffByEmail,
  listStaff,
  staffToAuthUser,
  updateStaff,
  type StaffRole,
} from "../services/staffStore.js";
import { setPasswordOverride } from "../services/userStore.js";

const router = express.Router();
type Request = express.Request;
type Response = express.Response;

function getRole(req: Request): string | null {
  return (req.headers["x-role"] as string) ?? null;
}

function getHospitalId(req: Request): string | null {
  return (req.headers["x-hospital-id"] as string) ?? null;
}

function canManageUsers(role: string | null): boolean {
  return role === "super_admin" || role === "hospital_admin";
}

const ALLOWED_CREATE_ROLES: Record<string, StaffRole[]> = {
  super_admin: ["hospital_admin", "doctor", "nurse", "patient", "medical_vendor", "bloodbank_admin", "insurance_provider"],
  hospital_admin: ["doctor", "nurse", "patient"],
};

router.get("/api/staff/users", async (req: Request, res: Response) => {
  const role = getRole(req);
  if (!canManageUsers(role)) return res.status(403).json({ error: "Forbidden." });
  const hospitalId = role === "hospital_admin" ? getHospitalId(req) : (req.query.hospitalId as string) || undefined;
  const rows = await listStaff({ hospitalId: hospitalId || undefined });
  res.json({ data: rows });
});

router.post("/api/staff/users", async (req: Request, res: Response) => {
  const role = getRole(req);
  if (!canManageUsers(role)) return res.status(403).json({ error: "Forbidden." });
  const { email, password, firstName, lastName, staffRole, hospitalId, specialization, patientId } = req.body || {};
  if (!email || !password || !firstName || !lastName || !staffRole) {
    return res.status(400).json({ error: "email, password, firstName, lastName, and staffRole are required." });
  }
  const allowed = ALLOWED_CREATE_ROLES[role || ""] || [];
  if (!allowed.includes(staffRole)) {
    return res.status(403).json({ error: `Your role cannot create ${staffRole} accounts.` });
  }
  const resolvedHospital =
    role === "hospital_admin" ? getHospitalId(req) || undefined : hospitalId ? String(hospitalId) : undefined;
  if ((staffRole === "doctor" || staffRole === "nurse") && !resolvedHospital) {
    return res.status(400).json({ error: "hospitalId is required for clinical staff." });
  }
  try {
    const row = await createStaff({
      email: String(email),
      password: String(password),
      firstName: String(firstName),
      lastName: String(lastName),
      role: staffRole as StaffRole,
      hospitalId: resolvedHospital,
      patientId: patientId ? String(patientId) : undefined,
      specialization: specialization ? String(specialization) : undefined,
    });
    await setPasswordOverride(String(email), String(password));
    const { password: _, ...safe } = row;
    res.status(201).json({ data: safe });
  } catch (e) {
    if ((e as Error).message === "email_exists") return res.status(409).json({ error: "Email already registered." });
    throw e;
  }
});

router.patch("/api/staff/users/:email", async (req: Request, res: Response) => {
  const role = getRole(req);
  if (!canManageUsers(role)) return res.status(403).json({ error: "Forbidden." });
  const target = await findStaffByEmail(req.params.email);
  if (!target) return res.status(404).json({ error: "User not found." });
  if (role === "hospital_admin" && target.hospitalId !== getHospitalId(req)) {
    return res.status(403).json({ error: "Forbidden." });
  }
  const updated = await updateStaff(req.params.email, req.body || {});
  if (!updated) return res.status(404).json({ error: "User not found." });
  if (req.body?.password) await setPasswordOverride(updated.email, String(req.body.password));
  const { password: _, ...safe } = updated;
  res.json({ data: safe });
});

export default router;
