import type { Request, Response, NextFunction } from "express";
import * as store from "./store.js";

export interface TelemetryAuth {
  role: string;
  hospitalId?: string;
  userId?: string;
  patientId?: string;
  email?: string;
}

export function parseTelemetryAuth(req: Request): TelemetryAuth {
  return {
    role: (req.headers["x-role"] as string) || "",
    hospitalId: (req.headers["x-hospital-id"] as string) || undefined,
    userId: (req.headers["x-user-id"] as string) || undefined,
    patientId: (req.headers["x-patient-id"] as string) || undefined,
    email: (req.headers["x-user-email"] as string) || undefined,
  };
}

export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = parseTelemetryAuth(req);
    if (!roles.includes(auth.role)) {
      res.status(403).json({ error: "forbidden" });
      return;
    }
    (req as Request & { telemetryAuth: TelemetryAuth }).telemetryAuth = auth;
    next();
  };
}

export function resolveHospitalId(req: Request): string | null {
  const auth = parseTelemetryAuth(req);
  if (auth.hospitalId) return auth.hospitalId;
  if (auth.role === "patient" && auth.patientId) {
    return store.findPatient(auth.patientId)?.hospitalId ?? null;
  }
  return null;
}
