/**
 * Phase LLM-2 — structured patient context packet for AI Assist.
 */
import type { Scope } from "../db/repositories/coreCare.js";
import { getScope } from "../db/requestScope.js";
import { useDatabase } from "../db/client.js";
import * as aiContextDb from "../db/repositories/aiContext.js";
import { vitalsLatest } from "../telemetry/store.js";
import type express from "express";

export interface PatientAiContextPacket {
  meta: {
    patientId: string;
    generatedAt: string;
    sources: string[];
  };
  demographics: Record<string, unknown>;
  visit: Record<string, unknown>;
  allergies: unknown[];
  activeProblems: unknown[];
  medications: unknown[];
  labsAndRecords: unknown[];
  history: unknown[];
  vitals: { latest: unknown | null; recentTrend: unknown[] };
  appointments: { upcoming: unknown[]; recent: unknown[] };
  safetyFlags: Record<string, unknown>;
  clinicalNotes: Record<string, unknown>;
}

function calcAge(birthDate: string | undefined): number | null {
  if (!birthDate) return null;
  const dob = new Date(birthDate);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

function calcBmi(weightKg?: number | null, heightCm?: number | null): number | null {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

export function assembleAiContextPacket(input: {
  patientId: string;
  patient: Record<string, unknown>;
  clinical?: Record<string, unknown>;
  allergies?: unknown[];
  problems?: unknown[];
  medications?: unknown[];
  records?: unknown[];
  history?: unknown[];
  appointments?: unknown[];
  latestVitals?: unknown | null;
  vitalsTrend?: unknown[];
}): PatientAiContextPacket {
  const patient = input.patient;
  const clinical = input.clinical || {};
  const birthDate = (patient.birthDate as string) || undefined;
  const weightKg = clinical.weightKg as number | undefined;
  const heightCm = clinical.heightCm as number | undefined;
  const sources: string[] = ["patient"];

  if ((input.allergies?.length ?? 0) > 0) sources.push("allergies");
  if ((input.problems?.length ?? 0) > 0) sources.push("problems");
  if ((input.medications?.length ?? 0) > 0) sources.push("medications");
  if ((input.records?.length ?? 0) > 0) sources.push("records");
  if ((input.history?.length ?? 0) > 0) sources.push("history");
  if (input.latestVitals) sources.push("vitals");
  if ((input.appointments?.length ?? 0) > 0) sources.push("appointments");

  const today = new Date().toISOString().slice(0, 10);
  const appts = input.appointments || [];
  const upcoming = appts.filter((a) => {
    const row = a as { date?: string; status?: string };
    return row.date && row.date >= today && row.status !== "Completed" && row.status !== "Rejected";
  });
  const recent = appts.filter((a) => {
    const row = a as { date?: string };
    return row.date && row.date < today;
  }).slice(0, 5);

  return {
    meta: {
      patientId: input.patientId,
      generatedAt: new Date().toISOString(),
      sources,
    },
    demographics: {
      name: patient.name,
      gender: patient.gender,
      birthDate,
      age: calcAge(birthDate),
      bloodType: clinical.bloodType ?? null,
      weightKg: weightKg ?? null,
      heightCm: heightCm ?? null,
      bmi: calcBmi(weightKg, heightCm),
      mrn: (patient.identifier as { value?: string }[])?.[0]?.value ?? null,
    },
    visit: {
      status: patient.visitStatus,
      room: patient.room ?? null,
      chiefComplaint: clinical.chiefComplaint ?? null,
      admittedAt: patient.admittedAt ?? null,
      dischargedAt: patient.dischargedAt ?? null,
      lastConsultAt: patient.lastConsultAt ?? null,
    },
    allergies: input.allergies || [],
    activeProblems: input.problems || [],
    medications: input.medications || [],
    labsAndRecords: (input.records || []).slice(0, 20),
    history: (input.history || []).slice(0, 10),
    vitals: {
      latest: input.latestVitals ?? null,
      recentTrend: (input.vitalsTrend || []).slice(0, 10),
    },
    appointments: { upcoming, recent },
    safetyFlags: {
      pregnancyStatus: clinical.pregnancyStatus ?? null,
      eGFR: clinical.eGFR ?? null,
      creatinine: clinical.creatinine ?? null,
      smokingStatus: clinical.smokingStatus ?? null,
      alcoholUse: clinical.alcoholUse ?? null,
      codeStatus: clinical.codeStatus ?? null,
    },
    clinicalNotes: {
      consultNotes: patient.consultNotes ?? null,
    },
  };
}

export async function buildPatientAiContextFromDb(patientId: string, scope: Scope): Promise<PatientAiContextPacket | null> {
  const raw = await aiContextDb.loadAiContextRaw(patientId, scope);
  if (!raw) return null;

  const latestVitals = vitalsLatest.get(patientId) ?? raw.vitalsLatest ?? null;

  return assembleAiContextPacket({
    patientId,
    patient: raw.patient,
    clinical: raw.clinical,
    allergies: raw.allergies,
    problems: raw.problems,
    medications: raw.medications,
    records: raw.records,
    history: raw.history,
    appointments: raw.appointments,
    latestVitals,
    vitalsTrend: raw.vitalsTrend,
  });
}

export async function getPatientAiContext(req: express.Request, patientId: string): Promise<PatientAiContextPacket | null> {
  if (useDatabase()) {
    return buildPatientAiContextFromDb(patientId, getScope(req));
  }
  return null;
}
