import express from "express";
import { useDatabase } from "../db/client.js";
import { pushConfigured } from "../services/fcmPush.js";

const router = express.Router();

const LIVEKIT_OK = Boolean(
  process.env.LIVEKIT_URL?.trim() &&
    process.env.LIVEKIT_API_KEY?.trim() &&
    process.env.LIVEKIT_API_SECRET?.trim()
);

/** Feature matrix for QA */
const FEATURES = [
  { id: "auth", label: "Login + JWT", api: "/api/auth/login", phase: 2, roles: ["all"], done: true },
  { id: "persistence", label: "PostgreSQL persistence", api: "—", phase: 1, roles: ["all"], done: true },
  { id: "patients", label: "Patients CRUD + admit/discharge", api: "/api/core/patients", phase: 0, roles: ["super_admin", "hospital_admin", "doctor", "nurse"], done: true },
  { id: "appointments", label: "In-person appointments", api: "/api/core/appointments", phase: 0, roles: ["hospital_admin", "doctor", "patient"], done: true },
  { id: "queue", label: "Patient queue accept/reject", api: "/api/core/queue", phase: 0, roles: ["super_admin", "hospital_admin", "doctor", "nurse"], done: true },
  { id: "scheduler", label: "Staff scheduler", api: "/api/schedules", phase: 0, roles: ["super_admin", "hospital_admin", "doctor", "nurse"], done: true },
  { id: "staff", label: "Add hospital users", api: "/api/staff/users", phase: 0, roles: ["super_admin", "hospital_admin"], done: true },
  { id: "prescriptions", label: "Prescribe + update Rx", api: "/api/prescriptions", phase: 0, roles: ["doctor", "super_admin"], done: true },
  { id: "telemetry", label: "RPM + vitals history in DB", api: "/api/telemetry/*", phase: 7, roles: ["hospital_admin", "doctor", "nurse", "patient"], done: true },
  { id: "video", label: "Video appointments + LiveKit", api: "/api/video/appointments", phase: 6, roles: ["hospital_admin", "doctor", "patient"], done: LIVEKIT_OK },
  { id: "pharmacy_stock", label: "Pharmacy / inventory lists", api: "/api/pharmacy-stock", phase: 0, roles: ["hospital_admin", "medical_vendor", "patient"], done: true },
  { id: "blood", label: "Blood requests + inventory", api: "/api/blood/*", phase: 0, roles: ["bloodbank_admin", "hospital_admin", "doctor", "patient"], done: true },
  { id: "insurance", label: "Policies + applicants", api: "/api/policies", phase: 0, roles: ["insurance_provider", "super_admin"], done: true },
  { id: "fcm", label: "Push notifications (FCM)", api: "/api/notifications/device-token", phase: 6, roles: ["doctor", "nurse"], done: pushConfigured() },
  { id: "deploy", label: "Docker / PM2 / EC2 compose", api: "—", phase: 3, roles: ["all"], done: true },
  { id: "prod_clients", label: "Production client URLs", api: "—", phase: 4, roles: ["all"], done: true },
];

function currentPhase(db: boolean): number {
  if (!db) return 2;
  if (!LIVEKIT_OK || !pushConfigured()) return 6;
  return 7;
}

router.get("/api/platform/status", (_req, res) => {
  const db = useDatabase();
  const phase = currentPhase(db);
  const labels: Record<number, string> = {
    0: "API-backed UI",
    1: "PostgreSQL",
    2: "JWT auth",
    3: "Deploy ready",
    4: "Production URLs configured",
    5: "Full UI parity",
    6: "LiveKit + FCM",
    7: "Telemetry persistence",
  };
  res.json({
    phase,
    phaseLabel: labels[phase] || "Healthcare platform",
    storage: db ? "postgresql" : "in-memory",
    jwt: true,
    enforceJwt: process.env.ENFORCE_JWT === "true",
    livekitConfigured: LIVEKIT_OK,
    pushConfigured: pushConfigured(),
    features: FEATURES,
    demoPassword: "demo123",
    demoAccounts: [
      "superadmin@demo.com",
      "hospitaladmin@demo.com",
      "doctor@demo.com",
      "nurse@demo.com",
      "patient@demo.com",
      "vendor@demo.com",
      "insurance@demo.com",
      "bloodbank@demo.com",
    ],
  });
});

export default router;
