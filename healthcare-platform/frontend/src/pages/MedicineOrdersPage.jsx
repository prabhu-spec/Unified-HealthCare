import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import { coreFetch } from '@/lib/coreApi';

export default function MedicineOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectReason, setRejectReason] = useState({});
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    try {
      const data = await coreFetch('/api/medicine-orders', user);
      setOrders(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err.message || 'Failed to load orders.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (getPermissions(user?.role).canManageMedicineOrders) fetchOrders();
    else setLoading(false);
  }, [user, fetchOrders]);

  const handleAccept = async (id) => {
    setActionLoading(id);
    setError('');
    try {
      await coreFetch(`/api/medicine-orders/${id}/accept`, user, { method: 'PATCH' });
      await fetchOrders();
    } catch (err) {
      setError(err.message || 'Failed to accept order.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id) => {
    const reason = rejectReason[id] ?? 'Medicine unavailable';
    setActionLoading(id);
    setError('');
    try {
      await coreFetch(`/api/medicine-orders/${id}/reject`, user, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      });
      await fetchOrders();
      setRejectReason((prev) => ({ ...prev, [id]: undefined }));
    } catch (err) {
      setError(err.message || 'Failed to reject order.');
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) return null;
  if (!getPermissions(user.role).canManageMedicineOrders) {
    return <AccessDenied message="You do not have permission to manage medicine orders." />;
  }

  const pending = orders.filter((o) => o.status === 'pending');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Medicine Orders</h1>
      <p className="text-gray-600 mb-6">
        Accept or reject patient medicine orders. When rejecting, you can state a reason (e.g. medicine unavailable).
      </p>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-gray-500">Loading orders…</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">No medicine orders yet.</p>
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
                <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Actions</th>
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
                    {o.rejectionReason && (
                      <p className="text-xs text-gray-500 mt-1">{o.rejectionReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {o.status === 'pending' && (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          placeholder="Rejection reason (e.g. Medicine unavailable)"
                          value={rejectReason[o.id] ?? ''}
                          onChange={(e) => setRejectReason((prev) => ({ ...prev, [o.id]: e.target.value }))}
                          className="w-48 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                        <button
                          type="button"
                          onClick={() => handleAccept(o.id)}
                          disabled={actionLoading === o.id}
                          className="px-3 py-1.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                          {actionLoading === o.id ? '…' : 'Accept'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(o.id)}
                          disabled={actionLoading === o.id}
                          className="px-3 py-1.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && pending.length > 0 && (
        <p className="mt-4 text-sm text-gray-500">{pending.length} pending order(s).</p>
      )}
    </div>
  );
}
