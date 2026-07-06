import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import DataTable from '@/components/ui/DataTable';
import { useApiData } from '@/lib/useApiData';

export default function ApplicantsPage() {
  const { user } = useAuth();
  const { rows, loading, error } = useApiData('/api/applicants', user, {
    enabled: !!user && getPermissions(user.role).canViewApplicants,
  });

  if (!user) return null;
  if (!getPermissions(user.role).canViewApplicants) {
    return <AccessDenied message="Access denied." />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Applicants</h1>
      <p className="text-gray-600 mb-6">Policy applicants (API-backed).</p>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && <p className="text-gray-600 mb-4">Loading...</p>}
      <DataTable columns={[{ key: 'name', label: 'Applicant' }, { key: 'policyId', label: 'Policy' }, { key: 'status', label: 'Status' }]} rows={rows} statusKey="status" />
    </div>
  );
}
