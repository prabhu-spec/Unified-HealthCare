import { prisma } from "../client.js";

function toApi(row: {
  id: string;
  patientId: string;
  patientName: string;
  doctorType: string;
  hospitalId: string;
  hospitalName: string;
  date: string;
  time: string;
  status: string;
  roomName: string | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    patientId: row.patientId,
    patientName: row.patientName,
    doctorType: row.doctorType,
    hospitalId: row.hospitalId,
    hospitalName: row.hospitalName,
    date: row.date,
    time: row.time,
    status: row.status,
    roomName: row.roomName ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listVideoAppointments(filters: {
  role: string | null;
  patientId?: string | null;
  hospitalId?: string | null;
}) {
  const rows = await prisma.videoAppointment.findMany({ orderBy: { createdAt: "desc" } });
  let list = rows;
  if (filters.role === "patient" && filters.patientId) {
    list = list.filter((a) => a.patientId === filters.patientId);
  } else if ((filters.role === "doctor" || filters.role === "hospital_admin") && filters.hospitalId) {
    list = list.filter((a) => a.hospitalId === filters.hospitalId);
  }
  return list.map(toApi);
}

export async function createVideoAppointment(data: {
  patientId: string;
  patientName: string;
  doctorType: string;
  hospitalId: string;
  hospitalName: string;
  date: string;
  time: string;
}) {
  const count = await prisma.videoAppointment.count();
  const row = await prisma.videoAppointment.create({
    data: {
      id: `vc-${count + 1}`,
      ...data,
      status: "pending",
    },
  });
  return toApi(row);
}

export async function findVideoAppointment(id: string) {
  const row = await prisma.videoAppointment.findUnique({ where: { id } });
  return row ? toApi(row) : null;
}

export async function updateVideoAppointment(
  id: string,
  data: { status?: string; roomName?: string }
) {
  const row = await prisma.videoAppointment.update({ where: { id }, data });
  return toApi(row);
}

export async function getAllForReminders() {
  const rows = await prisma.videoAppointment.findMany();
  return rows.map(toApi);
}
