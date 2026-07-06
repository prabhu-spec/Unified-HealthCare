import jwt, { type SignOptions } from "jsonwebtoken";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  hospitalId?: string;
  patientId?: string;
}

const SECRET = process.env.JWT_SECRET || "dev-jwt-secret-change-in-production";

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET);
    if (typeof decoded !== "object" || decoded === null) return null;
    const p = decoded as JwtPayload;
    if (!p.sub || !p.email || !p.role) return null;
    return p;
  } catch {
    return null;
  }
}

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}
