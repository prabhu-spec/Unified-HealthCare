'use client';

import { useState, useEffect } from 'react';
import { Patient, Bundle } from '@/lib/fhir-client';
import { useAuth } from '@/lib/auth';
import { coreFetch } from '@/lib/coreApi';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';

export default function PatientsPage() {
  const { user, isAuthenticated } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isAuthenticated && user) loadPatients();
    else if (!isAuthenticated) {
      setLoading(false);
      setError('Please sign in to view patients.');
    }
  }, [isAuthenticated, user]);

  const loadPatients = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const res = await coreFetch('/api/core/patients', user);
      const list = (res.data || []) as Patient[];
      const bundle: Bundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: list.map((p) => ({ resource: p })),
      };
      const patientResources = bundle.entry?.map((entry) => entry.resource as Patient) || [];
      setPatients(patientResources);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadPatients} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800">
      <div className="p-6">
        <div className="mb-6">
          <button className="bg-purple-700 text-white px-4 py-2 rounded mb-4 hover:bg-purple-800 transition-colors">
            ← Back to Hospitals
          </button>
          
          <div className="bg-gradient-to-r from-purple-700 to-purple-900 rounded-lg p-6 text-white shadow-lg">
            <h1 className="text-2xl font-bold mb-2">Patients (API)</h1>
            <p className="text-purple-200 text-sm">{patients.length} patients from /api/core/patients</p>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search patients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-2 rounded-lg border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {patients
            .filter((patient) => {
              if (!searchTerm) return true;
              const name = patient.name?.[0];
              const fullName = `${name?.given?.join(' ') || ''} ${name?.family || ''}`.toLowerCase();
              const mrn = patient.identifier?.find((id) => id.system?.includes('patients'))?.value?.toLowerCase() || '';
              return fullName.includes(searchTerm.toLowerCase()) || mrn.includes(searchTerm.toLowerCase());
            })
            .map((patient) => {
              const name = patient.name?.[0];
              const fullName = `${name?.given?.join(' ') || ''} ${name?.family || ''}`.trim();
              const mrn = patient.identifier?.find((id) => id.system?.includes('patients'))?.value || 'N/A';
              return (
                <div key={patient.id} className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow">
                  <h3 className="font-semibold text-lg text-gray-800">{fullName || 'Unknown'}</h3>
                  <p className="text-gray-600 text-sm">MRN: {mrn}</p>
                  <p className="text-gray-500 text-sm">Gender: {patient.gender || '—'}</p>
                  <p className="text-gray-500 text-sm">DOB: {patient.birthDate || '—'}</p>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
