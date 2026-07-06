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
}

export interface Bundle extends FHIRResource {
  resourceType: 'Bundle';
  entry?: Array<{
    resource: FHIRResource;
  }>;
}

class FHIRClient {
  private client: AxiosInstance;
  private baseURL: string;
  private useMockData: boolean;

  constructor(
    baseURL: string = process.env.EPIC_FHIR_BASE_URL || 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4', 
    useMockData: boolean = process.env.USE_MOCK_DATA_FALLBACK === 'true'
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

  // Skip Epic authentication - use SMART on FHIR instead
  async ensureAuthenticated(): Promise<void> {
    console.log('🔄 Skipping Epic authentication, using SMART on FHIR for real data...');
    return;
  }

  // Get real patients from SMART on FHIR test server
  async getRealPatientsFromSMART(): Promise<Bundle> {
    console.log('🔄 Fetching REAL patients from SMART on FHIR test server...');
    
    try {
      const smartClient = axios.create({
        baseURL: 'https://hapi.fhir.org/baseR4',
        headers: {
          'Accept': 'application/fhir+json',
          'Content-Type': 'application/fhir+json',
        },
        timeout: 15000,
      });

      const response = await smartClient.get('/Patient', {
        params: {
          '_count': '20',
          '_sort': 'family'
        }
      });

      if (response.data && response.data.entry && response.data.entry.length > 0) {
        console.log(`✅ SUCCESS: Loaded ${response.data.entry.length} REAL patients from SMART on FHIR`);
        return response.data;
      }

      throw new Error('No patients found in SMART on FHIR test server');
      
    } catch (error: any) {
      console.error('❌ SMART on FHIR patient fetch failed:', error.response?.data || error.message);
      throw error;
    }
  }

  // Get patients with SMART on FHIR priority
  async getPatients(params: Record<string, string> = {}): Promise<Bundle> {
    console.log('🔄 Attempting to fetch REAL patient data...');
    
    // Strategy 1: Try SMART on FHIR test server first (most reliable)
    try {
      console.log('🔄 Trying SMART on FHIR test server for real patients...');
      const smartResult = await this.getRealPatientsFromSMART();
      if (smartResult.entry && smartResult.entry.length > 0) {
        console.log(`✅ SUCCESS: Using ${smartResult.entry.length} REAL patients from SMART on FHIR`);
        return smartResult;
      }
    } catch (smartError: any) {
      console.warn('⚠️ SMART on FHIR failed, skipping Epic FHIR...', smartError.message);
    }
    
    // Strategy 2: Skip Epic FHIR for now (authentication issues)
    console.log('⚠️ Skipping Epic FHIR due to authentication configuration issues');
      
      // Only use mock data as absolute last resort
      if (this.useMockData) {
        console.warn('⚠️ Falling back to mock patient data - Real patient data unavailable');
        const { mockPatientsBundle } = await import('./mock-data');
        return mockPatientsBundle;
      } else {
        throw new Error(`Real patient data unavailable`);
      }
  }
}

// Export singleton instance
export const fhirClient = new FHIRClient();
export default FHIRClient;