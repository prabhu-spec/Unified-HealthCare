import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import DataTable from '@/components/ui/DataTable';
import { useApiData } from '@/lib/useApiData';

export default function PoliciesPage() {
  const { user } = useAuth();
  const { rows, loading, error } = useApiData('/api/policies', user, {
    enabled: !!user && getPermissions(user.role).canManagePolicies,
  });

  if (!user) return null;
  if (!getPermissions(user.role).canManagePolicies) {
    return <AccessDenied message="Access denied." />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Policy Types</h1>
      <p className="text-gray-600 mb-6">Insurance policy catalog (API-backed).</p>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && <p className="text-gray-600 mb-4">Loading...</p>}
      <DataTable columns={[{ key: 'name', label: 'Policy' }, { key: 'status', label: 'Status' }]} rows={rows} statusKey="status" />
    </div>
  );
}
