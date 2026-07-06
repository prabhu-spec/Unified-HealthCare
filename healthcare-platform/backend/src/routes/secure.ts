import { Router } from "express";
import { requireAuth } from "../lib/middleware/requireAuth";
import { requireRole } from "../lib/middleware/requireRole";
import { enforceTenant } from "../lib/middleware/enforceTenant";

const router = Router();

router.get(
  "/secure/health",
  requireAuth,
  enforceTenant,
  requireRole(["admin", "provider"]),
  (_req, res) => {
    res.json({ status: "secure ok" });
  }
);

export default router;
