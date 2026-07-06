import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import DataTable from '@/components/ui/DataTable';
import { getPatientName } from '@/lib/utils';
import { useApiData } from '@/lib/useApiData';
import { Link } from 'react-router-dom';

export default function HospitalPatientsPage() {
  const { user } = useAuth();
  const { rows: patients, loading, error } = useApiData('/api/core/patients', user, {
    enabled: !!user && getPermissions(user.role).canManageHospitalPatients,
  });

  if (!user) return null;
  if (!getPermissions(user.role).canManageHospitalPatients) {
    return <AccessDenied message="Access denied." />;
  }

  const rows = patients.map((p) => ({
    id: p.id,
    name: getPatientName(p),
    admitted: p.admittedAt ? new Date(p.admittedAt).toLocaleDateString() : '—',
    status: p.visitStatus || 'outpatient',
    room: p.room || '—',
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Hospital Patients</h1>
      <p className="text-gray-600 mb-6">Patients at your facility (API-backed). <Link to="/patients" className="text-sky-600 hover:underline">Manage in Patient Details →</Link></p>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && <p className="text-gray-600 mb-4">Loading...</p>}
      <DataTable columns={[{ key: 'name', label: 'Patient' }, { key: 'room', label: 'Room' }, { key: 'admitted', label: 'Admitted' }, { key: 'status', label: 'Status' }]} rows={rows} statusKey="status" />
    </div>
  );
}
