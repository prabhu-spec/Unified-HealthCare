import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import DataTable from '@/components/ui/DataTable';
import { useApiData } from '@/lib/useApiData';

export default function HospitalPharmacyPage() {
  const { user } = useAuth();
  const { rows: raw, loading, error } = useApiData('/api/pharmacy-stock', user, {
    enabled: !!user && getPermissions(user.role).canManageHospitalPharmacy,
  });

  if (!user) return null;
  if (!getPermissions(user.role).canManageHospitalPharmacy) {
    return <AccessDenied message="Access denied." />;
  }

  const rows = raw.map((i) => ({ id: i.id, item: i.name, quantity: i.quantity, status: i.status }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Hospital Pharmacy</h1>
      <p className="text-gray-600 mb-6">Pharmacy stock for your facility (API-backed).</p>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && <p className="text-gray-600 mb-4">Loading...</p>}
      <DataTable columns={[{ key: 'item', label: 'Item' }, { key: 'quantity', label: 'Qty' }, { key: 'status', label: 'Status' }]} rows={rows} statusKey="status" />
    </div>
  );
}
