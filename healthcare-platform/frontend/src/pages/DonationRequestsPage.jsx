import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import { BLOOD_TYPES } from '@/lib/constants';
import { useApiData } from '@/lib/useApiData';

export default function DonationRequestsPage() {
  const { user } = useAuth();
  const [bloodType, setBloodType] = useState('');
  const [units, setUnits] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { rows: hospitals } = useApiData('/api/core/hospitals', user, { enabled: !!user });
  const { rows: donations, reload } = useApiData('/api/blood/donations', user, {
    enabled: !!user && getPermissions(user?.role).canSendDonationRequests,
  });

  if (!user) return null;
  if (!getPermissions(user.role).canSendDonationRequests) {
    return <AccessDenied message="You do not have access to send donation requests." />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bloodType || !units || !hospitalId) return;
    setSubmitted(true);
    reload();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Donation Requests</h1>
      <p className="text-gray-600 mb-6">
        Raise a request to hospital admins to find willing donors (patients or doctors) with matching blood type.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4">Send donation request to hospital</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood type needed *</label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select</option>
                {BLOOD_TYPES.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Units needed *</label>
              <input
                type="number"
                min="1"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Send to hospital *</label>
              <select
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select hospital</option>
                {hospitals.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
                placeholder="e.g. Urgent need for emergency surgery"
              />
            </div>
            <button type="submit" className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 font-medium">
              Send request to hospital admin
            </button>
          </form>
          {submitted && (
            <p className="mt-4 text-green-600 text-sm">Donation request sent. Hospital admin can reach out to donors (patients/doctors with matching blood type in their profile).</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4">Sent donation requests</h2>
          <ul className="space-y-3">
            {donations.map((r) => (
              <li key={r.id} className="border-b border-gray-100 pb-3 last:border-0">
                <p className="font-medium text-gray-900">{r.donorName} · {r.bloodType}</p>
                <p className="text-sm text-gray-600">Preferred: {r.preferredDate}</p>
                <p className="text-xs text-gray-500">{r.status}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
