/**
 * Phase LLM-5 — Accept AI draft into patient consult notes (human-in-the-loop).
 */
import express from "express";
import { useDatabase } from "../db/client.js";
import { getScope } from "../db/requestScope.js";
import { extractBearerToken, verifyAccessToken } from "../services/jwt.js";
import * as aiDraftDb from "../db/repositories/aiDraft.js";
import { getInMemoryPatient } from "../store/inMemoryClinical.js";
import { appendInMemoryAiAudit } from "../store/inMemoryAiAudit.js";

const router = express.Router();
type Request = express.Request;
type Response = express.Response;

function canAcceptAiDraft(role: string | null): boolean {
  return ["super_admin", "hospital_admin", "doctor", "nurse"].includes(role || "");
}

router.post("/api/core/patients/:id/accept-ai-draft", async (req: Request, res: Response) => {
  const role = getScope(req).role;
  if (!canAcceptAiDraft(role)) {
    return res.status(403).json({ error: "Only clinical staff can accept AI drafts into patient notes." });
  }

  const token = extractBearerToken(req.headers.authorization);
  const claims = token ? verifyAccessToken(token) : null;
  if (!claims) {
    return res.status(401).json({ error: "Authentication required." });
  }

  const patientId = req.params.id;
  const body = req.body || {};

  if (useDatabase()) {
    const result = await aiDraftDb.acceptAiDraft(patientId, getScope(req), claims, body);
    if (!result) return res.status(404).json({ error: "Patient not found." });
    if ("error" in result) return res.status(400).json(result);
    return res.json({ data: result });
  }

  const draft = typeof body.draft === "string" ? body.draft.trim() : "";
  if (!draft) return res.status(400).json({ error: "draft is required." });

  const patient = getInMemoryPatient(req, patientId) as Record<string, unknown> | undefined;
  if (!patient) return res.status(404).json({ error: "Patient not found." });

  const source = body.source === "chat" ? "chat" : "summary";
  const append = body.append !== false;
  const existingNotes = patient.consultNotes as string | undefined;

  const consultNotes = aiDraftDb.formatAcceptedDraft(draft, claims.email, source, append, existingNotes);
  patient.consultNotes = consultNotes;
  patient.lastConsultAt = new Date().toISOString();

  appendInMemoryAiAudit({
    userId: claims.sub,
    userEmail: claims.email,
    role: claims.role,
    hospitalId: claims.hospitalId ?? null,
    patientId,
    action: "accept_draft",
    model: "n/a",
    mode: "n/a",
    status: "success",
    promptPreview: draft.slice(0, 120),
    errorMessage: null,
    contextSources: JSON.stringify([source]),
  });

  res.json({
    data: {
      patient,
      consultNotes,
      savedAt: new Date().toISOString(),
      source,
    },
  });
});

export default router;
