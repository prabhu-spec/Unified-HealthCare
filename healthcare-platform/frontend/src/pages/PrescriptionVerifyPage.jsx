import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import DataTable from '@/components/ui/DataTable';
import { useApiData } from '@/lib/useApiData';
import { coreFetch } from '@/lib/coreApi';

export default function PrescriptionVerifyPage() {
  const { user } = useAuth();
  const { rows, loading, error, reload } = useApiData('/api/prescription-verifications', user, {
    enabled: !!user && getPermissions(user.role).canPrescriptionVerification,
  });

  if (!user) return null;
  if (!getPermissions(user.role).canPrescriptionVerification) {
    return <AccessDenied message="Access denied." />;
  }

  const tableRows = rows.map((r) => ({
    id: r.id,
    patientName: r.patientName,
    prescription: r.prescription,
    status: r.status,
  }));

  const verify = async (id) => {
    await coreFetch(`/api/prescription-verifications/${id}/verify`, user, { method: 'PATCH' });
    reload();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Prescription Verification</h1>
      <p className="text-gray-600 mb-6">Vendor verification queue (API-backed).</p>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && <p className="text-gray-600 mb-4">Loading...</p>}
      <DataTable columns={[{ key: 'patientName', label: 'Patient' }, { key: 'prescription', label: 'Prescription' }, { key: 'status', label: 'Status' }]} rows={tableRows} statusKey="status" />
      <div className="mt-4 flex gap-2 flex-wrap">
        {rows.filter((r) => r.status === 'Pending').map((r) => (
          <button key={r.id} type="button" onClick={() => verify(r.id)} className="text-sm px-3 py-1 bg-sky-600 text-white rounded-lg">
            Verify {r.patientName}
          </button>
        ))}
      </div>
    </div>
  );
}
