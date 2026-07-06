import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import DataTable from '@/components/ui/DataTable';
import { useApiData } from '@/lib/useApiData';

export default function InventoryPage() {
  const { user } = useAuth();
  const { rows: raw, loading, error } = useApiData('/api/inventory', user, {
    enabled: !!user && getPermissions(user.role).canManageInventory,
  });
  const rows = raw.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, status: i.status }));

  if (!user) return null;
  if (!getPermissions(user.role).canManageInventory) {
    return <AccessDenied message="Access denied." />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Inventory</h1>
      <p className="text-gray-600 mb-6">Hospital inventory (API-backed demo data).</p>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && <p className="text-gray-600 mb-4">Loading...</p>}
      <DataTable columns={[{ key: 'name', label: 'Item' }, { key: 'quantity', label: 'Qty' }, { key: 'status', label: 'Status' }]} rows={rows} statusKey="status" />
    </div>
  );
}
