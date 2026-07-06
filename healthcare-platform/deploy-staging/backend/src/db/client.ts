import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

let databaseConnected = false;

export function isDatabaseEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/** True when DATABASE_URL is set and Postgres connected successfully. */
export function useDatabase(): boolean {
  return isDatabaseEnabled() && databaseConnected;
}

export function setDatabaseConnected(value: boolean): void {
  databaseConnected = value;
}
