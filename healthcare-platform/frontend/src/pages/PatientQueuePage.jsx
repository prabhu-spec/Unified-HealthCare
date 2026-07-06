import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import DataTable from '@/components/ui/DataTable';
import { coreFetch } from '@/lib/coreApi';

export default function PatientQueuePage() {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadQueue = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await coreFetch('/api/core/queue', user);
      setQueue(response.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [user]);

  if (!user) return null;
  if (!getPermissions(user.role).canManagePatientQueue) {
    return <AccessDenied message="You do not have access to the patient queue." />;
  }

  const handleAccept = async (row) => {
    await coreFetch(`/api/core/queue/${row.id}/accept`, user, { method: 'PATCH' });
    await loadQueue();
  };
  const handleReject = async (row) => {
    await coreFetch(`/api/core/queue/${row.id}/reject`, user, { method: 'PATCH' });
    await loadQueue();
  };

  const columns = [
    { key: 'patientName', label: 'Patient' },
    { key: 'date', label: 'Date' },
    { key: 'time', label: 'Time' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Patient Queue</h1>
      <p className="text-gray-600 mb-6">Accept or reject appointment requests.</p>
      {loading && <p className="text-gray-600 mb-4">Loading queue...</p>}
      <DataTable
        columns={columns}
        rows={queue}
        statusKey="status"
      />
      <div className="mt-4 flex gap-2 flex-wrap">
        {queue.filter((r) => r.status === 'Pending').map((r) => (
          <span key={r.id} className="flex items-center gap-2">
            <span className="text-sm text-gray-700">{r.patientName}</span>
            <button onClick={() => handleAccept(r)} className="text-sm bg-green-600 text-white px-2 py-1 rounded">Accept</button>
            <button onClick={() => handleReject(r)} className="text-sm bg-red-600 text-white px-2 py-1 rounded">Reject</button>
          </span>
        ))}
      </div>
    </div>
  );
}
