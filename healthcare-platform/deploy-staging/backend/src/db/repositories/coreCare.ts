import type { Patient } from "@prisma/client";
import { prisma } from "../client.js";
import { hospitalToApi, patientToApi } from "../mappers.js";

export type Scope = { role: string | null; hospitalId: string | null; patientId: string | null };

function scopePatientWhere(scope: Scope) {
  if (scope.role === "patient" && scope.patientId) return { id: scope.patientId };
  if (["doctor", "hospital_admin", "nurse"].includes(scope.role || "") && scope.hospitalId) {
    return { hospitalId: scope.hospitalId };
  }
  return {};
}

function scopeAppointmentWhere(scope: Scope) {
  if (scope.role === "patient" && scope.patientId) return { patientId: scope.patientId };
  if (["doctor", "hospital_admin", "nurse"].includes(scope.role || "") && scope.hospitalId) {
    return { hospitalId: scope.hospitalId };
  }
  return {};
}

function patientName(p: Patient) {
  return `${p.firstName} ${p.lastName}`;
}

export async function listHospitals(scope: Scope) {
  const rows = await prisma.hospital.findMany({ orderBy: { name: "asc" } });
  const list = rows.map(hospitalToApi);
  if ((scope.role === "doctor" || scope.role === "hospital_admin") && scope.hospitalId) {
    return list.filter((h) => h.id === scope.hospitalId);
  }
  return list;
}

export async function getHospitalDetail(id: string) {
  const h = await prisma.hospital.findUnique({ where: { id } });
  if (!h) return null;
  const hospital = hospitalToApi(h);
  const pRows = await prisma.patient.findMany({ where: { hospitalId: id } });
  const aRows = await prisma.appointment.findMany({ where: { hospitalId: id } });
  return {
    hospital,
    patients: pRows.map(patientToApi),
    appointments: aRows,
  };
}

export async function listPatients(scope: Scope) {
  const rows = await prisma.patient.findMany({ where: scopePatientWhere(scope) });
  return rows.map(patientToApi);
}

export async function getPatientDetail(id: string, scope: Scope) {
  const where = { id, ...scopePatientWhere(scope) };
  const p = await prisma.patient.findFirst({ where });
  if (!p) return null;
  const patient = patientToApi(p);
  const [history, records, receipts, appointments] = await Promise.all([
    prisma.patientHistory.findMany({ where: { patientId: id }, orderBy: { date: "desc" } }),
    prisma.medicalRecord.findMany({ where: { patientId: id } }),
    prisma.receipt.findMany({ where: { patientId: id } }),
    prisma.appointment.findMany({ where: { patientId: id } }),
  ]);
  return { patient, history, records, receipts, appointments };
}

export async function createPatient(
  scope: Scope,
  body: Record<string, unknown>
) {
  const count = await prisma.patient.count();
  const id = `patient-${count + 1}`;
  const hid =
    ["hospital_admin", "doctor", "nurse"].includes(scope.role || "")
      ? scope.hospitalId || String(body.hospitalId || "org-1")
      : String(body.hospitalId || "org-1");
  const admitted = Boolean(body.room);
  const row = await prisma.patient.create({
    data: {
      id,
      hospitalId: hid,
      firstName: String(body.firstName),
      lastName: String(body.lastName),
      gender: String(body.gender || "unknown"),
      birthDate: String(body.birthDate || "1990-01-01"),
      mrn: String(body.mrn || `MRN${Date.now().toString().slice(-6)}`),
      phone: body.phone ? String(body.phone) : null,
      email: body.email ? String(body.email) : null,
      street: body.street ? String(body.street) : null,
      city: body.city ? String(body.city) : null,
      state: body.state ? String(body.state) : null,
      postalCode: body.postalCode ? String(body.postalCode) : null,
      visitStatus: admitted ? "admitted" : "outpatient",
      room: body.room ? String(body.room) : null,
      admittedAt: admitted ? new Date() : null,
    },
  });
  return patientToApi(row);
}

export async function updatePatient(id: string, scope: Scope, body: Record<string, unknown>) {
  const existing = await prisma.patient.findFirst({ where: { id, ...scopePatientWhere(scope) } });
  if (!existing) return null;
  if (scope.role !== "super_admin" && scope.hospitalId && existing.hospitalId !== scope.hospitalId) {
    return null;
  }
  const row = await prisma.patient.update({
    where: { id },
    data: {
      ...(body.firstName ? { firstName: String(body.firstName) } : {}),
      ...(body.lastName ? { lastName: String(body.lastName) } : {}),
      ...(body.gender ? { gender: String(body.gender) } : {}),
      ...(body.birthDate ? { birthDate: String(body.birthDate) } : {}),
      ...(body.phone !== undefined ? { phone: body.phone ? String(body.phone) : null } : {}),
      ...(body.email !== undefined ? { email: body.email ? String(body.email) : null } : {}),
      ...(body.room !== undefined ? { room: body.room ? String(body.room) : null } : {}),
      ...(body.consultNotes !== undefined ? { consultNotes: body.consultNotes ? String(body.consultNotes) : null } : {}),
      ...(body.visitStatus ? { visitStatus: String(body.visitStatus) } : {}),
    },
  });
  return patientToApi(row);
}

export async function admitPatient(id: string, body: { room?: string; notes?: string }) {
  if (!body.room) return { error: "room is required." as const };
  const row = await prisma.patient.update({
    where: { id },
    data: {
      visitStatus: "admitted",
      room: String(body.room),
      admittedAt: new Date(),
      dischargedAt: null,
      ...(body.notes ? { consultNotes: String(body.notes) } : {}),
    },
  });
  return patientToApi(row);
}

export async function dischargePatient(id: string, role: string | null, body: { notes?: string }) {
  const p = await prisma.patient.findUnique({ where: { id } });
  if (!p) return null;
  const row = await prisma.patient.update({
    where: { id },
    data: {
      visitStatus: "discharged",
      dischargedAt: new Date(),
      lastConsultAt: new Date(),
      ...(body.notes ? { consultNotes: String(body.notes) } : {}),
    },
  });
  await prisma.patientHistory.create({
    data: {
      id: `h-${Date.now()}`,
      patientId: id,
      patientName: patientName(p),
      hospitalId: p.hospitalId,
      date: new Date().toISOString().slice(0, 10),
      type: "Discharge",
      provider: role === "nurse" ? "Nursing staff" : "Clinical staff",
      summary: body.notes ? String(body.notes) : "Patient discharged after consultation.",
    },
  });
  return patientToApi(row);
}

export async function completeConsultation(
  id: string,
  role: string | null,
  body: { notes?: string; stayAdmitted?: boolean }
) {
  const p = await prisma.patient.findUnique({ where: { id } });
  if (!p) return null;
  const row = await prisma.patient.update({
    where: { id },
    data: {
      lastConsultAt: new Date(),
      ...(body.notes ? { consultNotes: String(body.notes) } : {}),
      visitStatus: body.stayAdmitted ? "admitted" : "outpatient",
    },
  });
  await prisma.patientHistory.create({
    data: {
      id: `h-${Date.now()}`,
      patientId: id,
      patientName: patientName(p),
      hospitalId: p.hospitalId,
      date: new Date().toISOString().slice(0, 10),
      type: "Consultation",
      provider: role === "doctor" ? "Doctor" : role === "nurse" ? "Nurse" : "Staff",
      summary: body.notes ? String(body.notes) : "Consultation completed.",
    },
  });
  return patientToApi(row);
}

export async function listAppointments(scope: Scope) {
  return prisma.appointment.findMany({ where: scopeAppointmentWhere(scope), orderBy: { date: "desc" } });
}

export async function createAppointment(body: Record<string, unknown>) {
  const count = await prisma.appointment.count();
  const row = await prisma.appointment.create({
    data: {
      id: `apt-${count + 1}`,
      patientId: String(body.patientId),
      patientName: String(body.patientName || "Patient"),
      hospitalId: String(body.hospitalId),
      doctorId: String(body.doctorId || "u-doc"),
      doctorName: String(body.doctorName || "Doctor"),
      date: String(body.date),
      time: String(body.time),
      type: String(body.type || "Consultation"),
      status: "Pending",
    },
  });
  return row;
}

export async function updateAppointmentStatus(id: string, status: string) {
  const row = await prisma.appointment.update({ where: { id }, data: { status } });
  return row;
}

export async function findAppointment(id: string) {
  return prisma.appointment.findUnique({ where: { id } });
}

export async function listQueue(scope: Scope) {
  const rows = await listAppointments(scope);
  return rows.filter((a) => a.status === "Pending" || a.status === "Accepted");
}

export async function listHistory(scope: Scope) {
  const where =
    scope.role === "patient" && scope.patientId
      ? { patientId: scope.patientId }
      : ["doctor", "hospital_admin", "nurse"].includes(scope.role || "") && scope.hospitalId
        ? { hospitalId: scope.hospitalId }
        : {};
  return prisma.patientHistory.findMany({ where, orderBy: { date: "desc" } });
}

export async function listRecords(scope: Scope) {
  const where =
    scope.role === "patient" && scope.patientId
      ? { patientId: scope.patientId }
      : ["doctor", "hospital_admin", "nurse"].includes(scope.role || "") && scope.hospitalId
        ? { hospitalId: scope.hospitalId }
        : {};
  return prisma.medicalRecord.findMany({ where });
}

export async function listReceipts(scope: Scope) {
  const where =
    scope.role === "patient" && scope.patientId
      ? { patientId: scope.patientId }
      : ["doctor", "hospital_admin", "nurse"].includes(scope.role || "") && scope.hospitalId
        ? { hospitalId: scope.hospitalId }
        : {};
  return prisma.receipt.findMany({ where });
}

export async function findPatientRaw(id: string) {
  return prisma.patient.findUnique({ where: { id } });
}
