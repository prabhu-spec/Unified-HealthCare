import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import { useApiData } from '@/lib/useApiData';

export default function BloodInventoryPage() {
  const { user } = useAuth();
  const { rows, loading, error } = useApiData('/api/blood/inventory', user, {
    enabled: !!user && getPermissions(user.role).canManageBloodInventory,
  });

  if (!user) return null;
  if (!getPermissions(user.role).canManageBloodInventory) {
    return <AccessDenied message="You do not have access to blood inventory." />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Blood Inventory</h1>
      <p className="text-gray-600 mb-6">Units by blood type (API-backed demo).</p>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && <p className="text-gray-600 mb-4">Loading...</p>}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {rows.map((b) => (
          <div key={b.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <p className="font-semibold text-gray-900 text-lg">{b.type}</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{b.units} units</p>
            <p className="text-xs text-gray-500 mt-1">{b.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
