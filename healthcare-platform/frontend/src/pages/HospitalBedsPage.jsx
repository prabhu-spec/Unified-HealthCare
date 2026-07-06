import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import DataTable from '@/components/ui/DataTable';
import { useApiData } from '@/lib/useApiData';

export default function HospitalBedsPage() {
  const { user } = useAuth();
  const { rows: raw, loading, error } = useApiData('/api/beds', user, {
    enabled: !!user && getPermissions(user.role).canManageBeds,
  });

  if (!user) return null;
  if (!getPermissions(user.role).canManageBeds) {
    return <AccessDenied message="Access denied." />;
  }

  const rows = raw.map((b) => ({
    id: b.id,
    ward: b.ward,
    total: b.total,
    available: b.available,
    status: b.status,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Beds</h1>
      <p className="text-gray-600 mb-6">Ward capacity (API-backed).</p>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && <p className="text-gray-600 mb-4">Loading...</p>}
      <DataTable columns={[{ key: 'ward', label: 'Ward' }, { key: 'available', label: 'Available' }, { key: 'total', label: 'Total' }, { key: 'status', label: 'Status' }]} rows={rows} statusKey="status" />
    </div>
  );
}
