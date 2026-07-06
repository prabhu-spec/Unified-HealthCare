/**
 * FCM device token registry — in-memory (Phase 0) or PostgreSQL (Phase 1+).
 */

import { useDatabase } from "../db/client.js";
import * as pushDb from "../db/repositories/pushTokens.js";

export interface DeviceTokenRecord {
  token: string;
  userId: string;
  role: string;
  hospitalId?: string;
  patientId?: string;
  platform: "android" | "ios" | "web";
  updatedAt: string;
}

const tokens = new Map<string, DeviceTokenRecord>();

function key(userId: string, token: string) {
  return `${userId}:${token}`;
}

export async function registerDeviceToken(
  input: Omit<DeviceTokenRecord, "updatedAt">
): Promise<DeviceTokenRecord> {
  if (useDatabase()) return pushDb.registerDeviceTokenDb(input);
  const row: DeviceTokenRecord = { ...input, updatedAt: new Date().toISOString() };
  tokens.set(key(input.userId, input.token), row);
  return row;
}

export async function unregisterDeviceToken(userId: string, token: string): Promise<boolean> {
  if (useDatabase()) return pushDb.unregisterDeviceTokenDb(userId, token);
  return tokens.delete(key(userId, token));
}

export async function tokensForNotification(filters: {
  targetRoles: string[];
  hospitalId?: string;
  patientId?: string;
}): Promise<DeviceTokenRecord[]> {
  if (useDatabase()) return pushDb.tokensForNotificationDb(filters);
  const { targetRoles, hospitalId, patientId } = filters;
  return [...tokens.values()].filter((t) => {
    if (!targetRoles.includes(t.role) && !targetRoles.includes("all")) return false;
    if (hospitalId && t.hospitalId && t.hospitalId !== hospitalId) return false;
    if (patientId && t.role === "patient" && t.patientId && t.patientId !== patientId) return false;
    return true;
  });
}

export function listDeviceTokens(): DeviceTokenRecord[] {
  return [...tokens.values()];
}
