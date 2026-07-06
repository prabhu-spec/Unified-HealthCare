import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import DataTable from '@/components/ui/DataTable';
import { useApiData } from '@/lib/useApiData';

export default function HospitalDoctorsPage() {
  const { user } = useAuth();
  const { rows, loading, error } = useApiData('/api/hospital/doctors', user, {
    enabled: !!user && getPermissions(user.role).canManageHospitalDoctors,
  });

  if (!user) return null;
  if (!getPermissions(user.role).canManageHospitalDoctors) {
    return <AccessDenied message="Access denied." />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Hospital Doctors</h1>
      <p className="text-gray-600 mb-6">Clinical staff roster (API-backed demo data).</p>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && <p className="text-gray-600 mb-4">Loading...</p>}
      <DataTable columns={[{ key: 'name', label: 'Doctor' }, { key: 'specialization', label: 'Specialization' }, { key: 'status', label: 'Status' }]} rows={rows} statusKey="status" />
    </div>
  );
}
