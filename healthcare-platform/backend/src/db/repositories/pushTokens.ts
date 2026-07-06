import { prisma } from "../client.js";
import type { DeviceTokenRecord } from "../../services/pushTokens.js";

export async function registerDeviceTokenDb(input: Omit<DeviceTokenRecord, "updatedAt">): Promise<DeviceTokenRecord> {
  const row = await prisma.devicePushToken.upsert({
    where: { userId_token: { userId: input.userId, token: input.token } },
    create: {
      token: input.token,
      userId: input.userId,
      role: input.role,
      hospitalId: input.hospitalId,
      patientId: input.patientId,
      platform: input.platform,
    },
    update: {
      role: input.role,
      hospitalId: input.hospitalId,
      patientId: input.patientId,
      platform: input.platform,
      updatedAt: new Date(),
    },
  });
  return {
    token: row.token,
    userId: row.userId,
    role: row.role,
    hospitalId: row.hospitalId ?? undefined,
    patientId: row.patientId ?? undefined,
    platform: row.platform as DeviceTokenRecord["platform"],
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function unregisterDeviceTokenDb(userId: string, token: string): Promise<boolean> {
  const result = await prisma.devicePushToken.deleteMany({ where: { userId, token } });
  return result.count > 0;
}

export async function tokensForNotificationDb(filters: {
  targetRoles: string[];
  hospitalId?: string;
  patientId?: string;
}): Promise<DeviceTokenRecord[]> {
  const rows = await prisma.devicePushToken.findMany();
  return rows
    .filter((t) => {
      if (!filters.targetRoles.includes(t.role) && !filters.targetRoles.includes("all")) return false;
      if (filters.hospitalId && t.hospitalId && t.hospitalId !== filters.hospitalId) return false;
      if (filters.patientId && t.role === "patient" && t.patientId && t.patientId !== filters.patientId) return false;
      return true;
    })
    .map((t) => ({
      token: t.token,
      userId: t.userId,
      role: t.role,
      hospitalId: t.hospitalId ?? undefined,
      patientId: t.patientId ?? undefined,
      platform: t.platform as DeviceTokenRecord["platform"],
      updatedAt: t.updatedAt.toISOString(),
    }));
}
