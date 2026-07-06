import { useEffect, useState } from 'react';
import { useAuth, normalizeRole } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import { getPatientName } from '@/lib/utils';
import { coreFetch } from '@/lib/coreApi';

const STATUS_OPTIONS = ['Active', 'Completed', 'Cancelled'];

export default function PrescribePage() {
  const { user } = useAuth();
  const role = user ? normalizeRole(user.role) : null;
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [patientId, setPatientId] = useState('');
  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ medication: '', dosage: '', status: 'Active' });

  async function load() {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      const [patRes, rxRes] = await Promise.all([
        coreFetch('/api/core/patients', user),
        coreFetch('/api/prescriptions', user),
      ]);
      setPatients(patRes.data || []);
      setPrescriptions(rxRes.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !patientId || !medication || !dosage) return;
    const patient = patients.find((p) => p.id === patientId);
    try {
      setError('');
      await coreFetch('/api/prescriptions', user, {
        method: 'POST',
        body: JSON.stringify({
          patientId,
          patientName: patient ? getPatientName(patient) : 'Patient',
          medication,
          dosage,
          prescribedBy: `${user.firstName} ${user.lastName}`,
          prescribedByEmail: user.email,
        }),
      });
      setPatientId('');
      setMedication('');
      setDosage('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prescription.');
    }
  };

  const startEdit = (rx) => {
    setEditingId(rx.id);
    setEditForm({ medication: rx.medication, dosage: rx.dosage, status: rx.status });
  };

  const saveEdit = async (id) => {
    if (!user) return;
    try {
      await coreFetch(`/api/prescriptions/${id}`, user, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
      });
      setEditingId(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update prescription.');
    }
  };

  const removeRx = async (id) => {
    if (!user || !window.confirm('Delete this prescription?')) return;
    try {
      await coreFetch(`/api/prescriptions/${id}`, user, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete prescription.');
    }
  };

  if (!user) return null;
  if (!getPermissions(user.role).canPrescribe) {
    return <AccessDenied message="Only doctors can prescribe medications." />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Prescribe Medication</h1>
      <p className="text-gray-600 mb-6">Issue, update, and manage patient prescriptions.</p>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="max-w-md bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">New prescription</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
            <select
              required
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{getPatientName(p)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medication</label>
            <input
              required
              type="text"
              value={medication}
              onChange={(e) => setMedication(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g. Amoxicillin 500mg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
            <input
              required
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="e.g. 1 tablet twice daily"
            />
          </div>
          <button type="submit" className="w-full bg-sky-600 text-white py-2 rounded-lg font-medium hover:bg-sky-700">
            Issue prescription
          </button>
        </form>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-3">Your prescriptions</h2>
      {loading && <p className="text-gray-600">Loading...</p>}
      <div className="grid gap-3">
        {prescriptions.map((rx) => (
          <div key={rx.id} className="bg-white rounded-lg border border-gray-200 p-4">
            {editingId === rx.id ? (
              <div className="space-y-3">
                <input
                  value={editForm.medication}
                  onChange={(e) => setEditForm({ ...editForm, medication: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  value={editForm.dosage}
                  onChange={(e) => setEditForm({ ...editForm, dosage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="flex gap-2">
                  <button type="button" onClick={() => saveEdit(rx.id)} className="px-3 py-1 bg-sky-600 text-white rounded-lg text-sm">Save</button>
                  <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1 border border-gray-300 rounded-lg text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{rx.medication}</p>
                  <p className="text-sm text-gray-600">{rx.patientName} · {rx.dosage}</p>
                  <p className="text-xs text-gray-500 mt-1">{rx.status} · {new Date(rx.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => startEdit(rx)} className="text-sm text-sky-600 hover:underline">Edit</button>
                  {(role === 'doctor' || role === 'super_admin') && (
                    <button type="button" onClick={() => removeRx(rx.id)} className="text-sm text-red-600 hover:underline">Delete</button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {!loading && prescriptions.length === 0 && (
        <p className="text-gray-500 text-center py-6">No prescriptions yet.</p>
      )}
    </div>
  );
}
