import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { canAccessMedicalRecords } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import { coreFetch } from '@/lib/coreApi';

export default function RecordsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const response = await coreFetch('/api/core/records', user);
        if (active) setRecords(response.data || []);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [user]);

  if (!user) return null;
  if (!canAccessMedicalRecords(user.role)) {
    return <AccessDenied message="Your role cannot view medical records." />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
        <p className="text-gray-600 mt-1">Secure access to patient observations</p>
      </div>
      <div className="bg-white rounded-lg p-6 shadow">
        {loading && <p className="text-gray-600">Loading records...</p>}
        {!loading && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Record</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.patientName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.date}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{record.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{record.value}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{record.provider}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {records.length === 0 && <p className="text-gray-500 text-center py-8">No records found.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
