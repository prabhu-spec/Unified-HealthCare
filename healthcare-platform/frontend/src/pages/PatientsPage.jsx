import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, normalizeRole } from '@/lib/auth';
import { canAccessPatientDetails, getPatientDetailLevel, getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import { getPatientName, getContactInfo, getAddress } from '@/lib/utils';
import { coreFetch } from '@/lib/coreApi';

const VISIT_BADGE = {
  admitted: 'bg-green-100 text-green-800',
  discharged: 'bg-gray-100 text-gray-600',
  outpatient: 'bg-sky-100 text-sky-800',
};

export default function PatientsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', gender: 'unknown', birthDate: '1990-01-01', phone: '', email: '', room: '',
  });
  const role = user ? normalizeRole(user.role) : null;
  const canManage = user && getPermissions(user.role).canManageHospitalPatients;

  async function load() {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      const response = await coreFetch('/api/core/patients', user);
      setPatients(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      setError('');
      await coreFetch('/api/core/patients', user, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setShowAdd(false);
      setForm({ firstName: '', lastName: '', gender: 'unknown', birthDate: '1990-01-01', phone: '', email: '', room: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add patient.');
    }
  };

  if (!user) return null;
  if (!canAccessPatientDetails(user.role)) {
    return <AccessDenied message="Your role cannot view patient details." />;
  }

  const level = getPatientDetailLevel(user.role);
  const filtered = patients.filter((p) => getPatientName(p).toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Patient Details</h1>
          <p className="text-gray-600">
            {level === 'full' && 'View demographics, visit status, and manage admissions.'}
            {level === 'limited_claims' && 'View claim-related patient information only.'}
            {level === 'limited_contact' && 'View contact and delivery information only.'}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700"
          >
            {showAdd ? 'Cancel' : '+ Add patient'}
          </button>
        )}
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {showAdd && canManage && (
        <form onSubmit={handleAdd} className="bg-white rounded-lg border border-gray-200 p-6 mb-6 max-w-2xl space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Register new patient</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <input required placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" />
            <input required placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" />
            <input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" />
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="unknown">Unknown</option>
            </select>
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" />
            <input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" />
            <input placeholder="Room (admit immediately)" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg sm:col-span-2" />
          </div>
          <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700">Save patient</button>
        </form>
      )}

      {loading && <p className="text-gray-600 mb-4">Loading patients...</p>}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500"
        />
      </div>
      <div className="grid gap-4">
        {filtered.map((patient) => (
          <div key={patient.id} className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <div className="flex justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{getPatientName(patient)}</h3>
                  {patient.visitStatus && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${VISIT_BADGE[patient.visitStatus] || VISIT_BADGE.outpatient}`}>
                      {patient.visitStatus}
                      {patient.room && ` · Room ${patient.room}`}
                    </span>
                  )}
                </div>
                {(level === 'full' || level === 'limited_claims') && (
                  <p className="text-sm text-gray-600 mt-1">DOB: {patient.birthDate || 'N/A'}</p>
                )}
                {(level === 'full' || level === 'limited_contact') && (
                  <>
                    <p className="text-sm text-gray-600">
                      {getContactInfo(patient.telecom || []).phone && `Phone: ${getContactInfo(patient.telecom || []).phone}`}
                    </p>
                    <p className="text-sm text-gray-600">{getAddress(patient.address || [])}</p>
                  </>
                )}
              </div>
              {level === 'full' && (
                <Link to={`/patients/${patient.id}`} className="text-sky-600 hover:underline text-sm font-medium whitespace-nowrap">
                  Manage →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && !loading && (
        <p className="text-gray-500 text-center py-8">No patients match your search.</p>
      )}
    </div>
  );
}
