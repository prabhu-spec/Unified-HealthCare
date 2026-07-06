import { prisma } from "../client.js";

export type ScheduleFilters = {
  hospitalId?: string | null;
  staffId?: string;
  date?: string;
  role?: string | null;
  userId?: string | null;
};

export async function listSchedules(filters: ScheduleFilters) {
  let rows = await prisma.schedule.findMany({ orderBy: { createdAt: "desc" } });
  if (filters.hospitalId) rows = rows.filter((s) => s.hospitalId === filters.hospitalId);
  if (filters.staffId) rows = rows.filter((s) => s.staffId === filters.staffId);
  if (filters.date) rows = rows.filter((s) => s.date === filters.date);
  if (filters.role === "doctor" || filters.role === "nurse") {
    if (filters.userId) rows = rows.filter((s) => s.staffId === filters.userId);
  }
  return rows.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  }));
}

export async function createSchedule(data: {
  hospitalId: string;
  staffId: string;
  staffName: string;
  staffRole: string;
  patientId?: string;
  patientName?: string;
  title: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}) {
  const count = await prisma.schedule.count();
  const row = await prisma.schedule.create({
    data: {
      id: `sch-${count + 1}`,
      ...data,
      status: "scheduled",
    },
  });
  return { ...row, createdAt: row.createdAt.toISOString() };
}

export async function updateSchedule(id: string, body: Record<string, unknown>) {
  const row = await prisma.schedule.update({
    where: { id },
    data: {
      ...(body.title ? { title: String(body.title) } : {}),
      ...(body.date ? { date: String(body.date) } : {}),
      ...(body.startTime ? { startTime: String(body.startTime) } : {}),
      ...(body.endTime ? { endTime: String(body.endTime) } : {}),
      ...(body.notes !== undefined ? { notes: body.notes ? String(body.notes) : null } : {}),
      ...(body.status && ["scheduled", "completed", "cancelled"].includes(String(body.status))
        ? { status: String(body.status) }
        : {}),
    },
  });
  return { ...row, createdAt: row.createdAt.toISOString() };
}

export async function findSchedule(id: string) {
  const row = await prisma.schedule.findUnique({ where: { id } });
  if (!row) return null;
  return { ...row, createdAt: row.createdAt.toISOString() };
}

export async function deleteSchedule(id: string) {
  await prisma.schedule.delete({ where: { id } });
}
