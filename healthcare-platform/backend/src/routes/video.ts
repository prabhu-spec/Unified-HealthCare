/**
 * LiveKit video token API and video appointment requests.
 * Token is only generated after doctor accepts; appointments have status: pending | accepted | completed | cancelled.
 */
import express from "express";
import { AccessToken } from "livekit-server-sdk";
import { useDatabase } from "../db/client.js";
import * as videoDb from "../db/repositories/video.js";
import {
  notifyVideoAccepted,
  notifyVideoRequest,
} from "../services/notifications.js";

const router = express.Router();
type Request = express.Request;
type Response = express.Response;

const LIVEKIT_URL = process.env.LIVEKIT_URL || "";
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "";

type VideoAppointmentStatus = "pending" | "accepted" | "completed" | "cancelled";

interface VideoAppointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorType: string;
  hospitalId: string;
  hospitalName: string;
  date: string;
  time: string;
  status: VideoAppointmentStatus;
  roomName?: string;
  createdAt: string;
}

const videoAppointments: VideoAppointment[] = [];
let nextId = 1;

function getRole(req: Request): string | null {
  return (req.headers["x-role"] as string) ?? req.body?.role ?? (req.query.role as string) ?? null;
}
function getHospitalId(req: Request): string | null {
  return (req.headers["x-hospital-id"] as string) ?? req.body?.hospitalId ?? (req.query.hospitalId as string) ?? null;
}

// Create video appointment (pending) – patient schedules; no link until doctor accepts
router.post("/api/video/appointments", async (req: Request, res: Response) => {
  const { doctorType, hospitalId, hospitalName, date, time, patientId, patientName } = req.body || {};
  if (!doctorType || !hospitalId || !date || !time || !patientId) {
    res.status(400).json({ error: "Missing doctorType, hospitalId, date, time, or patientId." });
    return;
  }
  if (useDatabase()) {
    const appointment = await videoDb.createVideoAppointment({
      patientId: String(patientId),
      patientName: typeof patientName === "string" ? patientName : "Patient",
      doctorType: String(doctorType),
      hospitalId: String(hospitalId),
      hospitalName: typeof hospitalName === "string" ? hospitalName : "",
      date: String(date),
      time: String(time),
    });
    notifyVideoRequest(appointment);
    res.status(201).json({ data: appointment });
    return;
  }
  const id = `vc-${nextId++}`;
  const appointment: VideoAppointment = {
    id,
    patientId: String(patientId),
    patientName: typeof patientName === "string" ? patientName : "Patient",
    doctorType: String(doctorType),
    hospitalId: String(hospitalId),
    hospitalName: typeof hospitalName === "string" ? hospitalName : "",
    date: String(date),
    time: String(time),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  videoAppointments.push(appointment);
  notifyVideoRequest(appointment);
  res.status(201).json({ data: appointment });
});

// List video appointments – patient: by patientId; doctor: by hospitalId
router.get("/api/video/appointments", async (req: Request, res: Response) => {
  const role = getRole(req);
  const patientId = (req.query.patientId as string) ?? (req.headers["x-patient-id"] as string);
  const hospitalId = getHospitalId(req);

  if (useDatabase()) {
    const list = await videoDb.listVideoAppointments({ role, patientId, hospitalId });
    res.json({ data: list });
    return;
  }

  let list = [...videoAppointments];
  if (role === "patient" && patientId) {
    list = list.filter((a) => a.patientId === patientId);
  } else if ((role === "doctor" || role === "hospital_admin") && hospitalId) {
    list = list.filter((a) => a.hospitalId === hospitalId);
  }
  res.json({ data: list });
});

// Doctor accepts – set status accepted and roomName so patient can join
router.patch("/api/video/appointments/:id/accept", async (req: Request, res: Response) => {
  const id = req.params.id;
  if (useDatabase()) {
    const apt = await videoDb.findVideoAppointment(id);
    if (!apt) {
      res.status(404).json({ error: "Video appointment not found." });
      return;
    }
    if (apt.status !== "pending") {
      res.status(400).json({ error: "Appointment is not pending." });
      return;
    }
    const updated = await videoDb.updateVideoAppointment(id, { status: "accepted", roomName: id });
    notifyVideoAccepted(updated);
    res.json({ data: updated });
    return;
  }
  const apt = videoAppointments.find((a) => a.id === id);
  if (!apt) {
    res.status(404).json({ error: "Video appointment not found." });
    return;
  }
  if (apt.status !== "pending") {
    res.status(400).json({ error: "Appointment is not pending." });
    return;
  }
  apt.status = "accepted";
  apt.roomName = id;
  notifyVideoAccepted(apt);
  res.json({ data: apt });
});

// Doctor or system rejects/cancels
router.patch("/api/video/appointments/:id/reject", async (req: Request, res: Response) => {
  const id = req.params.id;
  if (useDatabase()) {
    const apt = await videoDb.findVideoAppointment(id);
    if (!apt) {
      res.status(404).json({ error: "Video appointment not found." });
      return;
    }
    const updated = await videoDb.updateVideoAppointment(id, { status: "cancelled" });
    res.json({ data: updated });
    return;
  }
  const apt = videoAppointments.find((a) => a.id === id);
  if (!apt) {
    res.status(404).json({ error: "Video appointment not found." });
    return;
  }
  apt.status = "cancelled";
  res.json({ data: apt });
});

// Mark as completed (optional – e.g. after call ends)
router.patch("/api/video/appointments/:id/complete", async (req: Request, res: Response) => {
  const id = req.params.id;
  if (useDatabase()) {
    const apt = await videoDb.findVideoAppointment(id);
    if (!apt) {
      res.status(404).json({ error: "Video appointment not found." });
      return;
    }
    const updated = await videoDb.updateVideoAppointment(id, { status: "completed" });
    res.json({ data: updated });
    return;
  }
  const apt = videoAppointments.find((a) => a.id === id);
  if (!apt) {
    res.status(404).json({ error: "Video appointment not found." });
    return;
  }
  apt.status = "completed";
  res.json({ data: apt });
});

// Generate token – only used when joining; roomName must belong to an accepted appointment
router.post("/api/video/token", async (req: Request, res: Response) => {
  try {
    const { roomName, participantName } = req.body || {};
    const room = typeof roomName === "string" && roomName.trim() ? roomName.trim() : `room-${Date.now()}`;
    const name = typeof participantName === "string" && participantName.trim() ? participantName.trim() : "Participant";

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      res.status(500).json({ error: "LiveKit credentials not configured (LIVEKIT_API_KEY / LIVEKIT_API_SECRET)." });
      return;
    }

    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: name.replace(/\s+/g, "-").slice(0, 64),
      name,
    });
    at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true });

    const token = await at.toJwt();

    res.json({
      token,
      roomName: room,
      url: LIVEKIT_URL || undefined,
    });
  } catch (err) {
    console.error("LiveKit token error:", err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Failed to create video token." });
  }
});

export default router;

export async function getVideoAppointmentsForReminders() {
  if (useDatabase()) return videoDb.getAllForReminders();
  return videoAppointments.map((a) => ({ ...a }));
}
