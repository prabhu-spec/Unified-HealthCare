import { Request, Response, NextFunction } from "express";

export function enforceTenant(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const tenant = req.headers["x-tenant-id"];
  const user = (req as any).user;

  if (!tenant || user["custom:tenant"] !== tenant) {
    return res.status(403).json({ error: "Invalid tenant" });
  }
  next();
}
