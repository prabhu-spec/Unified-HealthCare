import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import { ROLE_LABELS } from '@/lib/auth';
import AccessDenied from '@/components/AccessDenied';
import { coreFetch } from '@/lib/coreApi';

const STAFF_ROLE_OPTIONS = {
  super_admin: [
    { value: 'hospital_admin', label: 'Hospital Admin' },
    { value: 'doctor', label: 'Doctor' },
    { value: 'nurse', label: 'Nurse' },
    { value: 'patient', label: 'Patient' },
    { value: 'medical_vendor', label: 'Pharmacy Vendor' },
    { value: 'bloodbank_admin', label: 'Blood Bank Admin' },
    { value: 'insurance_provider', label: 'Insurance Agent' },
  ],
  hospital_admin: [
    { value: 'doctor', label: 'Doctor' },
    { value: 'nurse', label: 'Nurse' },
    { value: 'patient', label: 'Patient' },
  ],
};

export default function HospitalStaffPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    staffRole: 'nurse',
    specialization: '',
  });

  const roleOptions = STAFF_ROLE_OPTIONS[user?.role] || [];

  async function load() {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      const res = await coreFetch('/api/staff/users', user);
      setStaff(res.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load staff.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      setError('');
      await coreFetch('/api/staff/users', user, {
        method: 'POST',
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          staffRole: form.staffRole,
          hospitalId: user.hospitalId,
          specialization: form.specialization || undefined,
        }),
      });
      setShowForm(false);
      setForm({ email: '', password: '', firstName: '', lastName: '', staffRole: 'nurse', specialization: '' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user.');
    }
  };

  if (!user) return null;
  if (!getPermissions(user.role).canManageStaff) {
    return <AccessDenied message="Access denied." />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Staff & Users</h1>
          <p className="text-gray-600">Add doctors, nurses, and other users to the system.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700"
        >
          {showForm ? 'Cancel' : '+ Add user'}
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg border border-gray-200 p-6 mb-6 max-w-xl space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">New user account</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
              <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
              <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Temporary password</label>
              <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select value={form.staffRole} onChange={(e) => setForm({ ...form, staffRole: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                {roleOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {(form.staffRole === 'doctor') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="general" />
              </div>
            )}
          </div>
          <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700">
            Create account
          </button>
        </form>
      )}

      {loading && <p className="text-gray-600">Loading staff...</p>}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-700">Name</th>
              <th className="px-4 py-3 font-medium text-gray-700">Email</th>
              <th className="px-4 py-3 font-medium text-gray-700">Role</th>
              <th className="px-4 py-3 font-medium text-gray-700">Hospital</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((row) => (
              <tr key={row.id || row.email} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 text-gray-900">{row.firstName} {row.lastName}</td>
                <td className="px-4 py-3 text-gray-600">{row.email}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 text-xs font-medium">
                    {ROLE_LABELS[row.role] || row.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{row.hospitalId || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && staff.length === 0 && (
          <p className="text-gray-500 text-center py-8">No staff accounts yet. Add your first user above.</p>
        )}
      </div>
    </div>
  );
}
