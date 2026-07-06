import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import DataTable from '@/components/ui/DataTable';
import { useApiData } from '@/lib/useApiData';

export default function SystemLogsPage() {
  const { user } = useAuth();
  const { rows, loading, error } = useApiData('/api/logs', user, {
    enabled: !!user && getPermissions(user.role).canViewSystemLogs,
  });

  if (!user) return null;
  if (!getPermissions(user.role).canViewSystemLogs) {
    return <AccessDenied message="Access denied." />;
  }

  const tableRows = rows.map((r) => ({
    id: r.id,
    timestamp: r.timestamp,
    userId: r.userId,
    action: r.action,
    resource: r.resource,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">System Logs</h1>
      <p className="text-gray-600 mb-6">Audit trail (API-backed demo).</p>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && <p className="text-gray-600 mb-4">Loading...</p>}
      <DataTable columns={[{ key: 'timestamp', label: 'Time' }, { key: 'userId', label: 'User' }, { key: 'action', label: 'Action' }, { key: 'resource', label: 'Resource' }]} rows={tableRows} />
    </div>
  );
}
