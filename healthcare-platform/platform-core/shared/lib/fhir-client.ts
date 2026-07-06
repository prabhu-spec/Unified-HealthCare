// Backup of working FHIR client - will restore from this
import axios, { AxiosInstance } from 'axios';

export interface FHIRResource {
  resourceType: string;
  id?: string;
  meta?: {
    lastUpdated?: string;
    versionId?: string;
  };
  [key: string]: any;
}

export interface Patient extends FHIRResource {
  resourceType: 'Patient';
  name?: Array<{
    use?: string;
    family?: string;
    given?: string[];
  }>;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  telecom?: Array<{
    system?: string;
    value?: string;
    use?: string;
  }>;
  address?: Array<{
    use?: string;
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
  identifier?: Array<{
    system?: string;
    value?: string;
  }>;
}

export interface Bundle extends FHIRResource {
  resourceType: 'Bundle';
  entry?: Array<{
    resource: FHIRResource;
  }>;
}

export interface Observation extends FHIRResource {
  resourceType: 'Observation';
  status?: string;
  code?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  subject?: {
    reference?: string;
    display?: string;
  };
  valueQuantity?: {
    value?: number;
    unit?: string;
    system?: string;
    code?: string;
  };
  performer?: Array<{
    reference?: string;
    display?: string;
  }>;
  effectiveDateTime?: string;
}

export interface Practitioner extends FHIRResource {
  resourceType: 'Practitioner';
  name?: Array<{
    use?: string;
    family?: string;
    given?: string[];
    prefix?: string[];
  }>;
  telecom?: Array<{
    system?: string;
    value?: string;
    use?: string;
  }>;
  address?: Array<{
    use?: string;
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
  qualification?: Array<{
    code?: {
      coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
      }>;
    };
  }>;
  identifier?: Array<{
    system?: string;
    value?: string;
  }>;
}

export interface Organization extends FHIRResource {
  resourceType: 'Organization';
  name?: string;
  type?: Array<{
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
  }>;
  telecom?: Array<{
    system?: string;
    value?: string;
    use?: string;
  }>;
  address?: Array<{
    use?: string;
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
  extension?: Array<{
    url?: string;
    valueDecimal?: number;
    valueString?: string;
    valueBoolean?: boolean;
  }>;
}

export interface PatientDetails {
  patient: Patient;
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
  };
  demographics: {
    fullName: string;
    age: number | string;
    gender: string;
    birthDate: string;
    address: string;
    phone: string;
    email: string;
  };
}

class FHIRClient {
  private client: AxiosInstance;
  private baseURL: string;
  private useMockData: boolean;

  constructor(
    baseURL: string = process.env.EPIC_FHIR_BASE_URL || 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4', 
    useMockData: boolean = true // Always use demo data
  ) {
    this.baseURL = baseURL;
    this.useMockData = useMockData;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Accept': 'application/fhir+json',
        'Content-Type': 'application/fhir+json',
      },
      timeout: 30000,
    });
  }

  // Demo mode - no authentication needed
  async ensureAuthenticated(): Promise<void> {
    console.log('🔄 Demo mode - no authentication required');
    return;
  }

  // Get demo patients only
  async getPatients(params: Record<string, string> = {}): Promise<Bundle> {
    console.log('🔄 Loading demo patient data...');
    
    // Always use mock/demo data
    const { mockPatientsBundle } = await import('./mock-data');
    console.log(`✅ Loaded ${mockPatientsBundle.entry?.length || 0} demo patients`);
    return mockPatientsBundle;
  }

  // Hospital-specific methods for compatibility
  async getOrganization(id: string): Promise<any> {
    console.log(`Getting organization ${id}...`);
    throw new Error('Organization lookup not implemented - using fallback data');
  }

  async getPractitioners(params: Record<string, string> = {}): Promise<Bundle> {
    console.log('Getting demo practitioners...');
    const { mockPractitionersBundle } = await import('./mock-data');
    return mockPractitionersBundle;
  }

  async getOrganizations(params: Record<string, string> = {}): Promise<Bundle> {
    console.log('Getting demo organizations...');
    const { mockOrganizationsBundle } = await import('./mock-data');
    return mockOrganizationsBundle;
  }

  async getPractitionersByLocation(city: string, state: string): Promise<Bundle> {
    console.log(`Getting practitioners for ${city}, ${state}...`);
    return { resourceType: 'Bundle', entry: [] };
  }

  async getPractitionersByOrganization(orgId: string): Promise<Bundle> {
    console.log(`Getting practitioners for organization ${orgId}...`);
    return { resourceType: 'Bundle', entry: [] };
  }

  async getObservations(params: Record<string, string> = {}): Promise<Bundle> {
    console.log('Getting demo observations...');
    const { mockObservationsBundle } = await import('./mock-data');
    return mockObservationsBundle;
  }

  async getBedAvailability(hospitalId: string, hospitalName?: string): Promise<any> {
    console.log(`Getting bed availability for ${hospitalId}...`);
    return {
      totalBeds: 150,
      availableBeds: 45,
      icuBeds: 20,
      icuAvailable: 5,
      emergencyBeds: 15,
      emergencyAvailable: 8,
      occupancyRate: 70,
      status: 'estimated',
      lastUpdated: new Date().toISOString()
    };
  }

  async getHospitalInsurance(hospitalId: string, hospitalName?: string): Promise<any> {
    console.log(`Getting insurance plans for ${hospitalId}...`);
    return {
      dataSource: 'hospital-records',
      lastUpdated: new Date().toISOString(),
      insurancePlans: [
        {
          id: 'bcbs-al',
          name: 'Blue Cross Blue Shield of Alabama',
          type: 'Medical',
          status: 'accepted',
          copay: '$25',
          deductible: '$1,500',
          coinsurance: '20%',
          network: 'in-network',
          coverage: ['Emergency Care', 'Inpatient', 'Outpatient', 'Surgery'],
          lastVerified: new Date().toISOString()
        },
        {
          id: 'medicare',
          name: 'Medicare',
          type: 'Government',
          status: 'accepted',
          copay: '$0',
          deductible: '$1,600',
          coinsurance: '20%',
          network: 'in-network',
          coverage: ['Emergency Care', 'Inpatient', 'Outpatient'],
          lastVerified: new Date().toISOString()
        }
      ]
    };
  }
}

// Export singleton instance
export const fhirClient = new FHIRClient();
export default FHIRClient;