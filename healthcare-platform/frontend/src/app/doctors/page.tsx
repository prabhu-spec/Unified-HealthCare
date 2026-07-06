'use client';

import { useState, useEffect } from 'react';
import { Practitioner } from '@/lib/fhir-client';
import PractitionerCard from '@/components/PractitionerCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

export default function DoctorsPage() {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPractitioners();
  }, []);

  const loadPractitioners = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Using FHIR client with mock data fallback
      const { fhirClient } = await import('@/lib/fhir-client');
      const bundle = await fhirClient.getPractitioners();
      
      const practitionerResources = bundle.entry?.map((entry: any) => entry.resource as Practitioner) || [];
      setPractitioners(practitionerResources);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load practitioners');
    } finally {
      setLoading(false);
    }
  };

  const filteredPractitioners = practitioners.filter(practitioner => {
    if (!searchTerm) return true;
    const name = practitioner.name?.[0];
    const fullName = `${name?.prefix?.join(' ') || ''} ${name?.given?.join(' ') || ''} ${name?.family || ''}`.toLowerCase();
    const npi = practitioner.identifier?.find((id: any) => id.system?.includes('npi'))?.value?.toLowerCase() || '';
    return fullName.includes(searchTerm.toLowerCase()) || npi.includes(searchTerm.toLowerCase());
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadPractitioners} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <button className="bg-purple-700 text-white px-4 py-2 rounded mb-4 hover:bg-purple-800 transition-colors">
            ← Back to Hospitals
          </button>
          
          <div className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-lg p-6 text-white shadow-lg">
            <h1 className="text-2xl font-bold mb-2">👨‍⚕️ Doctors at SOUTHEAST HEALTH MEDICAL CENTER</h1>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-blue-400 text-lg">ℹ️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                Medical staff and physicians practicing at this hospital
              </p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search doctors by name or NPI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm"
          />
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPractitioners.map((practitioner) => (
            <PractitionerCard
              key={practitioner.id}
              practitioner={practitioner}
              onClick={() => {
                // Handle practitioner selection - could navigate to practitioner details
                console.log('Selected practitioner:', practitioner.id);
              }}
            />
          ))}
        </div>

        {filteredPractitioners.length === 0 && !loading && (
          <div className="text-center py-8">
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <p className="text-gray-500">No doctors found matching your search.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
