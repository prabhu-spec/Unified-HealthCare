import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import { coreFetch } from '@/lib/coreApi';

export default function PrescriptionOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const data = await coreFetch('/api/prescriptions', user);
      setOrders(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err.message || 'Failed to load prescription orders.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getPermissions(user?.role).canViewPrescriptionOrders) fetchOrders();
    else setLoading(false);
  }, [user, fetchOrders]);

  if (!user) return null;
  if (!getPermissions(user.role).canViewPrescriptionOrders) {
    return <AccessDenied message="You do not have permission to view prescription orders." />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Prescription Orders</h1>
      <p className="text-gray-600 mb-6">
        View medicine orders placed by patients from your prescriptions. Check status and any rejection reason (e.g. medicine unavailable).
      </p>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">No prescription orders yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Patient</th>
                <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Medication</th>
                <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Dosage</th>
                <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Prescribed by</th>
                <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Rejection reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((o) => (
                <tr key={o.id} className="bg-white">
                  <td className="px-4 py-3 text-sm text-gray-900">{o.patientName}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{o.medication}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{o.dosage}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{o.prescribedBy}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        o.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : o.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{o.rejectionReason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
