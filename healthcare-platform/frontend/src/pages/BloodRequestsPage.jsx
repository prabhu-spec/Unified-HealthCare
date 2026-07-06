import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import DataTable from '@/components/ui/DataTable';
import { useApiData } from '@/lib/useApiData';
import { coreFetch } from '@/lib/coreApi';

export default function BloodRequestsPage() {
  const { user } = useAuth();
  const { rows, loading, error, reload } = useApiData('/api/blood/requests', user, {
    enabled: !!user && getPermissions(user.role).canViewBloodRequests,
  });

  if (!user) return null;
  if (!getPermissions(user.role).canViewBloodRequests) {
    return <AccessDenied message="Access denied." />;
  }

  const tableRows = rows.map((r) => ({
    id: r.id,
    bloodType: r.bloodType,
    units: r.units,
    requestedBy: r.requestedBy,
    status: r.status,
  }));

  const act = async (id, action) => {
    await coreFetch(`/api/blood/requests/${id}/${action}`, user, { method: 'PATCH' });
    reload();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Blood Requests</h1>
      <p className="text-gray-600 mb-6">Incoming requests (API-backed).</p>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && <p className="text-gray-600 mb-4">Loading...</p>}
      <DataTable columns={[{ key: 'bloodType', label: 'Type' }, { key: 'units', label: 'Units' }, { key: 'requestedBy', label: 'From' }, { key: 'status', label: 'Status' }]} rows={tableRows} statusKey="status" />
      <div className="mt-4 flex gap-2 flex-wrap">
        {rows.filter((r) => r.status === 'Pending').map((r) => (
          <span key={r.id} className="flex gap-2 items-center text-sm">
            {r.bloodType} ({r.units})
            <button type="button" onClick={() => act(r.id, 'approve')} className="px-2 py-1 bg-green-600 text-white rounded text-xs">Approve</button>
            <button type="button" onClick={() => act(r.id, 'reject')} className="px-2 py-1 bg-red-600 text-white rounded text-xs">Reject</button>
          </span>
        ))}
      </div>
    </div>
  );
}
