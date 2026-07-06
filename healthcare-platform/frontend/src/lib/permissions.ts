import type { UserRole } from './auth';

export type PatientDetailLevel = 'none' | 'limited_claims' | 'limited_contact' | 'full';

const VALID_ROLES: UserRole[] = ['super_admin', 'insurance_provider', 'medical_vendor', 'hospital_admin', 'bloodbank_admin', 'doctor', 'nurse', 'patient'];

function normalizeRole(role: UserRole | string | undefined): UserRole {
  const r = (typeof role === 'string' ? role : '').toLowerCase();
  return (VALID_ROLES.includes(r as UserRole) ? r : 'patient') as UserRole;
}

export const PERMISSIONS: Record<
  UserRole,
  {
    patientDetails: PatientDetailLevel;
    canBookAppointment: boolean;
    canViewPatientHistory: boolean;
    canViewMedicalRecords: boolean;
    canViewReceipts: boolean;
    canViewHospitals: boolean;
    canManageAppointments: boolean;
    canViewBedAvailability: boolean;
    canViewPharmacyStock: boolean;
    canPurchaseMedicines: boolean;
    canUploadPrescription: boolean;
    canViewInsuranceRenewal: boolean;
    canManagePatientQueue: boolean;
    canPrescribe: boolean;
    canHospitalApplication: boolean;
    canManageInventory: boolean;
    canRestockRequest: boolean;
    canPrescriptionVerification: boolean;
    canManagePolicies: boolean;
    canViewApplicants: boolean;
    canViewPolicyStatus: boolean;
    canManageHospitalDoctors: boolean;
    canManageHospitalPatients: boolean;
    canManageHospitalPharmacy: boolean;
    canManageBeds: boolean;
    canManageStaff: boolean;
    canManageBilling: boolean;
    canViewSystemLogs: boolean;
    canViewBloodRequests: boolean;
    canManageBloodInventory: boolean;
    canSendDonationRequests: boolean;
    canRequestBlood: boolean;
    canManageMedicineOrders: boolean;
    canViewPrescriptionOrders: boolean;
    /** Ward overview (room tiles + detail modal). Hospital admin: all rooms; doctor: assigned only. */
    canViewPatientOverview: boolean;
    /** Live vitals charts, critical alerts, full Socket.IO vitals stream (doctor only). */
    canViewLiveTelemetry: boolean;
    /** Register / remove IoMT devices (hospital admin only). */
    canManageTelemetryDevices: boolean;
    /** RPM patient CRUD + device↔patient assignment (doctor only). */
    canManageTelemetryAssignments: boolean;
    /** Assign doctor to patient in overview modal (hospital admin only). */
    canAssignTelemetryDoctor: boolean;
    /** Enter / exit room visit logging in overview (doctor only). */
    canLogTelemetryRoomVisit: boolean;
    /** Read device list for assignments workflow (doctor; hospital admin uses Devices page). */
    canViewTelemetryDevicesReadOnly: boolean;
    /** Patient: own room/vitals snapshot in overview (healthcare-specific). */
    canViewOwnTelemetry: boolean;
    scope: 'all' | 'hospital' | 'own' | 'claims_only';
  }
> = {
  super_admin: {
    patientDetails: 'full',
    canBookAppointment: false,
    canViewPatientHistory: true,
    canViewMedicalRecords: true,
    canViewReceipts: true,
    canViewHospitals: true,
    canManageAppointments: true,
    canViewBedAvailability: true,
    canViewPharmacyStock: true,
    canPurchaseMedicines: true,
    canUploadPrescription: true,
    canViewInsuranceRenewal: true,
    canManagePatientQueue: true,
    canPrescribe: true,
    canHospitalApplication: true,
    canManageInventory: true,
    canRestockRequest: true,
    canPrescriptionVerification: true,
    canManagePolicies: true,
    canViewApplicants: true,
    canViewPolicyStatus: true,
    canManageHospitalDoctors: true,
    canManageHospitalPatients: true,
    canManageHospitalPharmacy: true,
    canManageBeds: true,
    canManageStaff: true,
    canManageBilling: true,
    canViewSystemLogs: true,
    canViewBloodRequests: true,
    canManageBloodInventory: true,
    canSendDonationRequests: true,
    canRequestBlood: true,
    canManageMedicineOrders: true,
    canViewPrescriptionOrders: true,
    canViewPatientOverview: false,
    canViewLiveTelemetry: false,
    canManageTelemetryDevices: false,
    canManageTelemetryAssignments: false,
    canAssignTelemetryDoctor: false,
    canLogTelemetryRoomVisit: false,
    canViewTelemetryDevicesReadOnly: false,
    canViewOwnTelemetry: false,
    scope: 'all'
  },
  insurance_provider: {
    patientDetails: 'limited_claims',
    canBookAppointment: false,
    canViewPatientHistory: true,
    canViewMedicalRecords: true,
    canViewReceipts: true,
    canViewHospitals: false,
    canManageAppointments: false,
    canViewBedAvailability: false,
    canViewPharmacyStock: false,
    canPurchaseMedicines: false,
    canUploadPrescription: false,
    canViewInsuranceRenewal: false,
    canManagePatientQueue: false,
    canPrescribe: false,
    canHospitalApplication: false,
    canManageInventory: false,
    canRestockRequest: false,
    canPrescriptionVerification: false,
    canManagePolicies: true,
    canViewApplicants: true,
    canViewPolicyStatus: true,
    canManageHospitalDoctors: false,
    canManageHospitalPatients: false,
    canManageHospitalPharmacy: false,
    canManageBeds: false,
    canManageStaff: false,
    canManageBilling: false,
    canViewSystemLogs: false,
    canViewBloodRequests: false,
    canManageBloodInventory: false,
    canSendDonationRequests: false,
    canRequestBlood: false,
    canManageMedicineOrders: false,
    canViewPrescriptionOrders: false,
    canViewPatientOverview: false,
    canViewLiveTelemetry: false,
    canManageTelemetryDevices: false,
    canManageTelemetryAssignments: false,
    canAssignTelemetryDoctor: false,
    canLogTelemetryRoomVisit: false,
    canViewTelemetryDevicesReadOnly: false,
    canViewOwnTelemetry: false,
    scope: 'claims_only'
  },
  medical_vendor: {
    patientDetails: 'limited_contact',
    canBookAppointment: false,
    canViewPatientHistory: false,
    canViewMedicalRecords: false,
    canViewReceipts: false,
    canViewHospitals: false,
    canManageAppointments: false,
    canViewBedAvailability: false,
    canViewPharmacyStock: true,
    canPurchaseMedicines: false,
    canUploadPrescription: false,
    canViewInsuranceRenewal: false,
    canManagePatientQueue: false,
    canPrescribe: false,
    canHospitalApplication: false,
    canManageInventory: true,
    canRestockRequest: true,
    canPrescriptionVerification: true,
    canManagePolicies: false,
    canViewApplicants: false,
    canViewPolicyStatus: false,
    canManageHospitalDoctors: false,
    canManageHospitalPatients: false,
    canManageHospitalPharmacy: false,
    canManageBeds: false,
    canManageStaff: false,
    canManageBilling: false,
    canViewSystemLogs: false,
    canViewBloodRequests: false,
    canManageBloodInventory: false,
    canSendDonationRequests: false,
    canRequestBlood: false,
    canManageMedicineOrders: true,
    canViewPrescriptionOrders: false,
    canViewPatientOverview: false,
    canViewLiveTelemetry: false,
    canManageTelemetryDevices: false,
    canManageTelemetryAssignments: false,
    canAssignTelemetryDoctor: false,
    canLogTelemetryRoomVisit: false,
    canViewTelemetryDevicesReadOnly: false,
    canViewOwnTelemetry: false,
    scope: 'claims_only'
  },
  hospital_admin: {
    patientDetails: 'full',
    canBookAppointment: true,
    canViewPatientHistory: true,
    canViewMedicalRecords: true,
    canViewReceipts: true,
    canViewHospitals: true,
    canManageAppointments: true,
    canViewBedAvailability: true,
    canViewPharmacyStock: true,
    canPurchaseMedicines: false,
    canUploadPrescription: false,
    canViewInsuranceRenewal: false,
    canManagePatientQueue: true,
    canPrescribe: false,
    canHospitalApplication: false,
    canManageInventory: true,
    canRestockRequest: true,
    canPrescriptionVerification: false,
    canManagePolicies: false,
    canViewApplicants: false,
    canViewPolicyStatus: false,
    canManageHospitalDoctors: true,
    canManageHospitalPatients: true,
    canManageHospitalPharmacy: true,
    canManageBeds: true,
    canManageStaff: true,
    canManageBilling: true,
    canViewSystemLogs: false,
    canViewBloodRequests: false,
    canManageBloodInventory: false,
    canSendDonationRequests: false,
    canRequestBlood: true,
    canManageMedicineOrders: false,
    canViewPrescriptionOrders: false,
    canViewPatientOverview: true,
    canViewLiveTelemetry: false,
    canManageTelemetryDevices: true,
    canManageTelemetryAssignments: false,
    canAssignTelemetryDoctor: true,
    canLogTelemetryRoomVisit: false,
    canViewTelemetryDevicesReadOnly: false,
    canViewOwnTelemetry: false,
    scope: 'hospital'
  },
  bloodbank_admin: {
    patientDetails: 'limited_contact',
    canBookAppointment: false,
    canViewPatientHistory: false,
    canViewMedicalRecords: false,
    canViewReceipts: false,
    canViewHospitals: true,
    canManageAppointments: false,
    canViewBedAvailability: false,
    canViewPharmacyStock: false,
    canPurchaseMedicines: false,
    canUploadPrescription: false,
    canViewInsuranceRenewal: false,
    canManagePatientQueue: false,
    canPrescribe: false,
    canHospitalApplication: false,
    canManageInventory: false,
    canRestockRequest: false,
    canPrescriptionVerification: false,
    canManagePolicies: false,
    canViewApplicants: false,
    canViewPolicyStatus: false,
    canManageHospitalDoctors: false,
    canManageHospitalPatients: false,
    canManageHospitalPharmacy: false,
    canManageBeds: false,
    canManageStaff: false,
    canManageBilling: false,
    canViewSystemLogs: false,
    canViewBloodRequests: true,
    canManageBloodInventory: true,
    canSendDonationRequests: true,
    canRequestBlood: false,
    canManageMedicineOrders: false,
    canViewPrescriptionOrders: false,
    canViewPatientOverview: false,
    canViewLiveTelemetry: false,
    canManageTelemetryDevices: false,
    canManageTelemetryAssignments: false,
    canAssignTelemetryDoctor: false,
    canLogTelemetryRoomVisit: false,
    canViewTelemetryDevicesReadOnly: false,
    canViewOwnTelemetry: false,
    scope: 'all'
  },
  doctor: {
    patientDetails: 'full',
    canBookAppointment: true,
    canViewPatientHistory: true,
    canViewMedicalRecords: true,
    canViewReceipts: true,
    canViewHospitals: true,
    canManageAppointments: true,
    canViewBedAvailability: false,
    canViewPharmacyStock: true,
    canPurchaseMedicines: false,
    canUploadPrescription: false,
    canViewInsuranceRenewal: false,
    canManagePatientQueue: true,
    canPrescribe: true,
    canHospitalApplication: true,
    canManageInventory: false,
    canRestockRequest: true,
    canPrescriptionVerification: false,
    canManagePolicies: false,
    canViewApplicants: false,
    canViewPolicyStatus: false,
    canManageHospitalDoctors: false,
    canManageHospitalPatients: true,
    canManageHospitalPharmacy: false,
    canManageBeds: false,
    canManageStaff: false,
    canManageBilling: false,
    canViewSystemLogs: false,
    canViewBloodRequests: false,
    canManageBloodInventory: false,
    canSendDonationRequests: false,
    canRequestBlood: true,
    canManageMedicineOrders: false,
    canViewPrescriptionOrders: true,
    canViewPatientOverview: true,
    canViewLiveTelemetry: true,
    canManageTelemetryDevices: false,
    canManageTelemetryAssignments: true,
    canAssignTelemetryDoctor: false,
    canLogTelemetryRoomVisit: true,
    canViewTelemetryDevicesReadOnly: true,
    canViewOwnTelemetry: false,
    scope: 'hospital'
  },
  nurse: {
    patientDetails: 'full',
    canBookAppointment: false,
    canViewPatientHistory: true,
    canViewMedicalRecords: true,
    canViewReceipts: false,
    canViewHospitals: true,
    canManageAppointments: false,
    canViewBedAvailability: true,
    canViewPharmacyStock: true,
    canPurchaseMedicines: false,
    canUploadPrescription: false,
    canViewInsuranceRenewal: false,
    canManagePatientQueue: true,
    canPrescribe: false,
    canHospitalApplication: false,
    canManageInventory: false,
    canRestockRequest: false,
    canPrescriptionVerification: false,
    canManagePolicies: false,
    canViewApplicants: false,
    canViewPolicyStatus: false,
    canManageHospitalDoctors: false,
    canManageHospitalPatients: true,
    canManageHospitalPharmacy: false,
    canManageBeds: false,
    canManageStaff: false,
    canManageBilling: false,
    canViewSystemLogs: false,
    canViewBloodRequests: false,
    canManageBloodInventory: false,
    canSendDonationRequests: false,
    canRequestBlood: false,
    canManageMedicineOrders: false,
    canViewPrescriptionOrders: true,
    canViewPatientOverview: true,
    canViewLiveTelemetry: true,
    canManageTelemetryDevices: false,
    canManageTelemetryAssignments: false,
    canAssignTelemetryDoctor: false,
    canLogTelemetryRoomVisit: true,
    canViewTelemetryDevicesReadOnly: true,
    canViewOwnTelemetry: false,
    scope: 'hospital'
  },
  patient: {
    patientDetails: 'full',
    canBookAppointment: true,
    canViewPatientHistory: true,
    canViewMedicalRecords: true,
    canViewReceipts: true,
    canViewHospitals: true,
    canManageAppointments: false,
    canViewBedAvailability: true,
    canViewPharmacyStock: true,
    canPurchaseMedicines: true,
    canUploadPrescription: true,
    canViewInsuranceRenewal: true,
    canManagePatientQueue: false,
    canPrescribe: false,
    canHospitalApplication: false,
    canManageInventory: false,
    canRestockRequest: false,
    canPrescriptionVerification: false,
    canManagePolicies: false,
    canViewApplicants: false,
    canViewPolicyStatus: false,
    canManageHospitalDoctors: false,
    canManageHospitalPatients: false,
    canManageHospitalPharmacy: false,
    canManageBeds: false,
    canManageStaff: false,
    canManageBilling: false,
    canViewSystemLogs: false,
    canViewBloodRequests: false,
    canManageBloodInventory: false,
    canSendDonationRequests: false,
    canRequestBlood: true,
    canManageMedicineOrders: false,
    canViewPrescriptionOrders: false,
    canViewPatientOverview: true,
    canViewLiveTelemetry: false,
    canManageTelemetryDevices: false,
    canManageTelemetryAssignments: false,
    canAssignTelemetryDoctor: false,
    canLogTelemetryRoomVisit: false,
    canViewTelemetryDevicesReadOnly: false,
    canViewOwnTelemetry: true,
    scope: 'own'
  }
};

/** IoMT RPM telemetry access (non-telemetry permissions unchanged above). */
export function canAccessTelemetryOverview(role: UserRole) {
  return getPermissions(role).canViewPatientOverview || getPermissions(role).canViewOwnTelemetry;
}

export function canAccessTelemetryLive(role: UserRole) {
  return getPermissions(role).canViewLiveTelemetry;
}

export function canAccessTelemetryDevices(role: UserRole) {
  return getPermissions(role).canManageTelemetryDevices;
}

export function canAccessTelemetryAssignments(role: UserRole) {
  return getPermissions(role).canManageTelemetryAssignments;
}

export function getPermissions(role: UserRole) {
  return PERMISSIONS[normalizeRole(role)];
}

export function canAccessPatientDetails(role: UserRole): boolean {
  return PERMISSIONS[role].patientDetails !== 'none';
}

export function getPatientDetailLevel(role: UserRole): PatientDetailLevel {
  return PERMISSIONS[role].patientDetails;
}

export function canAccessAppointments(role: UserRole): boolean {
  return PERMISSIONS[role].canBookAppointment;
}

export function canAccessPatientHistory(role: UserRole): boolean {
  return PERMISSIONS[role].canViewPatientHistory;
}

export function canAccessMedicalRecords(role: UserRole): boolean {
  return PERMISSIONS[role].canViewMedicalRecords;
}

export function canAccessReceipts(role: UserRole): boolean {
  return PERMISSIONS[role].canViewReceipts;
}

export function canAccessHospitals(role: UserRole): boolean {
  return PERMISSIONS[role].canViewHospitals;
}

export function canManageAppointments(role: UserRole): boolean {
  return PERMISSIONS[role].canManageAppointments;
}

export function canUseAiAssist(role: UserRole): boolean {
  const r = normalizeRole(role);
  return ['super_admin', 'hospital_admin', 'doctor', 'nurse', 'patient'].includes(r);
}

export function canAcceptAiDraft(role: UserRole): boolean {
  const r = normalizeRole(role);
  return ['super_admin', 'hospital_admin', 'doctor', 'nurse'].includes(r);
}

export function canViewAiAuditLogs(role: UserRole): boolean {
  const r = normalizeRole(role);
  return r === 'super_admin' || r === 'hospital_admin';
}

export interface DashboardMenuItem {
  path: string;
  label: string;
  icon: string;
  roles: UserRole[];
}

/** Role-based navigation: first item is Dashboard Home, then role-specific items */
export const DASHBOARD_MENU_ITEMS: DashboardMenuItem[] = [
  { path: '/', label: 'Dashboard', icon: '🏠', roles: ['super_admin', 'insurance_provider', 'medical_vendor', 'hospital_admin', 'bloodbank_admin', 'doctor', 'nurse', 'patient'] },
  { path: '/blood-requests', label: 'Blood Requests', icon: '🩸', roles: ['bloodbank_admin'] },
  { path: '/blood-inventory', label: 'Blood Inventory', icon: '🩺', roles: ['bloodbank_admin'] },
  { path: '/donation-requests', label: 'Donation Requests', icon: '❤️', roles: ['bloodbank_admin'] },
  { path: '/request-blood', label: 'Request Blood', icon: '🩸', roles: ['hospital_admin', 'doctor', 'patient'] },
  { path: '/hospitals', label: 'Hospitals', icon: '🏥', roles: ['super_admin', 'hospital_admin', 'doctor', 'patient'] },
  { path: '/patients', label: 'Patient Details', icon: '👤', roles: ['super_admin', 'insurance_provider', 'medical_vendor', 'hospital_admin', 'doctor', 'nurse', 'patient'] },
  { path: '/ai-assist', label: 'AI Assist', icon: '✨', roles: ['super_admin', 'hospital_admin', 'doctor', 'nurse', 'patient'] },
  { path: '/ai-audit', label: 'AI Audit Log', icon: '📋', roles: ['super_admin', 'hospital_admin'] },
  { path: '/appointments', label: 'Book Appointment', icon: '📅', roles: ['hospital_admin', 'doctor', 'patient'] },
  { path: '/scheduler', label: 'Staff Scheduler', icon: '🗓️', roles: ['super_admin', 'hospital_admin', 'doctor', 'nurse'] },
  { path: '/telemetry/overview', label: 'Overview', icon: '🏨', roles: ['hospital_admin', 'doctor', 'nurse', 'patient'] },
  { path: '/telemetry/live', label: 'Live Telemetry', icon: '📡', roles: ['doctor', 'nurse'] },
  { path: '/telemetry/devices', label: 'Devices', icon: '⌚', roles: ['hospital_admin'] },
  { path: '/telemetry/assignments', label: 'Patients & Assignments', icon: '🔗', roles: ['doctor'] },
  { path: '/queue', label: 'Patient Queue', icon: '📋', roles: ['super_admin', 'hospital_admin', 'doctor', 'nurse'] },
  { path: '/history', label: 'Patient History', icon: '📜', roles: ['super_admin', 'insurance_provider', 'hospital_admin', 'doctor', 'nurse', 'patient'] },
  { path: '/records', label: 'Medical Records', icon: '📁', roles: ['super_admin', 'insurance_provider', 'hospital_admin', 'doctor', 'nurse', 'patient'] },
  { path: '/prescribe', label: 'Prescribe', icon: '💊', roles: ['super_admin', 'doctor'] },
  { path: '/hospital-application', label: 'Hospital Application', icon: '📝', roles: ['doctor'] },
  { path: '/medicines', label: 'Purchase Medicines', icon: '🛒', roles: ['patient'] },
  { path: '/medicine-orders', label: 'Medicine Orders', icon: '📋', roles: ['super_admin', 'medical_vendor'] },
  { path: '/prescription-orders', label: 'Prescription Orders', icon: '💊', roles: ['super_admin', 'doctor'] },
  { path: '/documents', label: 'Medical Documents', icon: '📄', roles: ['patient'] },
  { path: '/pharmacy-stock', label: 'Pharmacy Stock', icon: '📦', roles: ['super_admin', 'medical_vendor', 'hospital_admin', 'patient'] },
  { path: '/prescription-upload', label: 'Upload Prescription (AI)', icon: '🤖', roles: ['patient'] },
  { path: '/insurance-renewal', label: 'Insurance Renewal', icon: '🛡️', roles: ['patient'] },
  { path: '/bed-availability', label: 'Bed Availability', icon: '🛏️', roles: ['super_admin', 'hospital_admin', 'patient'] },
  { path: '/inventory', label: 'Inventory', icon: '📊', roles: ['super_admin', 'medical_vendor', 'hospital_admin'] },
  { path: '/restock', label: 'Restock Request', icon: '🔄', roles: ['super_admin', 'medical_vendor', 'hospital_admin', 'doctor'] },
  { path: '/prescription-verify', label: 'Prescription Verification', icon: '✅', roles: ['super_admin', 'medical_vendor'] },
  { path: '/policies', label: 'Policy Types', icon: '📑', roles: ['super_admin', 'insurance_provider'] },
  { path: '/applicants', label: 'Applicants', icon: '👥', roles: ['super_admin', 'insurance_provider'] },
  { path: '/policy-status', label: 'Policy Status', icon: '📈', roles: ['super_admin', 'insurance_provider'] },
  { path: '/hospital/doctors', label: 'Hospital Doctors', icon: '👨‍⚕️', roles: ['super_admin', 'hospital_admin'] },
  { path: '/hospital/patients', label: 'Hospital Patients', icon: '🏥', roles: ['super_admin', 'hospital_admin'] },
  { path: '/hospital/pharmacy', label: 'Hospital Pharmacy', icon: '💉', roles: ['super_admin', 'hospital_admin'] },
  { path: '/hospital/beds', label: 'Beds', icon: '🛏️', roles: ['super_admin', 'hospital_admin'] },
  { path: '/hospital/staff', label: 'Staff', icon: '👔', roles: ['super_admin', 'hospital_admin'] },
  { path: '/hospital/billing', label: 'Billing & Dues', icon: '💰', roles: ['super_admin', 'hospital_admin'] },
  { path: '/receipts', label: 'Receipts', icon: '🧾', roles: ['super_admin', 'insurance_provider', 'hospital_admin', 'doctor', 'patient'] },
  { path: '/logs', label: 'System Logs', icon: '📜', roles: ['super_admin'] },
  { path: '/platform-testing', label: 'Platform Testing', icon: '🧪', roles: ['super_admin', 'hospital_admin'] },
  { path: '/profile', label: 'Profile', icon: '⚙️', roles: ['super_admin', 'insurance_provider', 'medical_vendor', 'hospital_admin', 'bloodbank_admin', 'doctor', 'nurse', 'patient'] }
];

export function getMenuItemsForRole(role: UserRole): DashboardMenuItem[] {
  const r = normalizeRole(role);
  return DASHBOARD_MENU_ITEMS.filter((item) => item.roles.includes(r));
}
