import express, { type Request, type Response } from "express";
import type { Server as SocketServer } from "socket.io";
import * as store from "./store.js";
import {
  persistPatient,
  persistPatientDelete,
  persistDevice,
  persistDeviceDelete,
} from "./persistence.js";
import * as overview from "./overview.js";
import { attachDeviceStatus, hasCriticalAlert } from "./vitalsEngine.js";
import { parseTelemetryAuth, requireRoles, resolveHospitalId } from "./middleware.js";

function emitRpm(io: SocketServer, hospitalId: string, msg: Record<string, unknown>) {
  io.to(`hospital:${hospitalId}`).emit("rpm", msg);
}

export function createTelemetryRouter(io: SocketServer) {
  const router = express.Router();

  const clinicalStaff = requireRoles("doctor", "nurse");
  const doctorOnly = requireRoles("doctor");
  const hospitalAdminOnly = requireRoles("hospital_admin");
  const overviewRoles = requireRoles("hospital_admin", "doctor", "nurse", "patient");
  const devicesReadRoles = requireRoles("hospital_admin", "doctor", "nurse");
  const vitalsReadRoles = requireRoles("doctor", "nurse", "patient");

  router.get("/api/telemetry/overview", overviewRoles, (req: Request, res: Response) => {
    const auth = parseTelemetryAuth(req);
    let hospitalId = resolveHospitalId(req);
    if (!hospitalId) return res.status(400).json({ error: "hospital_required" });

    if (auth.role === "patient") {
      const p = store.findPatient(auth.patientId || "");
      if (!p) return res.json({ hospital: null, rooms: [] });
      hospitalId = p.hospitalId;
      const detail = overview.buildOverview(hospitalId);
      if (!detail) return res.status(404).json({ error: "hospital_not_found" });
      const tile = detail.rooms.find((r) => r.patient?.patientId === p.patientId);
      return res.json({ hospital: detail.hospital, rooms: tile ? [tile] : [] });
    }

    const filterDoctor = auth.role === "doctor" ? auth.userId : undefined;
    const payload = overview.buildOverview(hospitalId, filterDoctor);
    if (!payload) return res.status(404).json({ error: "hospital_not_found" });
    res.json(payload);
  });

  router.get("/api/telemetry/overview/rooms/:room", overviewRoles, (req: Request, res: Response) => {
    const auth = parseTelemetryAuth(req);
    const hospitalId = resolveHospitalId(req);
    if (!hospitalId) return res.status(400).json({ error: "hospital_required" });
    const filterDoctor = auth.role === "doctor" ? auth.userId : undefined;
    const detail = overview.getRoomDetail(hospitalId, req.params.room, filterDoctor);
    if (!detail) return res.status(404).json({ error: "not_found" });
    if ("error" in detail) return res.status(detail.error === "forbidden" ? 403 : 404).json(detail);
    res.json(detail);
  });

  router.post("/api/telemetry/overview/visit/enter", clinicalStaff, (req: Request, res: Response) => {
    const auth = parseTelemetryAuth(req);
    const { room, patientId } = req.body || {};
    if (!room || !patientId) return res.status(400).json({ error: "room_and_patient_required" });
    const p = store.findPatient(patientId);
    if (!p || p.hospitalId !== auth.hospitalId) return res.status(403).json({ error: "forbidden" });
    overview.startVisit(p.hospitalId, room, patientId, auth.userId || "doctor", auth.email || "doctor");
    emitRpm(io, p.hospitalId, { type: "room_presence", room, patientId, doctorInRoom: true });
    res.json({ ok: true });
  });

  router.post("/api/telemetry/overview/visit/exit", clinicalStaff, (req: Request, res: Response) => {
    const auth = parseTelemetryAuth(req);
    const { room } = req.body || {};
    if (!room || !auth.hospitalId) return res.status(400).json({ error: "room_required" });
    overview.endVisit(auth.hospitalId, room, auth.userId || "doctor");
    emitRpm(io, auth.hospitalId, { type: "room_presence", room, doctorInRoom: false });
    res.json({ ok: true });
  });

  router.get("/api/telemetry/patients", clinicalStaff, (req: Request, res: Response) => {
    const auth = parseTelemetryAuth(req);
    let list = [...store.patients];
    if (auth.hospitalId) {
      list = list.filter((p) => p.hospitalId === auth.hospitalId);
    }
    const enriched = list.map((p) => ({
      ...p,
      latestVitals: store.vitalsLatest.get(p.patientId) || null,
      alert: store.vitalsLatest.get(p.patientId)
        ? hasCriticalAlert(store.vitalsLatest.get(p.patientId)!)
        : false,
    }));
    res.json(enriched);
  });

  router.get("/api/telemetry/patients/admin", hospitalAdminOnly, (req: Request, res: Response) => {
    const hid = resolveHospitalId(req);
    if (!hid) return res.status(400).json({ error: "hospital_required" });
    const list = store.patients.filter((p) => p.hospitalId === hid);
    res.json(list);
  });

  router.put("/api/telemetry/patients/:patientId/assigned-doctor", hospitalAdminOnly, (req: Request, res: Response) => {
    const hid = resolveHospitalId(req);
    const p = store.findPatient(req.params.patientId);
    if (!p || p.hospitalId !== hid) return res.status(404).json({ error: "not_found" });
    const { doctorUserId } = req.body || {};
    p.assignedDoctorId = doctorUserId || null;
    persistPatient(p);
    if (hid) emitRpm(io, hid, { type: "doctor_assignment", patientId: p.patientId, assignedDoctor: doctorUserId });
    res.json(p);
  });

  router.post("/api/telemetry/patients", doctorOnly, (req: Request, res: Response) => {
    const auth = parseTelemetryAuth(req);
    const { fullName, room, patientId: customId } = req.body || {};
    if (!fullName || !room) return res.status(400).json({ error: "fullName_and_room_required" });
    const id =
      customId ||
      `patient-${Date.now().toString(36)}`;
    if (store.findPatient(id)) return res.status(409).json({ error: "patient_exists" });
    const row: store.TelemetryPatient = {
      patientId: id,
      fullName: String(fullName).trim(),
      room: String(room).trim(),
      hospitalId: auth.hospitalId || "org-1",
      assignedDoctorId: auth.userId || null,
    };
    store.patients.push(row);
    persistPatient(row);
    res.status(201).json(row);
  });

  router.patch("/api/telemetry/patients/:patientId", doctorOnly, (req: Request, res: Response) => {
    const auth = parseTelemetryAuth(req);
    const p = store.findPatient(req.params.patientId);
    if (!p || p.hospitalId !== auth.hospitalId) return res.status(404).json({ error: "not_found" });
    if (req.body.fullName) p.fullName = String(req.body.fullName).trim();
    if (req.body.room) p.room = String(req.body.room).trim();
    persistPatient(p);
    res.json(p);
  });

  router.delete("/api/telemetry/patients/:patientId", doctorOnly, (req: Request, res: Response) => {
    const auth = parseTelemetryAuth(req);
    const idx = store.patients.findIndex((x) => x.patientId === req.params.patientId);
    if (idx === -1) return res.status(404).json({ error: "not_found" });
    const p = store.patients[idx];
    if (p.hospitalId !== auth.hospitalId) return res.status(403).json({ error: "forbidden" });
    store.patients.splice(idx, 1);
    store.vitalsLatest.delete(p.patientId);
    persistPatientDelete(p.patientId);
    for (const d of store.devices) {
      if (d.patientId === p.patientId) d.patientId = null;
    }
    res.json({ ok: true });
  });

  router.get("/api/telemetry/devices", devicesReadRoles, (req: Request, res: Response) => {
    const auth = parseTelemetryAuth(req);
    let list = [...store.devices];
    if (auth.hospitalId) {
      list = list.filter((d) => d.hospitalId === auth.hospitalId);
    }
    res.json(attachDeviceStatus(list));
  });

  router.post("/api/telemetry/devices/register", hospitalAdminOnly, (req: Request, res: Response) => {
    const hid = resolveHospitalId(req);
    if (!hid) return res.status(400).json({ error: "hospital_required" });
    const { deviceId, name, type } = req.body || {};
    if (!deviceId || !name || !type) return res.status(400).json({ error: "deviceId_name_type_required" });
    if (store.findDevice(deviceId)) return res.status(409).json({ error: "device_exists" });
    const row: store.TelemetryDevice = {
      deviceId: String(deviceId).trim(),
      name: String(name).trim(),
      type: String(type).trim(),
      hospitalId: hid,
      patientId: null,
      lastSeenAt: null,
    };
    store.devices.push(row);
    persistDevice(row);
    res.status(201).json(row);
  });

  router.post("/api/telemetry/devices/:deviceId/assign", doctorOnly, (req: Request, res: Response) => {
    const auth = parseTelemetryAuth(req);
    const d = store.findDevice(req.params.deviceId);
    if (!d || d.hospitalId !== auth.hospitalId) return res.status(404).json({ error: "not_found" });
    const { patientId } = req.body || {};
    if (patientId) {
      const p = store.findPatient(patientId);
      if (!p || p.hospitalId !== auth.hospitalId) return res.status(400).json({ error: "invalid_patient" });
      for (const other of store.devices) {
        if (other.patientId === patientId) other.patientId = null;
      }
      d.patientId = patientId;
    } else {
      d.patientId = null;
    }
    emitRpm(io, d.hospitalId, { type: "assignment", deviceId: d.deviceId, patientId: d.patientId });
    persistDevice(d);
    res.json(d);
  });

  router.delete("/api/telemetry/devices/:deviceId", hospitalAdminOnly, (req: Request, res: Response) => {
    const hid = resolveHospitalId(req);
    const idx = store.devices.findIndex((x) => x.deviceId === req.params.deviceId);
    if (idx === -1) return res.status(404).json({ error: "not_found" });
    const d = store.devices[idx];
    if (d.hospitalId !== hid) return res.status(403).json({ error: "forbidden" });
    if (d.patientId) return res.status(400).json({ error: "unassign_first" });
    store.devices.splice(idx, 1);
    persistDeviceDelete(d.deviceId);
    res.json({ ok: true });
  });

  router.get("/api/telemetry/vitals/history/:patientId", vitalsReadRoles, async (req: Request, res: Response) => {
    const auth = parseTelemetryAuth(req);
    const p = store.findPatient(req.params.patientId);
    if (!p) return res.status(404).json({ error: "not_found" });
    if (auth.role === "patient" && auth.patientId !== p.patientId) {
      return res.status(403).json({ error: "forbidden" });
    }
    const { useDatabase } = await import("../db/client.js");
    if (useDatabase()) {
      const { prisma } = await import("../db/client.js");
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const rows = await prisma.vitalsSnapshot.findMany({
        where: { patientId: p.patientId },
        orderBy: { timestamp: "desc" },
        take: limit,
      });
      return res.json(
        rows.map((v) => ({
          patientId: v.patientId,
          deviceId: v.deviceId,
          hospitalId: v.hospitalId,
          heartRate: v.heartRate,
          spo2: v.spo2,
          temperature: v.temperature,
          systolic: v.systolic,
          diastolic: v.diastolic,
          respiration: v.respiration,
          battery: v.battery,
          timestamp: v.timestamp.toISOString(),
        }))
      );
    }
    const latest = store.vitalsLatest.get(p.patientId);
    res.json(latest ? [latest] : []);
  });

  router.get("/api/telemetry/vitals/latest/:patientId", vitalsReadRoles, (req: Request, res: Response) => {
    const auth = parseTelemetryAuth(req);
    const p = store.findPatient(req.params.patientId);
    if (!p) return res.status(404).json({ error: "not_found" });
    if (auth.role === "patient" && auth.patientId !== p.patientId) {
      return res.status(403).json({ error: "forbidden" });
    }
    if (auth.role === "doctor" && p.hospitalId !== auth.hospitalId) {
      return res.status(403).json({ error: "forbidden" });
    }
    const v = store.vitalsLatest.get(p.patientId);
    res.json(v || null);
  });

  router.get("/api/telemetry/notifications", clinicalStaff, (req: Request, res: Response) => {
    const auth = parseTelemetryAuth(req);
    const list = store.notifications.filter((n) => n.hospitalId === auth.hospitalId);
    res.json(list.slice(0, 50));
  });

  router.get("/api/telemetry/hospital", hospitalAdminOnly, (req: Request, res: Response) => {
    const hid = resolveHospitalId(req);
    const h = store.getHospital(hid || "");
    if (!h) return res.status(404).json({ error: "not_found" });
    res.json(h);
  });

  router.patch("/api/telemetry/hospital", hospitalAdminOnly, (req: Request, res: Response) => {
    const hid = resolveHospitalId(req);
    const h = store.hospitals.find((x) => x.hospitalId === hid);
    if (!h) return res.status(404).json({ error: "not_found" });
    if (req.body.totalRooms != null) h.totalRooms = Math.max(1, Number(req.body.totalRooms));
    if (req.body.roomNumberStart != null) h.roomNumberStart = Number(req.body.roomNumberStart);
    res.json(h);
  });

  router.get("/api/telemetry/users/doctors", hospitalAdminOnly, (req: Request, res: Response) => {
    const hid = resolveHospitalId(req);
    res.json(store.DEMO_DOCTORS.filter((d) => d.hospitalId === hid));
  });

  return router;
}
