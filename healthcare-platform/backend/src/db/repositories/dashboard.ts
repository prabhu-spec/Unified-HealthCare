import { prisma } from "../client.js";

export async function listLegacyAppointments(hospitalId: string | null, role: string | null) {
  const rows = await prisma.appointment.findMany({ orderBy: { date: "asc" } });
  const mapped = rows.map((a) => ({
    id: a.id,
    patientId: a.patientId,
    hospitalId: a.hospitalId,
    doctorId: a.doctorId,
    date: a.date,
    time: a.time,
    status: a.status,
  }));
  if ((role === "hospital_admin" || role === "doctor") && hospitalId) {
    return mapped.filter((a) => a.hospitalId === hospitalId);
  }
  return mapped;
}

export async function listPolicies() {
  return prisma.policy.findMany();
}

export async function listApplicants() {
  return prisma.applicant.findMany();
}

export async function listPolicyStatus() {
  return prisma.policyStatusRow.findMany();
}

export async function listInventory(hospitalId: string | null) {
  const rows = await prisma.inventoryItem.findMany();
  if (!hospitalId) return rows;
  return rows.filter((i) => i.hospitalId == null || i.hospitalId === hospitalId);
}

export async function listLogs() {
  return prisma.systemLog.findMany({ orderBy: { timestamp: "desc" } });
}

export async function listBeds(hospitalId: string | null) {
  const rows = await prisma.bed.findMany();
  return hospitalId ? rows.filter((b) => b.hospitalId === hospitalId) : rows;
}

export async function listBloodInventory() {
  return prisma.bloodInventory.findMany();
}

export async function listBloodRequests(hospitalId: string | null) {
  const rows = await prisma.bloodRequest.findMany();
  return hospitalId ? rows.filter((r) => r.hospitalId === hospitalId) : rows;
}

export async function createBloodRequest(data: {
  bloodType: string;
  units: number;
  hospitalId: string;
  requestedBy: string;
  urgency: string;
}) {
  const count = await prisma.bloodRequest.count();
  return prisma.bloodRequest.create({
    data: { id: `br-${count + 1}`, ...data, status: "Pending" },
  });
}

export async function updateBloodRequestStatus(id: string, status: string) {
  return prisma.bloodRequest.update({ where: { id }, data: { status } });
}

export async function findBloodRequest(id: string) {
  return prisma.bloodRequest.findUnique({ where: { id } });
}

export async function listDonations() {
  return prisma.donationRequest.findMany();
}

export async function listHospitalDoctors(hospitalId: string | null) {
  const rows = await prisma.hospitalDoctor.findMany();
  return hospitalId ? rows.filter((d) => d.hospitalId === hospitalId) : rows;
}

export async function listHospitalStaff(hospitalId: string | null) {
  const rows = await prisma.hospitalStaff.findMany();
  return hospitalId ? rows.filter((s) => s.hospitalId === hospitalId) : rows;
}

export async function listHospitalBilling(hospitalId: string | null) {
  const rows = await prisma.hospitalBilling.findMany();
  return hospitalId ? rows.filter((b) => b.hospitalId === hospitalId) : rows;
}

export async function listHospitalApplications(role: string | null, email: string) {
  const rows = await prisma.hospitalApplication.findMany({ orderBy: { id: "asc" } });
  if (role === "doctor" && email) {
    return rows.filter(
      (a) =>
        (a.applicantEmail && a.applicantEmail === email) ||
        a.applicant.toLowerCase().includes(email.toLowerCase())
    );
  }
  return rows;
}

export async function createHospitalApplication(data: {
  hospitalId: string;
  hospitalName: string;
  applicant: string;
  applicantEmail?: string;
}) {
  return prisma.hospitalApplication.create({
    data: {
      id: `ha-${Date.now()}`,
      hospitalId: data.hospitalId,
      hospitalName: data.hospitalName,
      applicant: data.applicant,
      applicantEmail: data.applicantEmail,
      status: "Pending",
    },
  });
}

export async function listInsuranceRenewals() {
  return prisma.insuranceRenewal.findMany();
}

export async function listMedicineOrders(role: string | null, patientId: string | null) {
  const rows = await prisma.medicineOrder.findMany({ orderBy: { createdAt: "desc" } });
  if (role === "patient" && patientId) return rows.filter((o) => o.patientId === patientId);
  return rows;
}

export async function createMedicineOrder(data: {
  patientId: string;
  patientName: string;
  medication: string;
  dosage: string;
  prescribedBy: string;
  prescribedByEmail?: string;
}) {
  const count = await prisma.medicineOrder.count();
  return prisma.medicineOrder.create({
    data: {
      id: `mo-${count + 1}`,
      ...data,
      status: "pending",
    },
  });
}

export async function updateMedicineOrder(id: string, status: string, rejectionReason?: string) {
  return prisma.medicineOrder.update({
    where: { id },
    data: { status, ...(rejectionReason ? { rejectionReason } : {}) },
  });
}

export async function findMedicineOrder(id: string) {
  return prisma.medicineOrder.findUnique({ where: { id } });
}

export async function listPrescriptions(role: string | null, patientId: string | null, doctorEmail: string) {
  const rows = await prisma.prescription.findMany({ orderBy: { createdAt: "desc" } });
  if (role === "patient" && patientId) return rows.filter((p) => p.patientId === patientId);
  if (role === "doctor" && doctorEmail) return rows.filter((p) => p.prescribedByEmail === doctorEmail);
  return rows;
}

export async function createPrescription(data: {
  patientId: string;
  patientName: string;
  medication: string;
  dosage: string;
  prescribedBy: string;
  prescribedByEmail?: string;
}) {
  const count = await prisma.prescription.count();
  return prisma.prescription.create({
    data: { id: `rx-${count + 1}`, ...data, status: "Active" },
  });
}

export async function updatePrescription(id: string, patch: { medication?: string; dosage?: string; status?: string }) {
  return prisma.prescription.update({ where: { id }, data: patch });
}

export async function deletePrescription(id: string) {
  await prisma.prescription.delete({ where: { id } });
}

export async function findPrescription(id: string) {
  return prisma.prescription.findUnique({ where: { id } });
}

export async function listRestockRequests(hospitalId: string | null) {
  const rows = await prisma.restockRequest.findMany({ orderBy: { createdAt: "desc" } });
  return hospitalId ? rows.filter((r) => r.hospitalId === hospitalId) : rows;
}

export async function createRestockRequest(data: {
  item: string;
  quantity: number;
  hospitalId: string;
  requestedBy: string;
}) {
  const count = await prisma.restockRequest.count();
  return prisma.restockRequest.create({
    data: { id: `rs-${count + 1}`, ...data, status: "Pending" },
  });
}

export async function updateRestockRequest(id: string, status: string) {
  return prisma.restockRequest.update({ where: { id }, data: { status } });
}

export async function findRestockRequest(id: string) {
  return prisma.restockRequest.findUnique({ where: { id } });
}

export async function listPrescriptionVerifications() {
  return prisma.prescriptionVerification.findMany({ orderBy: { createdAt: "desc" } });
}

export async function verifyPrescription(id: string) {
  return prisma.prescriptionVerification.update({
    where: { id },
    data: { status: "Verified" },
  });
}

export async function findPrescriptionVerification(id: string) {
  return prisma.prescriptionVerification.findUnique({ where: { id } });
}
