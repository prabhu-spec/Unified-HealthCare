/**
 * RBAC Dashboard API – data filtered by roleID and hospitalID where applicable.
 */
import express from "express";
import { useDatabase } from "../db/client.js";
import * as dbh from "./dashboardDbHandlers.js";
import {
  notifyBloodApproved,
  notifyBloodRequest,
  notifyMedicineOrder,
  notifyRestockApproved,
  notifyRestockRequest,
} from "../services/notifications.js";

const router = express.Router();
type Request = express.Request;
type Response = express.Response;

// In-memory demo data; in production replace with DB and enforce role/hospital in middleware
const MOCK_APPOINTMENTS = [
  { id: "1", patientId: "p1", hospitalId: "org-1", doctorId: "d1", date: "2025-03-05", time: "10:00", status: "Pending" },
  { id: "2", patientId: "p2", hospitalId: "org-1", doctorId: "d1", date: "2025-03-05", time: "11:00", status: "Accepted" },
];
const MOCK_POLICIES = [
  { id: "1", name: "Health Basic", status: "Active" },
  { id: "2", name: "Health Plus", status: "Active" },
];
const MOCK_APPLICANTS = [
  { id: "1", name: "Alice", policyId: "1", status: "Pending" },
  { id: "2", name: "Bob", policyId: "2", status: "Approved" },
];
const MOCK_INVENTORY = [
  { id: "1", name: "Amoxicillin 500mg", quantity: 120, reorderLevel: 20, hospitalId: "org-1", status: "In-stock" },
  { id: "2", name: "Paracetamol", quantity: 5, reorderLevel: 30, hospitalId: "org-1", status: "Low stock" },
  { id: "3", name: "Ibuprofen", quantity: 0, reorderLevel: 25, hospitalId: "org-1", status: "Out-of-stock" },
];
const MOCK_LOGS = [
  { id: "1", timestamp: new Date().toISOString(), userId: "doctor@demo.com", action: "Login", resource: "Auth" },
];
const BLOOD_INVENTORY = [
  { id: "b-Apos", type: "A+", units: 12, status: "In stock" },
  { id: "b-Oneg", type: "O-", units: 3, status: "Low" },
  { id: "b-ABpos", type: "AB+", units: 8, status: "In stock" },
];
const bloodRequests = [
  { id: "br-1", bloodType: "O+", units: 2, hospitalId: "org-1", requestedBy: "Southeast Health", urgency: "Urgent", status: "Pending" },
  { id: "br-2", bloodType: "AB-", units: 1, hospitalId: "org-1", requestedBy: "Flowers Hospital", urgency: "Routine", status: "Approved" },
];
let bloodRequestIdNext = 3;
const donationRequests = [
  { id: "dr-1", donorName: "Alicia Stone", bloodType: "A+", preferredDate: "2026-05-30", status: "Pending" },
  { id: "dr-2", donorName: "Rahul Nair", bloodType: "O-", preferredDate: "2026-06-02", status: "Scheduled" },
];
const hospitalDoctors = [
  { id: "doc-1", name: "Dr. Sarah Johnson", specialization: "General", hospitalId: "org-1", status: "Active" },
  { id: "doc-2", name: "Dr. Murray Baker", specialization: "Orthopedics", hospitalId: "org-1", status: "Active" },
];
const hospitalStaff = [
  { id: "staff-1", name: "Nina Patel", department: "Nursing", hospitalId: "org-1", shift: "Day", status: "On duty" },
  { id: "staff-2", name: "Oscar Lee", department: "Billing", hospitalId: "org-1", shift: "Evening", status: "On duty" },
];
const hospitalBilling = [
  { id: "bill-1", patientName: "John Michael Smith", amount: 2400, hospitalId: "org-1", status: "Pending" },
  { id: "bill-2", patientName: "Sarah Elizabeth Johnson", amount: 820, hospitalId: "org-1", status: "Paid" },
];
const hospitalApplications = [
  { id: "ha-1", hospitalName: "North Valley Clinic", applicant: "Dr. Meera Rao", status: "Pending" },
  { id: "ha-2", hospitalName: "Eastside Care", applicant: "Dr. Alan Green", status: "Approved" },
];
const insuranceRenewals = [
  { id: "ir-1", holder: "John Doe", policy: "Health Plus", dueDate: "2026-06-15", status: "Renewal due" },
  { id: "ir-2", holder: "Jane Smith", policy: "Health Basic", dueDate: "2026-07-01", status: "Active" },
];

type PrescriptionStatus = "Active" | "Completed" | "Cancelled";
interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  medication: string;
  dosage: string;
  prescribedBy: string;
  prescribedByEmail?: string;
  status: PrescriptionStatus;
  createdAt: string;
}
const prescriptions: Prescription[] = [
  {
    id: "rx-1",
    patientId: "patient-1",
    patientName: "John Michael Smith",
    medication: "Amoxicillin 500mg",
    dosage: "1 tablet twice daily",
    prescribedBy: "Dr. Sarah Johnson",
    prescribedByEmail: "doctor@demo.com",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
  {
    id: "rx-2",
    patientId: "patient-1",
    patientName: "John Michael Smith",
    medication: "Paracetamol 650mg",
    dosage: "As needed for fever",
    prescribedBy: "Dr. Sarah Johnson",
    prescribedByEmail: "doctor@demo.com",
    status: "Active",
    createdAt: new Date().toISOString(),
  },
];
let prescriptionIdNext = 3;

type RestockStatus = "Pending" | "Approved" | "Rejected";
interface RestockRequest {
  id: string;
  item: string;
  quantity: number;
  hospitalId: string;
  requestedBy: string;
  status: RestockStatus;
  createdAt: string;
}
const restockRequests: RestockRequest[] = [
  { id: "rs-1", item: "Paracetamol", quantity: 100, hospitalId: "org-1", requestedBy: "hospital_admin@demo.com", status: "Pending", createdAt: new Date().toISOString() },
  { id: "rs-2", item: "Ibuprofen", quantity: 50, hospitalId: "org-1", requestedBy: "hospital_admin@demo.com", status: "Approved", createdAt: new Date().toISOString() },
];
let restockIdNext = 3;

type VerificationStatus = "Pending" | "Verified" | "Rejected";
interface PrescriptionVerification {
  id: string;
  patientName: string;
  prescription: string;
  status: VerificationStatus;
  createdAt: string;
}
const prescriptionVerifications: PrescriptionVerification[] = [
  { id: "pv-1", patientName: "John Doe", prescription: "Amoxicillin 500mg", status: "Pending", createdAt: new Date().toISOString() },
  { id: "pv-2", patientName: "Jane Smith", prescription: "Paracetamol", status: "Verified", createdAt: new Date().toISOString() },
];

// Medicine orders: patient places order, vendor accepts/rejects (e.g. "medicine unavailable")
type MedicineOrderStatus = "pending" | "accepted" | "rejected";
interface MedicineOrder {
  id: string;
  patientId: string;
  patientName: string;
  medication: string;
  dosage: string;
  prescribedBy: string;
  prescribedByEmail?: string;
  status: MedicineOrderStatus;
  rejectionReason?: string;
  createdAt: string;
}
const medicineOrders: MedicineOrder[] = [];
let medicineOrderIdNext = 1;

// Middleware: expect x-role and x-hospital-id (or x-user-id) for filtering
function getRole(req: Request): string | null {
  return (req.headers["x-role"] as string) ?? (req.query.role as string) ?? null;
}
function getHospitalId(req: Request): string | null {
  return (req.headers["x-hospital-id"] as string) ?? (req.query.hospitalId as string) ?? null;
}

// Appointments – filter by hospital for hospital_admin/doctor
router.get("/api/appointments", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handleGetAppointments(req, res);
  const role = getRole(req);
  const hospitalId = getHospitalId(req);
  let list = [...MOCK_APPOINTMENTS];
  if (role === "hospital_admin" || role === "doctor") {
    if (hospitalId) list = list.filter((a) => a.hospitalId === hospitalId);
  }
  res.json({ data: list });
});

// Patient queue – same as appointments for queue view
router.get("/api/queue", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handleGetQueue(req, res);
  const hospitalId = getHospitalId(req);
  let list = MOCK_APPOINTMENTS.filter((a) => a.status === "Pending" || a.status === "Accepted");
  if (hospitalId) list = list.filter((a) => a.hospitalId === hospitalId);
  res.json({ data: list });
});

// Policies – for insurance_provider / super_admin
router.get("/api/policies", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handleGetPolicies(req, res);
  res.json({ data: MOCK_POLICIES });
});

// Applicants – for insurance
router.get("/api/applicants", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handleGetApplicants(req, res);
  res.json({ data: MOCK_APPLICANTS });
});

// Policy status – for insurance
router.get("/api/policy-status", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handleGetPolicyStatus(req, res);
  res.json({
    data: [
      { id: "1", holder: "John", policy: "Health Plus", dueDate: "2025-12-31", status: "Active" },
      { id: "2", holder: "Jane", policy: "Health Basic", dueDate: "2025-03-15", status: "Pending" },
    ],
  });
});

// Inventory – filter by hospital for hospital_admin
router.get("/api/inventory", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handleGetInventory(req, res);
  const hospitalId = getHospitalId(req);
  let list = [...MOCK_INVENTORY];
  if (hospitalId) list = list.filter((i) => (i as any).hospitalId == null || (i as any).hospitalId === hospitalId);
  res.json({ data: list });
});

router.get("/api/pharmacy-stock", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handleGetInventory(req, res);
  const hospitalId = getHospitalId(req);
  let list = [...MOCK_INVENTORY];
  if (hospitalId) list = list.filter((i) => (i as any).hospitalId == null || (i as any).hospitalId === hospitalId);
  res.json({ data: list });
});

// System logs – super_admin only
router.get("/api/logs", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handleGetLogs(req, res);
  const role = getRole(req);
  if (role !== "super_admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  res.json({ data: MOCK_LOGS });
});

// Beds – filter by hospital
router.get("/api/beds", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handleGetBeds(req, res);
  const hospitalId = getHospitalId(req);
  const list = [
    { id: "1", hospitalId: "org-1", ward: "General", total: 50, available: 8, status: "Available" },
    { id: "2", hospitalId: "org-1", ward: "ICU", total: 10, available: 0, status: "Full" },
  ];
  const filtered = hospitalId ? list.filter((b) => b.hospitalId === hospitalId) : list;
  res.json({ data: filtered });
});

router.get("/api/blood/inventory", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handleGetBloodInventory(req, res);
  res.json({ data: BLOOD_INVENTORY });
});

router.get("/api/blood/requests", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handleGetBloodRequests(req, res);
  const hospitalId = getHospitalId(req);
  const list = hospitalId ? bloodRequests.filter((r) => r.hospitalId === hospitalId) : bloodRequests;
  res.json({ data: list });
});

router.post("/api/blood/requests", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handlePostBloodRequest(req, res);
  const { bloodType, units, hospitalId, requestedBy, urgency } = req.body || {};
  if (!bloodType || !units) return res.status(400).json({ error: "Missing bloodType or units." });
  const request = {
    id: `br-${bloodRequestIdNext++}`,
    bloodType: String(bloodType),
    units: Number(units),
    hospitalId: String(hospitalId || getHospitalId(req) || "org-1"),
    requestedBy: String(requestedBy || req.headers["x-user-email"] || "Hospital"),
    urgency: String(urgency || "Routine"),
    status: "Pending",
  };
  bloodRequests.push(request);
  notifyBloodRequest(request);
  res.status(201).json({ data: request });
});

router.patch("/api/blood/requests/:id/approve", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handlePatchBloodApprove(req, res);
  const request = bloodRequests.find((r) => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: "Blood request not found." });
  request.status = "Approved";
  notifyBloodApproved({ id: request.id, bloodType: request.bloodType, hospitalId: request.hospitalId });
  res.json({ data: request });
});

router.patch("/api/blood/requests/:id/reject", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handlePatchBloodReject(req, res);
  const request = bloodRequests.find((r) => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: "Blood request not found." });
  request.status = "Rejected";
  res.json({ data: request });
});

router.get("/api/blood/donations", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handleGetDonations(req, res);
  res.json({ data: donationRequests });
});

router.get("/api/hospital/doctors", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handleGetHospitalDoctors(req, res);
  const hospitalId = getHospitalId(req);
  const list = hospitalId ? hospitalDoctors.filter((d) => d.hospitalId === hospitalId) : hospitalDoctors;
  res.json({ data: list });
});

router.get("/api/hospital/staff", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handleGetHospitalStaff(req, res);
  const hospitalId = getHospitalId(req);
  const list = hospitalId ? hospitalStaff.filter((s) => s.hospitalId === hospitalId) : hospitalStaff;
  res.json({ data: list });
});

router.get("/api/hospital/billing", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handleGetHospitalBilling(req, res);
  const hospitalId = getHospitalId(req);
  const list = hospitalId ? hospitalBilling.filter((b) => b.hospitalId === hospitalId) : hospitalBilling;
  res.json({ data: list });
});

router.get("/api/hospital/applications", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handleGetHospitalApplications(req, res);
  const role = getRole(req);
  const email = (req.headers["x-user-email"] as string) ?? "";
  let list = [...hospitalApplications];
  if (role === "doctor" && email) {
    list = list.filter(
      (a) =>
        (a as { applicantEmail?: string }).applicantEmail === email ||
        a.applicant.toLowerCase().includes(email.toLowerCase())
    );
  }
  res.json({ data: list });
});

router.post("/api/hospital/applications", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handlePostHospitalApplications(req, res);
  const role = getRole(req);
  if (role !== "doctor") return res.status(403).json({ error: "Only doctors can submit hospital applications." });
  const { hospitalId, hospitalName, applicantName, applicantEmail } = req.body || {};
  if (!hospitalId) return res.status(400).json({ error: "hospitalId is required." });
  const row = {
    id: `ha-${Date.now()}`,
    hospitalId: String(hospitalId),
    hospitalName: String(hospitalName || "Hospital"),
    applicant: String(applicantName || applicantEmail || "Doctor"),
    applicantEmail: applicantEmail ? String(applicantEmail) : undefined,
    status: "Pending" as const,
  };
  hospitalApplications.unshift(row);
  res.status(201).json({ data: row });
});

router.get("/api/insurance/renewals", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handleGetInsuranceRenewals(req, res);
  res.json({ data: insuranceRenewals });
});

// Medicine orders – patient creates; vendor accepts/rejects; patient/doctor view
router.post("/api/medicine-orders", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handlePostMedicineOrders(req, res);
  const { patientId, patientName, medication, dosage, prescribedBy, prescribedByEmail } = req.body || {};
  if (!patientId || !medication) {
    return res.status(400).json({ error: "Missing patientId or medication." });
  }
  const id = `mo-${medicineOrderIdNext++}`;
  const order: MedicineOrder = {
    id,
    patientId: String(patientId),
    patientName: String(patientName || "Patient"),
    medication: String(medication),
    dosage: String(dosage || ""),
    prescribedBy: String(prescribedBy || ""),
    prescribedByEmail: prescribedByEmail ? String(prescribedByEmail) : undefined,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  medicineOrders.push(order);
  notifyMedicineOrder({
    id: order.id,
    medication: order.medication,
    patientName: order.patientName,
    hospitalId: getHospitalId(req) || undefined,
  });
  res.status(201).json({ data: order });
});

router.get("/api/medicine-orders", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handleGetMedicineOrders(req, res);
  const role = getRole(req);
  const patientId = (req.query.patientId as string) ?? (req.headers["x-patient-id"] as string);
  let list = [...medicineOrders];
  if (role === "patient" && patientId) {
    list = list.filter((o) => o.patientId === patientId);
  }
  res.json({ data: list });
});

router.patch("/api/medicine-orders/:id/accept", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handlePatchMedicineAccept(req, res);
  const order = medicineOrders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found." });
  if (order.status !== "pending") return res.status(400).json({ error: "Order is not pending." });
  order.status = "accepted";
  res.json({ data: order });
});

router.patch("/api/medicine-orders/:id/reject", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handlePatchMedicineReject(req, res);
  const order = medicineOrders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found." });
  if (order.status !== "pending") return res.status(400).json({ error: "Order is not pending." });
  const reason = (req.body && (req.body as any).reason) ? String((req.body as any).reason) : "Medicine unavailable";
  order.status = "rejected";
  order.rejectionReason = reason;
  res.json({ data: order });
});

router.get("/api/prescriptions", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handleGetPrescriptions(req, res);
  const role = getRole(req);
  const patientId = (req.query.patientId as string) ?? (req.headers["x-patient-id"] as string);
  const doctorEmail = (req.headers["x-user-email"] as string) ?? (req.query.email as string);
  let list = [...prescriptions];
  if (role === "patient" && patientId) {
    list = list.filter((p) => p.patientId === patientId);
  } else if (role === "doctor" && doctorEmail) {
    list = list.filter((p) => p.prescribedByEmail === doctorEmail);
  }
  res.json({ data: list });
});

router.post("/api/prescriptions", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handlePostPrescriptions(req, res);
  const { patientId, patientName, medication, dosage, prescribedBy, prescribedByEmail } = req.body || {};
  if (!patientId || !medication || !dosage) {
    return res.status(400).json({ error: "Missing patientId, medication, or dosage." });
  }
  const prescription: Prescription = {
    id: `rx-${prescriptionIdNext++}`,
    patientId: String(patientId),
    patientName: String(patientName || "Patient"),
    medication: String(medication),
    dosage: String(dosage),
    prescribedBy: String(prescribedBy || "Doctor"),
    prescribedByEmail: prescribedByEmail ? String(prescribedByEmail) : undefined,
    status: "Active",
    createdAt: new Date().toISOString(),
  };
  prescriptions.push(prescription);
  res.status(201).json({ data: prescription });
});

router.patch("/api/prescriptions/:id", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handlePatchPrescriptions(req, res);
  const role = getRole(req);
  if (!["doctor", "super_admin", "hospital_admin"].includes(role || "")) {
    return res.status(403).json({ error: "Forbidden." });
  }
  const rx = prescriptions.find((p) => p.id === req.params.id);
  if (!rx) return res.status(404).json({ error: "Prescription not found." });
  const body = req.body || {};
  if (body.medication) rx.medication = String(body.medication);
  if (body.dosage) rx.dosage = String(body.dosage);
  if (body.status && ["Active", "Completed", "Cancelled"].includes(body.status)) {
    rx.status = body.status;
  }
  res.json({ data: rx });
});

router.delete("/api/prescriptions/:id", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handleDeletePrescriptions(req, res);
  const role = getRole(req);
  if (!["doctor", "super_admin"].includes(role || "")) {
    return res.status(403).json({ error: "Forbidden." });
  }
  const idx = prescriptions.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Prescription not found." });
  prescriptions.splice(idx, 1);
  res.json({ ok: true });
});

router.get("/api/restock-requests", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handleGetRestock(req, res);
  const hospitalId = getHospitalId(req);
  const list = hospitalId ? restockRequests.filter((r) => r.hospitalId === hospitalId) : restockRequests;
  res.json({ data: list });
});

router.post("/api/restock-requests", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handlePostRestock(req, res);
  const role = getRole(req);
  if (role && !["hospital_admin", "doctor", "super_admin"].includes(role)) {
    return res.status(403).json({ error: "Only hospital admins and doctors can submit restock requests." });
  }
  const { item, quantity, hospitalId, requestedBy } = req.body || {};
  if (!item || !quantity) {
    return res.status(400).json({ error: "Missing item or quantity." });
  }
  const request: RestockRequest = {
    id: `rs-${restockIdNext++}`,
    item: String(item),
    quantity: Number(quantity),
    hospitalId: String(hospitalId || getHospitalId(req) || "org-1"),
    requestedBy: String(requestedBy || req.headers["x-user-email"] || "user"),
    status: "Pending",
    createdAt: new Date().toISOString(),
  };
  restockRequests.push(request);
  notifyRestockRequest({
    id: request.id,
    medicine: request.item,
    hospitalId: request.hospitalId,
    requestedBy: request.requestedBy,
  });
  res.status(201).json({ data: request });
});

router.patch("/api/restock-requests/:id/approve", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handlePatchRestockApprove(req, res);
  const role = getRole(req);
  if (role && !["medical_vendor", "super_admin"].includes(role)) {
    return res.status(403).json({ error: "Only pharmacy vendors can approve restock requests." });
  }
  const request = restockRequests.find((r) => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: "Restock request not found." });
  request.status = "Approved";
  notifyRestockApproved({ id: request.id, medicine: request.item, hospitalId: request.hospitalId });
  res.json({ data: request });
});

router.patch("/api/restock-requests/:id/reject", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handlePatchRestockReject(req, res);
  const role = getRole(req);
  if (role && !["medical_vendor", "super_admin"].includes(role)) {
    return res.status(403).json({ error: "Only pharmacy vendors can reject restock requests." });
  }
  const request = restockRequests.find((r) => r.id === req.params.id);
  if (!request) return res.status(404).json({ error: "Restock request not found." });
  request.status = "Rejected";
  res.json({ data: request });
});

router.get("/api/prescription-verifications", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handleGetPrescriptionVerifications(req, res);
  res.json({ data: prescriptionVerifications });
});

router.patch("/api/prescription-verifications/:id/verify", async (req: Request, res: Response) => {
  if (useDatabase()) return dbh.handlePatchPrescriptionVerify(req, res);
  const verification = prescriptionVerifications.find((v) => v.id === req.params.id);
  if (!verification) return res.status(404).json({ error: "Prescription verification not found." });
  verification.status = "Verified";
  res.json({ data: verification });
});

export default router;
