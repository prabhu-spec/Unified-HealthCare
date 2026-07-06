import type express from "express";

export function getScope(req: express.Request) {
  return {
    role: (req.headers["x-role"] as string) ?? (req.query.role as string) ?? null,
    hospitalId: (req.headers["x-hospital-id"] as string) ?? (req.query.hospitalId as string) ?? null,
    patientId: (req.headers["x-patient-id"] as string) ?? (req.query.patientId as string) ?? null,
  };
}
