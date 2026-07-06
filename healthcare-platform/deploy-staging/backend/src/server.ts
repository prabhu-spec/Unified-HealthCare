import "dotenv/config";
import http from "http";
import cors from "cors";
import express from "express";
import { initSendGrid } from "./services/email.js";
import { initDatabase, disconnectDatabase } from "./db/init.js";
import { useDatabase } from "./db/client.js";
import { jwtAuthMiddleware } from "./middleware/jwtAuth.js";
import authRoutes from "./routes/auth.js";
import emailRoutes from "./routes/email.js";
import dashboardRoutes from "./routes/dashboard.js";
import videoRoutes, { getVideoAppointmentsForReminders } from "./routes/video.js";
import coreCareRoutes from "./routes/coreCare.js";
import notificationRoutes from "./routes/notifications.js";
import staffRoutes from "./routes/staff.js";
import schedulerRoutes from "./routes/scheduler.js";
import platformRoutes from "./routes/platform.js";
import { createTelemetryRouter } from "./telemetry/routes.js";
import { createTelemetrySocket } from "./telemetry/socket.js";
import { startVitalsSimulator } from "./telemetry/vitalsEngine.js";
import { startReminderScheduler } from "./services/reminderScheduler.js";

initSendGrid();

const app = express();
const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(cors({ origin: corsOrigin === "*" ? true : corsOrigin }));
app.use(express.json());
app.use(jwtAuthMiddleware);

const server = http.createServer(app);
const io = createTelemetrySocket(server, corsOrigin);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    telemetry: true,
    database: useDatabase(),
    jwt: true,
    enforceJwt: process.env.ENFORCE_JWT === "true",
  });
});

app.get("/smoke", (_req, res) => {
  res.send("✅ Healthcare backend + telemetry");
});

app.use(authRoutes);
app.use(emailRoutes);
app.use(dashboardRoutes);
app.use(videoRoutes);
app.use(coreCareRoutes);
app.use(notificationRoutes);
app.use(staffRoutes);
app.use(schedulerRoutes);
app.use(platformRoutes);
app.use(createTelemetryRouter(io));

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "internal_error" });
});

async function main() {
  await initDatabase();
  startVitalsSimulator(io);
  startReminderScheduler(getVideoAppointmentsForReminders);

  const PORT = Number(process.env.PORT) || 5000;
  const HOST = process.env.HOST || "0.0.0.0";
  server.listen(PORT, HOST, () => {
    console.log(`Backend + telemetry Socket.IO on http://${HOST}:${PORT}`);
    const db = useDatabase();
    console.log(`Data layer: ${db ? "PostgreSQL" : "in-memory (Phase 0 fallback)"}`);
    console.log(`JWT: enabled (ENFORCE_JWT=${process.env.ENFORCE_JWT === "true"})`);
    const lk = Boolean(process.env.LIVEKIT_API_KEY?.trim());
    const fcm = Boolean(process.env.FCM_SERVER_KEY?.trim());
    console.log(`LiveKit: ${lk ? "configured" : "not configured"}`);
    console.log(`FCM push: ${fcm ? "configured" : "not configured (in-app notifications still work)"}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

process.on("SIGINT", () => {
  disconnectDatabase().finally(() => process.exit(0));
});
process.on("SIGTERM", () => {
  disconnectDatabase().finally(() => process.exit(0));
});
