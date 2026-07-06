import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import type { TelemetryAuth } from "./middleware.js";
import * as store from "./store.js";

function resolveSocketHospitalId(auth: TelemetryAuth): string | undefined {
  if (auth.hospitalId) return auth.hospitalId;
  if (auth.role === "patient" && auth.patientId) {
    return store.findPatient(auth.patientId)?.hospitalId;
  }
  return undefined;
}

export function createTelemetrySocket(httpServer: HttpServer, corsOrigin: string | string[] | boolean) {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin === "*" ? true : corsOrigin,
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const auth = socket.handshake.auth as Partial<TelemetryAuth>;
    if (!auth?.role) {
      next(new Error("auth_required"));
      return;
    }
    socket.data.telemetryAuth = {
      role: auth.role,
      hospitalId: auth.hospitalId,
      userId: auth.userId,
      patientId: auth.patientId,
      email: auth.email,
    } as TelemetryAuth;
    next();
  });

  io.on("connection", (socket) => {
    const auth = socket.data.telemetryAuth as TelemetryAuth;
    const hid = resolveSocketHospitalId(auth);
    if (hid) {
      auth.hospitalId = hid;
      socket.join(`hospital:${hid}`);
      if (auth.role === "doctor" || auth.role === "nurse") {
        socket.join(`hospital:${hid}:doctors`);
      }
    }
    socket.emit("rpm", {
      type: "hello",
      message: "telemetry_connected",
      role: auth.role,
      hospitalId: hid || null,
    });
  });

  return io;
}
