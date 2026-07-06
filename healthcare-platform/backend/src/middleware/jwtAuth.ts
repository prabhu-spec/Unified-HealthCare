import type express from "express";
import { extractBearerToken, verifyAccessToken } from "../services/jwt.js";

/** Paths that do not require JWT (login, health, public checks). */
const PUBLIC_PATHS = [
  "/health",
  "/smoke",
  "/api/auth/login",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/forgot-email",
  "/api/auth/request-password-change-otp",
  "/api/auth/change-password",
  "/api/auth/request-delete-account-otp",
  "/api/auth/confirm-delete-account",
];

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"));
}

function applyClaimsToRequest(req: express.Request, claims: ReturnType<typeof verifyAccessToken>) {
  if (!claims) return;
  req.headers["x-role"] = claims.role;
  req.headers["x-user-email"] = claims.email;
  req.headers["x-user-id"] = claims.sub;
  if (claims.hospitalId) req.headers["x-hospital-id"] = claims.hospitalId;
  else delete req.headers["x-hospital-id"];
  if (claims.patientId) req.headers["x-patient-id"] = claims.patientId;
  else delete req.headers["x-patient-id"];
}

/**
 * Phase 2: When Authorization Bearer JWT is present, role/hospital claims come from the token
 * (clients cannot spoof x-role). Without JWT, x-role headers still work unless ENFORCE_JWT=true.
 */
export function jwtAuthMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const path = req.path;
  if (isPublicPath(path)) return next();

  const token = extractBearerToken(req.headers.authorization);
  const enforce = process.env.ENFORCE_JWT === "true";

  if (token) {
    const claims = verifyAccessToken(token);
    if (claims) {
      applyClaimsToRequest(req, claims);
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
