/**
 * Staff/user registry — in-memory (Phase 0) or PostgreSQL (Phase 1).
 */

import { useDatabase } from "../db/client.js";
import * as userDb from "../db/repositories/users.js";
export type StaffRole =
  | "super_admin"
  | "hospital_admin"
  | "doctor"
  | "nurse"
  | "patient"
  | "medical_vendor"
  | "bloodbank_admin"
  | "insurance_provider";

export interface StaffUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: StaffRole;
  hospitalId?: string;
  patientId?: string;
  specialization?: string;
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

const users = new Map<string, StaffUser>();
let nextId = 1;

function mapKey(email: string) {
  return email.toLowerCase().trim();
}

export async function listStaff(filters?: { hospitalId?: string; role?: string }) {
  if (useDatabase()) return userDb.listStaffUsers(filters);
  let rows = [...users.values()];
  if (filters?.hospitalId) rows = rows.filter((u) => u.hospitalId === filters.hospitalId);
  if (filters?.role) rows = rows.filter((u) => u.role === filters.role);
  return rows.map(({ password, ...rest }) => rest);
}

export async function findStaffByEmail(email: string): Promise<StaffUser | undefined> {
  if (useDatabase()) {
    const u = await userDb.findUserByEmail(email);
    if (!u || u.isDeleted) return undefined;
    return {
      id: u.id,
      email: u.email,
      password: u.password,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role as StaffRole,
      hospitalId: u.hospitalId ?? undefined,
      patientId: u.patientId ?? undefined,
      specialization: u.specialization ?? undefined,
      isVerified: u.isVerified,
      createdAt: u.createdAt.toISOString(),
      lastLogin: u.lastLogin?.toISOString(),
    };
  }
  return users.get(mapKey(email));
}

export async function createStaff(input: Omit<StaffUser, "id" | "createdAt" | "isVerified">): Promise<StaffUser> {
  if (useDatabase()) {
    const row = await userDb.createStaffUser(input);
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      firstName: row.firstName,
      lastName: row.lastName,
      role: row.role as StaffRole,
      hospitalId: row.hospitalId ?? undefined,
      patientId: row.patientId ?? undefined,
      specialization: row.specialization ?? undefined,
      isVerified: row.isVerified,
      createdAt: row.createdAt.toISOString(),
    };
  }
  const email = mapKey(input.email);
  if (users.has(email)) throw new Error("email_exists");
  const row: StaffUser = {
    ...input,
    email,
    id: `u-staff-${nextId++}`,
    isVerified: true,
    createdAt: new Date().toISOString(),
  };
  users.set(email, row);
  return row;
}

export async function updateStaff(email: string, patch: Partial<StaffUser>): Promise<StaffUser | null> {
  if (useDatabase()) {
    const updated = await userDb.updateStaffUser(email, {
      firstName: patch.firstName,
      lastName: patch.lastName,
      role: patch.role,
      hospitalId: patch.hospitalId,
      specialization: patch.specialization,
      password: patch.password,
    });
    if (!updated) return null;
    return {
      id: updated.id,
      email: updated.email,
      password: updated.password,
      firstName: updated.firstName,
      lastName: updated.lastName,
      role: updated.role as StaffRole,
      hospitalId: updated.hospitalId ?? undefined,
      patientId: updated.patientId ?? undefined,
      specialization: updated.specialization ?? undefined,
      isVerified: updated.isVerified,
      createdAt: updated.createdAt.toISOString(),
      lastLogin: updated.lastLogin?.toISOString(),
    };
  }
  const row = users.get(mapKey(email));
  if (!row) return null;
  if (patch.firstName) row.firstName = patch.firstName;
  if (patch.lastName) row.lastName = patch.lastName;
  if (patch.role) row.role = patch.role as StaffRole;
  if (patch.hospitalId !== undefined) row.hospitalId = patch.hospitalId || undefined;
  if (patch.specialization !== undefined) row.specialization = patch.specialization;
  if (patch.password) row.password = patch.password;
  return row;
}

export function staffToAuthUser(row: StaffUser) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    role: row.role,
    hospitalId: row.hospitalId,
    patientId: row.patientId,
    specialization: row.specialization,
    isVerified: row.isVerified,
    createdAt: row.createdAt,
    lastLogin: new Date().toISOString(),
  };
}

export async function loginStaffOrDemo(
  email: string,
  password: string
): Promise<Record<string, unknown> | null> {
  if (useDatabase()) return userDb.loginUser(email, password);
  return null;
}
