import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import AccessDenied from '@/components/AccessDenied';
import { coreFetch } from '@/lib/coreApi';

export default function HospitalApplicationPage() {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function load() {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      const [hRes, aRes] = await Promise.all([
        coreFetch('/api/core/hospitals', user),
        coreFetch('/api/hospital/applications', user),
      ]);
      setHospitals(hRes.data || []);
      setApplications(aRes.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user]);

  if (!user) return null;
  if (user.role !== 'doctor') {
    return <AccessDenied message="Only doctors can apply to hospitals." />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHospital) return;
    const org = hospitals.find((h) => h.id === selectedHospital);
    try {
      setError('');
      await coreFetch('/api/hospital/applications', user, {
        method: 'POST',
        body: JSON.stringify({
          hospitalId: selectedHospital,
          hospitalName: org?.name || selectedHospital,
          applicantName: `${user.firstName} ${user.lastName}`.trim(),
          applicantEmail: user.email,
        }),
      });
      setSubmitted(true);
      setSelectedHospital('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application.');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Hospital Application</h1>
      <p className="text-gray-600 mb-6">Apply to work at a registered hospital (saved on server until restart).</p>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading && <p className="text-gray-600 mb-4">Loading...</p>}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="max-w-md bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">New application</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
              <select
                required
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select hospital</option>
                {hospitals.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full bg-sky-600 text-white py-2 rounded-lg font-medium hover:bg-sky-700">
              Submit application
            </button>
          </form>
          {submitted && <p className="mt-4 text-green-600 text-sm">Application submitted. Pending approval.</p>}
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">My applications</h2>
          {applications.length === 0 ? (
            <p className="text-sm text-gray-500">No applications yet.</p>
          ) : (
            <ul className="space-y-3">
              {applications.map((a) => (
                <li key={a.id} className="border-b border-gray-100 pb-2 text-sm">
                  <p className="font-medium text-gray-900">{a.hospitalName}</p>
                  <p className="text-gray-600">{a.status}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
