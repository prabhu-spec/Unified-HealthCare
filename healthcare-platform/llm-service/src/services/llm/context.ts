import axios from "axios";
import type { JwtPayload } from "../jwt.js";

const MAIN_API_URL = (process.env.MAIN_API_URL || "http://127.0.0.1:5000").replace(/\/$/, "");

export async function fetchPatientContext(patientId: string, authHeader: string | undefined): Promise<unknown> {
  const id = patientId.replace(/^Patient\//, "");
  const res = await axios.get(`${MAIN_API_URL}/api/core/patients/${encodeURIComponent(id)}/ai-context`, {
    headers: {
      Authorization: authHeader || "",
      "Content-Type": "application/json",
    },
    timeout: 15000,
    validateStatus: () => true,
  });

  if (res.status === 403) {
    throw Object.assign(new Error("You do not have access to this patient."), { status: 403 });
  }
  if (res.status === 404) {
    throw Object.assign(new Error("Patient not found."), { status: 404 });
  }
  if (res.status >= 400) {
    throw Object.assign(new Error(res.data?.error || "Failed to load patient context from main API."), {
      status: res.status,
    });
  }

  return res.data?.data ?? res.data;
}

export function assertPatientAccess(claims: JwtPayload | undefined, patientId: string): void {
  if (!claims) return;
  const role = claims.role.toLowerCase();
  const normalizedId = patientId.replace(/^Patient\//, "");
  const ownPatientId = claims.patientId?.replace(/^Patient\//, "");

  const staffRoles = ["doctor", "nurse", "hospital_admin", "super_admin"];
  if (staffRoles.includes(role)) return;

  if (role === "patient") {
    if (ownPatientId && ownPatientId !== normalizedId) {
      throw Object.assign(new Error("Patients may only use AI Assist for their own records."), { status: 403 });
    }
    return;
  }

  throw Object.assign(new Error("Your role cannot access patient AI summaries."), { status: 403 });
}

export function canUseClinicalSummary(role: string | undefined): boolean {
  if (!role) return false;
  return ["doctor", "nurse", "hospital_admin", "super_admin", "patient"].includes(role.toLowerCase());
}
