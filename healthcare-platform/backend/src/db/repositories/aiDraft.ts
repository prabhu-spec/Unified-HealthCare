import { prisma } from "../client.js";
import type { Scope } from "./coreCare.js";
import { patientToApi } from "../mappers.js";
import { createAiAuditLog } from "./aiAudit.js";

function scopePatientWhere(scope: Scope, patientId: string) {
  if (scope.role === "patient" && scope.patientId) {
    return scope.patientId === patientId ? { id: patientId } : { id: "__deny__" };
  }
  if (["doctor", "hospital_admin", "nurse"].includes(scope.role || "") && scope.hospitalId) {
    return { id: patientId, hospitalId: scope.hospitalId };
  }
  if (scope.role === "super_admin") return { id: patientId };
  return { id: "__deny__" };
}

export function formatAcceptedDraft(
  draft: string,
  acceptedBy: string,
  source: string,
  append: boolean,
  existingNotes?: string | null
): string {
  const stamp = new Date().toISOString();
  const header = `[AI Assist — ${source} accepted ${stamp} by ${acceptedBy}]`;
  const block = `${header}\n${draft.trim()}`;
  if (append && existingNotes?.trim()) {
    return `${existingNotes.trim()}\n\n${block}`;
  }
  return block;
}

export async function acceptAiDraft(
  patientId: string,
  scope: Scope,
  claims: { sub: string; email: string; role: string; hospitalId?: string },
  body: { draft?: string; source?: string; append?: boolean }
) {
  const draft = typeof body.draft === "string" ? body.draft.trim() : "";
  if (!draft) return { error: "draft is required." as const };

  const source = body.source === "chat" ? "chat" : "summary";
  const append = body.append !== false;

  const existing = await prisma.patient.findFirst({ where: scopePatientWhere(scope, patientId) });
  if (!existing) return null;

  const consultNotes = formatAcceptedDraft(draft, claims.email, source, append, existing.consultNotes);

  const row = await prisma.patient.update({
    where: { id: patientId },
    data: { consultNotes, lastConsultAt: new Date() },
  });

  await createAiAuditLog(
    { sub: claims.sub, email: claims.email, role: claims.role, hospitalId: claims.hospitalId },
    {
      action: "accept_draft",
      patientId,
      model: "n/a",
      mode: "n/a",
      status: "success",
      promptPreview: draft.slice(0, 120),
      contextSources: [source],
    }
  );

  return {
    patient: patientToApi(row),
    consultNotes,
    savedAt: new Date().toISOString(),
    source,
  };
}
