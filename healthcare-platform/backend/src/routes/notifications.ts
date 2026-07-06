import express from "express";
import { listNotifications, markAllRead, markRead } from "../services/notifications.js";
import { pushConfigured } from "../services/fcmPush.js";
import { registerDeviceToken, unregisterDeviceToken } from "../services/pushTokens.js";

const router = express.Router();
type Request = express.Request;
type Response = express.Response;

function getRole(req: Request): string | null {
  return (req.headers["x-role"] as string) ?? (req.query.role as string) ?? null;
}
function getHospitalId(req: Request): string | null {
  return (req.headers["x-hospital-id"] as string) ?? (req.query.hospitalId as string) ?? null;
}
function getPatientId(req: Request): string | null {
  return (req.headers["x-patient-id"] as string) ?? (req.query.patientId as string) ?? null;
}
function getUserId(req: Request): string | null {
  return (req.headers["x-user-id"] as string) ?? (req.body?.userId as string) ?? null;
}

router.get("/api/notifications", (req: Request, res: Response) => {
  const role = getRole(req);
  if (!role) return res.status(401).json({ error: "Role required (x-role header)." });
  const unreadOnly = req.query.unreadOnly === "true";
  const data = listNotifications({
    role,
    hospitalId: getHospitalId(req),
    patientId: getPatientId(req),
    unreadOnly,
  });
  res.json({ data, unreadCount: data.filter((n) => !n.read).length });
});

router.patch("/api/notifications/:id/read", (req: Request, res: Response) => {
  const row = markRead(req.params.id);
  if (!row) return res.status(404).json({ error: "Notification not found." });
  res.json({ data: row });
});

router.post("/api/notifications/read-all", (req: Request, res: Response) => {
  const role = getRole(req);
  if (!role) return res.status(401).json({ error: "Role required." });
  const count = markAllRead(role, getHospitalId(req), getPatientId(req));
  res.json({ ok: true, marked: count });
});

router.post("/api/notifications/device-token", async (req: Request, res: Response) => {
  const role = getRole(req);
  const userId = getUserId(req);
  const token = (req.body?.token as string)?.trim();
  if (!role || !userId || !token) {
    return res.status(400).json({ error: "x-role, x-user-id, and token are required." });
  }
  const row = await registerDeviceToken({
    token,
    userId,
    role,
    hospitalId: getHospitalId(req) ?? undefined,
    patientId: getPatientId(req) ?? undefined,
    platform: (req.body?.platform as "android") || "android",
  });
  res.json({ ok: true, data: row, pushEnabled: pushConfigured() });
});

router.delete("/api/notifications/device-token", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const token = (req.body?.token as string)?.trim();
  if (!userId || !token) return res.status(400).json({ error: "x-user-id and token are required." });
  await unregisterDeviceToken(userId, token);
  res.json({ ok: true });
});

router.get("/api/notifications/push-status", (_req: Request, res: Response) => {
  res.json({ pushEnabled: pushConfigured() });
});

export default router;
