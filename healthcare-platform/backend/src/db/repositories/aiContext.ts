import { prisma } from "../client.js";
import type { Scope } from "./coreCare.js";
import { getPatientDetail } from "./coreCare.js";
import { patientClinicalFields } from "../mappers.js";

export async function loadAiContextRaw(patientId: string, scope: Scope) {
  const detail = await getPatientDetail(patientId, scope);
  if (!detail) return null;

  const [allergies, problems, medications, vitalsTrend] = await Promise.all([
    prisma.patientAllergy.findMany({ where: { patientId, status: "active" } }),
    prisma.patientProblem.findMany({ where: { patientId, status: "active" } }),
    prisma.prescription.findMany({
      where: { patientId, status: "Active" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vitalsSnapshot.findMany({
      where: { patientId },
      orderBy: { timestamp: "desc" },
      take: 10,
    }),
  ]);

  const pRow = await prisma.patient.findUnique({ where: { id: patientId } });
  const clinical = pRow ? patientClinicalFields(pRow) : {};

  return {
    patient: detail.patient as Record<string, unknown>,
    clinical,
    allergies,
    problems,
    medications: medications.map((m) => ({
      id: m.id,
      medication: m.medication,
      dosage: m.dosage,
      status: m.status,
      prescribedBy: m.prescribedBy,
      createdAt: m.createdAt.toISOString(),
    })),
    records: detail.records,
    history: detail.history,
    appointments: detail.appointments,
    vitalsLatest: vitalsTrend[0]
      ? {
          patientId: vitalsTrend[0].patientId,
          heartRate: vitalsTrend[0].heartRate,
          spo2: vitalsTrend[0].spo2,
          temperature: vitalsTrend[0].temperature,
          systolic: vitalsTrend[0].systolic,
          diastolic: vitalsTrend[0].diastolic,
          respiration: vitalsTrend[0].respiration,
          timestamp: vitalsTrend[0].timestamp.toISOString(),
        }
      : null,
    vitalsTrend: vitalsTrend.map((v) => ({
      heartRate: v.heartRate,
      spo2: v.spo2,
      temperature: v.temperature,
      systolic: v.systolic,
      diastolic: v.diastolic,
      respiration: v.respiration,
      timestamp: v.timestamp.toISOString(),
    })),
  };
}
