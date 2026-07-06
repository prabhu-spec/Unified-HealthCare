import { useState, useEffect } from 'react';
import { useAuth, normalizeRole } from '@/lib/auth';
import { canAccessHospitals } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import OrganizationCard from '@/components/OrganizationCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { coreFetch } from '@/lib/coreApi';

export default function HospitalsPage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  if (user && !canAccessHospitals(user.role)) {
    return <AccessDenied message="Your role cannot view the hospital directory. Use the sidebar for your allowed options." />;
  }

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await coreFetch('/api/core/hospitals', user);
        setOrganizations(response.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load hospitals');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const role = user ? normalizeRole(user.role) : null;
  const hospitalId = user?.hospitalId;
  const scopeToMyHospital = (role === 'hospital_admin' || role === 'doctor' || role === 'nurse') && hospitalId;

  let list = organizations;
  if (scopeToMyHospital) {
    list = organizations.filter((org) => org.id === hospitalId);
  }

  const filtered = list.filter((org) => {
    if (!searchTerm) return true;
    const name = (org.name || '').toLowerCase();
    const city = (org.address?.[0]?.city || '').toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || city.includes(searchTerm.toLowerCase());
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={() => window.location.reload()} />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hospitals</h1>
        <p className="text-gray-600 mt-1">Find hospitals and view details</p>
      </div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search hospitals..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((org) => (
          <OrganizationCard key={org.id} organization={org} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-gray-500 text-center py-8">No hospitals match your search.</p>
      )}
    </div>
  );
}
