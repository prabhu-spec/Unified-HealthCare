import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import DataTable from '@/components/ui/DataTable';
import { apiFetch } from '@/lib/api';
import { coreFetch } from '@/lib/coreApi';

export default function MedicinesPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    coreFetch('/api/prescriptions', user)
      .then((res) => setPrescriptions(res.data || []))
      .catch(() => setPrescriptions([]));
  }, [user]);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    const patientId = user.patientId || user.email || user.id;
    try {
      const data = await apiFetch(`/api/medicine-orders?patientId=${encodeURIComponent(patientId)}`);
      setOrders(Array.isArray(data.data) ? data.data : []);
    } catch {
      setOrders([]);
    }
  }, [user]);

  useEffect(() => {
    if (getPermissions(user?.role).canPurchaseMedicines) fetchOrders();
  }, [user, fetchOrders]);

  if (!user) return null;
  if (!getPermissions(user.role).canPurchaseMedicines) {
    return <AccessDenied message="Access denied." />;
  }

  const handleOrderFromPharmacy = async (e) => {
    e.preventDefault();
    setOrderError('');
    const prescription = selectedPrescription ?? prescriptions[0];
    if (!prescription) {
      setOrderError('Please select a prescription.');
      return;
    }
    const patientId = user.patientId || user.email || user.id;
    const patientName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
    setSubmitting(true);
    try {
      await apiFetch('/api/medicine-orders', {
        method: 'POST',
        body: JSON.stringify({
          patientId,
          patientName,
          medication: prescription.medication,
          dosage: prescription.dosage,
          prescribedBy: prescription.prescribedBy,
        }),
      });
      setSelectedPrescription(null);
      fetchOrders();
    } catch (err) {
      setOrderError(err.message || 'Failed to place order.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: 'medication', label: 'Medication' },
    { key: 'dosage', label: 'Dosage' },
    { key: 'prescribedBy', label: 'Prescribed by' },
    { key: 'status', label: 'Status' },
  ];

  const orderColumns = [
    { key: 'medication', label: 'Medication' },
    { key: 'dosage', label: 'Dosage' },
    { key: 'prescribedBy', label: 'Prescribed by' },
    { key: 'status', label: 'Status' },
    { key: 'rejectionReason', label: 'Rejection reason' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Purchase Medicines</h1>
      <p className="text-gray-600 mb-6">Order from your digital prescriptions. The pharmacy (medical vendor) will accept or reject your order.</p>

      <DataTable columns={columns} rows={prescriptions} statusKey="status" />

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-2">Order from pharmacy</h2>
        <p className="text-sm text-gray-600 mb-3">Select a prescription and submit to send the order to the pharmacy. You can check status below.</p>
        <form onSubmit={handleOrderFromPharmacy} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Prescription</label>
            <select
              value={selectedPrescription?.id ?? ''}
              onChange={(e) => {
                const p = prescriptions.find((x) => x.id === e.target.value);
                setSelectedPrescription(p || null);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select prescription</option>
              {prescriptions.map((p) => (
                <option key={p.id} value={p.id}>{p.medication} – {p.prescribedBy}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Order from pharmacy'}
          </button>
        </form>
        {orderError && <p className="mt-2 text-sm text-red-600">{orderError}</p>}
      </div>

      <div className="mt-8">
        <h2 className="font-semibold text-gray-900 mb-3">My orders</h2>
        <p className="text-sm text-gray-500 mb-3">Check prescription order status. Rejected orders may include a reason (e.g. medicine unavailable).</p>
        {orders.length === 0 ? (
          <p className="text-gray-500">No orders yet. Place an order above.</p>
        ) : (
          <DataTable
            columns={orderColumns}
            rows={orders.map((o) => ({ ...o, rejectionReason: o.rejectionReason || '—' }))}
            statusKey="status"
          />
        )}
      </div>
    </div>
  );
}
