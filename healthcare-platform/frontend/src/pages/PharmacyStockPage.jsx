import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import DataTable from '@/components/ui/DataTable';
import { useApiData } from '@/lib/useApiData';

export default function PharmacyStockPage() {
  const { user } = useAuth();
  const { rows: raw, loading, error } = useApiData('/api/pharmacy-stock', user, {
    enabled: !!user && getPermissions(user.role).canViewPharmacyStock,
  });
  const rows = raw.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, status: i.status }));

  if (!user) return null;
  if (!getPermissions(user.role).canViewPharmacyStock) {
    return <AccessDenied message="You cannot view pharmacy stock." />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Pharmacy Stock</h1>
      <p className="text-gray-600 mb-6">Stock from hospital API (in-memory demo data).</p>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && <p className="text-gray-600 mb-4">Loading...</p>}
      <DataTable columns={[{ key: 'name', label: 'Medicine' }, { key: 'quantity', label: 'Qty' }, { key: 'status', label: 'Status' }]} rows={rows} statusKey="status" />
    </div>
  );
}
