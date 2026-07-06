import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import { BLOOD_TYPES } from '@/lib/constants';
import { useApiData } from '@/lib/useApiData';
import { coreFetch } from '@/lib/coreApi';

export default function RequestBloodPage() {
  const { user } = useAuth();
  const [bloodType, setBloodType] = useState('');
  const [units, setUnits] = useState('');
  const [urgency, setUrgency] = useState('Routine');
  const [error, setError] = useState('');
  const { rows: myRequests, reload } = useApiData('/api/blood/requests', user, {
    enabled: !!user && getPermissions(user?.role).canRequestBlood,
  });

  if (!user) return null;
  if (!getPermissions(user.role).canRequestBlood) {
    return <AccessDenied message="You cannot request blood." />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!bloodType || !units) return;
    try {
      await coreFetch('/api/blood/requests', user, {
        method: 'POST',
        body: JSON.stringify({
          bloodType,
          units: Number(units),
          hospitalId: user.hospitalId || 'org-1',
          requestedBy: `${user.firstName} ${user.lastName}`.trim() || user.email,
          urgency,
        }),
      });
      setBloodType('');
      setUnits('');
      reload();
    } catch (err) {
      setError(err.message || 'Request failed.');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Request Blood</h1>
      <p className="text-gray-600 mb-6">Submit requests to the blood bank (API-backed demo).</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4">New blood request</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood type *</label>
              <select value={bloodType} onChange={(e) => setBloodType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                <option value="">Select blood type</option>
                {BLOOD_TYPES.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Units *</label>
              <input type="number" min="1" value={units} onChange={(e) => setUnits(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
              <select value={urgency} onChange={(e) => setUrgency(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                <option value="Routine">Routine</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700">Submit request</button>
          </form>
        </div>
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4">My requests</h2>
          {myRequests.length === 0 ? (
            <p className="text-sm text-gray-500">No requests yet.</p>
          ) : (
            <ul className="space-y-2">
              {myRequests.map((r) => (
                <li key={r.id} className="text-sm text-gray-700 border-b border-gray-100 pb-2">
                  {r.bloodType} · {r.units} units · {r.status}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
