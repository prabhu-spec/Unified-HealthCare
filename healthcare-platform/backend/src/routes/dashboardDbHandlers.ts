/**
 * PostgreSQL handlers for dashboard routes (used when DATABASE_URL is set).
 */
import type express from "express";
import * as dashDb from "../db/repositories/dashboard.js";
import {
  notifyBloodApproved,
  notifyBloodRequest,
  notifyMedicineOrder,
  notifyRestockApproved,
  notifyRestockRequest,
} from "../services/notifications.js";

type Request = express.Request;
type Response = express.Response;

export function getRole(req: Request): string | null {
  return (req.headers["x-role"] as string) ?? (req.query.role as string) ?? null;
}

export function getHospitalId(req: Request): string | null {
  return (req.headers["x-hospital-id"] as string) ?? (req.query.hospitalId as string) ?? null;
}

export async function handleGetAppointments(req: Request, res: Response) {
  res.json({ data: await dashDb.listLegacyAppointments(getHospitalId(req), getRole(req)) });
}

export async function handleGetQueue(req: Request, res: Response) {
  const list = (await dashDb.listLegacyAppointments(getHospitalId(req), getRole(req))).filter(
    (a) => a.status === "Pending" || a.status === "Accepted"
  );
  res.json({ data: list });
}

export async function handleGetPolicies(_req: Request, res: Response) {
  res.json({ data: await dashDb.listPolicies() });
}

export async function handleGetApplicants(_req: Request, res: Response) {
  res.json({ data: await dashDb.listApplicants() });
}

export async function handleGetPolicyStatus(_req: Request, res: Response) {
  res.json({ data: await dashDb.listPolicyStatus() });
}

export async function handleGetInventory(req: Request, res: Response) {
  res.json({ data: await dashDb.listInventory(getHospitalId(req)) });
}

export async function handleGetLogs(req: Request, res: Response) {
  const role = getRole(req);
  if (role !== "super_admin") return res.status(403).json({ error: "Forbidden" });
  res.json({ data: await dashDb.listLogs() });
}

export async function handleGetBeds(req: Request, res: Response) {
  res.json({ data: await dashDb.listBeds(getHospitalId(req)) });
}

export async function handleGetBloodInventory(_req: Request, res: Response) {
  res.json({ data: await dashDb.listBloodInventory() });
}

export async function handleGetBloodRequests(req: Request, res: Response) {
  res.json({ data: await dashDb.listBloodRequests(getHospitalId(req)) });
}

export async function handlePostBloodRequest(req: Request, res: Response) {
  const { bloodType, units, hospitalId, requestedBy, urgency } = req.body || {};
  if (!bloodType || !units) return res.status(400).json({ error: "Missing bloodType or units." });
  const request = await dashDb.createBloodRequest({
    bloodType: String(bloodType),
    units: Number(units),
    hospitalId: String(hospitalId || getHospitalId(req) || "org-1"),
    requestedBy: String(requestedBy || req.headers["x-user-email"] || "Hospital"),
    urgency: String(urgency || "Routine"),
  });
  notifyBloodRequest(request);
  res.status(201).json({ data: request });
}

export async function handlePatchBloodApprove(req: Request, res: Response) {
  const request = await dashDb.findBloodRequest(req.params.id);
  if (!request) return res.status(404).json({ error: "Blood request not found." });
  const updated = await dashDb.updateBloodRequestStatus(req.params.id, "Approved");
  notifyBloodApproved({ id: updated.id, bloodType: updated.bloodType, hospitalId: updated.hospitalId });
  res.json({ data: updated });
}

export async function handlePatchBloodReject(req: Request, res: Response) {
  const request = await dashDb.findBloodRequest(req.params.id);
  if (!request) return res.status(404).json({ error: "Blood request not found." });
  const updated = await dashDb.updateBloodRequestStatus(req.params.id, "Rejected");
  res.json({ data: updated });
}

export async function handleGetDonations(_req: Request, res: Response) {
  res.json({ data: await dashDb.listDonations() });
}

export async function handleGetHospitalDoctors(req: Request, res: Response) {
  res.json({ data: await dashDb.listHospitalDoctors(getHospitalId(req)) });
}

export async function handleGetHospitalStaff(req: Request, res: Response) {
  res.json({ data: await dashDb.listHospitalStaff(getHospitalId(req)) });
}

export async function handleGetHospitalBilling(req: Request, res: Response) {
  res.json({ data: await dashDb.listHospitalBilling(getHospitalId(req)) });
}

export async function handleGetHospitalApplications(req: Request, res: Response) {
  const email = (req.headers["x-user-email"] as string) ?? "";
  res.json({ data: await dashDb.listHospitalApplications(getRole(req), email) });
}

export async function handlePostHospitalApplications(req: Request, res: Response) {
  const role = getRole(req);
  if (role !== "doctor") return res.status(403).json({ error: "Only doctors can submit hospital applications." });
  const { hospitalId, hospitalName, applicantName, applicantEmail } = req.body || {};
  if (!hospitalId) return res.status(400).json({ error: "hospitalId is required." });
  const row = await dashDb.createHospitalApplication({
    hospitalId: String(hospitalId),
    hospitalName: String(hospitalName || "Hospital"),
    applicant: String(applicantName || applicantEmail || "Doctor"),
    applicantEmail: applicantEmail ? String(applicantEmail) : undefined,
  });
  res.status(201).json({ data: row });
}

export async function handleGetInsuranceRenewals(_req: Request, res: Response) {
  res.json({ data: await dashDb.listInsuranceRenewals() });
}

export async function handlePostMedicineOrders(req: Request, res: Response) {
  const { patientId, patientName, medication, dosage, prescribedBy, prescribedByEmail } = req.body || {};
  if (!patientId || !medication) return res.status(400).json({ error: "Missing patientId or medication." });
  const order = await dashDb.createMedicineOrder({
    patientId: String(patientId),
    patientName: String(patientName || "Patient"),
    medication: String(medication),
    dosage: String(dosage || ""),
    prescribedBy: String(prescribedBy || ""),
    prescribedByEmail: prescribedByEmail ? String(prescribedByEmail) : undefined,
  });
  notifyMedicineOrder({
    id: order.id,
    medication: order.medication,
    patientName: order.patientName,
    hospitalId: getHospitalId(req) || undefined,
  });
  res.status(201).json({ data: { ...order, createdAt: order.createdAt.toISOString() } });
}

export async function handleGetMedicineOrders(req: Request, res: Response) {
  const patientId = (req.query.patientId as string) ?? (req.headers["x-patient-id"] as string);
  const rows = await dashDb.listMedicineOrders(getRole(req), patientId || null);
  res.json({ data: rows.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() })) });
}

export async function handlePatchMedicineAccept(req: Request, res: Response) {
  const order = await dashDb.findMedicineOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found." });
  if (order.status !== "pending") return res.status(400).json({ error: "Order is not pending." });
  const updated = await dashDb.updateMedicineOrder(req.params.id, "accepted");
  res.json({ data: { ...updated, createdAt: updated.createdAt.toISOString() } });
}

export async function handlePatchMedicineReject(req: Request, res: Response) {
  const order = await dashDb.findMedicineOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found." });
  if (order.status !== "pending") return res.status(400).json({ error: "Order is not pending." });
  const reason = req.body?.reason ? String(req.body.reason) : "Medicine unavailable";
  const updated = await dashDb.updateMedicineOrder(req.params.id, "rejected", reason);
  res.json({ data: { ...updated, createdAt: updated.createdAt.toISOString() } });
}

export async function handleGetPrescriptions(req: Request, res: Response) {
  const patientId = (req.query.patientId as string) ?? (req.headers["x-patient-id"] as string);
  const doctorEmail = (req.headers["x-user-email"] as string) ?? (req.query.email as string);
  const rows = await dashDb.listPrescriptions(getRole(req), patientId || null, doctorEmail || "");
  res.json({ data: rows.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })) });
}

export async function handlePostPrescriptions(req: Request, res: Response) {
  const { patientId, patientName, medication, dosage, prescribedBy, prescribedByEmail } = req.body || {};
  if (!patientId || !medication || !dosage) {
    return res.status(400).json({ error: "Missing patientId, medication, or dosage." });
  }
  const rx = await dashDb.createPrescription({
    patientId: String(patientId),
    patientName: String(patientName || "Patient"),
    medication: String(medication),
    dosage: String(dosage),
    prescribedBy: String(prescribedBy || "Doctor"),
    prescribedByEmail: prescribedByEmail ? String(prescribedByEmail) : undefined,
  });
  res.status(201).json({ data: { ...rx, createdAt: rx.createdAt.toISOString() } });
}

export async function handlePatchPrescriptions(req: Request, res: Response) {
  const role = getRole(req);
  if (!["doctor", "super_admin", "hospital_admin"].includes(role || "")) {
    return res.status(403).json({ error: "Forbidden." });
  }
  const rx = await dashDb.findPrescription(req.params.id);
  if (!rx) return res.status(404).json({ error: "Prescription not found." });
  const body = req.body || {};
  const updated = await dashDb.updatePrescription(req.params.id, {
    ...(body.medication ? { medication: String(body.medication) } : {}),
    ...(body.dosage ? { dosage: String(body.dosage) } : {}),
    ...(body.status && ["Active", "Completed", "Cancelled"].includes(body.status) ? { status: body.status } : {}),
  });
  res.json({ data: { ...updated, createdAt: updated.createdAt.toISOString() } });
}

export async function handleDeletePrescriptions(req: Request, res: Response) {
  const role = getRole(req);
  if (!["doctor", "super_admin"].includes(role || "")) {
    return res.status(403).json({ error: "Forbidden." });
  }
  const rx = await dashDb.findPrescription(req.params.id);
  if (!rx) return res.status(404).json({ error: "Prescription not found." });
  await dashDb.deletePrescription(req.params.id);
  res.json({ ok: true });
}

export async function handleGetRestock(req: Request, res: Response) {
  const rows = await dashDb.listRestockRequests(getHospitalId(req));
  res.json({ data: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) });
}

export async function handlePostRestock(req: Request, res: Response) {
  const role = getRole(req);
  if (role && !["hospital_admin", "doctor", "super_admin"].includes(role)) {
    return res.status(403).json({ error: "Only hospital admins and doctors can submit restock requests." });
  }
  const { item, quantity, hospitalId, requestedBy } = req.body || {};
  if (!item || !quantity) return res.status(400).json({ error: "Missing item or quantity." });
  const request = await dashDb.createRestockRequest({
    item: String(item),
    quantity: Number(quantity),
    hospitalId: String(hospitalId || getHospitalId(req) || "org-1"),
    requestedBy: String(requestedBy || req.headers["x-user-email"] || "user"),
  });
  notifyRestockRequest({
    id: request.id,
    medicine: request.item,
    hospitalId: request.hospitalId,
    requestedBy: request.requestedBy,
  });
  res.status(201).json({ data: { ...request, createdAt: request.createdAt.toISOString() } });
}

export async function handlePatchRestockApprove(req: Request, res: Response) {
  const role = getRole(req);
  if (role && !["medical_vendor", "super_admin"].includes(role)) {
    return res.status(403).json({ error: "Only pharmacy vendors can approve restock requests." });
  }
  const request = await dashDb.findRestockRequest(req.params.id);
  if (!request) return res.status(404).json({ error: "Restock request not found." });
  const updated = await dashDb.updateRestockRequest(req.params.id, "Approved");
  notifyRestockApproved({ id: updated.id, medicine: updated.item, hospitalId: updated.hospitalId });
  res.json({ data: { ...updated, createdAt: updated.createdAt.toISOString() } });
}

export async function handlePatchRestockReject(req: Request, res: Response) {
  const role = getRole(req);
  if (role && !["medical_vendor", "super_admin"].includes(role)) {
    return res.status(403).json({ error: "Only pharmacy vendors can reject restock requests." });
  }
  const request = await dashDb.findRestockRequest(req.params.id);
  if (!request) return res.status(404).json({ error: "Restock request not found." });
  const updated = await dashDb.updateRestockRequest(req.params.id, "Rejected");
  res.json({ data: { ...updated, createdAt: updated.createdAt.toISOString() } });
}

export async function handleGetPrescriptionVerifications(_req: Request, res: Response) {
  const rows = await dashDb.listPrescriptionVerifications();
  res.json({ data: rows.map((v) => ({ ...v, createdAt: v.createdAt.toISOString() })) });
}

export async function handlePatchPrescriptionVerify(req: Request, res: Response) {
  const verification = await dashDb.findPrescriptionVerification(req.params.id);
  if (!verification) return res.status(404).json({ error: "Prescription verification not found." });
  const updated = await dashDb.verifyPrescription(req.params.id);
  res.json({ data: { ...updated, createdAt: updated.createdAt.toISOString() } });
}
