import { prisma } from "../client.js";
import type { Scope } from "./coreCare.js";
import { patientClinicalFields } from "../mappers.js";

const CLINICAL_KEYS = [
  "weightKg",
  "heightCm",
  "bloodType",
  "chiefComplaint",
  "pregnancyStatus",
  "eGFR",
  "creatinine",
  "smokingStatus",
  "alcoholUse",
  "codeStatus",
] as const;

function scopePatientWhere(scope: Scope, patientId: string) {
  if (scope.role === "patient" && scope.patientId) {
    return scope.patientId === patientId ? { id: patientId } : { id: "__deny__" };
  }
  if (["doctor", "hospital_admin", "nurse"].includes(scope.role || "") && scope.hospitalId) {
    return { id: patientId, hospitalId: scope.hospitalId };
  }
  if (scope.role === "super_admin") return { id: patientId };
  return { id: "__deny__" };
}

async function assertPatientAccess(patientId: string, scope: Scope) {
  const row = await prisma.patient.findFirst({ where: scopePatientWhere(scope, patientId) });
  return row;
}

function pickClinicalBody(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  for (const key of CLINICAL_KEYS) {
    if (body[key] !== undefined) {
      const val = body[key];
      if (val === null || val === "") {
        data[key] = null;
      } else if (key === "weightKg" || key === "heightCm" || key === "eGFR" || key === "creatinine") {
        data[key] = Number(val);
      } else {
        data[key] = String(val);
      }
    }
  }
  return data;
}

export async function getClinicalBundle(patientId: string, scope: Scope) {
  const patient = await assertPatientAccess(patientId, scope);
  if (!patient) return null;

  const [allergies, problems] = await Promise.all([
    prisma.patientAllergy.findMany({ where: { patientId }, orderBy: { allergen: "asc" } }),
    prisma.patientProblem.findMany({ where: { patientId }, orderBy: { description: "asc" } }),
  ]);

  return {
    clinicalProfile: patientClinicalFields(patient),
    allergies,
    problems,
  };
}

export async function updateClinicalProfile(patientId: string, scope: Scope, body: Record<string, unknown>) {
  const existing = await assertPatientAccess(patientId, scope);
  if (!existing) return null;
  const data = pickClinicalBody(body);
  if (Object.keys(data).length === 0) return patientClinicalFields(existing);

  const row = await prisma.patient.update({ where: { id: patientId }, data });
  return patientClinicalFields(row);
}

export async function createAllergy(patientId: string, scope: Scope, body: Record<string, unknown>) {
  const patient = await assertPatientAccess(patientId, scope);
  if (!patient) return null;
  if (!body.allergen) return { error: "allergen is required." as const };

  const count = await prisma.patientAllergy.count();
  const row = await prisma.patientAllergy.create({
    data: {
      id: `al-${count + 1}-${Date.now()}`,
      patientId,
      allergen: String(body.allergen),
      reaction: body.reaction ? String(body.reaction) : null,
      severity: String(body.severity || "moderate"),
      category: String(body.category || "drug"),
      status: String(body.status || "active"),
    },
  });
  return row;
}

export async function updateAllergy(
  patientId: string,
  allergyId: string,
  scope: Scope,
  body: Record<string, unknown>
) {
  const patient = await assertPatientAccess(patientId, scope);
  if (!patient) return null;

  const existing = await prisma.patientAllergy.findFirst({ where: { id: allergyId, patientId } });
  if (!existing) return null;

  return prisma.patientAllergy.update({
    where: { id: allergyId },
    data: {
      ...(body.allergen !== undefined ? { allergen: String(body.allergen) } : {}),
      ...(body.reaction !== undefined ? { reaction: body.reaction ? String(body.reaction) : null } : {}),
      ...(body.severity !== undefined ? { severity: String(body.severity) } : {}),
      ...(body.category !== undefined ? { category: String(body.category) } : {}),
      ...(body.status !== undefined ? { status: String(body.status) } : {}),
    },
  });
}

export async function deleteAllergy(patientId: string, allergyId: string, scope: Scope) {
  const patient = await assertPatientAccess(patientId, scope);
  if (!patient) return false;
  const existing = await prisma.patientAllergy.findFirst({ where: { id: allergyId, patientId } });
  if (!existing) return false;
  await prisma.patientAllergy.delete({ where: { id: allergyId } });
  return true;
}

export async function createProblem(patientId: string, scope: Scope, body: Record<string, unknown>) {
  const patient = await assertPatientAccess(patientId, scope);
  if (!patient) return null;
  if (!body.description) return { error: "description is required." as const };

  const count = await prisma.patientProblem.count();
  const row = await prisma.patientProblem.create({
    data: {
      id: `pb-${count + 1}-${Date.now()}`,
      patientId,
      code: body.code ? String(body.code) : null,
      description: String(body.description),
      status: String(body.status || "active"),
      onsetDate: body.onsetDate ? String(body.onsetDate) : null,
      notes: body.notes ? String(body.notes) : null,
    },
  });
  return row;
}

export async function updateProblem(
  patientId: string,
  problemId: string,
  scope: Scope,
  body: Record<string, unknown>
) {
  const patient = await assertPatientAccess(patientId, scope);
  if (!patient) return null;

  const existing = await prisma.patientProblem.findFirst({ where: { id: problemId, patientId } });
  if (!existing) return null;

  return prisma.patientProblem.update({
    where: { id: problemId },
    data: {
      ...(body.code !== undefined ? { code: body.code ? String(body.code) : null } : {}),
      ...(body.description !== undefined ? { description: String(body.description) } : {}),
      ...(body.status !== undefined ? { status: String(body.status) } : {}),
      ...(body.onsetDate !== undefined ? { onsetDate: body.onsetDate ? String(body.onsetDate) : null } : {}),
      ...(body.notes !== undefined ? { notes: body.notes ? String(body.notes) : null } : {}),
    },
  });
}

export async function deleteProblem(patientId: string, problemId: string, scope: Scope) {
  const patient = await assertPatientAccess(patientId, scope);
  if (!patient) return false;
  const existing = await prisma.patientProblem.findFirst({ where: { id: problemId, patientId } });
  if (!existing) return false;
  await prisma.patientProblem.delete({ where: { id: problemId } });
  return true;
}
