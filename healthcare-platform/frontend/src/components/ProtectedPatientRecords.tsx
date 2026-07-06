'use client';

import { useNavigate } from 'react-router-dom';
import { useAuth, normalizeRole } from '@/lib/auth';
import { useState, useEffect } from 'react';
import ObservationCard from './ObservationCard';
import FHIRClient from '@/lib/fhir-client';
import { mockPatients, mockObservations, getPatientIdsForHospital } from '@/lib/mock-data';
import { coreFetch } from '@/lib/coreApi';
// Define types locally to avoid import issues
interface Observation {
  resourceType: 'Observation';
  id?: string;
  status?: string;
  code?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
  };
  subject?: {
    reference?: string;
  };
  valueQuantity?: {
    value?: number;
    unit?: string;
  };
}

interface PatientDetails {
  patient: any;
  observations: Observation[];
  conditions: any[];
  medications: any[];
  allergies: any[];
  encounters: any[];
  immunizations: any[];
  vitalSigns: {
    bloodPressure?: { systolic: number; diastolic: number; unit: string; date: string };
    heartRate?: { value: number; unit: string; date: string };
    temperature?: { value: number; unit: string; date: string };
    weight?: { value: number; unit: string; date: string };
    height?: { value: number; unit: string; date: string };
    bmi?: { value: number; unit: string; date: string };
  };
  demographics: {
    fullName: string;
    age: number | string;
    gender: string;
    birthDate: string;
    address: string;
    phone: string;
    email: string;
    mrn: string;
    emergencyContact?: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
}

interface ProtectedPatientRecordsProps {
  hospitalName?: string;
}

export default function ProtectedPatientRecords({ hospitalName }: ProtectedPatientRecordsProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [allPatientsData, setAllPatientsData] = useState<PatientDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Load comprehensive data for all patients when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadAllPatientsData();
    }
  }, [isAuthenticated, user]);

  const loadAllPatientsData = async () => {
    setLoading(true);
    try {
      const role = normalizeRole(user?.role);
      let patientsToLoad = mockPatients;
      if (user) {
        try {
          const res = await coreFetch('/api/core/patients', user);
          const apiList = (res.data || []) as Array<{ id: string; name?: Array<{ given?: string[]; family?: string }>; gender?: string; birthDate?: string; identifier?: Array<{ value?: string }> }>;
          if (apiList.length > 0) {
            patientsToLoad = apiList.map((p) => ({
              id: p.id,
              resourceType: 'Patient' as const,
              name: p.name || [{ given: ['Unknown'], family: '' }],
              gender: p.gender,
              birthDate: p.birthDate,
              identifier: p.identifier,
            }));
          }
        } catch {
          /* fallback to mock below */
        }
      }
      if (role === 'patient' && user) {
        patientsToLoad = patientsToLoad.filter((p) => p.id === user.patientId || user.patientId === `Patient/${p.id}`);
      } else if ((role === 'hospital_admin' || role === 'doctor' || role === 'nurse') && user?.hospitalId && patientsToLoad === mockPatients) {
        const ids = getPatientIdsForHospital(user.hospitalId);
        patientsToLoad = mockPatients.filter((p) => ids.has(p.id));
      }
      const list = patientsToLoad;
      
      // Create comprehensive demo patient data with realistic medical information
      const demoComprehensiveData = list.map((patient, index) => {
        // Generate realistic demo medical data for each patient
        const patientObservations = mockObservations.filter(obs => 
          obs.subject?.reference === `Patient/${patient.id}`
        );
        
        // Demo conditions
        const demoConditions = [
          {
            id: `condition-${patient.id}-1`,
            clinicalStatus: { coding: [{ code: 'active', display: 'Active' }] },
            code: { coding: [{ display: 'Hypertension' }] },
            onsetDateTime: '2023-01-15'
          },
          {
            id: `condition-${patient.id}-2`,
            clinicalStatus: { coding: [{ code: 'resolved', display: 'Resolved' }] },
            code: { coding: [{ display: 'Common Cold' }] },
            onsetDateTime: '2024-11-20'
          }
        ].slice(0, 2); // Sample: 2 conditions per patient
        
        // Demo medications
        const demoMedications = [
          {
            id: `med-${patient.id}-1`,
            status: 'active',
            code: { coding: [{ display: 'Lisinopril 10mg' }] },
            form: { coding: [{ display: 'Tablet' }] }
          },
          {
            id: `med-${patient.id}-2`,
            status: 'active',
            code: { coding: [{ display: 'Metformin 500mg' }] },
            form: { coding: [{ display: 'Tablet' }] }
          }
        ];
        
        // Demo allergies
        const demoAllergies = [
          {
            id: `allergy-${patient.id}-1`,
            substance: { coding: [{ display: 'Penicillin' }] },
            criticality: 'high',
            type: 'allergy',
            status: 'active',
            reaction: [{ manifestation: [{ coding: [{ display: 'Skin rash' }] }] }]
          }
        ];
        
        // Demo encounters
        const demoEncounters = [
          {
            id: `encounter-${patient.id}-1`,
            status: 'finished',
            class: { display: 'Outpatient Visit' },
            period: { start: '2024-12-01T10:00:00Z' },
            reasonCode: [{ coding: [{ display: 'Annual Physical' }] }]
          },
          {
            id: `encounter-${patient.id}-2`,
            status: 'finished',
            class: { display: 'Emergency Visit' },
            period: { start: '2024-11-15T14:30:00Z' },
            reasonCode: [{ coding: [{ display: 'Chest Pain' }] }]
          }
        ];
        
        // Demo immunizations
        const demoImmunizations = [
          {
            id: `immunization-${patient.id}-1`,
            status: 'completed',
            vaccineCode: { coding: [{ display: 'COVID-19 Vaccine' }] },
            occurrenceDateTime: '2024-09-15',
            lotNumber: 'LOT123456'
          },
          {
            id: `immunization-${patient.id}-2`,
            status: 'completed',
            vaccineCode: { coding: [{ display: 'Influenza Vaccine' }] },
            occurrenceDateTime: '2024-10-01',
            lotNumber: 'FLU789012'
          }
        ];
        
        return {
          patient,
          observations: patientObservations,
          conditions: demoConditions,
          medications: demoMedications,
          allergies: demoAllergies,
          encounters: demoEncounters,
          immunizations: demoImmunizations,
          vitalSigns: {
            bloodPressure: { 
              systolic: 110 + Math.floor(Math.random() * 40), 
              diastolic: 70 + Math.floor(Math.random() * 20), 
              unit: 'mmHg', 
              date: new Date().toISOString() 
            },
            heartRate: { 
              value: 60 + Math.floor(Math.random() * 40), 
              unit: 'bpm', 
              date: new Date().toISOString() 
            },
            temperature: { 
              value: 97.5 + Math.random() * 2, 
              unit: '°F', 
              date: new Date().toISOString() 
            },
            weight: {
              value: 120 + Math.floor(Math.random() * 100),
              unit: 'lbs',
              date: new Date().toISOString()
            },
            height: {
              value: 60 + Math.floor(Math.random() * 15),
              unit: 'inches',
              date: new Date().toISOString()
            },
            bmi: {
              value: 18.5 + Math.random() * 15,
              unit: 'kg/m²',
              date: new Date().toISOString()
            }
          },
          demographics: {
            fullName: patient.name?.[0] ? `${patient.name[0].given?.join(' ')} ${patient.name[0].family}` : 'Unknown Name',
            age: patient.birthDate ? new Date().getFullYear() - new Date(patient.birthDate).getFullYear() : 'Unknown',
            gender: patient.gender || 'Unknown',
            birthDate: patient.birthDate || 'Unknown',
            address: patient.address?.[0] ? `${patient.address[0].line?.join(', ')}, ${patient.address[0].city}, ${patient.address[0].state} ${patient.address[0].postalCode}` : 'Demo Address',
            phone: patient.telecom?.find((t: any) => t.system === 'phone')?.value || '(555) 123-4567',
            email: patient.telecom?.find((t: any) => t.system === 'email')?.value || 'demo@example.com',
            mrn: patient.identifier?.[0]?.value || `MRN${String(index + 1).padStart(6, '0')}`,
            emergencyContact: {
              name: 'Emergency Contact Name',
              relationship: 'Spouse',
              phone: '(555) 987-6543'
            }
          }
        };
      });
      
      setAllPatientsData(demoComprehensiveData.length > 0 ? demoComprehensiveData : []);
      if (demoComprehensiveData.length > 0) {
        setSelectedPatientId(demoComprehensiveData[0].patient.id);
      }
    } catch (error) {
      console.error('Failed to load demo patient data:', error);
      setAllPatientsData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    // Get current URL for redirect after login
    const currentUrl = window.location.pathname + window.location.search;
    navigate(`/login?redirect=${encodeURIComponent(currentUrl)}`);
  };

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <>
        <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-purple-200">
          <div className="max-w-md mx-auto">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Secure Patient Records Access
            </h3>
            <p className="text-gray-600 mb-6">
              Patient medical records are protected by HIPAA regulations. Please login or register to access this information securely.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleLoginRedirect}
                className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                🔐 Login / Register to Access Records
              </button>
              
              <div className="text-sm text-gray-500">
                <p className="mb-2">✓ HIPAA Compliant Security</p>
                <p className="mb-2">✓ Encrypted Data Protection</p>
                <p>✓ Authorized Access Only</p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // If authenticated, show patient records
  return (
    <div>
      {/* User Info Header */}
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="text-green-600 text-2xl mr-3">✅</div>
            <div>
              <h3 className="font-medium text-green-800">
                Authenticated Access - {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-sm text-green-600">
                {normalizeRole(user?.role) === 'patient' ? '👤 Patient Account' : '👨‍⚕️ Healthcare Provider'} • 
                Secure access to {hospitalName || 'hospital'} records
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="text-sm text-green-700 hover:text-green-900 underline"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading comprehensive patient data...</p>
        </div>
      )}

      {/* Patient Search and Filter */}
      {!loading && allPatientsData.length > 0 && (
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">👥 All Patients ({allPatientsData.length})</h3>
              <div className="text-sm text-gray-500">
                Select a patient to view detailed records
              </div>
            </div>
            

            
            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search patients by name or MRN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            {/* Patient List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {allPatientsData
                .filter(patientData => {
                  if (!searchTerm) return true;
                  const fullName = patientData.demographics.fullName?.toLowerCase() || '';
                  const mrn = patientData.demographics.mrn?.toLowerCase() || '';
                  return fullName.includes(searchTerm.toLowerCase()) || mrn.includes(searchTerm.toLowerCase());
                })
                .map((patientData) => (
                <div
                  key={patientData.patient.id}
                  onClick={() => setSelectedPatientId(patientData.patient.id || null)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedPatientId === patientData.patient.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {patientData.demographics.fullName}
                      </div>
                      <div className="text-sm text-gray-600">
                        MRN: {patientData.demographics.mrn}
                      </div>
                      <div className="text-sm text-gray-500">
                        Age: {patientData.demographics.age} • {patientData.patient.gender}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Conditions</div>
                      <div className="font-bold text-purple-600">{patientData.conditions.length}</div>
                    </div>
                  </div>
                  
                  {/* Quick indicators */}
                  <div className="mt-3 flex space-x-2">
                    {patientData.allergies.length > 0 && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        ⚠️ {patientData.allergies.length} Allergies
                      </span>
                    )}
                    {patientData.medications.length > 0 && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        💊 {patientData.medications.length} Meds
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Selected Patient Comprehensive Data Display */}
      {!loading && allPatientsData.length > 0 && selectedPatientId && (() => {
        const selectedPatientData = allPatientsData.find(p => p.patient.id === selectedPatientId);
        return selectedPatientData ? (
        <div className="space-y-6">
          {/* Patient Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedPatientData.demographics.fullName}
                </h2>
                <p className="text-gray-600">
                  MRN: {selectedPatientData.demographics.mrn} • Age: {selectedPatientData.demographics.age} • 
                  Gender: {selectedPatientData.patient.gender}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Last Updated</div>
                <div className="font-medium">{new Date().toLocaleDateString()}</div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm text-blue-600">Blood Pressure</div>
                <div className="font-bold text-blue-900">
                  {selectedPatientData.vitalSigns.bloodPressure ? 
                    `${selectedPatientData.vitalSigns.bloodPressure.systolic}/${selectedPatientData.vitalSigns.bloodPressure.diastolic}` : 
                    'N/A'
                  }
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-sm text-green-600">Heart Rate</div>
                <div className="font-bold text-green-900">
                  {selectedPatientData.vitalSigns.heartRate?.value || 'N/A'} bpm
                </div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="text-sm text-yellow-600">BMI</div>
                <div className="font-bold text-yellow-900">
                  {selectedPatientData.vitalSigns.bmi?.value || 'N/A'}
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="text-sm text-purple-600">Active Conditions</div>
                <div className="font-bold text-purple-900">
                  {selectedPatientData.conditions.length}
                </div>
              </div>
            </div>
          </div>

          {/* Tabbed Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'overview', label: 'Overview', icon: '📋' },
                  { id: 'vitals', label: 'Vital Signs', icon: '💓' },
                  { id: 'conditions', label: 'Conditions', icon: '🏥' },
                  { id: 'medications', label: 'Medications', icon: '💊' },
                  { id: 'allergies', label: 'Allergies', icon: '⚠️' },
                  { id: 'encounters', label: 'Visits', icon: '📅' },
                  { id: 'immunizations', label: 'Vaccines', icon: '💉' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Demographics */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-3">👤 Patient Demographics</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Full Name:</span> {selectedPatientData.demographics.fullName}</div>
                        <div><span className="font-medium">Age:</span> {selectedPatientData.demographics.age} years</div>
                        <div><span className="font-medium">Gender:</span> {selectedPatientData.patient.gender}</div>
                        <div><span className="font-medium">MRN:</span> {selectedPatientData.demographics.mrn}</div>
                        {selectedPatientData.patient.telecom?.map((contact: any, idx: number) => (
                          <div key={idx}>
                            <span className="font-medium">{contact.system}:</span> {contact.value}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Emergency Contact */}
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-3">🚨 Emergency Contact</h3>
                      <div className="space-y-2 text-sm">
                        <div><span className="font-medium">Name:</span> {selectedPatientData.demographics.emergencyContact?.name}</div>
                        <div><span className="font-medium">Relationship:</span> {selectedPatientData.demographics.emergencyContact?.relationship}</div>
                        <div><span className="font-medium">Phone:</span> {selectedPatientData.demographics.emergencyContact?.phone}</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Observations */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">📊 Recent Medical Observations</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedPatientData.observations.slice(0, 6).map((observation) => (
                        <div key={observation.id} className="relative">
                          <ObservationCard
                            observation={observation}
                            onClick={() => console.log('Selected observation:', observation.id)}
                          />
                          <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            🔒 Secure
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'vitals' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-4">💓 Vital Signs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedPatientData.vitalSigns.bloodPressure && (
                      <div className="bg-red-50 p-4 rounded-lg">
                        <div className="text-red-600 font-medium">Blood Pressure</div>
                        <div className="text-2xl font-bold text-red-900">
                          {selectedPatientData.vitalSigns.bloodPressure.systolic}/{selectedPatientData.vitalSigns.bloodPressure.diastolic}
                        </div>
                        <div className="text-sm text-red-600">{selectedPatientData.vitalSigns.bloodPressure.unit}</div>
                      </div>
                    )}
                    {selectedPatientData.vitalSigns.heartRate && (
                      <div className="bg-pink-50 p-4 rounded-lg">
                        <div className="text-pink-600 font-medium">Heart Rate</div>
                        <div className="text-2xl font-bold text-pink-900">
                          {selectedPatientData.vitalSigns.heartRate.value}
                        </div>
                        <div className="text-sm text-pink-600">{selectedPatientData.vitalSigns.heartRate.unit}</div>
                      </div>
                    )}
                    {selectedPatientData.vitalSigns.temperature && (
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-orange-600 font-medium">Temperature</div>
                        <div className="text-2xl font-bold text-orange-900">
                          {selectedPatientData.vitalSigns.temperature.value}
                        </div>
                        <div className="text-sm text-orange-600">{selectedPatientData.vitalSigns.temperature.unit}</div>
                      </div>
                    )}
                    {selectedPatientData.vitalSigns.weight && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-blue-600 font-medium">Weight</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {selectedPatientData.vitalSigns.weight.value}
                        </div>
                        <div className="text-sm text-blue-600">{selectedPatientData.vitalSigns.weight.unit}</div>
                      </div>
                    )}
                    {selectedPatientData.vitalSigns.height && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-green-600 font-medium">Height</div>
                        <div className="text-2xl font-bold text-green-900">
                          {selectedPatientData.vitalSigns.height.value}
                        </div>
                        <div className="text-sm text-green-600">{selectedPatientData.vitalSigns.height.unit}</div>
                      </div>
                    )}
                    {selectedPatientData.vitalSigns.bmi && (
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-purple-600 font-medium">BMI</div>
                        <div className="text-2xl font-bold text-purple-900">
                          {selectedPatientData.vitalSigns.bmi.value}
                        </div>
                        <div className="text-sm text-purple-600">Body Mass Index</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'conditions' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-4">🏥 Medical Conditions</h3>
                  <div className="space-y-3">
                    {selectedPatientData.conditions.map((condition) => (
                      <div key={condition.id} className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-yellow-900">
                              {condition.code?.coding?.[0]?.display || 'Unknown Condition'}
                            </div>
                            <div className="text-sm text-yellow-700">
                              Status: {condition.clinicalStatus?.coding?.[0]?.display || 'Unknown'}
                            </div>
                            {condition.onsetDateTime && (
                              <div className="text-sm text-yellow-600">
                                Onset: {new Date(condition.onsetDateTime).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <div className="text-yellow-600">
                            {condition.clinicalStatus?.coding?.[0]?.code === 'active' ? '🔴' : '🟡'}
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedPatientData.conditions.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No active medical conditions recorded.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'medications' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-4">💊 Current Medications</h3>
                  <div className="space-y-3">
                    {selectedPatientData.medications.map((medication) => (
                      <div key={medication.id} className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-blue-900">
                              {medication.code?.coding?.[0]?.display || 'Unknown Medication'}
                            </div>
                            <div className="text-sm text-blue-700">
                              Status: {medication.status || 'Unknown'}
                            </div>
                            {medication.form && (
                              <div className="text-sm text-blue-600">
                                Form: {medication.form.coding?.[0]?.display}
                              </div>
                            )}
                          </div>
                          <div className="text-blue-600">💊</div>
                        </div>
                      </div>
                    ))}
                    {selectedPatientData.medications.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No current medications recorded.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'allergies' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-4">⚠️ Allergies & Intolerances</h3>
                  <div className="space-y-3">
                    {selectedPatientData.allergies.map((allergy) => (
                      <div key={allergy.id} className="bg-red-50 border border-red-200 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-red-900">
                              {allergy.substance?.coding?.[0]?.display || 'Unknown Allergen'}
                            </div>
                            <div className="text-sm text-red-700">
                              Criticality: {allergy.criticality || 'Unknown'}
                            </div>
                            <div className="text-sm text-red-600">
                              Type: {allergy.type || 'Unknown'} • Status: {allergy.status || 'Unknown'}
                            </div>
                            {allergy.reaction && allergy.reaction.length > 0 && (
                              <div className="text-sm text-red-600">
                                Reaction: {allergy.reaction[0].manifestation?.[0]?.coding?.[0]?.display}
                              </div>
                            )}
                          </div>
                          <div className="text-red-600">
                            {allergy.criticality === 'high' ? '🚨' : '⚠️'}
                          </div>
                        </div>
                      </div>
                    ))}
                    {selectedPatientData.allergies.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No known allergies or intolerances recorded.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'encounters' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-4">📅 Recent Visits & Encounters</h3>
                  <div className="space-y-3">
                    {selectedPatientData.encounters.map((encounter) => (
                      <div key={encounter.id} className="bg-green-50 border border-green-200 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-green-900">
                              {encounter.class?.display || 'Medical Visit'}
                            </div>
                            <div className="text-sm text-green-700">
                              Status: {encounter.status || 'Unknown'}
                            </div>
                            {encounter.period?.start && (
                              <div className="text-sm text-green-600">
                                Date: {new Date(encounter.period.start).toLocaleDateString()}
                              </div>
                            )}
                            {encounter.reasonCode && encounter.reasonCode.length > 0 && (
                              <div className="text-sm text-green-600">
                                Reason: {encounter.reasonCode[0].coding?.[0]?.display}
                              </div>
                            )}
                          </div>
                          <div className="text-green-600">📅</div>
                        </div>
                      </div>
                    ))}
                    {selectedPatientData.encounters.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No recent visits or encounters recorded.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'immunizations' && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-4">💉 Immunization History</h3>
                  <div className="space-y-3">
                    {selectedPatientData.immunizations.map((immunization) => (
                      <div key={immunization.id} className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-indigo-900">
                              {immunization.vaccineCode?.coding?.[0]?.display || 'Unknown Vaccine'}
                            </div>
                            <div className="text-sm text-indigo-700">
                              Status: {immunization.status || 'Unknown'}
                            </div>
                            {immunization.occurrenceDateTime && (
                              <div className="text-sm text-indigo-600">
                                Date: {new Date(immunization.occurrenceDateTime).toLocaleDateString()}
                              </div>
                            )}
                            {immunization.lotNumber && (
                              <div className="text-sm text-indigo-600">
                                Lot: {immunization.lotNumber}
                              </div>
                            )}
                          </div>
                          <div className="text-indigo-600">💉</div>
                        </div>
                      </div>
                    ))}
                    {selectedPatientData.immunizations.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No immunization records available.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        ) : null;
      })()}

      {/* Fallback for no data */}
      {!loading && allPatientsData.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Patient Data Available</h3>
          <p className="text-gray-600">
            Unable to load comprehensive patient data at this time. Please try again later.
          </p>
        </div>
      )}


    </div>
  );
}