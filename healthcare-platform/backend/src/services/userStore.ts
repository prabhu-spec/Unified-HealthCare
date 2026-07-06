/**
 * Password overrides and deleted accounts.
 * Phase 0: in-memory. Phase 1: PostgreSQL when DATABASE_URL is set.
 */

import { useDatabase } from "../db/client.js";
import * as userDb from "../db/repositories/users.js";

const passwordOverrides = new Map<string, string>();
const deletedAccounts = new Set<string>();

function key(email: string) {
  return email.toLowerCase().trim();
}

export async function isDeleted(email: string): Promise<boolean> {
  if (useDatabase()) return userDb.isUserDeleted(email);
  return deletedAccounts.has(key(email));
}

export async function setDeleted(email: string): Promise<void> {
  if (useDatabase()) {
    await userDb.markUserDeleted(email);
    return;
  }
  deletedAccounts.add(key(email));
}

export async function getPasswordOverride(email: string): Promise<string | undefined> {
  if (useDatabase()) {
    const user = await userDb.findUserByEmail(email);
    return user?.password;
  }
  return passwordOverrides.get(key(email));
}

export async function setPasswordOverride(email: string, password: string): Promise<void> {
  if (useDatabase()) {
    await userDb.setUserPassword(email, password);
    return;
  }
  passwordOverrides.set(key(email), password);
}

export function clearPasswordOverride(email: string): void {
  passwordOverrides.delete(key(email));
}
