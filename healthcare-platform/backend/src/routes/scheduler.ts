import express from "express";
import { useDatabase } from "../db/client.js";
import * as scheduleDb from "../db/repositories/schedules.js";

const router = express.Router();
type Request = express.Request;
type Response = express.Response;

export type ScheduleType = "shift" | "appointment" | "nursing_round" | "consultation";

export interface ScheduleEntry {
  id: string;
  hospitalId: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  patientId?: string;
  patientName?: string;
  title: string;
  type: ScheduleType;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  status: "scheduled" | "completed" | "cancelled";
  createdAt: string;
}

const schedules: ScheduleEntry[] = [
  {
    id: "sch-1",
    hospitalId: "org-1",
    staffId: "u-doc",
    staffName: "Dr. Sarah Johnson",
    staffRole: "doctor",
    patientId: "patient-1",
    patientName: "John Smith",
    title: "Follow-up consultation",
    type: "consultation",
    date: "2026-05-31",
    startTime: "09:00",
    endTime: "09:30",
    status: "scheduled",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sch-2",
    hospitalId: "org-1",
    staffId: "u-nurse",
    staffName: "Jane Miller",
    staffRole: "nurse",
    patientId: "patient-2",
    patientName: "Sarah Johnson",
    title: "Vitals check — Room 102",
    type: "nursing_round",
    date: "2026-05-31",
    startTime: "08:00",
    endTime: "08:15",
    notes: "Hourly SpO2 and HR",
    status: "scheduled",
    createdAt: new Date().toISOString(),
  },
];

let nextId = 3;

function getRole(req: Request): string | null {
  return (req.headers["x-role"] as string) ?? null;
}

function getHospitalId(req: Request): string | null {
  return (req.headers["x-hospital-id"] as string) ?? null;
}

function getUserId(req: Request): string | null {
  return (req.headers["x-user-id"] as string) ?? null;
}

function canManageSchedules(role: string | null): boolean {
  return ["super_admin", "hospital_admin", "doctor", "nurse"].includes(role || "");
}

router.get("/api/schedules", async (req: Request, res: Response) => {
  const role = getRole(req);
  const hospitalId = getHospitalId(req);
  const staffId = req.query.staffId as string | undefined;
  const date = req.query.date as string | undefined;
  if (useDatabase()) {
    const list = await scheduleDb.listSchedules({
      hospitalId,
      staffId,
      date,
      role,
      userId: getUserId(req),
    });
    return res.json({ data: list });
  }
  let list = [...schedules];
  if (hospitalId) list = list.filter((s) => s.hospitalId === hospitalId);
  if (staffId) list = list.filter((s) => s.staffId === staffId);
  if (date) list = list.filter((s) => s.date === date);
  if (role === "doctor" || role === "nurse") {
    const uid = getUserId(req);
    if (uid) list = list.filter((s) => s.staffId === uid);
  }
  res.json({ data: list });
});

router.post("/api/schedules", async (req: Request, res: Response) => {
  const role = getRole(req);
  if (!canManageSchedules(role)) return res.status(403).json({ error: "Forbidden." });
  const {
    hospitalId,
    staffId,
    staffName,
    staffRole,
    patientId,
    patientName,
    title,
    type,
    date,
    startTime,
    endTime,
    notes,
  } = req.body || {};
  if (!staffId || !title || !date || !startTime || !endTime) {
    return res.status(400).json({ error: "staffId, title, date, startTime, and endTime are required." });
  }
  if (useDatabase()) {
    const row = await scheduleDb.createSchedule({
      hospitalId: String(hospitalId || getHospitalId(req) || "org-1"),
      staffId: String(staffId),
      staffName: String(staffName || "Staff"),
      staffRole: String(staffRole || role || "staff"),
      patientId: patientId ? String(patientId) : undefined,
      patientName: patientName ? String(patientName) : undefined,
      title: String(title),
      type: (type as ScheduleType) || "shift",
      date: String(date),
      startTime: String(startTime),
      endTime: String(endTime),
      notes: notes ? String(notes) : undefined,
    });
    return res.status(201).json({ data: row });
  }
  const row: ScheduleEntry = {
    id: `sch-${nextId++}`,
    hospitalId: String(hospitalId || getHospitalId(req) || "org-1"),
    staffId: String(staffId),
    staffName: String(staffName || "Staff"),
    staffRole: String(staffRole || role || "staff"),
    patientId: patientId ? String(patientId) : undefined,
    patientName: patientName ? String(patientName) : undefined,
    title: String(title),
    type: (type as ScheduleType) || "shift",
    date: String(date),
    startTime: String(startTime),
    endTime: String(endTime),
    notes: notes ? String(notes) : undefined,
    status: "scheduled",
    createdAt: new Date().toISOString(),
  };
  schedules.unshift(row);
  res.status(201).json({ data: row });
});

router.patch("/api/schedules/:id", async (req: Request, res: Response) => {
  const role = getRole(req);
  if (!canManageSchedules(role)) return res.status(403).json({ error: "Forbidden." });
  if (useDatabase()) {
    const existing = await scheduleDb.findSchedule(req.params.id);
    if (!existing) return res.status(404).json({ error: "Schedule not found." });
    const row = await scheduleDb.updateSchedule(req.params.id, req.body || {});
    return res.json({ data: row });
  }
  const row = schedules.find((s) => s.id === req.params.id);
  if (!row) return res.status(404).json({ error: "Schedule not found." });
  const body = req.body || {};
  if (body.title) row.title = String(body.title);
  if (body.date) row.date = String(body.date);
  if (body.startTime) row.startTime = String(body.startTime);
  if (body.endTime) row.endTime = String(body.endTime);
  if (body.notes !== undefined) row.notes = body.notes ? String(body.notes) : undefined;
  if (body.status && ["scheduled", "completed", "cancelled"].includes(body.status)) {
    row.status = body.status;
  }
  res.json({ data: row });
});

router.delete("/api/schedules/:id", async (req: Request, res: Response) => {
  const role = getRole(req);
  if (!["super_admin", "hospital_admin", "doctor"].includes(role || "")) {
    return res.status(403).json({ error: "Forbidden." });
  }
  if (useDatabase()) {
    const existing = await scheduleDb.findSchedule(req.params.id);
    if (!existing) return res.status(404).json({ error: "Schedule not found." });
    await scheduleDb.deleteSchedule(req.params.id);
    return res.json({ ok: true });
  }
  const idx = schedules.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Schedule not found." });
  schedules.splice(idx, 1);
  res.json({ ok: true });
});

export default router;
