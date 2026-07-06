import { prisma } from "../client.js";
import type {
  TelemetryPatient,
  TelemetryDevice,
  VitalsLatest,
  RoomPresence,
  TelemetryNotification,
  HospitalTelemetryConfig,
} from "../../telemetry/store.js";

export async function hydrateTelemetryMemory(state: {
  hospitals: HospitalTelemetryConfig[];
  patients: TelemetryPatient[];
  devices: TelemetryDevice[];
  vitalsLatest: Map<string, VitalsLatest>;
  roomPresence: RoomPresence[];
  notifications: TelemetryNotification[];
}) {
  const [configs, patients, devices, vitals, presence, notifs] = await Promise.all([
    prisma.telemetryHospitalConfig.findMany(),
    prisma.telemetryPatient.findMany(),
    prisma.telemetryDevice.findMany(),
    prisma.vitalsSnapshot.findMany({ orderBy: { timestamp: "desc" }, take: 500 }),
    prisma.roomPresenceRecord.findMany({ orderBy: { enteredAt: "desc" }, take: 100 }),
    prisma.telemetryNotificationRow.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  state.hospitals.length = 0;
  state.hospitals.push(
    ...configs.map((c) => ({
      hospitalId: c.hospitalId,
      name: c.name,
      totalRooms: c.totalRooms,
      roomNumberStart: c.roomNumberStart,
    }))
  );

  state.patients.length = 0;
  state.patients.push(
    ...patients.map((p) => ({
      patientId: p.patientId,
      fullName: p.fullName,
      hospitalId: p.hospitalId,
      room: p.room,
      assignedDoctorId: p.assignedDoctorId,
    }))
  );

  state.devices.length = 0;
  state.devices.push(
    ...devices.map((d) => ({
      deviceId: d.deviceId,
      name: d.name,
      type: d.type,
      hospitalId: d.hospitalId,
      patientId: d.patientId,
      lastSeenAt: d.lastSeenAt?.toISOString() ?? null,
      lastBattery: d.lastBattery,
    }))
  );

  state.vitalsLatest.clear();
  for (const v of vitals) {
    if (state.vitalsLatest.has(v.patientId)) continue;
    state.vitalsLatest.set(v.patientId, {
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
    });
  }

  state.roomPresence.length = 0;
  state.roomPresence.push(
    ...presence.map((r) => ({
      hospitalId: r.hospitalId,
      room: r.room,
      patientId: r.patientId,
      doctorUserId: r.doctorUserId,
      doctorUsername: r.doctorUsername,
      enteredAt: r.enteredAt.toISOString(),
    }))
  );

  state.notifications.length = 0;
  state.notifications.push(
    ...notifs.map((n) => ({
      id: n.id,
      type: n.type,
      patientId: n.patientId,
      hospitalId: n.hospitalId,
      payload: JSON.parse(n.payload) as Record<string, unknown>,
      createdAt: n.createdAt.toISOString(),
    }))
  );
}

export async function seedTelemetryIfEmpty() {
  const count = await prisma.telemetryPatient.count();
  if (count > 0) return;

  await prisma.$transaction([
    prisma.telemetryHospitalConfig.createMany({
      data: [
        { hospitalId: "org-1", name: "SOUTHEAST HEALTH MEDICAL CENTER", totalRooms: 15, roomNumberStart: 100 },
        { hospitalId: "org-2", name: "NORTH VALLEY HOSPITAL", totalRooms: 12, roomNumberStart: 200 },
      ],
    }),
    prisma.telemetryPatient.createMany({
      data: [
        { patientId: "patient-1", fullName: "John Smith", hospitalId: "org-1", room: "101", assignedDoctorId: "u-doc" },
        { patientId: "patient-2", fullName: "Sarah Johnson", hospitalId: "org-1", room: "102", assignedDoctorId: "u-doc" },
        { patientId: "patient-3", fullName: "Robert Williams", hospitalId: "org-1", room: "103", assignedDoctorId: null },
        { patientId: "patient-4", fullName: "Emily Davis", hospitalId: "org-2", room: "201", assignedDoctorId: null },
      ],
    }),
    prisma.telemetryDevice.createMany({
      data: [
        { deviceId: "device001", name: "Bedside Monitor 1", type: "Vitals hub", hospitalId: "org-1", patientId: "patient-1" },
        { deviceId: "device002", name: "Bedside Monitor 2", type: "Vitals hub", hospitalId: "org-1", patientId: "patient-2" },
        { deviceId: "device003", name: "Bedside Monitor 3", type: "Vitals hub", hospitalId: "org-1", patientId: "patient-3" },
        { deviceId: "device004", name: "Ward Monitor 4", type: "Pulse oximeter", hospitalId: "org-2", patientId: "patient-4" },
      ],
    }),
  ]);
}

export async function upsertTelemetryPatient(p: TelemetryPatient) {
  await prisma.telemetryPatient.upsert({
    where: { patientId: p.patientId },
    create: p,
    update: {
      fullName: p.fullName,
      hospitalId: p.hospitalId,
      room: p.room,
      assignedDoctorId: p.assignedDoctorId,
    },
  });
}

export async function deleteTelemetryPatient(patientId: string) {
  await prisma.telemetryPatient.delete({ where: { patientId } }).catch(() => {});
  await prisma.vitalsSnapshot.deleteMany({ where: { patientId } });
}

export async function upsertTelemetryDevice(d: TelemetryDevice) {
  await prisma.telemetryDevice.upsert({
    where: { deviceId: d.deviceId },
    create: {
      deviceId: d.deviceId,
      name: d.name,
      type: d.type,
      hospitalId: d.hospitalId,
      patientId: d.patientId,
      lastSeenAt: d.lastSeenAt ? new Date(d.lastSeenAt) : null,
      lastBattery: d.lastBattery,
    },
    update: {
      name: d.name,
      type: d.type,
      hospitalId: d.hospitalId,
      patientId: d.patientId,
      lastSeenAt: d.lastSeenAt ? new Date(d.lastSeenAt) : null,
      lastBattery: d.lastBattery,
    },
  });
}

export async function deleteTelemetryDevice(deviceId: string) {
  await prisma.telemetryDevice.delete({ where: { deviceId } }).catch(() => {});
}

export async function saveVitalsSnapshot(v: VitalsLatest) {
  await prisma.vitalsSnapshot.create({
    data: {
      patientId: v.patientId,
      deviceId: v.deviceId,
      hospitalId: v.hospitalId,
      heartRate: Math.round(v.heartRate),
      spo2: Math.round(v.spo2),
      temperature: v.temperature,
      systolic: Math.round(v.systolic),
      diastolic: Math.round(v.diastolic),
      respiration: Math.round(v.respiration),
      battery: Math.round(v.battery),
      timestamp: new Date(v.timestamp),
    },
  });
}

export async function replaceRoomPresence(rows: RoomPresence[]) {
  await prisma.roomPresenceRecord.deleteMany();
  if (rows.length === 0) return;
  await prisma.roomPresenceRecord.createMany({
    data: rows.map((r) => ({
      hospitalId: r.hospitalId,
      room: r.room,
      patientId: r.patientId,
      doctorUserId: r.doctorUserId,
      doctorUsername: r.doctorUsername,
      enteredAt: new Date(r.enteredAt),
    })),
  });
}

export async function saveTelemetryNotification(n: TelemetryNotification) {
  await prisma.telemetryNotificationRow.create({
    data: {
      id: n.id,
      type: n.type,
      patientId: n.patientId,
      hospitalId: n.hospitalId,
      payload: JSON.stringify(n.payload),
      createdAt: new Date(n.createdAt),
    },
  });
}
