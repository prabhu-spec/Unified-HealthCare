import * as store from "./store.js";
import { persistRoomPresence } from "./persistence.js";
import { hasCriticalAlert, deviceOnline } from "./vitalsEngine.js";

function vitalsSummary(patientId: string) {
  const v = store.vitalsLatest.get(patientId);
  if (!v) return null;
  return {
    heartRate: v.heartRate,
    spo2: v.spo2,
    temperature: v.temperature,
    systolic: v.systolic,
    diastolic: v.diastolic,
    respiration: v.respiration,
    battery: v.battery,
    timestamp: v.timestamp,
    alert: hasCriticalAlert(v),
  };
}

function mapDoctorRef(doctorUserId: string | null | undefined) {
  if (!doctorUserId) return null;
  const d = store.DEMO_DOCTORS.find((x) => x.userId === doctorUserId);
  return d ? { userId: d.userId, username: d.username, displayName: d.displayName } : { userId: doctorUserId, username: doctorUserId };
}

export function buildOverview(hospitalId: string, filterDoctorUserId?: string) {
  const hospital = store.getHospital(hospitalId);
  if (!hospital) return null;

  const roomList = store.roomNumbersForHospital(hospitalId);
  const hospitalPatients = store.patients.filter((p) => p.hospitalId === hospitalId);
  const byRoom = new Map<string, store.TelemetryPatient>();
  for (const p of hospitalPatients) {
    if (!byRoom.has(p.room)) byRoom.set(p.room, p);
  }

  const presenceByRoom = Object.fromEntries(
    store.roomPresence.filter((r) => r.hospitalId === hospitalId).map((r) => [r.room, r])
  );

  const rooms = roomList.map((room) => {
    const patient = byRoom.get(room) || null;
    const presence = presenceByRoom[room];
    const assignedDoc = patient?.assignedDoctorId ? mapDoctorRef(patient.assignedDoctorId) : null;
    const patientDevices = patient
      ? store.devices.filter((d) => d.patientId === patient.patientId)
      : [];

    return {
      room,
      occupied: !!patient,
      patient: patient
        ? {
            patientId: patient.patientId,
            fullName: patient.fullName,
            latestVitals: vitalsSummary(patient.patientId),
            deviceCount: patientDevices.length,
          }
        : null,
      assignedDoctor: assignedDoc,
      doctorInRoom: !!presence,
      presentDoctor: presence
        ? { userId: presence.doctorUserId, username: presence.doctorUsername }
        : null,
    };
  });

  let filtered = rooms;
  if (filterDoctorUserId) {
    filtered = rooms.filter(
      (r) => r.occupied && r.assignedDoctor && r.assignedDoctor.userId === filterDoctorUserId
    );
  }

  return { hospital, rooms: filtered };
}

export function getRoomDetail(hospitalId: string, room: string, filterDoctorUserId?: string) {
  const overview = buildOverview(hospitalId, filterDoctorUserId);
  if (!overview) return null;

  const tile = overview.rooms.find((r) => r.room === room);
  const allRooms = store.roomNumbersForHospital(hospitalId);
  if (!allRooms.includes(room)) return { error: "room_not_found" };

  const patient = store.patients.find((p) => p.hospitalId === hospitalId && p.room === room);
  if (filterDoctorUserId && patient && patient.assignedDoctorId !== filterDoctorUserId) {
    return { error: "forbidden" };
  }

  const devices = patient
    ? store.devices.filter((d) => d.hospitalId === hospitalId && d.patientId === patient.patientId)
    : [];
  const presence = store.roomPresence.find((r) => r.hospitalId === hospitalId && r.room === room);

  return {
    room,
    occupied: !!patient,
    patient: patient
      ? {
          patientId: patient.patientId,
          fullName: patient.fullName,
          latestVitals: vitalsSummary(patient.patientId),
        }
      : null,
    assignedDoctor: patient?.assignedDoctorId ? mapDoctorRef(patient.assignedDoctorId) : null,
    doctorInRoom: !!presence,
    presentDoctor: presence
      ? { userId: presence.doctorUserId, username: presence.doctorUsername }
      : null,
    devices: devices.map((d) => ({ ...d, online: deviceOnline(d.lastSeenAt) })),
    visitLogs: [],
  };
}

export function startVisit(hospitalId: string, room: string, patientId: string, doctorUserId: string, doctorUsername: string) {
  for (let i = store.roomPresence.length - 1; i >= 0; i--) {
    const r = store.roomPresence[i];
    if (r.hospitalId === hospitalId && r.room === room) store.roomPresence.splice(i, 1);
  }
  store.roomPresence.push({
    hospitalId,
    room,
    patientId,
    doctorUserId,
    doctorUsername,
    enteredAt: new Date().toISOString(),
  });
  persistRoomPresence();
}

export function endVisit(hospitalId: string, room: string, doctorUserId: string) {
  for (let i = store.roomPresence.length - 1; i >= 0; i--) {
    const r = store.roomPresence[i];
    if (r.hospitalId === hospitalId && r.room === room && r.doctorUserId === doctorUserId) {
      store.roomPresence.splice(i, 1);
    }
  }
  persistRoomPresence();
}
