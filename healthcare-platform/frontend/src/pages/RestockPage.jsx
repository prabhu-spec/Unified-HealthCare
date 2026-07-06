import { useCallback, useEffect, useState } from 'react';
import { useAuth, normalizeRole } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import StatusBadge from '@/components/ui/StatusBadge';
import { coreFetch } from '@/lib/coreApi';

const FALLBACK_STOCK = [
  { id: '1', name: 'Amoxicillin 500mg', quantity: 120, reorderLevel: 20, status: 'In-stock' },
  { id: '2', name: 'Paracetamol', quantity: 5, reorderLevel: 30, status: 'Low stock' },
  { id: '3', name: 'Ibuprofen', quantity: 0, reorderLevel: 25, status: 'Out-of-stock' }
];

export default function RestockPage() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const [requests, setRequests] = useState([]);
  const [stock, setStock] = useState(FALLBACK_STOCK);
  const [item, setItem] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const canSubmitRequest = role === 'hospital_admin' || role === 'doctor' || role === 'super_admin';
  const canApproveRequest = role === 'medical_vendor' || role === 'super_admin';

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const [requestData, stockData] = await Promise.all([
        coreFetch('/api/restock-requests', user),
        coreFetch('/api/pharmacy-stock', user),
      ]);
      setRequests(Array.isArray(requestData.data) ? requestData.data : []);
      const liveStock = Array.isArray(stockData.data) ? stockData.data : [];
      setStock(liveStock.length ? liveStock : FALLBACK_STOCK);
      if (!item && liveStock.length) setItem(liveStock[0].name);
    } catch (err) {
      setError(err.message || 'Failed to load restock requests.');
    } finally {
      setLoading(false);
    }
  }, [item, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!user) return null;
  if (!getPermissions(user.role).canRestockRequest) {
    return <AccessDenied message="Access denied." />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!canSubmitRequest) {
      setError('Only hospital admins and doctors can submit restock requests.');
      return;
    }
    if (!item || Number(quantity) <= 0) {
      setError('Select a medicine and enter a valid quantity.');
      return;
    }
    setSubmitting(true);
    try {
      await coreFetch('/api/restock-requests', user, {
        method: 'POST',
        body: JSON.stringify({
          item,
          quantity: Number(quantity),
          hospitalId: user.hospitalId || 'org-1',
          requestedBy: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
        })
      });
      setMessage('Restock request submitted. The pharmacy vendor can now approve or reject it.');
      setQuantity('100');
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to submit restock request.');
    } finally {
      setSubmitting(false);
    }
  };

  const updateRequest = async (id, action) => {
    setError('');
    setMessage('');
    try {
      await coreFetch(`/api/restock-requests/${id}/${action}`, user, {
        method: 'PATCH',
        body: JSON.stringify({}),
      });
      setMessage(action === 'approve' ? 'Restock request approved.' : 'Restock request rejected.');
      await fetchData();
    } catch (err) {
      setError(err.message || `Failed to ${action} request.`);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Restock Request</h1>
      <p className="text-gray-600 mb-6">
        Hospital admins and doctors can request medicine restocks. Pharmacy vendors review and approve or reject each request.
      </p>

      {canSubmitRequest && (
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Submit restock request</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-[1fr_160px_auto] gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medicine</label>
              <select
                value={item}
                onChange={(e) => setItem(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select medicine</option>
                {stock.map((medicine) => (
                  <option key={medicine.id || medicine.name} value={medicine.name}>
                    {medicine.name} · Qty {medicine.quantity} · {medicine.status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit request'}
            </button>
          </form>
        </div>
      )}

      {message && <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{message}</p>}
      {error && <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hospital</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested by</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              {canApproveRequest && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {requests.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-sm text-gray-900">{r.item}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{r.quantity}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{r.hospitalId || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{r.requestedBy || '-'}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                {canApproveRequest && (
                  <td className="px-4 py-3">
                    {r.status === 'Pending' ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => updateRequest(r.id, 'approve')}
                          className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => updateRequest(r.id, 'reject')}
                          className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Completed</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {!loading && requests.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-sm text-gray-500" colSpan={canApproveRequest ? 6 : 5}>
                  No restock requests yet.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td className="px-4 py-6 text-sm text-gray-500" colSpan={canApproveRequest ? 6 : 5}>
                  Loading restock requests...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
