import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { canAccessReceipts } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import { coreFetch } from '@/lib/coreApi';

export default function ReceiptsPage() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function load() {
      try {
        setLoading(true);
        const response = await coreFetch('/api/core/receipts', user);
        if (active) setReceipts(response.data || []);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [user]);

  if (!user) return null;
  if (!canAccessReceipts(user.role)) {
    return <AccessDenied message="Your role cannot view receipts." />;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Receipts</h1>
      <p className="text-gray-600 mb-6">
        {user.role === 'patient' ? 'Your payment receipts.' : 'View and manage receipts.'}
      </p>
      {loading && <p className="text-gray-600 mb-4">Loading receipts...</p>}

      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {receipts.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-sm text-gray-900">{r.date}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{r.description}</td>
                <td className="px-4 py-3 text-sm text-gray-900">${r.amount}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {receipts.length === 0 && (
        <p className="text-gray-500 text-center py-8">No receipts found.</p>
      )}
    </div>
  );
}
