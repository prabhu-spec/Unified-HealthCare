import { useAuth } from '@/lib/auth';
import { getPermissions } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import StatusBadge from '@/components/ui/StatusBadge';

export default function InsuranceRenewalPage() {
  const { user } = useAuth();

  if (!user) return null;
  if (!getPermissions(user.role).canViewInsuranceRenewal) {
    return <AccessDenied message="Access denied." />;
  }

  const policy = { name: 'Health Plus', expiry: '2025-12-31', status: 'Active' };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Insurance Renewal</h1>
      <p className="text-gray-600 mb-6">View and renew your policy.</p>
      <div className="max-w-md bg-white rounded-lg border border-gray-200 p-6">
        <p className="font-medium text-gray-900">{policy.name}</p>
        <p className="text-sm text-gray-600 mt-1">Expires: {policy.expiry}</p>
        <span className="mt-2 inline-block"><StatusBadge status={policy.status} /></span>
        <button className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">
          Renew policy
        </button>
      </div>
    </div>
  );
}
