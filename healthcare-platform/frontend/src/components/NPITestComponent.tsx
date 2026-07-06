'use client';

import { useState } from 'react';
import { npiClient } from '@/lib/npi-client';

export default function NPITestComponent() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string>('Not tested');

  const testAPIConnection = async () => {
    setApiStatus('Testing...');
    try {
      // Simple test to check if NPI API is accessible
      const response = await fetch('https://npiregistry.cms.hhs.gov/api/?limit=1&enumeration_type=ind&state=AL');
      if (response.ok) {
        const data = await response.json();
        setApiStatus(`✅ API accessible (${data.result_count} total providers in AL)`);
      } else {
        setApiStatus(`❌ API returned ${response.status}: ${response.statusText}`);
      }
    } catch (err: any) {
      setApiStatus(`❌ API connection failed: ${err.message}`);
    }
  };

  const testNPISearch = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting NPI test search...');
      
      // Test search for doctors in Dothan, AL (Southeast Health location)
      const providers = await npiClient.searchProvidersByHospital(
        'Southeast Health Medical Center',
        'DOTHAN', 
        'AL'
      );
      
      console.log('NPI Test Results:', providers);
      
      if (providers.length === 0) {
        setError('No providers found in Dothan, AL. This might be due to API limitations or the location having few registered providers.');
      } else {
        setResults(providers.slice(0, 5)); // Show first 5 results
      }
    } catch (err: any) {
      console.error('NPI Test Error:', err);
      setError(`NPI search failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
      <h3 className="text-lg font-bold mb-4">🧪 NPI Database Test</h3>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={testAPIConnection}
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Test API Connection
        </button>
        
        <button
          onClick={testNPISearch}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Test Real Doctor Search'}
        </button>
      </div>
      
      <div className="mb-4 text-sm">
        <strong>API Status:</strong> <span className={apiStatus.includes('✅') ? 'text-green-600' : apiStatus.includes('❌') ? 'text-red-600' : 'text-gray-600'}>{apiStatus}</span>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Found {results.length} Real Doctors:</h4>
          <div className="space-y-2">
            {results.map((provider, index) => (
              <div key={provider.number} className="p-2 bg-gray-50 rounded text-sm">
                <div className="font-medium">
                  {provider.basic.first_name} {provider.basic.last_name} {provider.basic.credential}
                </div>
                <div className="text-gray-600">
                  NPI: {provider.number} | 
                  {provider.taxonomies[0]?.desc || 'General Practice'}
                </div>
                <div className="text-gray-500">
                  {provider.addresses[0]?.city}, {provider.addresses[0]?.state}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}