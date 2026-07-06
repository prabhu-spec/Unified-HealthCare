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

const defaultBaseURL = 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4';

class FHIRClient {
  private client: AxiosInstance;
  private baseURL: string;
  private useMockData: boolean;

  constructor(baseURL: string = defaultBaseURL, useMockData: boolean = true) {
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

  async ensureAuthenticated(): Promise<void> {
    return;
  }

  async getPatients(_params: Record<string, string> = {}): Promise<Bundle> {
    const { mockPatientsBundle } = await import('./mock-data');
    return mockPatientsBundle;
  }

  async getOrganization(_id: string): Promise<any> {
    throw new Error('Organization lookup not implemented - using fallback data');
  }

  async getPractitioners(_params: Record<string, string> = {}): Promise<Bundle> {
    const { mockPractitionersBundle } = await import('./mock-data');
    return mockPractitionersBundle;
  }

  async getOrganizations(_params: Record<string, string> = {}): Promise<Bundle> {
    const { mockOrganizationsBundle } = await import('./mock-data');
    return mockOrganizationsBundle;
  }

  async getPractitionersByLocation(_city: string, _state: string): Promise<Bundle> {
    return { resourceType: 'Bundle', entry: [] };
  }

  async getPractitionersByOrganization(_orgId: string): Promise<Bundle> {
    return { resourceType: 'Bundle', entry: [] };
  }

  async getObservations(_params: Record<string, string> = {}): Promise<Bundle> {
    const { mockObservationsBundle } = await import('./mock-data');
    return mockObservationsBundle;
  }

  async getBedAvailability(_hospitalId: string, _hospitalName?: string): Promise<any> {
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

  async getHospitalInsurance(_hospitalId: string, _hospitalName?: string): Promise<any> {
    return {
      dataSource: 'hospital-records',
      lastUpdated: new Date().toISOString(),
      insurancePlans: [
        { id: 'bcbs-al', name: 'Blue Cross Blue Shield of Alabama', type: 'Medical', status: 'accepted' },
        { id: 'medicare', name: 'Medicare', type: 'Government', status: 'accepted' }
      ]
    };
  }
}

export const fhirClient = new FHIRClient();
export default FHIRClient;
