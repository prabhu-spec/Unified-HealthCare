import { prisma, isDatabaseEnabled, setDatabaseConnected, useDatabase } from "./client.js";
import { seedDatabase } from "./seed.js";
import { initTelemetryPersistence } from "../telemetry/persistence.js";

export async function initDatabase(): Promise<void> {
  if (!isDatabaseEnabled()) {
    console.warn(
      "[db] DATABASE_URL not set — using in-memory stores (Phase 0). Set DATABASE_URL for Phase 1 persistence."
    );
    return;
  }
  try {
    await prisma.$connect();
    setDatabaseConnected(true);
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      await seedDatabase();
      console.log("[db] PostgreSQL seeded with demo data");
    } else {
      console.log(`[db] PostgreSQL connected (${userCount} users)`);
    }
    await initTelemetryPersistence();
  } catch (err) {
    console.error(
      "[db] Could not connect to PostgreSQL. Start Docker: cd healthcare-platform && docker compose up -d",
      err instanceof Error ? err.message : err
    );
    console.warn("[db] Falling back to in-memory stores (Phase 0) for this run.");
    setDatabaseConnected(false);
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (useDatabase()) await prisma.$disconnect();
}
