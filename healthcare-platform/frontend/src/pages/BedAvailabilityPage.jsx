import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import DataTable from '@/components/ui/DataTable';
import { useApiData } from '@/lib/useApiData';

export default function BedAvailabilityPage() {
  const { user } = useAuth();
  const { rows: raw, loading, error } = useApiData('/api/beds', user, {
    enabled: !!user && getPermissions(user.role).canViewBedAvailability,
  });
  const rows = raw.map((b) => ({
    id: b.id,
    ward: b.ward,
    available: `${b.available} / ${b.total}`,
    status: b.status,
  }));

  if (!user) return null;
  if (!getPermissions(user.role).canViewBedAvailability) {
    return <AccessDenied message="Access denied." />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Bed Availability</h1>
      <p className="text-gray-600 mb-6">Ward beds from API (demo data).</p>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && <p className="text-gray-600 mb-4">Loading...</p>}
      <DataTable columns={[{ key: 'ward', label: 'Ward' }, { key: 'available', label: 'Available' }, { key: 'status', label: 'Status' }]} rows={rows} statusKey="status" />
    </div>
  );
}
