import { useDatabase } from "../db/client.js";
import * as telemetryDb from "../db/repositories/telemetry.js";
import * as store from "./store.js";

export async function initTelemetryPersistence() {
  if (!useDatabase()) return;
  await telemetryDb.seedTelemetryIfEmpty();
  await telemetryDb.hydrateTelemetryMemory({
    hospitals: store.hospitals,
    patients: store.patients,
    devices: store.devices,
    vitalsLatest: store.vitalsLatest,
    roomPresence: store.roomPresence,
    notifications: store.notifications,
  });
  console.log("[telemetry] Loaded from PostgreSQL");
}

export function persistPatient(p: store.TelemetryPatient) {
  if (useDatabase()) void telemetryDb.upsertTelemetryPatient(p);
}

export function persistPatientDelete(patientId: string) {
  if (useDatabase()) void telemetryDb.deleteTelemetryPatient(patientId);
}

export function persistDevice(d: store.TelemetryDevice) {
  if (useDatabase()) void telemetryDb.upsertTelemetryDevice(d);
}

export function persistDeviceDelete(deviceId: string) {
  if (useDatabase()) void telemetryDb.deleteTelemetryDevice(deviceId);
}

export function persistVitals(v: store.VitalsLatest) {
  if (useDatabase()) void telemetryDb.saveVitalsSnapshot(v);
}

export function persistRoomPresence() {
  if (useDatabase()) void telemetryDb.replaceRoomPresence(store.roomPresence);
}

export function persistNotification(n: store.TelemetryNotification) {
  if (useDatabase()) void telemetryDb.saveTelemetryNotification(n);
}
