/**
 * In-memory telemetry store (IoMT RPM pattern) — aligned with healthcare patient/hospital IDs.
 * Phase 7: mirrored to PostgreSQL via telemetry/persistence.ts when DATABASE_URL is connected.
 */

export interface TelemetryPatient {
  patientId: string;
  fullName: string;
  hospitalId: string;
  room: string;
  assignedDoctorId?: string | null;
}

export interface TelemetryDevice {
  deviceId: string;
  name: string;
  type: string;
  hospitalId: string;
  patientId?: string | null;
  lastSeenAt?: string | null;
  lastBattery?: number | null;
}

export interface VitalsLatest {
  patientId: string;
  deviceId: string;
  hospitalId: string;
  heartRate: number;
  spo2: number;
  temperature: number;
  systolic: number;
  diastolic: number;
  respiration: number;
  battery: number;
  timestamp: string;
}

export interface RoomPresence {
  hospitalId: string;
  room: string;
  patientId: string;
  doctorUserId: string;
  doctorUsername: string;
  enteredAt: string;
}

export interface TelemetryNotification {
  id: string;
  type: string;
  patientId: string;
  hospitalId: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface HospitalTelemetryConfig {
  hospitalId: string;
  name: string;
  totalRooms: number;
  roomNumberStart: number;
}

const DEFAULT_TOTAL_ROOMS = 15;
const DEFAULT_ROOM_START = 100;

export const hospitals: HospitalTelemetryConfig[] = [
  { hospitalId: "org-1", name: "SOUTHEAST HEALTH MEDICAL CENTER", totalRooms: DEFAULT_TOTAL_ROOMS, roomNumberStart: DEFAULT_ROOM_START },
  { hospitalId: "org-2", name: "NORTH VALLEY HOSPITAL", totalRooms: 12, roomNumberStart: 200 },
];

export const patients: TelemetryPatient[] = [
  { patientId: "patient-1", fullName: "John Smith", hospitalId: "org-1", room: "101", assignedDoctorId: "u-doc" },
  { patientId: "patient-2", fullName: "Sarah Johnson", hospitalId: "org-1", room: "102", assignedDoctorId: "u-doc" },
  { patientId: "patient-3", fullName: "Robert Williams", hospitalId: "org-1", room: "103", assignedDoctorId: null },
  { patientId: "patient-4", fullName: "Emily Davis", hospitalId: "org-2", room: "201", assignedDoctorId: null },
];

export const devices: TelemetryDevice[] = [
  { deviceId: "device001", name: "Bedside Monitor 1", type: "Vitals hub", hospitalId: "org-1", patientId: "patient-1", lastSeenAt: null },
  { deviceId: "device002", name: "Bedside Monitor 2", type: "Vitals hub", hospitalId: "org-1", patientId: "patient-2", lastSeenAt: null },
  { deviceId: "device003", name: "Bedside Monitor 3", type: "Vitals hub", hospitalId: "org-1", patientId: "patient-3", lastSeenAt: null },
  { deviceId: "device004", name: "Ward Monitor 4", type: "Pulse oximeter", hospitalId: "org-2", patientId: "patient-4", lastSeenAt: null },
];

export const vitalsLatest = new Map<string, VitalsLatest>();
export let roomPresence: RoomPresence[] = [];
export const notifications: TelemetryNotification[] = [];
let notificationIdNext = 1;

export function addNotification(n: Omit<TelemetryNotification, "id">) {
  const row: TelemetryNotification = { ...n, id: String(notificationIdNext++) };
  notifications.unshift(row);
  if (notifications.length > 100) notifications.pop();
  return row;
}

export const DEMO_DOCTORS = [
  { userId: "u-doc", username: "doctor@demo.com", hospitalId: "org-1", displayName: "Dr. Sarah Johnson" },
];

export function roomNumbersForHospital(hospitalId: string): string[] {
  const h = hospitals.find((x) => x.hospitalId === hospitalId);
  const total = h?.totalRooms ?? DEFAULT_TOTAL_ROOMS;
  const start = h?.roomNumberStart ?? DEFAULT_ROOM_START;
  return Array.from({ length: total }, (_, i) => String(start + i));
}

export function getHospital(hospitalId: string) {
  return hospitals.find((h) => h.hospitalId === hospitalId) ?? null;
}

export function findPatient(patientId: string) {
  return patients.find((p) => p.patientId === patientId);
}

export function findDevice(deviceId: string) {
  return devices.find((d) => d.deviceId === deviceId);
}
