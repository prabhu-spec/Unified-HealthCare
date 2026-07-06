import { useAuth } from '@/lib/auth';
import { canViewAiAuditLogs } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import DataTable from '@/components/ui/DataTable';
import { useApiData } from '@/lib/useApiData';

export default function AiAuditLogsPage() {
  const { user } = useAuth();
  const { rows, loading, error, reload } = useApiData('/api/ai-audit', user, {
    enabled: !!user && canViewAiAuditLogs(user.role),
  });

  if (!user) return null;
  if (!canViewAiAuditLogs(user.role)) {
    return <AccessDenied message="AI audit logs are for hospital and super admins only." />;
  }

  const tableRows = rows.map((r) => ({
    id: r.id,
    time: new Date(r.createdAt).toLocaleString(),
    user: r.userEmail,
    role: r.role,
    action: r.action,
    patient: r.patientId || '—',
    model: `${r.mode}/${r.model}`,
    status: r.status,
    preview: r.promptPreview || '—',
  }));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Audit Log</h1>
          <p className="text-gray-600 mt-1">
            Phase LLM-4 — who used AI Assist, for which patient, when, and with which model.
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          className="px-4 py-2 text-sm font-medium text-sky-700 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100"
        >
          Refresh
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && <p className="text-gray-600 mb-4">Loading audit entries…</p>}

      {!loading && tableRows.length === 0 && (
        <p className="text-gray-500 text-sm">No AI requests logged yet. Use AI Assist or AI Summary to generate entries.</p>
      )}

      {tableRows.length > 0 && (
        <DataTable
          columns={[
            { key: 'time', label: 'Time' },
            { key: 'user', label: 'User' },
            { key: 'action', label: 'Action' },
            { key: 'patient', label: 'Patient' },
            { key: 'model', label: 'Model' },
            { key: 'status', label: 'Status' },
            { key: 'preview', label: 'Prompt preview' },
          ]}
          rows={tableRows}
          statusKey="status"
        />
      )}
    </div>
  );
}
