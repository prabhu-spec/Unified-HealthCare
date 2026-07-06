import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { getMenuItemsForRole } from '@/lib/permissions';
import { coreFetch } from '@/lib/coreApi';
import AccessDenied from '@/components/AccessDenied';

export default function PlatformTestingPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    coreFetch('/api/platform/status', user)
      .then(setStatus)
      .catch((err) => setError(err.message || 'Failed to load status.'));
  }, [user]);

  if (!user) return null;
  if (user.role !== 'super_admin' && user.role !== 'hospital_admin') {
    return <AccessDenied message="Testing checklist is for admins only." />;
  }

  const menu = getMenuItemsForRole(user.role);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Platform testing (Phase 0)</h1>
      <p className="text-gray-600 mb-4">
        Data is <strong>in-memory on the server</strong> — good for role testing; restart backend clears new records.
      </p>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {status && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-6 text-sm text-gray-800">
          <p><strong>Phase:</strong> {status.phaseLabel}</p>
          <p><strong>Storage:</strong> {status.storage}</p>
          <p className="mt-2"><strong>Demo password:</strong> {status.demoPassword}</p>
        </div>
      )}
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Your menu ({user.role})</h2>
      <ul className="grid sm:grid-cols-2 gap-2 mb-8">
        {menu.filter((m) => m.path !== '/').map((m) => (
          <li key={m.path}>
            <Link to={m.path} className="text-sky-600 hover:underline text-sm">
              {m.icon} {m.label}
            </Link>
          </li>
        ))}
      </ul>
      {status?.features && (
        <>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">API features</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2">Feature</th>
                  <th className="px-3 py-2">API</th>
                  <th className="px-3 py-2">Phase</th>
                  <th className="px-3 py-2">Roles</th>
                </tr>
              </thead>
              <tbody>
                {status.features.map((f) => (
                  <tr key={f.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">{f.label}</td>
                    <td className="px-3 py-2 font-mono text-xs">{f.api}</td>
                    <td className="px-3 py-2">{f.phase}</td>
                    <td className="px-3 py-2 text-gray-600">{f.roles.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <p className="text-sm text-gray-500 mt-6">
        Full roadmap: <code className="text-xs">healthcare-platform/docs/PLATFORM_ROADMAP.md</code>
      </p>
    </div>
  );
}
