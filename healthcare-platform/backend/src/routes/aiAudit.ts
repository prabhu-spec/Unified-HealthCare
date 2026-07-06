/**
 * Phase LLM-4 — AI Assist audit trail (compliance + debugging).
 */
import express from "express";
import { useDatabase } from "../db/client.js";
import { getScope } from "../db/requestScope.js";
import { verifyAccessToken, extractBearerToken } from "../services/jwt.js";
import * as aiAuditDb from "../db/repositories/aiAudit.js";
import { appendInMemoryAiAudit, listInMemoryAiAudit } from "../store/inMemoryAiAudit.js";

const router = express.Router();
type Request = express.Request;
type Response = express.Response;

function canViewAiAudit(role: string | null): boolean {
  return role === "super_admin" || role === "hospital_admin";
}

function getClaims(req: Request) {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) return null;
  return verifyAccessToken(token);
}

router.post("/api/ai-audit", async (req: Request, res: Response) => {
  const claims = getClaims(req);
  if (!claims) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const input = aiAuditDb.buildAuditInputFromBody(req.body || {});

  if (useDatabase()) {
    const row = await aiAuditDb.createAiAuditLog(claims, input);
    return res.status(201).json({
      data: {
        id: row.id,
        createdAt: row.createdAt.toISOString(),
      },
    });
  }

  const row = appendInMemoryAiAudit({
    userId: claims.sub,
    userEmail: claims.email,
    role: claims.role,
    hospitalId: claims.hospitalId ?? null,
    patientId: input.patientId ?? null,
    action: input.action,
    model: input.model,
    mode: input.mode,
    status: input.status,
    promptPreview: input.promptPreview ?? null,
    errorMessage: input.errorMessage ?? null,
    contextSources: input.contextSources?.length ? JSON.stringify(input.contextSources) : null,
  });

  res.status(201).json({ data: { id: row.id, createdAt: row.createdAt } });
});

router.get("/api/ai-audit", async (req: Request, res: Response) => {
  const scope = getScope(req);
  if (!canViewAiAudit(scope.role)) {
    return res.status(403).json({ error: "Forbidden." });
  }

  if (useDatabase()) {
    const rows = await aiAuditDb.listAiAuditLogs(scope);
    return res.json({ data: rows });
  }

  const rows = listInMemoryAiAudit({ role: scope.role, hospitalId: scope.hospitalId });
  res.json({ data: rows });
});

export default router;
