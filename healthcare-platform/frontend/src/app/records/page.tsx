'use client';

import { useState, useEffect } from 'react';
import { Observation } from '@/lib/fhir-client';

import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import ProtectedPatientRecords from '@/components/ProtectedPatientRecords';
import Link from 'next/link';

export default function RecordsPage() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadObservations();
  }, []);

  const loadObservations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Using FHIR client with mock data fallback
      const { fhirClient } = await import('@/lib/fhir-client');
      const bundle = await fhirClient.getObservations();
      
      const observationResources = bundle.entry?.map((entry: any) => entry.resource as Observation) || [];
      setObservations(observationResources);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const filteredObservations = observations.filter(observation => {
    if (!searchTerm) return true;
    const code = observation.code?.text?.toLowerCase() || 
                 observation.code?.coding?.[0]?.display?.toLowerCase() || '';
    const patientName = observation.subject?.display?.toLowerCase() || '';
    return code.includes(searchTerm.toLowerCase()) || 
           patientName.includes(searchTerm.toLowerCase());
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadObservations} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="bg-purple-700 text-white px-4 py-2 rounded mb-4 hover:bg-purple-800 transition-colors inline-block">
            ← Back to Hospitals
          </Link>
          
          <div className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">📋</span>
              <h1 className="text-2xl font-bold">Patient Medical Records</h1>
            </div>
            <p className="text-purple-100">Secure access to patient medical observations and data</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <input
              type="text"
              placeholder="Search medical records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Protected Medical Records */}
        <div className="bg-white rounded-lg p-6 shadow-lg">
          <ProtectedPatientRecords 
            observations={filteredObservations}
            hospitalName="All Hospitals"
          />
        </div>
      </div>
    </div>
  );
}
