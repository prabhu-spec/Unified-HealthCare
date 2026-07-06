'use client';

import { useState } from 'react';

export default function EpicFhirTest() {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<string>('');

  const testEpicConnection = async () => {
    setStatus('testing');
    setResult('Testing Epic FHIR connection...\n');

    try {
      const { fhirClient } = await import('@/lib/fhir-client');
      
      // Check what credentials we have
      const hasClientId = !!process.env.EPIC_CLIENT_ID;
      const hasClientSecret = !!process.env.EPIC_CLIENT_SECRET;
      
      setResult(prev => prev + `\n📋 Credentials Check:\n- Client ID: ${hasClientId ? '✅ Found' : '❌ Missing'}\n- Client Secret: ${hasClientSecret ? '✅ Found' : '⚠️ Not provided (may not be required)'}\n`);
      
      // Test authentication
      console.log('Testing Epic FHIR connection...');
      setResult(prev => prev + '\n🔐 Testing authentication...\n');
      
      try {
        await fhirClient.authenticateWithEpic();
        setResult(prev => prev + '✅ Authentication successful\n');
      } catch (authError: any) {
        setResult(prev => prev + `⚠️ Authentication failed: ${authError.message}\n`);
        setResult(prev => prev + '🔄 Trying public endpoints...\n');
      }
      
      // Test a simple search
      setResult(prev => prev + '\n🔍 Testing practitioner search...\n');
      const practitioners = await fhirClient.getPractitioners({ '_count': '5' });
      
      setStatus('success');
      setResult(prev => prev + `\n✅ Epic FHIR Connection Successful!\n\nFound ${practitioners.total || practitioners.entry?.length || 0} practitioners\n\nConnection Type: ${hasClientSecret ? 'Authenticated' : 'Public/Client-only'}\n\nFirst practitioner: ${JSON.stringify(practitioners.entry?.[0]?.resource, null, 2)}`);
      
    } catch (error: any) {
      setStatus('error');
      setResult(prev => prev + `\n❌ Epic FHIR Connection Failed:\n\n${error.message}\n\nTroubleshooting:\n1. Verify your Client ID in .env.local\n2. Check if your Epic app requires a Client Secret\n3. Ensure your Epic app is approved and active\n4. Try using Epic's sandbox endpoints`);
      console.error('Epic FHIR test failed:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">🧪 Epic FHIR Connection Test</h3>
      
      <div className="mb-4">
        <button
          onClick={testEpicConnection}
          disabled={status === 'testing'}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            status === 'testing'
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {status === 'testing' ? '🔄 Testing Connection...' : '🚀 Test Epic FHIR Connection'}
        </button>
      </div>

      {result && (
        <div className={`p-4 rounded-lg ${
          status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <pre className="text-sm whitespace-pre-wrap overflow-x-auto">
            {result}
          </pre>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Instructions:</strong></p>
        <ol className="list-decimal list-inside space-y-1 mt-2">
          <li>Add your Epic Client ID and Secret to <code>.env.local</code></li>
          <li>Click "Test Epic FHIR Connection" to verify your credentials</li>
          <li>If successful, the app will use real Epic FHIR data</li>
          <li>If failed, check your credentials and Epic App Orchard settings</li>
        </ol>
      </div>
    </div>
  );
}