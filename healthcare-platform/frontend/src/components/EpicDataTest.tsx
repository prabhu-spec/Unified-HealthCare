'use client';

import { useState } from 'react';
import { fhirClient } from '@/lib/fhir-client';

export default function EpicDataTest() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testEpicAccess = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      console.log('Testing Epic FHIR access...');
      
      // Test 1: Practitioner search (doctors)
      const practitionersBundle = await fhirClient.getPractitioners({ '_count': '10' });
      
      // Test 2: Organization search (hospitals)
      const organizationsBundle = await fhirClient.getOrganizations({ '_count': '10' });
      
      // Test 3: PractitionerRole search (doctor-hospital relationships)
      let practitionerRolesBundle;
      try {
        practitionerRolesBundle = await fhirClient.search('PractitionerRole', { '_count': '10' });
      } catch (roleError) {
        console.log('PractitionerRole not accessible:', roleError);
      }
      
      // Test 4: Location search (hospital locations)
      let locationsBundle;
      try {
        locationsBundle = await fhirClient.search('Location', { '_count': '10' });
      } catch (locationError) {
        console.log('Location not accessible:', locationError);
      }
      
      // Test 5: Patient search (if available)
      let patientsBundle;
      try {
        patientsBundle = await fhirClient.getPatients({ '_count': '3' });
      } catch (patientError) {
        console.log('Patient data not accessible:', patientError);
      }
      
      const testResults = {
        practitioners: {
          total: practitionersBundle.total || 0,
          count: practitionersBundle.entry?.length || 0,
          sample: practitionersBundle.entry?.slice(0, 3).map((entry: any) => ({
            id: entry.resource.id,
            name: entry.resource.name?.[0],
            qualification: entry.resource.qualification?.[0]?.code?.coding?.[0]?.display,
            identifier: entry.resource.identifier?.find((id: any) => id.system?.includes('npi'))?.value
          })) || []
        },
        organizations: {
          total: organizationsBundle.total || 0,
          count: organizationsBundle.entry?.length || 0,
          sample: organizationsBundle.entry?.slice(0, 3).map((entry: any) => ({
            id: entry.resource.id,
            name: entry.resource.name,
            type: entry.resource.type?.[0]?.coding?.[0]?.display,
            address: entry.resource.address?.[0]?.city + ', ' + entry.resource.address?.[0]?.state
          })) || []
        },
        practitionerRoles: practitionerRolesBundle ? {
          total: practitionerRolesBundle.total || 0,
          count: practitionerRolesBundle.entry?.length || 0,
          sample: practitionerRolesBundle.entry?.slice(0, 2).map((entry: any) => ({
            id: entry.resource.id,
            practitioner: entry.resource.practitioner?.reference,
            organization: entry.resource.organization?.reference,
            specialty: entry.resource.specialty?.[0]?.coding?.[0]?.display
          })) || [],
          accessible: true
        } : {
          accessible: false,
          reason: 'PractitionerRole data not accessible'
        },
        locations: locationsBundle ? {
          total: locationsBundle.total || 0,
          count: locationsBundle.entry?.length || 0,
          sample: locationsBundle.entry?.slice(0, 2).map((entry: any) => ({
            id: entry.resource.id,
            name: entry.resource.name,
            type: entry.resource.type?.[0]?.coding?.[0]?.display,
            address: entry.resource.address?.city + ', ' + entry.resource.address?.state
          })) || [],
          accessible: true
        } : {
          accessible: false,
          reason: 'Location data not accessible'
        },
        patients: patientsBundle ? {
          total: patientsBundle.total || 0,
          count: patientsBundle.entry?.length || 0,
          accessible: true
        } : {
          accessible: false,
          reason: 'Patient data requires additional permissions'
        }
      };
      
      setResults(testResults);
      console.log('Epic FHIR Test Results:', testResults);
      
    } catch (err: any) {
      setError(`Epic FHIR Test Failed: ${err.message}`);
      console.error('Epic FHIR Test Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
      <h3 className="text-lg font-bold mb-4">🧪 Epic FHIR Access Test</h3>
      <p className="text-sm text-gray-600 mb-4">
        Test what data your Epic FHIR account can access
      </p>
      
      <button
        onClick={testEpicAccess}
        disabled={loading}
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? 'Testing Epic Access...' : 'Test Epic FHIR Data'}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {results && (
        <div className="mt-4 space-y-4">
          <div className="p-3 bg-blue-50 rounded">
            <h4 className="font-medium text-blue-900">👨‍⚕️ Practitioners (Doctors)</h4>
            <p className="text-sm text-blue-700">
              Total: {results.practitioners.total} | Retrieved: {results.practitioners.count}
            </p>
            {results.practitioners.sample.length > 0 && (
              <div className="mt-2 text-xs">
                <strong>Real Doctors Found:</strong>
                {results.practitioners.sample.map((p: any, i: number) => (
                  <div key={i} className="ml-2 bg-white p-1 rounded mb-1">
                    • <strong>{p.name?.given?.[0]} {p.name?.family}</strong><br/>
                    &nbsp;&nbsp;Specialty: {p.qualification || 'General Practice'}<br/>
                    {p.identifier && <span>&nbsp;&nbsp;NPI: {p.identifier}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-green-50 rounded">
            <h4 className="font-medium text-green-900">🏥 Organizations (Hospitals)</h4>
            <p className="text-sm text-green-700">
              Total: {results.organizations.total} | Retrieved: {results.organizations.count}
            </p>
            {results.organizations.sample.length > 0 && (
              <div className="mt-2 text-xs">
                <strong>Real Hospitals Found:</strong>
                {results.organizations.sample.map((o: any, i: number) => (
                  <div key={i} className="ml-2 bg-white p-1 rounded mb-1">
                    • <strong>{o.name}</strong><br/>
                    &nbsp;&nbsp;Type: {o.type || 'Healthcare Organization'}<br/>
                    &nbsp;&nbsp;Location: {o.address || 'Not specified'}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-3 bg-purple-50 rounded">
            <h4 className="font-medium text-purple-900">🔗 PractitionerRole (Doctor-Hospital Links)</h4>
            {results.practitionerRoles.accessible ? (
              <>
                <p className="text-sm text-purple-700">
                  ✅ Total: {results.practitionerRoles.total} | Retrieved: {results.practitionerRoles.count}
                </p>
                {results.practitionerRoles.sample.length > 0 && (
                  <div className="mt-2 text-xs">
                    <strong>Doctor-Hospital Relationships:</strong>
                    {results.practitionerRoles.sample.map((r: any, i: number) => (
                      <div key={i} className="ml-2 bg-white p-1 rounded mb-1">
                        • Doctor: {r.practitioner}<br/>
                        &nbsp;&nbsp;Hospital: {r.organization}<br/>
                        &nbsp;&nbsp;Specialty: {r.specialty || 'Not specified'}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-purple-700">❌ {results.practitionerRoles.reason}</p>
            )}
          </div>

          <div className="p-3 bg-indigo-50 rounded">
            <h4 className="font-medium text-indigo-900">📍 Locations (Hospital Departments)</h4>
            {results.locations.accessible ? (
              <>
                <p className="text-sm text-indigo-700">
                  ✅ Total: {results.locations.total} | Retrieved: {results.locations.count}
                </p>
                {results.locations.sample.length > 0 && (
                  <div className="mt-2 text-xs">
                    <strong>Hospital Locations:</strong>
                    {results.locations.sample.map((l: any, i: number) => (
                      <div key={i} className="ml-2 bg-white p-1 rounded mb-1">
                        • <strong>{l.name}</strong><br/>
                        &nbsp;&nbsp;Type: {l.type || 'Healthcare Location'}<br/>
                        &nbsp;&nbsp;Address: {l.address || 'Not specified'}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-indigo-700">❌ {results.locations.reason}</p>
            )}
          </div>

          <div className="p-3 bg-yellow-50 rounded">
            <h4 className="font-medium text-yellow-900">👥 Patient Data</h4>
            {results.patients.accessible ? (
              <p className="text-sm text-yellow-700">
                ✅ Accessible - Total: {results.patients.total} | Retrieved: {results.patients.count}
              </p>
            ) : (
              <p className="text-sm text-yellow-700">
                ❌ {results.patients.reason}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}