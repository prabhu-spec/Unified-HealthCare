'use client';

import { useState } from 'react';
import FHIRClient from '@/lib/fhir-client';

export default function RealPatientDataTest() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testRealPatientData = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const fhirClient = new FHIRClient();
      
      console.log('🚀 Testing REAL Patient Data Access...');
      
      // Test authentication
      await fhirClient.ensureAuthenticated();
      console.log('✅ Authentication successful');
      
      // Test patient data fetch
      const patientsBundle = await fhirClient.getPatients({ '_count': '10' });
      const patients = patientsBundle.entry?.map(entry => entry.resource) || [];
      
      if (patients.length > 0) {
        console.log(`✅ SUCCESS: Found ${patients.length} real patients`);
        
        // Get detailed info for first patient
        const firstPatient = patients[0];
        const comprehensiveData = await fhirClient.getComprehensivePatientData(firstPatient.id);
        
        setResults({
          totalPatients: patients.length,
          samplePatient: firstPatient,
          comprehensiveData: comprehensiveData,
          allPatients: patients.map(p => ({
            id: p.id,
            name: p.name?.[0] ? `${p.name[0].given?.join(' ')} ${p.name[0].family}` : 'Unknown',
            gender: p.gender,
            birthDate: p.birthDate
          }))
        });
      } else {
        throw new Error('No patients found in Epic FHIR');
      }
      
    } catch (err: any) {
      console.error('❌ Real patient data test failed:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-200">
      <h2 className="text-xl font-bold text-gray-900 mb-4">🔬 Real Patient Data Test</h2>
      
      <button
        onClick={testRealPatientData}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 mb-4"
      >
        {loading ? '🔄 Testing...' : '🚀 Test Real Patient Data Access'}
      </button>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <h3 className="text-red-800 font-medium mb-2">❌ Error</h3>
          <p className="text-red-700 text-sm">{error}</p>
          <div className="mt-2 text-xs text-red-600">
            <p>Common causes:</p>
            <ul className="list-disc list-inside ml-2">
              <li>Epic FHIR sandbox has no patient data</li>
              <li>Authentication credentials invalid</li>
              <li>API rate limits exceeded</li>
              <li>Network connectivity issues</li>
            </ul>
          </div>
        </div>
      )}
      
      {results && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-green-800 font-medium mb-3">✅ Real Patient Data Found!</h3>
          
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Total Patients:</span>
              <span className="ml-2 text-green-700">{results.totalPatients}</span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Sample Patient Names:</span>
              <ul className="ml-4 mt-1 space-y-1">
                {results.allPatients.slice(0, 5).map((patient: any, index: number) => (
                  <li key={index} className="text-gray-600">
                    • {patient.name} (ID: {patient.id})
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-4 p-3 bg-white rounded border">
              <span className="font-medium text-gray-700">First Patient Details:</span>
              <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                {JSON.stringify(results.samplePatient, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}