export interface AiAuditEntry {
  id: string;
  createdAt: string;
  userId: string;
  userEmail: string;
  role: string;
  hospitalId?: string | null;
  patientId?: string | null;
  action: string;
  model: string;
  mode: string;
  status: string;
  promptPreview?: string | null;
  errorMessage?: string | null;
  contextSources?: string | null;
}

const logs: AiAuditEntry[] = [];
let nextId = 1;

export function appendInMemoryAiAudit(entry: Omit<AiAuditEntry, "id" | "createdAt">): AiAuditEntry {
  const row: AiAuditEntry = {
    ...entry,
    id: `ai-audit-${nextId++}`,
    createdAt: new Date().toISOString(),
  };
  logs.unshift(row);
  if (logs.length > 500) logs.pop();
  return row;
}

export function listInMemoryAiAudit(filters: { role?: string | null; hospitalId?: string | null }) {
  let list = [...logs];
  if (filters.role === "hospital_admin" && filters.hospitalId) {
    list = list.filter((l) => l.hospitalId === filters.hospitalId);
  }
  return list.slice(0, 200);
}
