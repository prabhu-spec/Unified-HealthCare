import { Request, Response, NextFunction } from "express";

export function enforceSmartScope(required: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const scopes: string[] =
      req.user?.scope?.split(" ") || [];

    if (!scopes.includes(required)) {
      return res.status(403).json({
        error: "Missing SMART scope",
        required
      });
    }
    next();
  };
}
