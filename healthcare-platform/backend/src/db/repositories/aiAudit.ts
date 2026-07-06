import { prisma } from "../client.js";
import type { JwtPayload } from "../../services/jwt.js";

export interface AiAuditInput {
  action: string;
  patientId?: string | null;
  model: string;
  mode: string;
  status: string;
  promptPreview?: string | null;
  errorMessage?: string | null;
  contextSources?: string[] | null;
}

function truncate(text: string | undefined | null, max = 120): string | null {
  if (!text) return null;
  const t = text.trim();
  if (!t) return null;
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export async function createAiAuditLog(claims: JwtPayload, input: AiAuditInput) {
  const count = await prisma.aiAuditLog.count();
  return prisma.aiAuditLog.create({
    data: {
      id: `ai-audit-${count + 1}-${Date.now()}`,
      userId: claims.sub,
      userEmail: claims.email,
      role: claims.role,
      hospitalId: claims.hospitalId ?? null,
      patientId: input.patientId ?? null,
      action: input.action,
      model: input.model,
      mode: input.mode,
      status: input.status,
      promptPreview: truncate(input.promptPreview),
      errorMessage: input.errorMessage ? truncate(input.errorMessage, 300) : null,
      contextSources: input.contextSources?.length ? JSON.stringify(input.contextSources) : null,
    },
  });
}

export async function listAiAuditLogs(scope: { role: string | null; hospitalId: string | null }) {
  const where =
    scope.role === "hospital_admin" && scope.hospitalId
      ? { hospitalId: scope.hospitalId }
      : scope.role === "super_admin"
        ? {}
        : { id: "__deny__" };

  const rows = await prisma.aiAuditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return rows.map((r: {
    id: string;
    createdAt: Date;
    userId: string;
    userEmail: string;
    role: string;
    hospitalId: string | null;
    patientId: string | null;
    action: string;
    model: string;
    mode: string;
    status: string;
    promptPreview: string | null;
    errorMessage: string | null;
    contextSources: string | null;
  }) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    userId: r.userId,
    userEmail: r.userEmail,
    role: r.role,
    hospitalId: r.hospitalId,
    patientId: r.patientId,
    action: r.action,
    model: r.model,
    mode: r.mode,
    status: r.status,
    promptPreview: r.promptPreview,
    errorMessage: r.errorMessage,
    contextSources: r.contextSources,
  }));
}

export function buildAuditInputFromBody(body: Record<string, unknown>): AiAuditInput {
  return {
    action: String(body.action || "chat"),
    patientId: body.patientId ? String(body.patientId) : null,
    model: String(body.model || "unknown"),
    mode: String(body.mode || "unknown"),
    status: String(body.status || "success"),
    promptPreview: body.promptPreview ? String(body.promptPreview) : null,
    errorMessage: body.errorMessage ? String(body.errorMessage) : null,
    contextSources: Array.isArray(body.contextSources)
      ? body.contextSources.map(String)
      : null,
  };
}
