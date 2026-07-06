import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../auth/jwt";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const token = auth.replace("Bearer ", "");
    const claims = await verifyJwt(token);
    (req as any).user = claims;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
