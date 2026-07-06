import type express from "express";
import { extractBearerToken, verifyAccessToken } from "../services/jwt.js";

const PUBLIC_PATHS = ["/health", "/smoke"];

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));
}

export function jwtAuthMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (isPublicPath(req.path)) return next();

  const token = extractBearerToken(req.headers.authorization);
  const enforce = process.env.ENFORCE_JWT === "true";

  if (token) {
    const claims = verifyAccessToken(token);
    if (claims) {
      req.auth = claims;
      req.headers["x-role"] = claims.role;
      req.headers["x-user-id"] = claims.sub;
      if (claims.hospitalId) req.headers["x-hospital-id"] = claims.hospitalId;
      if (claims.patientId) req.headers["x-patient-id"] = claims.patientId;
      return next();
    }
    if (enforce) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }
  }

  if (enforce) {
    return res.status(401).json({ error: "Authentication required. Send Authorization: Bearer <token>." });
  }

  next();
}
