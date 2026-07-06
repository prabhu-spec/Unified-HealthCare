import type { Server as SocketServer } from "socket.io";
import { notifyTelemetryCritical } from "../services/notifications.js";
import * as store from "./store.js";
import { persistVitals, persistNotification } from "./persistence.js";

const DEVICE_OFFLINE_MS = Number(process.env.DEVICE_OFFLINE_MS) || 20_000;

export function hasCriticalAlert(v: {
  heartRate?: number;
  spo2?: number;
  temperature?: number;
}): boolean {
  const hr = Number(v.heartRate);
  const spo2 = Number(v.spo2);
  const temp = Number(v.temperature);
  return hr > 130 || spo2 < 90 || temp > 39;
}

export function deviceOnline(lastSeenAt: string | null | undefined): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < DEVICE_OFFLINE_MS;
}

const simState = new Map<
  string,
  {
    heartRate: number;
    spo2: number;
    temperature: number;
    systolic: number;
    diastolic: number;
    respiration: number;
    battery: number;
    abnormalUntil: number;
    abnormalKind: string | null;
  }
>();

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function walk(prev: number, lo: number, hi: number, maxStep: number) {
  return clamp(prev + (Math.random() - 0.5) * 2 * maxStep, lo, hi);
}

function getSimState(deviceId: string) {
  let s = simState.get(deviceId);
  if (!s) {
    s = {
      heartRate: 75 + Math.random() * 15,
      spo2: 96 + Math.random() * 3,
      temperature: 36.7 + Math.random() * 0.8,
      systolic: 112 + Math.random() * 15,
      diastolic: 68 + Math.random() * 12,
      respiration: 14 + Math.random() * 6,
      battery: 60 + Math.random() * 35,
      abnormalUntil: 0,
      abnormalKind: null,
    };
    simState.set(deviceId, s);
  }
  return s;
}

function buildPayload(deviceId: string, patientId: string) {
  const s = getSimState(deviceId);
  const forced = Date.now() < s.abnormalUntil ? s.abnormalKind : null;

  s.heartRate = walk(s.heartRate, 70, 110, 3);
  s.spo2 = walk(s.spo2, 94, 100, 0.6);
  s.temperature = walk(s.temperature, 36.5, 38.2, 0.08);
  s.systolic = walk(s.systolic, 105, 135, 4);
  s.diastolic = walk(s.diastolic, 65, 90, 3);
  s.respiration = walk(s.respiration, 12, 22, 1.2);
  s.battery = clamp(s.battery - Math.random() * 0.08, 20, 100);

  let heartRate = Math.round(s.heartRate);
  let spo2 = Math.round(s.spo2 * 10) / 10;
  let temperature = Math.round(s.temperature * 10) / 10;

  if (forced === "hr") heartRate = Math.round(131 + Math.random() * 15);
  if (forced === "spo2") spo2 = Math.round((85 + Math.random() * 4) * 10) / 10;
  if (forced === "temp") temperature = Math.round((39.1 + Math.random() * 0.7) * 10) / 10;

  return {
    deviceId,
    patientId,
    heartRate,
    spo2,
    temperature,
    systolic: Math.round(s.systolic),
    diastolic: Math.round(s.diastolic),
    respiration: Math.round(s.respiration),
    battery: Math.round(s.battery),
    timestamp: new Date().toISOString(),
  };
}

function maybeTriggerAbnormal(deviceId: string) {
  const s = getSimState(deviceId);
  if (Date.now() < s.abnormalUntil) return;
  if (Math.random() < 0.02) {
    const kinds = ["hr", "spo2", "temp"] as const;
    s.abnormalKind = kinds[Math.floor(Math.random() * kinds.length)];
    s.abnormalUntil = Date.now() + 30_000;
  }
}

export function upsertVitals(io: SocketServer, deviceId: string, payload: ReturnType<typeof buildPayload>) {
  const dev = store.findDevice(deviceId);
  if (!dev?.patientId) return null;

  const patient = store.findPatient(dev.patientId);
  if (!patient) return null;

  const now = new Date().toISOString();
  const doc: store.VitalsLatest = {
    ...payload,
    patientId: patient.patientId,
    deviceId,
    hospitalId: patient.hospitalId,
    timestamp: payload.timestamp,
  };

  store.vitalsLatest.set(patient.patientId, doc);
  persistVitals(doc);
  dev.lastSeenAt = now;
  dev.lastBattery = payload.battery;

  const alert = hasCriticalAlert(doc);
  const broadcast = {
    type: "vitals",
    patientId: patient.patientId,
    deviceId,
    vitals: {
      heartRate: doc.heartRate,
      spo2: doc.spo2,
      temperature: doc.temperature,
      systolic: doc.systolic,
      diastolic: doc.diastolic,
      respiration: doc.respiration,
      battery: doc.battery,
      timestamp: doc.timestamp,
    },
    alert,
    online: true,
  };

  io.to(`hospital:${patient.hospitalId}`).emit("rpm", broadcast);

  if (alert) {
    const critical = {
      type: "critical_alert",
      patientId: patient.patientId,
      deviceId,
      hospitalId: patient.hospitalId,
      room: patient.room,
      fullName: patient.fullName,
      vitals: broadcast.vitals,
      at: now,
    };
    io.to(`hospital:${patient.hospitalId}:doctors`).emit("rpm", critical);
    const alertRow = store.addNotification({
      type: "critical",
      patientId: patient.patientId,
      hospitalId: patient.hospitalId,
      payload: critical,
      createdAt: now,
    });
    persistNotification(alertRow);
    notifyTelemetryCritical({
      patientId: patient.patientId,
      fullName: patient.fullName,
      hospitalId: patient.hospitalId,
      room: patient.room,
      vitals: broadcast.vitals as unknown as Record<string, unknown>,
    });
  }

  return broadcast;
}

let simInterval: ReturnType<typeof setInterval> | null = null;

export function startVitalsSimulator(io: SocketServer) {
  if (simInterval) return;
  simInterval = setInterval(() => {
    for (const d of store.devices) {
      if (!d.patientId) continue;
      maybeTriggerAbnormal(d.deviceId);
      const payload = buildPayload(d.deviceId, d.patientId);
      upsertVitals(io, d.deviceId, payload);
    }
  }, 1000);
  console.log("[telemetry] vitals simulator started (1s interval)");
}

export function attachDeviceStatus<T extends store.TelemetryDevice>(list: T[]) {
  return list.map((d) => ({
    ...d,
    online: deviceOnline(d.lastSeenAt),
  }));
}
