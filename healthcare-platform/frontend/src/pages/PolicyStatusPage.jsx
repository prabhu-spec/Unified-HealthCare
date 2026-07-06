import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import DataTable from '@/components/ui/DataTable';
import { useApiData } from '@/lib/useApiData';

export default function PolicyStatusPage() {
  const { user } = useAuth();
  const { rows, loading, error } = useApiData('/api/policy-status', user, {
    enabled: !!user && getPermissions(user.role).canViewPolicyStatus,
  });

  if (!user) return null;
  if (!getPermissions(user.role).canViewPolicyStatus) {
    return <AccessDenied message="Access denied." />;
  }

  const tableRows = rows.map((r) => ({
    id: r.id,
    holder: r.holder,
    name: r.policy,
    status: r.status,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Policy Status</h1>
      <p className="text-gray-600 mb-6">Active policies by holder (API-backed).</p>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && <p className="text-gray-600 mb-4">Loading...</p>}
      <DataTable columns={[{ key: 'holder', label: 'Holder' }, { key: 'name', label: 'Policy' }, { key: 'status', label: 'Status' }]} rows={tableRows} statusKey="status" />
    </div>
  );
}
