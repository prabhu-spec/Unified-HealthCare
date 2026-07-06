import axios from "axios";
import type { JwtPayload } from "./jwt.js";

const MAIN_API_URL = (process.env.MAIN_API_URL || "http://127.0.0.1:5000").replace(/\/$/, "");

export interface AuditPayload {
  action: "chat" | "summarize";
  patientId?: string | null;
  model: string;
  mode: string;
  status: "success" | "error";
  promptPreview?: string | null;
  errorMessage?: string | null;
  contextSources?: string[];
}

/** Fire-and-forget audit log to main backend (Phase LLM-4). */
export async function recordAiAudit(
  authHeader: string | undefined,
  payload: AuditPayload
): Promise<void> {
  if (!authHeader) return;
  try {
    await axios.post(`${MAIN_API_URL}/api/ai-audit`, payload, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      timeout: 5000,
      validateStatus: () => true,
    });
  } catch (err) {
    console.warn("[llm-audit] failed to persist:", err instanceof Error ? err.message : err);
  }
}

export function previewText(text: string | undefined, max = 120): string | null {
  if (!text?.trim()) return null;
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export function auditFromAuth(
  auth: JwtPayload | undefined,
  authHeader: string | undefined,
  payload: AuditPayload
) {
  void recordAiAudit(authHeader, payload);
  if (process.env.AI_AUDIT_VERBOSE === "true" && auth) {
    console.log(
      `[llm-audit] ${payload.status} ${payload.action} user=${auth.email} patient=${payload.patientId ?? "—"} model=${payload.model}`
    );
  }
}
