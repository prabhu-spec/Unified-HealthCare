import { prisma } from "../client.js";
import { userToAuth } from "../mappers.js";

function norm(email: string) {
  return email.toLowerCase().trim();
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: norm(email) } });
}

export async function loginUser(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user || user.isDeleted || user.password !== password) return null;
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });
  return userToAuth({ ...user, lastLogin: new Date() });
}

export async function setUserPassword(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) return false;
  await prisma.user.update({ where: { id: user.id }, data: { password } });
  return true;
}

export async function markUserDeleted(email: string) {
  const user = await findUserByEmail(email);
  if (!user) return false;
  await prisma.user.update({ where: { id: user.id }, data: { isDeleted: true } });
  return true;
}

export async function isUserDeleted(email: string) {
  const user = await findUserByEmail(email);
  return user?.isDeleted ?? false;
}

export async function listStaffUsers(filters?: { hospitalId?: string; role?: string }) {
  const where: { isDeleted: boolean; hospitalId?: string; role?: string } = { isDeleted: false };
  if (filters?.hospitalId) where.hospitalId = filters.hospitalId;
  if (filters?.role) where.role = filters.role;
  const rows = await prisma.user.findMany({ where, orderBy: { createdAt: "asc" } });
  return rows.map((u) => {
    const { password: _, ...rest } = u;
    return {
      id: rest.id,
      email: rest.email,
      firstName: rest.firstName,
      lastName: rest.lastName,
      role: rest.role,
      hospitalId: rest.hospitalId ?? undefined,
      patientId: rest.patientId ?? undefined,
      specialization: rest.specialization ?? undefined,
      isVerified: rest.isVerified,
      createdAt: rest.createdAt.toISOString(),
      lastLogin: rest.lastLogin?.toISOString(),
    };
  });
}

export async function createStaffUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  hospitalId?: string;
  patientId?: string;
  specialization?: string;
}) {
  const email = norm(input.email);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("email_exists");
  const count = await prisma.user.count({ where: { id: { startsWith: "u-staff-" } } });
  const row = await prisma.user.create({
    data: {
      id: `u-staff-${count + 1}`,
      email,
      password: input.password,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      hospitalId: input.hospitalId,
      patientId: input.patientId,
      specialization: input.specialization,
    },
  });
  return row;
}

export async function updateStaffUser(email: string, patch: Partial<{ firstName: string; lastName: string; role: string; hospitalId: string; specialization: string; password: string }>) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(patch.firstName ? { firstName: patch.firstName } : {}),
      ...(patch.lastName ? { lastName: patch.lastName } : {}),
      ...(patch.role ? { role: patch.role } : {}),
      ...(patch.hospitalId !== undefined ? { hospitalId: patch.hospitalId || null } : {}),
      ...(patch.specialization !== undefined ? { specialization: patch.specialization || null } : {}),
      ...(patch.password ? { password: patch.password } : {}),
    },
  });
  return updated;
}

export async function staffToAuthFromDb(email: string) {
  const user = await findUserByEmail(email);
  if (!user || user.isDeleted) return null;
  return userToAuth({ ...user, lastLogin: new Date() });
}
