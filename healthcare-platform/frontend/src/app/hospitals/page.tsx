'use client';

import { useState, useEffect } from 'react';
import { Organization } from '@/lib/fhir-client';
import OrganizationCard from '@/components/OrganizationCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

export default function HospitalsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Using FHIR client with mock data fallback
      const { fhirClient } = await import('@/lib/fhir-client');
      const bundle = await fhirClient.getOrganizations();
      
      const organizationResources = bundle.entry?.map(entry => entry.resource as Organization) || [];
      setOrganizations(organizationResources);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrganizations = organizations.filter(organization => {
    if (!searchTerm) return true;
    const name = organization.name?.toLowerCase() || '';
    const city = organization.address?.[0]?.city?.toLowerCase() || '';
    const state = organization.address?.[0]?.state?.toLowerCase() || '';
    return name.includes(searchTerm.toLowerCase()) || 
           city.includes(searchTerm.toLowerCase()) || 
           state.includes(searchTerm.toLowerCase());
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadOrganizations} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">🏥 Healthcare Finder USA</h1>
            <p className="text-purple-100">Find hospitals with doctors, insurance plans, and bed availability across all US states</p>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <input
                type="text"
                value="United States"
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select State</label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option>All States</option>
                <option>Alabama</option>
                <option>Alaska</option>
                <option>Arizona</option>
                {/* Add more states as needed */}
              </select>
            </div>
          </div>
          <input
            type="text"
            placeholder="Search hospitals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <div className="flex items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              🏥 Hospitals ({filteredOrganizations.length} results)
            </h2>
          </div>
          <p className="text-gray-600 mb-6">Click on any hospital to view doctors, insurance plans, and bed availability</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrganizations.map((organization) => (
              <OrganizationCard
                key={organization.id}
                organization={organization}
                onClick={() => {
                  // Handle hospital selection - could navigate to hospital details
                  console.log('Selected hospital:', organization.id);
                }}
              />
            ))}
          </div>

          {filteredOrganizations.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-gray-500">No hospitals found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
