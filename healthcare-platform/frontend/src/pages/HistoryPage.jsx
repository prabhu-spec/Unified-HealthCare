import { useEffect, useState } from 'react';
import { useAuth, normalizeRole } from '@/lib/auth';
import { canAccessPatientHistory } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import { getPatientName } from '@/lib/utils';
import { coreFetch } from '@/lib/coreApi';

export default function HistoryPage() {
  const { user } = useAuth();
  const role = user ? normalizeRole(user.role) : null;
  const [selectedPatient, setSelectedPatient] = useState(role === 'patient' ? (user?.patientId ?? '') : '');
  const [history, setHistory] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const [historyRes, patientsRes] = await Promise.all([
          coreFetch('/api/core/history', user),
          coreFetch('/api/core/patients', user),
        ]);
        if (active) {
          setHistory(historyRes.data || []);
          setPatients(patientsRes.data || []);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [user]);

  if (!user) return null;
  if (!canAccessPatientHistory(user.role)) {
    return <AccessDenied message="Your role cannot view patient history." />;
  }

  let historyList = selectedPatient ? history.filter((h) => h.patientId === selectedPatient) : history;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Patient History</h1>
      <p className="text-gray-600 mb-6">
        View visit and encounter history.
        {role === 'insurance_provider' && ' (Claims-related history only.)'}
      </p>

      {role !== 'patient' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select patient</label>
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">All patients</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>{getPatientName(p)}</option>
            ))}
          </select>
        </div>
      )}
      {loading && <p className="text-gray-600 mb-4">Loading history...</p>}

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {role !== 'patient' && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Summary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {historyList.map((h) => (
              <tr key={h.id}>
                {role !== 'patient' && (
                  <td className="px-4 py-3 text-sm text-gray-900">{h.patientName}</td>
                )}
                <td className="px-4 py-3 text-sm text-gray-900">{h.date}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{h.type}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{h.provider}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{h.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {historyList.length === 0 && (
        <p className="text-gray-500 text-center py-8">No history found.</p>
      )}
    </div>
  );
}
