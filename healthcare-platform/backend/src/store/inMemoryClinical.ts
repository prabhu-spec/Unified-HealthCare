/**
 * In-memory clinical data for Phase LLM-3 (shared by coreCare ai-context + clinical routes).
 */
import type express from "express";

export interface InMemoryAllergy {
  id: string;
  patientId: string;
  allergen: string;
  reaction?: string;
  severity: string;
  category: string;
  status: string;
}

export interface InMemoryProblem {
  id: string;
  patientId: string;
  code?: string;
  description: string;
  status: string;
  onsetDate?: string;
  notes?: string;
}

export const inMemoryAllergies: InMemoryAllergy[] = [
  { id: "al-1", patientId: "patient-1", allergen: "Penicillin", reaction: "Rash", severity: "moderate", category: "drug", status: "active" },
  { id: "al-2", patientId: "patient-1", allergen: "Shellfish", reaction: "Hives", severity: "mild", category: "food", status: "active" },
  { id: "al-3", patientId: "patient-2", allergen: "Latex", reaction: "Contact dermatitis", severity: "mild", category: "environmental", status: "active" },
];

export const inMemoryProblems: InMemoryProblem[] = [
  { id: "pb-1", patientId: "patient-1", code: "I10", description: "Essential hypertension", status: "active", onsetDate: "2020-03-01", notes: "On ACE inhibitor" },
  { id: "pb-2", patientId: "patient-1", code: "J06.9", description: "Acute upper respiratory infection", status: "active", onsetDate: "2026-05-20", notes: "Under evaluation" },
  { id: "pb-3", patientId: "patient-2", code: "E11.9", description: "Type 2 diabetes mellitus", status: "active", onsetDate: "2019-08-15", notes: "Diet controlled" },
];

let nextAllergyId = 10;
let nextProblemId = 10;

type PatientRow = Record<string, unknown> & { id: string; hospitalId?: string };

let patientsRef: PatientRow[] = [];

export function bindInMemoryPatients(patients: PatientRow[]) {
  patientsRef = patients;
}

function getRole(req: express.Request): string | null {
  return (req.headers["x-role"] as string) ?? null;
}

function getHospitalId(req: express.Request): string | null {
  return (req.headers["x-hospital-id"] as string) ?? null;
}

function getPatientIdHeader(req: express.Request): string | null {
  return (req.headers["x-patient-id"] as string) ?? null;
}

export function getInMemoryPatient(req: express.Request, patientId: string): PatientRow | undefined {
  const role = getRole(req);
  const hospitalId = getHospitalId(req);
  const ownPatientId = getPatientIdHeader(req);

  let list = patientsRef;
  if (role === "patient" && ownPatientId) {
    list = list.filter((p) => p.id === ownPatientId);
  } else if (["doctor", "hospital_admin", "nurse"].includes(role || "") && hospitalId) {
    list = list.filter((p) => p.hospitalId === hospitalId);
  }

  return list.find((p) => p.id === patientId);
}

function extractClinicalProfile(patient: PatientRow) {
  return {
    weightKg: patient.weightKg ?? null,
    heightCm: patient.heightCm ?? null,
    bloodType: patient.bloodType ?? null,
    chiefComplaint: patient.chiefComplaint ?? null,
    pregnancyStatus: patient.pregnancyStatus ?? null,
    eGFR: patient.eGFR ?? null,
    creatinine: patient.creatinine ?? null,
    smokingStatus: patient.smokingStatus ?? null,
    alcoholUse: patient.alcoholUse ?? null,
    codeStatus: patient.codeStatus ?? null,
  };
}

export function getInMemoryClinicalBundle(req: express.Request, patientId: string) {
  const patient = getInMemoryPatient(req, patientId);
  if (!patient) return null;
  return {
    clinicalProfile: extractClinicalProfile(patient),
    allergies: inMemoryAllergies.filter((a) => a.patientId === patientId),
    problems: inMemoryProblems.filter((p) => p.patientId === patientId),
  };
}

export function updateInMemoryClinicalProfile(req: express.Request, patientId: string, body: Record<string, unknown>) {
  const patient = getInMemoryPatient(req, patientId);
  if (!patient) return null;

  const keys = [
    "weightKg", "heightCm", "bloodType", "chiefComplaint", "pregnancyStatus",
    "eGFR", "creatinine", "smokingStatus", "alcoholUse", "codeStatus",
  ] as const;

  for (const key of keys) {
    if (body[key] !== undefined) {
      if (body[key] === null || body[key] === "") {
        delete patient[key];
      } else if (key === "weightKg" || key === "heightCm" || key === "eGFR" || key === "creatinine") {
        patient[key] = Number(body[key]);
      } else {
        patient[key] = String(body[key]);
      }
    }
  }

  return extractClinicalProfile(patient);
}

export function createInMemoryAllergy(req: express.Request, patientId: string, body: Record<string, unknown>) {
  if (!getInMemoryPatient(req, patientId)) return null;
  if (!body.allergen) return { error: "allergen is required." };

  const row: InMemoryAllergy = {
    id: `al-${nextAllergyId++}`,
    patientId,
    allergen: String(body.allergen),
    reaction: body.reaction ? String(body.reaction) : undefined,
    severity: String(body.severity || "moderate"),
    category: String(body.category || "drug"),
    status: String(body.status || "active"),
  };
  inMemoryAllergies.push(row);
  return row;
}

export function updateInMemoryAllergy(
  req: express.Request,
  patientId: string,
  allergyId: string,
  body: Record<string, unknown>
) {
  if (!getInMemoryPatient(req, patientId)) return null;
  const row = inMemoryAllergies.find((a) => a.id === allergyId && a.patientId === patientId);
  if (!row) return null;

  if (body.allergen !== undefined) row.allergen = String(body.allergen);
  if (body.reaction !== undefined) row.reaction = body.reaction ? String(body.reaction) : undefined;
  if (body.severity !== undefined) row.severity = String(body.severity);
  if (body.category !== undefined) row.category = String(body.category);
  if (body.status !== undefined) row.status = String(body.status);
  return row;
}

export function deleteInMemoryAllergy(req: express.Request, patientId: string, allergyId: string) {
  if (!getInMemoryPatient(req, patientId)) return false;
  const idx = inMemoryAllergies.findIndex((a) => a.id === allergyId && a.patientId === patientId);
  if (idx === -1) return false;
  inMemoryAllergies.splice(idx, 1);
  return true;
}

export function createInMemoryProblem(req: express.Request, patientId: string, body: Record<string, unknown>) {
  if (!getInMemoryPatient(req, patientId)) return null;
  if (!body.description) return { error: "description is required." };

  const row: InMemoryProblem = {
    id: `pb-${nextProblemId++}`,
    patientId,
    code: body.code ? String(body.code) : undefined,
    description: String(body.description),
    status: String(body.status || "active"),
    onsetDate: body.onsetDate ? String(body.onsetDate) : undefined,
    notes: body.notes ? String(body.notes) : undefined,
  };
  inMemoryProblems.push(row);
  return row;
}

export function updateInMemoryProblem(
  req: express.Request,
  patientId: string,
  problemId: string,
  body: Record<string, unknown>
) {
  if (!getInMemoryPatient(req, patientId)) return null;
  const row = inMemoryProblems.find((p) => p.id === problemId && p.patientId === patientId);
  if (!row) return null;

  if (body.code !== undefined) row.code = body.code ? String(body.code) : undefined;
  if (body.description !== undefined) row.description = String(body.description);
  if (body.status !== undefined) row.status = String(body.status);
  if (body.onsetDate !== undefined) row.onsetDate = body.onsetDate ? String(body.onsetDate) : undefined;
  if (body.notes !== undefined) row.notes = body.notes ? String(body.notes) : undefined;
  return row;
}

export function deleteInMemoryProblem(req: express.Request, patientId: string, problemId: string) {
  if (!getInMemoryPatient(req, patientId)) return false;
  const idx = inMemoryProblems.findIndex((p) => p.id === problemId && p.patientId === patientId);
  if (idx === -1) return false;
  inMemoryProblems.splice(idx, 1);
  return true;
}
