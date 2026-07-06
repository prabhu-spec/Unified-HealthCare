import { prisma } from "./client.js";

const DEMO_PASSWORD = "demo123";

export async function seedDatabase(): Promise<void> {
  const now = new Date();

  await prisma.$transaction([
    prisma.hospital.createMany({
      data: [
        {
          id: "org-1",
          name: "Southeast Health Medical Center",
          street: "1108 Ross Clark Cir",
          city: "Dothan",
          state: "AL",
          postalCode: "36301",
          phone: "(334) 793-8701",
          url: "https://www.southeasthealth.org",
          orgType: "Acute Care Hospital",
          rating: 4.0,
          emergencyServices: true,
        },
        {
          id: "org-2",
          name: "North Valley Hospital",
          street: "201 Health Pkwy",
          city: "Birmingham",
          state: "AL",
          postalCode: "35203",
          phone: "(205) 555-1100",
          orgType: "Community Hospital",
          rating: 4.2,
          emergencyServices: true,
        },
      ],
    }),
    prisma.user.createMany({
      data: [
        { id: "u-super", email: "superadmin@demo.com", password: DEMO_PASSWORD, firstName: "Super", lastName: "Admin", role: "super_admin" },
        { id: "u-ins", email: "insurance@demo.com", password: DEMO_PASSWORD, firstName: "Insurance", lastName: "Provider", role: "insurance_provider" },
        { id: "u-vendor", email: "vendor@demo.com", password: DEMO_PASSWORD, firstName: "Medical", lastName: "Vendor", role: "medical_vendor" },
        { id: "u-ha1", email: "hospitaladmin@demo.com", password: DEMO_PASSWORD, firstName: "Hospital", lastName: "Admin", role: "hospital_admin", hospitalId: "org-1" },
        { id: "u-ha2", email: "hospitaladmin2@demo.com", password: DEMO_PASSWORD, firstName: "Admin", lastName: "Two", role: "hospital_admin", hospitalId: "org-2" },
        { id: "u-doc", email: "doctor@demo.com", password: DEMO_PASSWORD, firstName: "Dr. Sarah", lastName: "Johnson", role: "doctor", hospitalId: "org-1", specialization: "general", gender: "female", bloodType: "O+" },
        { id: "u-nurse", email: "nurse@demo.com", password: DEMO_PASSWORD, firstName: "Jane", lastName: "Miller", role: "nurse", hospitalId: "org-1" },
        { id: "u-pat", email: "patient@demo.com", password: DEMO_PASSWORD, firstName: "John", lastName: "Doe", role: "patient", patientId: "patient-1", gender: "male", bloodType: "A+" },
        { id: "u-bb", email: "bloodbank@demo.com", password: DEMO_PASSWORD, firstName: "Blood", lastName: "Bank Admin", role: "bloodbank_admin" },
      ],
    }),
    prisma.patient.createMany({
      data: [
        {
          id: "patient-1", hospitalId: "org-1", firstName: "John", lastName: "Smith", gender: "male", birthDate: "1985-03-15", mrn: "MRN123456",
          phone: "+1-555-0123", email: "john.smith@email.com", street: "123 Main St", city: "Springfield", state: "IL", postalCode: "62701",
          weightKg: 82, heightCm: 178, bloodType: "A+", chiefComplaint: "Persistent cough and mild chest discomfort for 5 days",
          pregnancyStatus: "not_applicable", eGFR: 92, creatinine: 1.0, smokingStatus: "former", alcoholUse: "occasional", codeStatus: "full_code",
          consultNotes: "Hypertension managed on Lisinopril. Monitor BP and respiratory symptoms.",
        },
        {
          id: "patient-2", hospitalId: "org-1", firstName: "Sarah", lastName: "Johnson", gender: "female", birthDate: "1992-07-22", mrn: "MRN789012",
          phone: "+1-555-0456", email: "sarah.johnson@email.com", street: "456 Oak Ave", city: "Springfield", state: "IL", postalCode: "62702",
          weightKg: 68, heightCm: 165, bloodType: "O+", chiefComplaint: "Routine diabetes follow-up",
          pregnancyStatus: "not_applicable", eGFR: 88, creatinine: 1.1, smokingStatus: "never", alcoholUse: "none", codeStatus: "full_code",
        },
        { id: "patient-3", hospitalId: "org-1", firstName: "Robert", lastName: "Williams", gender: "male", birthDate: "1978-11-08", mrn: "MRN345678", phone: "+1-555-0789", email: "robert.williams@email.com", street: "789 Pine St", city: "Dothan", state: "AL", postalCode: "36301" },
        { id: "patient-4", hospitalId: "org-2", firstName: "Maria", lastName: "Davis", gender: "female", birthDate: "1965-04-12", mrn: "MRN901234", phone: "+1-555-0321", email: "maria.davis@email.com", street: "321 Elm Dr", city: "Florence", state: "AL", postalCode: "35630" },
      ],
    }),
    prisma.patientAllergy.createMany({
      data: [
        { id: "al-1", patientId: "patient-1", allergen: "Penicillin", reaction: "Rash", severity: "moderate", category: "drug", status: "active" },
        { id: "al-2", patientId: "patient-1", allergen: "Shellfish", reaction: "Hives", severity: "mild", category: "food", status: "active" },
        { id: "al-3", patientId: "patient-2", allergen: "Latex", reaction: "Contact dermatitis", severity: "mild", category: "environmental", status: "active" },
      ],
    }),
    prisma.patientProblem.createMany({
      data: [
        { id: "pb-1", patientId: "patient-1", code: "I10", description: "Essential hypertension", status: "active", onsetDate: "2020-03-01", notes: "On ACE inhibitor" },
        { id: "pb-2", patientId: "patient-1", code: "J06.9", description: "Acute upper respiratory infection", status: "active", onsetDate: "2026-05-20", notes: "Under evaluation" },
        { id: "pb-3", patientId: "patient-2", code: "E11.9", description: "Type 2 diabetes mellitus", status: "active", onsetDate: "2019-08-15", notes: "Diet controlled" },
      ],
    }),
    prisma.appointment.createMany({
      data: [
        { id: "apt-1", patientId: "patient-1", patientName: "John Smith", hospitalId: "org-1", doctorId: "u-doc", doctorName: "Dr. Sarah Johnson", date: "2026-05-27", time: "10:00", type: "Consultation", status: "Pending" },
        { id: "apt-2", patientId: "patient-2", patientName: "Sarah Johnson", hospitalId: "org-1", doctorId: "u-doc", doctorName: "Dr. Sarah Johnson", date: "2026-05-27", time: "11:30", type: "Follow-up", status: "Accepted" },
        { id: "apt-3", patientId: "patient-4", patientName: "Maria Davis", hospitalId: "org-2", doctorId: "u-doc-2", doctorName: "Dr. Murray Baker", date: "2026-05-28", time: "14:00", type: "Consultation", status: "Pending" },
      ],
    }),
    prisma.patientHistory.createMany({
      data: [
        { id: "h1", patientId: "patient-1", patientName: "John Smith", hospitalId: "org-1", date: "2026-05-01", type: "Consultation", provider: "Dr. Sarah Johnson", summary: "Routine check-up and care plan review." },
        { id: "h2", patientId: "patient-1", patientName: "John Smith", hospitalId: "org-1", date: "2026-04-18", type: "Follow-up", provider: "Dr. Sarah Johnson", summary: "Blood pressure follow-up, medication continued." },
        { id: "h3", patientId: "patient-2", patientName: "Sarah Johnson", hospitalId: "org-1", date: "2026-04-22", type: "Lab review", provider: "Dr. Sarah Johnson", summary: "Lab results reviewed, no urgent findings." },
        { id: "h4", patientId: "patient-4", patientName: "Maria Davis", hospitalId: "org-2", date: "2026-04-29", type: "Annual physical", provider: "Dr. Murray Baker", summary: "Annual wellness exam completed." },
      ],
    }),
    prisma.medicalRecord.createMany({
      data: [
        { id: "rec-1", patientId: "patient-1", patientName: "John Smith", hospitalId: "org-1", date: "2026-05-01", category: "Observation", name: "Blood Pressure", value: "128/82 mmHg", provider: "Dr. Sarah Johnson" },
        { id: "rec-2", patientId: "patient-1", patientName: "John Smith", hospitalId: "org-1", date: "2026-05-01", category: "Medication", name: "Lisinopril", value: "10mg once daily", provider: "Dr. Sarah Johnson" },
        { id: "rec-3", patientId: "patient-2", patientName: "Sarah Johnson", hospitalId: "org-1", date: "2026-04-22", category: "Lab", name: "Hemoglobin", value: "13.2 g/dL", provider: "Dr. Sarah Johnson" },
        { id: "rec-4", patientId: "patient-4", patientName: "Maria Davis", hospitalId: "org-2", date: "2026-04-29", category: "Observation", name: "Heart Rate", value: "78 bpm", provider: "Dr. Murray Baker" },
      ],
    }),
    prisma.receipt.createMany({
      data: [
        { id: "r1", patientId: "patient-1", patientName: "John Smith", hospitalId: "org-1", date: "2026-05-01", amount: 150, description: "Consultation", status: "paid" },
        { id: "r2", patientId: "patient-1", patientName: "John Smith", hospitalId: "org-1", date: "2026-04-18", amount: 75, description: "Follow-up", status: "paid" },
        { id: "r3", patientId: "patient-2", patientName: "Sarah Johnson", hospitalId: "org-1", date: "2026-04-22", amount: 200, description: "Lab review", status: "paid" },
        { id: "r4", patientId: "patient-4", patientName: "Maria Davis", hospitalId: "org-2", date: "2026-04-29", amount: 120, description: "Annual physical", status: "paid" },
      ],
    }),
    prisma.schedule.createMany({
      data: [
        { id: "sch-1", hospitalId: "org-1", staffId: "u-doc", staffName: "Dr. Sarah Johnson", staffRole: "doctor", patientId: "patient-1", patientName: "John Smith", title: "Follow-up consultation", type: "consultation", date: "2026-05-31", startTime: "09:00", endTime: "09:30", status: "scheduled", createdAt: now },
        { id: "sch-2", hospitalId: "org-1", staffId: "u-nurse", staffName: "Jane Miller", staffRole: "nurse", patientId: "patient-2", patientName: "Sarah Johnson", title: "Vitals check — Room 102", type: "nursing_round", date: "2026-05-31", startTime: "08:00", endTime: "08:15", notes: "Hourly SpO2 and HR", status: "scheduled", createdAt: now },
      ],
    }),
    prisma.inventoryItem.createMany({
      data: [
        { id: "1", name: "Amoxicillin 500mg", quantity: 120, reorderLevel: 20, hospitalId: "org-1", status: "In-stock" },
        { id: "2", name: "Paracetamol", quantity: 5, reorderLevel: 30, hospitalId: "org-1", status: "Low stock" },
        { id: "3", name: "Ibuprofen", quantity: 0, reorderLevel: 25, hospitalId: "org-1", status: "Out-of-stock" },
      ],
    }),
    prisma.policy.createMany({
      data: [
        { id: "1", name: "Health Basic", status: "Active" },
        { id: "2", name: "Health Plus", status: "Active" },
      ],
    }),
    prisma.applicant.createMany({
      data: [
        { id: "1", name: "Alice", policyId: "1", status: "Pending" },
        { id: "2", name: "Bob", policyId: "2", status: "Approved" },
      ],
    }),
    prisma.policyStatusRow.createMany({
      data: [
        { id: "1", holder: "John", policy: "Health Plus", dueDate: "2025-12-31", status: "Active" },
        { id: "2", holder: "Jane", policy: "Health Basic", dueDate: "2025-03-15", status: "Pending" },
      ],
    }),
    prisma.bed.createMany({
      data: [
        { id: "1", hospitalId: "org-1", ward: "General", total: 50, available: 8, status: "Available" },
        { id: "2", hospitalId: "org-1", ward: "ICU", total: 10, available: 0, status: "Full" },
      ],
    }),
    prisma.bloodInventory.createMany({
      data: [
        { id: "b-Apos", type: "A+", units: 12, status: "In stock" },
        { id: "b-Oneg", type: "O-", units: 3, status: "Low" },
        { id: "b-ABpos", type: "AB+", units: 8, status: "In stock" },
      ],
    }),
    prisma.bloodRequest.createMany({
      data: [
        { id: "br-1", bloodType: "O+", units: 2, hospitalId: "org-1", requestedBy: "Southeast Health", urgency: "Urgent", status: "Pending" },
        { id: "br-2", bloodType: "AB-", units: 1, hospitalId: "org-1", requestedBy: "Flowers Hospital", urgency: "Routine", status: "Approved" },
      ],
    }),
    prisma.donationRequest.createMany({
      data: [
        { id: "dr-1", donorName: "Alicia Stone", bloodType: "A+", preferredDate: "2026-05-30", status: "Pending" },
        { id: "dr-2", donorName: "Rahul Nair", bloodType: "O-", preferredDate: "2026-06-02", status: "Scheduled" },
      ],
    }),
    prisma.hospitalDoctor.createMany({
      data: [
        { id: "doc-1", name: "Dr. Sarah Johnson", specialization: "General", hospitalId: "org-1", status: "Active" },
        { id: "doc-2", name: "Dr. Murray Baker", specialization: "Orthopedics", hospitalId: "org-1", status: "Active" },
      ],
    }),
    prisma.hospitalStaff.createMany({
      data: [
        { id: "staff-1", name: "Nina Patel", department: "Nursing", hospitalId: "org-1", shift: "Day", status: "On duty" },
        { id: "staff-2", name: "Oscar Lee", department: "Billing", hospitalId: "org-1", shift: "Evening", status: "On duty" },
      ],
    }),
    prisma.hospitalBilling.createMany({
      data: [
        { id: "bill-1", patientName: "John Michael Smith", amount: 2400, hospitalId: "org-1", status: "Pending" },
        { id: "bill-2", patientName: "Sarah Elizabeth Johnson", amount: 820, hospitalId: "org-1", status: "Paid" },
      ],
    }),
    prisma.hospitalApplication.createMany({
      data: [
        { id: "ha-1", hospitalId: "org-2", hospitalName: "North Valley Clinic", applicant: "Dr. Meera Rao", status: "Pending" },
        { id: "ha-2", hospitalId: "org-1", hospitalName: "Eastside Care", applicant: "Dr. Alan Green", status: "Approved" },
      ],
    }),
    prisma.insuranceRenewal.createMany({
      data: [
        { id: "ir-1", holder: "John Doe", policy: "Health Plus", dueDate: "2026-06-15", status: "Renewal due" },
        { id: "ir-2", holder: "Jane Smith", policy: "Health Basic", dueDate: "2026-07-01", status: "Active" },
      ],
    }),
    prisma.prescription.createMany({
      data: [
        { id: "rx-1", patientId: "patient-1", patientName: "John Michael Smith", medication: "Amoxicillin 500mg", dosage: "1 tablet twice daily", prescribedBy: "Dr. Sarah Johnson", prescribedByEmail: "doctor@demo.com", status: "Active", createdAt: now },
        { id: "rx-2", patientId: "patient-1", patientName: "John Michael Smith", medication: "Paracetamol 650mg", dosage: "As needed for fever", prescribedBy: "Dr. Sarah Johnson", prescribedByEmail: "doctor@demo.com", status: "Active", createdAt: now },
      ],
    }),
    prisma.restockRequest.createMany({
      data: [
        { id: "rs-1", item: "Paracetamol", quantity: 100, hospitalId: "org-1", requestedBy: "hospitaladmin@demo.com", status: "Pending", createdAt: now },
        { id: "rs-2", item: "Ibuprofen", quantity: 50, hospitalId: "org-1", requestedBy: "hospitaladmin@demo.com", status: "Approved", createdAt: now },
      ],
    }),
    prisma.prescriptionVerification.createMany({
      data: [
        { id: "pv-1", patientName: "John Doe", prescription: "Amoxicillin 500mg", status: "Pending", createdAt: now },
        { id: "pv-2", patientName: "Jane Smith", prescription: "Paracetamol", status: "Verified", createdAt: now },
      ],
    }),
    prisma.systemLog.create({
      data: { id: "1", timestamp: now, userId: "doctor@demo.com", action: "Login", resource: "Auth" },
    }),
  ]);
}
