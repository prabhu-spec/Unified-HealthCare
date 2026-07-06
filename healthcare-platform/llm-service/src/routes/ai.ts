import { Router, type Request, type Response } from "express";
import {
  assertPatientAccess,
  canUseClinicalSummary,
  fetchPatientContext,
} from "../services/llm/context.js";
import { generateChat, generateSummary, getLlmStatus } from "../services/llm/provider.js";
import { auditFromAuth, previewText } from "../services/audit.js";

const router = Router();

function aiDisabled(_req: Request, res: Response): boolean {
  if (process.env.AI_ENABLED === "false") {
    res.status(503).json({ error: "AI Assist is disabled on this server." });
    return true;
  }
  return false;
}

router.get("/api/ai/status", (_req: Request, res: Response) => {
  res.json({ data: getLlmStatus() });
});

router.post("/api/ai/summarize-patient/:patientId", async (req: Request, res: Response) => {
  if (aiDisabled(req, res)) return;

  const role = req.auth?.role;
  if (!canUseClinicalSummary(role)) {
    return res.status(403).json({ error: "Your role cannot request AI patient summaries." });
  }

  const patientId = req.params.patientId;
  const authHeader = req.headers.authorization;

  try {
    assertPatientAccess(req.auth, patientId);
    const context = await fetchPatientContext(patientId, authHeader);
    const result = await generateSummary(context);
    const ctxMeta = (context as { meta?: { sources?: string[] } })?.meta;

    auditFromAuth(req.auth, authHeader, {
      action: "summarize",
      patientId,
      model: result.model,
      mode: result.mode,
      status: "success",
      promptPreview: `Summarize patient ${patientId}`,
      contextSources: ctxMeta?.sources ?? [],
    });

    res.json({
      data: {
        patientId,
        summary: result.text,
        mode: result.mode,
        model: result.model,
        disclaimer: result.disclaimer,
        generatedAt: new Date().toISOString(),
        contextSources: ctxMeta?.sources ?? [],
      },
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    auditFromAuth(req.auth, authHeader, {
      action: "summarize",
      patientId,
      model: "unknown",
      mode: getLlmStatus().mode,
      status: "error",
      promptPreview: `Summarize patient ${patientId}`,
      errorMessage: e.message,
    });
    res.status(e.status || 500).json({ error: e.message || "Summary failed." });
  }
});

router.post("/api/ai/chat", async (req: Request, res: Response) => {
  if (aiDisabled(req, res)) return;

  const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!message) {
    return res.status(400).json({ error: "message is required." });
  }

  const patientId = typeof req.body?.patientId === "string" ? req.body.patientId.trim() : "";
  const role = req.auth?.role;
  const authHeader = req.headers.authorization;

  if (!canUseClinicalSummary(role)) {
    return res.status(403).json({ error: "Your role cannot use AI Assist." });
  }

  try {
    let context: unknown | null = null;
    if (patientId) {
      assertPatientAccess(req.auth, patientId);
      context = await fetchPatientContext(patientId, authHeader);
    }

    const result = await generateChat(message, context, role);
    const ctxMeta = (context as { meta?: { sources?: string[] } } | null)?.meta;

    auditFromAuth(req.auth, authHeader, {
      action: "chat",
      patientId: patientId || null,
      model: result.model,
      mode: result.mode,
      status: "success",
      promptPreview: previewText(message),
      contextSources: ctxMeta?.sources ?? (patientId ? ["patient"] : []),
    });

    res.json({
      data: {
        reply: result.text,
        patientId: patientId || null,
        mode: result.mode,
        model: result.model,
        disclaimer: result.disclaimer,
        generatedAt: new Date().toISOString(),
        contextSources: ctxMeta?.sources ?? (patientId ? ["patient"] : []),
      },
    });
  } catch (err) {
    const e = err as Error & { status?: number };
    auditFromAuth(req.auth, authHeader, {
      action: "chat",
      patientId: patientId || null,
      model: "unknown",
      mode: getLlmStatus().mode,
      status: "error",
      promptPreview: previewText(message),
      errorMessage: e.message,
    });
    res.status(e.status || 500).json({ error: e.message || "Chat failed." });
  }
});

export default router;
