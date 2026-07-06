import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import DataTable from '@/components/ui/DataTable';
import { useApiData } from '@/lib/useApiData';

export default function HospitalBillingPage() {
  const { user } = useAuth();
  const { rows, loading, error } = useApiData('/api/hospital/billing', user, {
    enabled: !!user && getPermissions(user.role).canManageBilling,
  });

  if (!user) return null;
  if (!getPermissions(user.role).canManageBilling) {
    return <AccessDenied message="Access denied." />;
  }

  const tableRows = rows.map((r) => ({
    id: r.id,
    patientName: r.patientName,
    amount: `$${r.amount}`,
    status: r.status,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Billing & Dues</h1>
      <p className="text-gray-600 mb-6">Patient billing (API-backed demo).</p>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && <p className="text-gray-600 mb-4">Loading...</p>}
      <DataTable columns={[{ key: 'patientName', label: 'Patient' }, { key: 'amount', label: 'Amount' }, { key: 'status', label: 'Status' }]} rows={tableRows} statusKey="status" />
    </div>
  );
}
