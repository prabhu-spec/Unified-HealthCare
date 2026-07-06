/**
 * Core care APIs shared by web and Android.
 *
 * These endpoints replace frontend-only mock data for the first native parity phase:
 * hospitals, patients, in-person appointments/queue, history, records, and receipts.
 * Data is still in-memory for now; the response shapes are intentionally stable so a
 * database can replace the arrays without changing clients.
 */
import express from "express";
import { useDatabase } from "../db/client.js";
import { getScope } from "../db/requestScope.js";
import * as coreDb from "../db/repositories/coreCare.js";
import {
  notifyAppointmentRequest,
  notifyAppointmentStatus,
} from "../services/notifications.js";

const router = express.Router();
type Request = express.Request;
type Response = express.Response;

type AppointmentStatus = "Pending" | "Accepted" | "Rejected" | "Completed";

interface AppointmentRow {
  id: string;
  patientId: string;
  patientName: string;
  hospitalId: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  type: string;
  status: AppointmentStatus;
}

const hospitals = [
  {
    resourceType: "Organization",
    id: "org-1",
    name: "Southeast Health Medical Center",
    address: [{ line: ["1108 Ross Clark Cir"], city: "Dothan", state: "AL", postalCode: "36301" }],
    telecom: [{ system: "phone", value: "(334) 793-8701" }, { system: "url", value: "https://www.southeasthealth.org" }],
    type: [{ coding: [{ display: "Acute Care Hospital" }] }],
    extension: [
      { url: "organization-rating", valueDecimal: 4.0 },
      { url: "emergency-services", valueBoolean: true },
    ],
  },
  {
    resourceType: "Organization",
    id: "org-2",
    name: "North Valley Hospital",
    address: [{ line: ["201 Health Pkwy"], city: "Birmingham", state: "AL", postalCode: "35203" }],
    telecom: [{ system: "phone", value: "(205) 555-1100" }],
    type: [{ coding: [{ display: "Community Hospital" }] }],
    extension: [
      { url: "organization-rating", valueDecimal: 4.2 },
      { url: "emergency-services", valueBoolean: true },
    ],
  },
];

const patients = [
  makePatient("patient-1", "John", "Smith", "male", "1985-03-15", "org-1", "MRN123456", "+1-555-0123", "john.smith@email.com", "123 Main St", "Springfield", "IL", "62701"),
  makePatient("patient-2", "Sarah", "Johnson", "female", "1992-07-22", "org-1", "MRN789012", "+1-555-0456", "sarah.johnson@email.com", "456 Oak Ave", "Springfield", "IL", "62702"),
  makePatient("patient-3", "Robert", "Williams", "male", "1978-11-08", "org-1", "MRN345678", "+1-555-0789", "robert.williams@email.com", "789 Pine St", "Dothan", "AL", "36301"),
  makePatient("patient-4", "Maria", "Davis", "female", "1965-04-12", "org-2", "MRN901234", "+1-555-0321", "maria.davis@email.com", "321 Elm Dr", "Florence", "AL", "35630"),
];

let appointments: AppointmentRow[] = [
  { id: "apt-1", patientId: "patient-1", patientName: "John Smith", hospitalId: "org-1", doctorId: "u-doc", doctorName: "Dr. Sarah Johnson", date: "2026-05-27", time: "10:00", type: "Consultation", status: "Pending" },
  { id: "apt-2", patientId: "patient-2", patientName: "Sarah Johnson", hospitalId: "org-1", doctorId: "u-doc", doctorName: "Dr. Sarah Johnson", date: "2026-05-27", time: "11:30", type: "Follow-up", status: "Accepted" },
  { id: "apt-3", patientId: "patient-4", patientName: "Maria Davis", hospitalId: "org-2", doctorId: "u-doc-2", doctorName: "Dr. Murray Baker", date: "2026-05-28", time: "14:00", type: "Consultation", status: "Pending" },
];
let nextAppointmentId = 4;

const history = [
  { id: "h1", patientId: "patient-1", patientName: "John Smith", hospitalId: "org-1", date: "2026-05-01", type: "Consultation", provider: "Dr. Sarah Johnson", summary: "Routine check-up and care plan review." },
  { id: "h2", patientId: "patient-1", patientName: "John Smith", hospitalId: "org-1", date: "2026-04-18", type: "Follow-up", provider: "Dr. Sarah Johnson", summary: "Blood pressure follow-up, medication continued." },
  { id: "h3", patientId: "patient-2", patientName: "Sarah Johnson", hospitalId: "org-1", date: "2026-04-22", type: "Lab review", provider: "Dr. Sarah Johnson", summary: "Lab results reviewed, no urgent findings." },
  { id: "h4", patientId: "patient-4", patientName: "Maria Davis", hospitalId: "org-2", date: "2026-04-29", type: "Annual physical", provider: "Dr. Murray Baker", summary: "Annual wellness exam completed." },
];

const records = [
  { id: "rec-1", patientId: "patient-1", patientName: "John Smith", hospitalId: "org-1", date: "2026-05-01", category: "Observation", name: "Blood Pressure", value: "128/82 mmHg", provider: "Dr. Sarah Johnson" },
  { id: "rec-2", patientId: "patient-1", patientName: "John Smith", hospitalId: "org-1", date: "2026-05-01", category: "Medication", name: "Lisinopril", value: "10mg once daily", provider: "Dr. Sarah Johnson" },
  { id: "rec-3", patientId: "patient-2", patientName: "Sarah Johnson", hospitalId: "org-1", date: "2026-04-22", category: "Lab", name: "Hemoglobin", value: "13.2 g/dL", provider: "Dr. Sarah Johnson" },
  { id: "rec-4", patientId: "patient-4", patientName: "Maria Davis", hospitalId: "org-2", date: "2026-04-29", category: "Observation", name: "Heart Rate", value: "78 bpm", provider: "Dr. Murray Baker" },
];

const receipts = [
  { id: "r1", patientId: "patient-1", patientName: "John Smith", hospitalId: "org-1", date: "2026-05-01", amount: 150, description: "Consultation", status: "paid" },
  { id: "r2", patientId: "patient-1", patientName: "John Smith", hospitalId: "org-1", date: "2026-04-18", amount: 75, description: "Follow-up", status: "paid" },
  { id: "r3", patientId: "patient-2", patientName: "Sarah Johnson", hospitalId: "org-1", date: "2026-04-22", amount: 200, description: "Lab review", status: "paid" },
  { id: "r4", patientId: "patient-4", patientName: "Maria Davis", hospitalId: "org-2", date: "2026-04-29", amount: 120, description: "Annual physical", status: "paid" },
];

type VisitStatus = "outpatient" | "admitted" | "discharged";

function makePatient(
  id: string,
  firstName: string,
  lastName: string,
  gender: string,
  birthDate: string,
  hospitalId: string,
  mrn: string,
  phone: string,
  email: string,
  street: string,
  city: string,
  state: string,
  postalCode: string
) {
  return {
    resourceType: "Patient",
    id,
    hospitalId,
    name: [{ use: "official", family: lastName, given: [firstName] }],
    gender,
    birthDate,
    telecom: [{ system: "phone", value: phone, use: "home" }, { system: "email", value: email, use: "home" }],
    address: [{ use: "home", line: [street], city, state, postalCode, country: "US" }],
    identifier: [{ system: "http://hospital.example.org/patients", value: mrn }],
    visitStatus: "outpatient" as VisitStatus,
    room: undefined as string | undefined,
    consultNotes: undefined as string | undefined,
    admittedAt: undefined as string | undefined,
    dischargedAt: undefined as string | undefined,
    lastConsultAt: undefined as string | undefined,
  };
}

function getRole(req: Request): string | null {
  return (req.headers["x-role"] as string) ?? (req.query.role as string) ?? null;
}

function getHospitalId(req: Request): string | null {
  return (req.headers["x-hospital-id"] as string) ?? (req.query.hospitalId as string) ?? null;
}

function getPatientId(req: Request): string | null {
  return (req.headers["x-patient-id"] as string) ?? (req.query.patientId as string) ?? null;
}

let nextPatientId = 5;

function canManagePatients(role: string | null): boolean {
  return ["super_admin", "hospital_admin", "doctor", "nurse"].includes(role || "");
}

function scopeRows<T extends { hospitalId?: string; patientId?: string }>(req: Request, rows: T[]): T[] {
  const role = getRole(req);
  const hospitalId = getHospitalId(req);
  const patientId = getPatientId(req);
  if (role === "patient" && patientId) return rows.filter((r) => r.patientId === patientId);
  if ((role === "doctor" || role === "hospital_admin" || role === "nurse") && hospitalId) {
    return rows.filter((r) => r.hospitalId === hospitalId);
  }
  return rows;
}

router.get("/api/core/hospitals", async (req: Request, res: Response) => {
  if (useDatabase()) {
    return res.json({ data: await coreDb.listHospitals(getScope(req)) });
  }
  const hospitalId = getHospitalId(req);
  const role = getRole(req);
  const list = (role === "doctor" || role === "hospital_admin") && hospitalId
    ? hospitals.filter((h) => h.id === hospitalId)
    : hospitals;
  res.json({ data: list });
});

router.get("/api/core/hospitals/:id", async (req: Request, res: Response) => {
  if (useDatabase()) {
    const detail = await coreDb.getHospitalDetail(req.params.id);
    if (!detail) return res.status(404).json({ error: "Hospital not found." });
    return res.json({ data: detail });
  }
  const hospital = hospitals.find((h) => h.id === req.params.id);
  if (!hospital) return res.status(404).json({ error: "Hospital not found." });
  const hospitalPatients = patients.filter((p) => p.hospitalId === hospital.id);
  const hospitalAppointments = appointments.filter((a) => a.hospitalId === hospital.id);
  res.json({ data: { hospital, patients: hospitalPatients, appointments: hospitalAppointments } });
});

router.get("/api/core/patients", async (req: Request, res: Response) => {
  if (useDatabase()) {
    return res.json({ data: await coreDb.listPatients(getScope(req)) });
  }
  res.json({ data: scopeRows(req, patients) });
});

router.get("/api/core/patients/:id", async (req: Request, res: Response) => {
  if (useDatabase()) {
    const detail = await coreDb.getPatientDetail(req.params.id, getScope(req));
    if (!detail) return res.status(404).json({ error: "Patient not found." });
    return res.json({ data: detail });
  }
  const patient = scopeRows(req, patients).find((p) => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: "Patient not found." });
  res.json({
    data: {
      patient,
      history: history.filter((h) => h.patientId === patient.id),
      records: records.filter((r) => r.patientId === patient.id),
      receipts: receipts.filter((r) => r.patientId === patient.id),
      appointments: appointments.filter((a) => a.patientId === patient.id),
    },
  });
});

router.post("/api/core/patients", async (req: Request, res: Response) => {
  const role = getRole(req);
  if (!canManagePatients(role)) return res.status(403).json({ error: "Forbidden." });
  if (useDatabase()) {
    const row = await coreDb.createPatient(getScope(req), req.body || {});
    return res.status(201).json({ data: row });
  }
  const {
    firstName, lastName, gender, birthDate, hospitalId, mrn, phone, email,
    street, city, state, postalCode, room,
  } = req.body || {};
  if (!firstName || !lastName) return res.status(400).json({ error: "firstName and lastName are required." });
  const hid = role === "hospital_admin" || role === "doctor" || role === "nurse"
    ? getHospitalId(req) || String(hospitalId || "org-1")
    : String(hospitalId || "org-1");
  const id = `patient-${nextPatientId++}`;
  const row = makePatient(
    id,
    String(firstName),
    String(lastName),
    String(gender || "unknown"),
    String(birthDate || "1990-01-01"),
    hid,
    String(mrn || `MRN${Date.now().toString().slice(-6)}`),
    String(phone || ""),
    String(email || ""),
    String(street || ""),
    String(city || ""),
    String(state || ""),
    String(postalCode || ""),
  );
  if (room) {
    row.room = String(room);
    row.visitStatus = "admitted";
    row.admittedAt = new Date().toISOString();
  }
  patients.push(row);
  res.status(201).json({ data: row });
});

router.patch("/api/core/patients/:id", async (req: Request, res: Response) => {
  const role = getRole(req);
  if (!canManagePatients(role)) return res.status(403).json({ error: "Forbidden." });
  if (useDatabase()) {
    const row = await coreDb.updatePatient(req.params.id, getScope(req), req.body || {});
    if (!row) return res.status(404).json({ error: "Patient not found." });
    return res.json({ data: row });
  }
  const patient = patients.find((p) => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: "Patient not found." });
  if (role !== "super_admin" && patient.hospitalId !== getHospitalId(req)) {
    return res.status(403).json({ error: "Forbidden." });
  }
  const body = req.body || {};
  if (body.firstName || body.lastName) {
    const given = body.firstName ? [String(body.firstName)] : patient.name[0].given;
    const family = body.lastName ? String(body.lastName) : patient.name[0].family;
    patient.name = [{ use: "official", family, given }];
  }
  if (body.gender) patient.gender = String(body.gender);
  if (body.birthDate) patient.birthDate = String(body.birthDate);
  if (body.phone) patient.telecom = [{ system: "phone", value: String(body.phone), use: "home" }, ...(patient.telecom.filter((t) => t.system === "email"))];
  if (body.email) {
    const phoneEntry = patient.telecom.find((t) => t.system === "phone") || { system: "phone", value: "", use: "home" };
    patient.telecom = [phoneEntry, { system: "email", value: String(body.email), use: "home" }];
  }
  if (body.room !== undefined) patient.room = body.room ? String(body.room) : undefined;
  if (body.consultNotes !== undefined) patient.consultNotes = body.consultNotes ? String(body.consultNotes) : undefined;
  if (body.visitStatus) patient.visitStatus = body.visitStatus;
  res.json({ data: patient });
});

router.post("/api/core/patients/:id/admit", async (req: Request, res: Response) => {
  const role = getRole(req);
  if (!canManagePatients(role)) return res.status(403).json({ error: "Forbidden." });
  if (useDatabase()) {
    const result = await coreDb.admitPatient(req.params.id, req.body || {});
    if (typeof result === "object" && "error" in result) return res.status(400).json(result);
    if (!result) return res.status(404).json({ error: "Patient not found." });
    return res.json({ data: result });
  }
  const patient = patients.find((p) => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: "Patient not found." });
  const { room, notes } = req.body || {};
  if (!room) return res.status(400).json({ error: "room is required." });
  patient.visitStatus = "admitted";
  patient.room = String(room);
  patient.admittedAt = new Date().toISOString();
  patient.dischargedAt = undefined;
  if (notes) patient.consultNotes = String(notes);
  res.json({ data: patient });
});

router.post("/api/core/patients/:id/discharge", async (req: Request, res: Response) => {
  const role = getRole(req);
  if (!canManagePatients(role)) return res.status(403).json({ error: "Forbidden." });
  if (useDatabase()) {
    const row = await coreDb.dischargePatient(req.params.id, role, req.body || {});
    if (!row) return res.status(404).json({ error: "Patient not found." });
    return res.json({ data: row });
  }
  const patient = patients.find((p) => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: "Patient not found." });
  const { notes } = req.body || {};
  patient.visitStatus = "discharged";
  patient.dischargedAt = new Date().toISOString();
  patient.lastConsultAt = new Date().toISOString();
  if (notes) patient.consultNotes = String(notes);
  const name = `${patient.name[0].given[0]} ${patient.name[0].family}`;
  history.unshift({
    id: `h-${Date.now()}`,
    patientId: patient.id,
    patientName: name,
    hospitalId: patient.hospitalId,
    date: new Date().toISOString().slice(0, 10),
    type: "Discharge",
    provider: role === "nurse" ? "Nursing staff" : "Clinical staff",
    summary: notes ? String(notes) : "Patient discharged after consultation.",
  });
  res.json({ data: patient });
});

router.post("/api/core/patients/:id/complete-consultation", async (req: Request, res: Response) => {
  const role = getRole(req);
  if (!canManagePatients(role)) return res.status(403).json({ error: "Forbidden." });
  if (useDatabase()) {
    const row = await coreDb.completeConsultation(req.params.id, role, req.body || {});
    if (!row) return res.status(404).json({ error: "Patient not found." });
    return res.json({ data: row });
  }
  const patient = patients.find((p) => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: "Patient not found." });
  const { notes, stayAdmitted } = req.body || {};
  patient.lastConsultAt = new Date().toISOString();
  if (notes) patient.consultNotes = String(notes);
  if (stayAdmitted) {
    patient.visitStatus = "admitted";
  } else {
    patient.visitStatus = "outpatient";
  }
  const name = `${patient.name[0].given[0]} ${patient.name[0].family}`;
  history.unshift({
    id: `h-${Date.now()}`,
    patientId: patient.id,
    patientName: name,
    hospitalId: patient.hospitalId,
    date: new Date().toISOString().slice(0, 10),
    type: "Consultation",
    provider: role === "doctor" ? "Doctor" : role === "nurse" ? "Nurse" : "Staff",
    summary: notes ? String(notes) : "Consultation completed.",
  });
  res.json({ data: patient });
});

router.get("/api/core/appointments", async (req: Request, res: Response) => {
  if (useDatabase()) {
    return res.json({ data: await coreDb.listAppointments(getScope(req)) });
  }
  res.json({ data: scopeRows(req, appointments) });
});

router.post("/api/core/appointments", async (req: Request, res: Response) => {
  const { patientId, patientName, hospitalId, doctorId, doctorName, date, time, type } = req.body || {};
  if (!patientId || !hospitalId || !date || !time) {
    return res.status(400).json({ error: "patientId, hospitalId, date, and time are required." });
  }
  if (useDatabase()) {
    const row = await coreDb.createAppointment(req.body || {});
    notifyAppointmentRequest(row);
    return res.status(201).json({ data: row });
  }
  const row: AppointmentRow = {
    id: `apt-${nextAppointmentId++}`,
    patientId: String(patientId),
    patientName: String(patientName || "Patient"),
    hospitalId: String(hospitalId),
    doctorId: String(doctorId || "u-doc"),
    doctorName: String(doctorName || "Doctor"),
    date: String(date),
    time: String(time),
    type: String(type || "Consultation"),
    status: "Pending",
  };
  appointments.unshift(row);
  notifyAppointmentRequest(row);
  res.status(201).json({ data: row });
});

router.patch("/api/core/appointments/:id/status", async (req: Request, res: Response) => {
  const status = String(req.body?.status || "") as AppointmentStatus;
  if (!["Pending", "Accepted", "Rejected", "Completed"].includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }
  if (useDatabase()) {
    const existing = await coreDb.findAppointment(req.params.id);
    if (!existing) return res.status(404).json({ error: "Appointment not found." });
    const appointment = await coreDb.updateAppointmentStatus(req.params.id, status);
    if (status === "Accepted" || status === "Rejected") {
      notifyAppointmentStatus(status, appointment);
    }
    return res.json({ data: appointment });
  }
  const appointment = appointments.find((a) => a.id === req.params.id);
  if (!appointment) return res.status(404).json({ error: "Appointment not found." });
  appointment.status = status;
  if (status === "Accepted" || status === "Rejected") {
    notifyAppointmentStatus(status, appointment);
  }
  res.json({ data: appointment });
});

router.get("/api/core/queue", async (req: Request, res: Response) => {
  if (useDatabase()) {
    return res.json({ data: await coreDb.listQueue(getScope(req)) });
  }
  const list = scopeRows(req, appointments).filter((a) => a.status === "Pending" || a.status === "Accepted");
  res.json({ data: list });
});

router.patch("/api/core/queue/:id/accept", async (req: Request, res: Response) => {
  if (useDatabase()) {
    const existing = await coreDb.findAppointment(req.params.id);
    if (!existing) return res.status(404).json({ error: "Queue item not found." });
    const appointment = await coreDb.updateAppointmentStatus(req.params.id, "Accepted");
    notifyAppointmentStatus("Accepted", appointment);
    return res.json({ data: appointment });
  }
  const appointment = appointments.find((a) => a.id === req.params.id);
  if (!appointment) return res.status(404).json({ error: "Queue item not found." });
  appointment.status = "Accepted";
  notifyAppointmentStatus("Accepted", appointment);
  res.json({ data: appointment });
});

router.patch("/api/core/queue/:id/reject", async (req: Request, res: Response) => {
  if (useDatabase()) {
    const existing = await coreDb.findAppointment(req.params.id);
    if (!existing) return res.status(404).json({ error: "Queue item not found." });
    const appointment = await coreDb.updateAppointmentStatus(req.params.id, "Rejected");
    notifyAppointmentStatus("Rejected", appointment);
    return res.json({ data: appointment });
  }
  const appointment = appointments.find((a) => a.id === req.params.id);
  if (!appointment) return res.status(404).json({ error: "Queue item not found." });
  appointment.status = "Rejected";
  notifyAppointmentStatus("Rejected", appointment);
  res.json({ data: appointment });
});

router.get("/api/core/history", async (req: Request, res: Response) => {
  if (useDatabase()) {
    return res.json({ data: await coreDb.listHistory(getScope(req)) });
  }
  res.json({ data: scopeRows(req, history) });
});

router.get("/api/core/records", async (req: Request, res: Response) => {
  if (useDatabase()) {
    return res.json({ data: await coreDb.listRecords(getScope(req)) });
  }
  res.json({ data: scopeRows(req, records) });
});

router.get("/api/core/receipts", async (req: Request, res: Response) => {
  if (useDatabase()) {
    return res.json({ data: await coreDb.listReceipts(getScope(req)) });
  }
  res.json({ data: scopeRows(req, receipts) });
});

export default router;
