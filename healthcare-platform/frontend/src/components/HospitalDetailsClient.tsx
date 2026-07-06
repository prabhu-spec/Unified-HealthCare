'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PractitionerCard from '@/components/PractitionerCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import ProtectedPatientRecords from '@/components/ProtectedPatientRecords';
import { fhirClient } from '@/lib/fhir-client';

// Define types locally to avoid import issues
interface Organization {
  resourceType: 'Organization';
  id?: string;
  name?: string;
  address?: Array<{
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
  }>;
  telecom?: Array<{
    system?: string;
    value?: string;
  }>;
  type?: Array<{
    coding?: Array<{
      display?: string;
    }>;
  }>;
  extension?: Array<{
    url?: string;
    valueDecimal?: number;
    valueString?: string;
    valueBoolean?: boolean;
  }>;
}

interface Practitioner {
  resourceType: 'Practitioner';
  id?: string;
  name?: Array<{
    family?: string;
    given?: string[];
  }>;
  qualification?: Array<{
    code?: {
      coding?: Array<{
        display?: string;
      }>;
    };
  }>;
  address?: Array<{
    use?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  }>;
}

interface Observation {
  resourceType: 'Observation';
  status?: string;
  code?: {
    coding?: Array<{
      display?: string;
    }>;
  };
}

interface BedAvailability {
  totalBeds: number;
  availableBeds: number;
  icuBeds: number;
  icuAvailable: number;
  emergencyBeds: number;
  emergencyAvailable: number;
  occupancyRate: number;
  status: string;
  lastUpdated: string;
}

interface HospitalInsurance {
  dataSource: string;
  lastUpdated: string;
  insurancePlans: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    copay?: string;
    deductible?: string;
    coinsurance?: string;
    network: string;
    coverage: string[];
    lastVerified: string;
  }>;
}

// Helper function to customize doctors for specific hospitals
function customizeDoctorsForHospital(doctors: Practitioner[], hospitalId: string): Practitioner[] {
  const hospitalDoctorCount = {
    'southeast-health': 6,
    'marshall-medical': 4,
    'north-alabama': 5,
  };
  
  const count = hospitalDoctorCount[hospitalId as keyof typeof hospitalDoctorCount] || 3;
  const selectedDoctors = doctors.slice(0, count);
  
  return selectedDoctors.map((doctor) => {
    const customizedDoctor = { ...doctor };
    
    if (hospitalId === 'southeast-health') {
      customizedDoctor.address = [{
        use: 'work',
        city: 'DOTHAN',
        state: 'AL',
        postalCode: '36301'
      }];
    } else if (hospitalId === 'marshall-medical') {
      customizedDoctor.address = [{
        use: 'work', 
        city: 'BOAZ',
        state: 'AL',
        postalCode: '35957'
      }];
    } else if (hospitalId === 'north-alabama') {
      customizedDoctor.address = [{
        use: 'work',
        city: 'FLORENCE', 
        state: 'AL',
        postalCode: '35630'
      }];
    }
    
    return customizedDoctor;
  });
}

interface HospitalDetailsClientProps {
  hospitalId?: string;
}

export default function HospitalDetailsClient({ hospitalId: propHospitalId }: HospitalDetailsClientProps) {
  // Get hospital ID from URL if not provided as prop
  const getHospitalIdFromUrl = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const match = path.match(/\/hospital\/([^\/]+)/);
      return match ? match[1] : null;
    }
    return null;
  };

  const hospitalId = propHospitalId || getHospitalIdFromUrl();

  // Safety check for hospitalId
  if (!hospitalId) {
    return <div className="p-6">Loading hospital information...</div>;
  }

  const [hospital, setHospital] = useState<Organization | null>(null);
  const [doctors, setDoctors] = useState<Practitioner[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [bedAvailability, setBedAvailability] = useState<BedAvailability | null>(null);
  const [hospitalInsurance, setHospitalInsurance] = useState<HospitalInsurance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'doctors' | 'beds' | 'insurance' | 'patients'>('doctors');
  const [epicStatus, setEpicStatus] = useState<'connecting' | 'connected' | 'mock' | 'error'>('connecting');

  const loadHospitalDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading hospital data from fallback sources...');
      
      let hospitalData: Organization;
      
      // Define all real hospitals (matching the homepage data)
      const realHospitals: { [key: string]: Organization } = {
        'southeast-health': {
          resourceType: 'Organization',
          id: 'southeast-health',
          name: 'SOUTHEAST HEALTH MEDICAL CENTER',
          address: [{
            line: ['1108 ROSS CLARK CIRCLE'],
            city: 'DOTHAN',
            state: 'AL',
            postalCode: '36301'
          }],
          telecom: [{
            system: 'phone',
            value: '(334) 793-8701'
          }],
          type: [{
            coding: [{
              display: 'Acute Care Hospitals'
            }]
          }]
        },
        'mizell-memorial': {
          resourceType: 'Organization',
          id: 'mizell-memorial',
          name: 'MIZELL MEMORIAL HOSPITAL',
          address: [{
            line: ['702 MAIN STREET'],
            city: 'OPP',
            state: 'AL',
            postalCode: '36467'
          }],
          telecom: [{
            system: 'phone',
            value: '(334) 493-3541'
          }],
          type: [{
            coding: [{
              display: 'Acute Care Hospitals'
            }]
          }]
        },
        'crenshaw-community': {
          resourceType: 'Organization',
          id: 'crenshaw-community',
          name: 'CRENSHAW COMMUNITY HOSPITAL',
          address: [{
            line: ['101 HOSPITAL CIRCLE'],
            city: 'LUVERNE',
            state: 'AL',
            postalCode: '36049'
          }],
          telecom: [{
            system: 'phone',
            value: '(334) 335-3374'
          }],
          type: [{
            coding: [{
              display: 'Acute Care Hospitals'
            }]
          }]
        },
        'marshall-medical': {
          resourceType: 'Organization',
          id: 'marshall-medical',
          name: 'MARSHALL MEDICAL CENTERS',
          address: [{
            line: ['2505 U S HIGHWAY 431 NORTH'],
            city: 'BOAZ',
            state: 'AL',
            postalCode: '35957'
          }],
          telecom: [{
            system: 'phone',
            value: '(256) 593-8310'
          }],
          type: [{
            coding: [{
              display: 'Acute Care Hospitals'
            }]
          }]
        },
        'north-alabama': {
          resourceType: 'Organization',
          id: 'north-alabama',
          name: 'NORTH ALABAMA MEDICAL CENTER',
          address: [{
            line: ['1701 VETERANS DRIVE'],
            city: 'FLORENCE',
            state: 'AL',
            postalCode: '35630'
          }],
          telecom: [{
            system: 'phone',
            value: '(256) 768-9400'
          }],
          type: [{
            coding: [{
              display: 'Acute Care Hospitals'
            }]
          }]
        }
      };
      
      // Check if it's a known real hospital
      if (realHospitals[hospitalId]) {
        hospitalData = realHospitals[hospitalId];
        console.log(`✅ Loaded real hospital data for ${hospitalId}: ${hospitalData.name}`);
      } else {
        // Try to load from Epic FHIR as fallback
        try {
          hospitalData = await fhirClient.getOrganization(hospitalId);
          console.log(`✅ Loaded hospital from Epic FHIR: ${hospitalData.name}`);
        } catch {
          // If Epic FHIR fails, create a basic hospital entry
          console.warn(`Hospital ${hospitalId} not found, creating basic entry`);
          hospitalData = {
            resourceType: 'Organization',
            id: hospitalId,
            name: (hospitalId || 'unknown').toUpperCase().replace(/-/g, ' ') + ' HOSPITAL',
            address: [{
              city: 'Unknown',
              state: 'AL'
            }],
            type: [{
              coding: [{
                display: 'Healthcare Facility'
              }]
            }]
          };
        }
      }
      
      setHospital(hospitalData);
      
      // Load demo doctors data
      setEpicStatus('connecting');
      
      console.log(`Loading demo doctors for ${hospitalData.name || hospitalId}...`);
      
      try {
        // Always use demo doctors from mock data
        const practitionersBundle = await fhirClient.getPractitioners({ '_count': '10' });
        let doctorResources = practitionersBundle.entry?.map((entry: any) => entry.resource as Practitioner) || [];
        
        if (doctorResources.length > 0) {
          // Customize doctors for specific hospitals
          doctorResources = customizeDoctorsForHospital(doctorResources, hospitalId);
          setDoctors(doctorResources);
          setEpicStatus('mock');
          console.log(`✅ Loaded ${doctorResources.length} demo doctors for ${hospitalData.name || hospitalId}`);
        } else {
          console.warn(`❌ No demo doctors available`);
          setEpicStatus('error');
          setError(`Demo doctor data not available`);
        }
      } catch (error) {
        console.error('Failed to load demo doctors:', error);
        setEpicStatus('error');
        setError(`Unable to load demo doctor data`);
      }
      
      // Load demo observations (medical records)
      try {
        const observationsBundle = await fhirClient.getObservations();
        const observationResources = observationsBundle.entry?.map((entry: any) => entry.resource as Observation) || [];
        setObservations(observationResources);
        console.log(`✅ Loaded ${observationResources.length} demo observations`);
      } catch (obsError) {
        console.warn('Failed to load demo observations:', obsError);
        setObservations([]);
      }
      
      // Load bed availability data
      try {
        console.log(`Loading bed availability for ${hospitalData.name || hospitalId}...`);
        const bedData = await fhirClient.getBedAvailability(hospitalId, hospitalData.name);
        setBedAvailability(bedData);
        console.log(`✅ Loaded bed availability: ${bedData.availableBeds}/${bedData.totalBeds} beds available (${bedData.status} data)`);
      } catch (bedError) {
        console.warn('Failed to load bed availability:', bedError);
        setBedAvailability(null);
      }
      
      // Load insurance data
      try {
        console.log(`Loading insurance plans for ${hospitalData.name || hospitalId}...`);
        const insuranceData = await fhirClient.getHospitalInsurance(hospitalId, hospitalData.name);
        setHospitalInsurance(insuranceData);
        console.log(`✅ Loaded ${insuranceData.insurancePlans.length} insurance plans (${insuranceData.dataSource} data)`);
      } catch (insuranceError) {
        console.warn('Failed to load insurance data:', insuranceError);
        setHospitalInsurance(null);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load hospital details');
    } finally {
      setLoading(false);
    }
  }, [hospitalId]);

  useEffect(() => {
    loadHospitalDetails();
  }, [loadHospitalDetails]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={loadHospitalDetails} />;
  if (!hospital) return <div className="p-6">Hospital not found</div>;

  const hospitalName = hospital.name || 'Unknown Hospital';
  const address = hospital.address?.[0];
  const addressStr = address ? `${address.line?.join(', ')}, ${address.city}, ${address.state} ${address.postalCode}` : 'No address';
  const phone = hospital.telecom?.find(t => t.system === 'phone')?.value;
  const type = hospital.type?.[0]?.coding?.[0]?.display;
  
  // Extract rating and emergency services
  const ratingExtension = hospital.extension?.find(ext => ext.url?.includes('organization-rating'));
  const rating = ratingExtension?.valueDecimal || ratingExtension?.valueString;
  const emergencyExtension = hospital.extension?.find(ext => ext.url?.includes('emergency-services'));
  const hasEmergencyServices = emergencyExtension?.valueBoolean;

  return (
    <div className="min-h-screen" style={{backgroundColor: '#F4F8FB'}}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Link to="/" className="btn-primary px-4 py-2 rounded mb-4 inline-block">
            ← Back to Hospitals
          </Link>
          
          <div className="header-gradient rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-center mb-4">
              <span className="text-3xl mr-3">🏥</span>
              <h1 className="text-2xl font-bold">{hospitalName}</h1>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center">
                <span className="mr-2">📍</span>
                <span><strong>Address:</strong> {addressStr}</span>
              </div>
              {phone && (
                <div className="flex items-center">
                  <span className="mr-2">📞</span>
                  <span><strong>Phone:</strong> {phone}</span>
                </div>
              )}
              {type && (
                <div className="flex items-center">
                  <span className="mr-2">🏥</span>
                  <span><strong>Type:</strong> {type}</span>
                </div>
              )}
              {rating && (
                <div className="flex items-center">
                  <span className="mr-2">⭐</span>
                  <span><strong>Rating:</strong> {typeof rating === 'number' ? `${rating}/5` : rating}</span>
                </div>
              )}
            </div>
            
            {hasEmergencyServices && (
              <div className="mt-4">
                <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                  🚨 Emergency Services Available
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="hospital-card mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('doctors')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'doctors'
                  ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                  : 'text-secondary hover:text-blue-600'
              }`}
            >
              👨‍⚕️ Doctors ({doctors.length})
            </button>
            <button
              onClick={() => setActiveTab('beds')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'beds'
                  ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                  : 'text-secondary hover:text-blue-600'
              }`}
            >
              🛏️ Bed Availability
            </button>
            <button
              onClick={() => setActiveTab('insurance')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'insurance'
                  ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                  : 'text-secondary hover:text-blue-600'
              }`}
            >
              📋 Insurance Plans
            </button>
            <button
              onClick={() => setActiveTab('patients')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'patients'
                  ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                  : 'text-secondary hover:text-blue-600'
              }`}
            >
              📊 Patient Records
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {activeTab === 'doctors' && (
            <div>
              <div className="mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Medical Staff and Physicians</h2>
                    <p className="text-gray-600">Healthcare providers practicing at this hospital</p>
                  </div>
                  
                  {/* Epic FHIR Status Indicator */}
                  <div className="text-right">
                    {epicStatus === 'connecting' && (
                      <div className="flex items-center text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        <span className="text-sm">Loading real doctors...</span>
                      </div>
                    )}

                    {epicStatus === 'mock' && (
                      <div className="flex items-center text-blue-600">
                        <span className="text-sm mr-2">🔧 Demo Mode</span>
                        <span className="text-xs bg-blue-100 px-2 py-1 rounded">Sample Data</span>
                      </div>
                    )}
                    {epicStatus === 'error' && (
                      <div className="flex items-center text-red-600">
                        <span className="text-sm mr-2">❌ Real Doctor Data Unavailable</span>
                        <span className="text-xs bg-red-100 px-2 py-1 rounded">Data Source Error</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                {doctors.map((doctor) => (
                  <div key={doctor.id} className="relative">
                    <PractitionerCard
                      practitioner={doctor}
                      onClick={() => console.log('Selected doctor:', doctor.id)}
                    />
                  </div>
                ))}
              </div>
              
              {doctors.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No doctors found for this hospital.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'beds' && (
            <div>
              <div className="mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Bed Availability</h2>
                    <p className="text-gray-600">Real-time hospital capacity and bed status</p>
                  </div>
                  
                  {/* Data Source Indicator */}
                  <div className="text-right">
                    {bedAvailability?.status === 'real' && (
                      <div className="flex items-center text-green-600">
                        <span className="text-sm mr-2">✅ Real-Time Data</span>
                        <span className="text-xs bg-green-100 px-2 py-1 rounded">Epic FHIR</span>
                      </div>
                    )}
                    {bedAvailability?.status === 'estimated' && (
                      <div className="flex items-center text-blue-600">
                        <span className="text-sm mr-2">📊 Estimated Data</span>
                        <span className="text-xs bg-blue-100 px-2 py-1 rounded">Hospital Records</span>
                      </div>
                    )}
                    {!bedAvailability && (
                      <div className="flex items-center text-gray-600">
                        <span className="text-sm mr-2">⏳ Loading...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {bedAvailability ? (
                <>
                  {/* Bed Statistics Table */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
                    <table className="text-lg">
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="py-3 pr-2 font-medium text-gray-700">Total Beds :</td>
                          <td className="py-3 pr-16 font-bold text-blue-600">{bedAvailability.totalBeds}</td>
                          <td className="py-3 pr-2 font-medium text-gray-700">Available Beds :</td>
                          <td className="py-3 font-bold text-green-600">{bedAvailability.availableBeds}</td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-2 font-medium text-gray-700">ICU Available beds :</td>
                          <td className="py-3 pr-16 font-bold text-purple-600">{bedAvailability.icuBeds}</td>
                          <td className="py-3 pr-2 font-medium text-gray-700">Emergency Available :</td>
                          <td className="py-3 font-bold text-orange-600">{bedAvailability.emergencyBeds}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Real Availability Summary */}
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200 mb-6">
                    <div className="flex justify-between items-center">
                      <div className="text-blue-700 font-medium text-lg">
                        Available Beds: {bedAvailability.availableBeds} of {bedAvailability.totalBeds}
                      </div>
                      <div className="text-blue-700 font-medium text-lg">
                        Occupancy Rate: {bedAvailability.occupancyRate}%
                      </div>
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">General Beds</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium">{bedAvailability.totalBeds - bedAvailability.icuBeds - bedAvailability.emergencyBeds}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Available:</span>
                          <span className="font-medium text-green-600">{bedAvailability.availableBeds - bedAvailability.icuAvailable - bedAvailability.emergencyAvailable}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">ICU Beds</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium">{bedAvailability.icuBeds}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Available:</span>
                          <span className="font-medium text-green-600">{bedAvailability.icuAvailable}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Emergency Beds</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total:</span>
                          <span className="font-medium">{bedAvailability.emergencyBeds}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Available:</span>
                          <span className="font-medium text-green-600">{bedAvailability.emergencyAvailable}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="mt-6 text-center text-sm text-gray-500">
                    Last updated: {new Date(bedAvailability.lastUpdated).toLocaleString()}
                    {bedAvailability.status === 'estimated' && (
                      <span className="ml-2 text-blue-600">• Based on hospital capacity records</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading bed availability data...</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'insurance' && (
            <div>
              <div className="mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Insurance Plans Accepted</h2>
                    <p className="text-gray-600">Insurance coverage and plans accepted at this hospital</p>
                  </div>
                  
                  {/* Data Source Indicator */}
                  <div className="text-right">
                    {hospitalInsurance?.dataSource === 'epic-fhir' && (
                      <div className="flex items-center text-green-600">
                        <span className="text-sm mr-2">✅ Real-Time Data</span>
                        <span className="text-xs bg-green-100 px-2 py-1 rounded">Epic FHIR</span>
                      </div>
                    )}
                    {hospitalInsurance?.dataSource === 'hospital-records' && (
                      <div className="flex items-center text-blue-600">
                        <span className="text-sm mr-2">📋 Hospital Records</span>
                        <span className="text-xs bg-blue-100 px-2 py-1 rounded">Verified Data</span>
                      </div>
                    )}
                    {!hospitalInsurance && (
                      <div className="flex items-center text-gray-600">
                        <span className="text-sm mr-2">⏳ Loading...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {hospitalInsurance ? (
                <>
                  {/* Insurance Statistics */}
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200 mb-6">
                    <div className="flex justify-between items-center">
                      <div className="text-blue-700 font-medium text-lg">
                        {hospitalInsurance.insurancePlans.length} Insurance Plans Accepted
                      </div>
                      <div className="text-blue-700 font-medium text-lg">
                        In-Network Provider
                      </div>
                    </div>
                  </div>

                  {/* Real Insurance Plans */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {hospitalInsurance.insurancePlans.map((plan) => (
                      <div key={plan.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <span className="text-blue-600 text-lg mr-2">
                              {plan.type === 'Government' ? '🏛️' : plan.type === 'Military' ? '🪖' : '🏥'}
                            </span>
                            <h3 className="text-lg font-bold text-blue-600">{plan.name}</h3>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            plan.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            plan.status === 'limited' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {plan.status === 'accepted' ? '✓ Accepted' : 
                             plan.status === 'limited' ? '⚠ Limited' : '✗ Not Accepted'}
                          </span>
                        </div>
                        
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded text-center font-medium mb-3">
                          {plan.type} Insurance
                        </div>
                        
                        <div className="space-y-2 text-sm mb-4">
                          <div>
                            <span className="font-medium text-gray-700">Coverage:</span>
                            <div className="mt-1">
                              {plan.coverage.map((coverage, index) => (
                                <span key={index} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded mr-1 mb-1">
                                  {coverage}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          {plan.copay && (
                            <div><span className="font-medium text-gray-700">Copay:</span> <span className="text-gray-600">{plan.copay}</span></div>
                          )}
                          
                          {plan.deductible && (
                            <div><span className="font-medium text-gray-700">Deductible:</span> <span className="text-gray-600">{plan.deductible}</span></div>
                          )}
                          
                          {plan.coinsurance && (
                            <div><span className="font-medium text-gray-700">Coinsurance:</span> <span className="text-gray-600">{plan.coinsurance}</span></div>
                          )}
                          
                          <div><span className="font-medium text-gray-700">Network:</span> <span className="text-green-600 capitalize">{plan.network.replace('-', ' ')}</span></div>
                        </div>
                        
                        <div className="text-xs text-gray-500 border-t pt-2">
                          Last verified: {new Date(plan.lastVerified).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Insurance Categories */}
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Private Insurance</h3>
                      <div className="space-y-2">
                        {hospitalInsurance.insurancePlans.filter(p => p.type === 'Medical').map(plan => (
                          <div key={plan.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">{plan.name}</span>
                            <span className="text-green-600">✓</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Government Plans</h3>
                      <div className="space-y-2">
                        {hospitalInsurance.insurancePlans.filter(p => p.type === 'Government').map(plan => (
                          <div key={plan.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">{plan.name}</span>
                            <span className="text-green-600">✓</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Military & Other</h3>
                      <div className="space-y-2">
                        {hospitalInsurance.insurancePlans.filter(p => p.type === 'Military').map(plan => (
                          <div key={plan.id} className="flex justify-between text-sm">
                            <span className="text-gray-600">{plan.name}</span>
                            <span className="text-green-600">✓</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="mt-6 text-center text-sm text-gray-500">
                    Insurance information last updated: {new Date(hospitalInsurance.lastUpdated).toLocaleString()}
                    {hospitalInsurance.dataSource === 'hospital-records' && (
                      <span className="ml-2 text-blue-600">• Verified with hospital billing department</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading insurance information...</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'patients' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">Patient Medical Records</h2>
                <p className="text-gray-600">Secure access to patient medical observations and data</p>
              </div>
              
              <ProtectedPatientRecords 
                hospitalName={hospital?.name}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}