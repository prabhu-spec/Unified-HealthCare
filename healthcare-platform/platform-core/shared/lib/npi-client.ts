// NPI (National Provider Identifier) API Client
// This connects to the official CMS NPI database with real doctor data

import axios from 'axios';

export interface NPIProvider {
  number: string;
  enumeration_type: string;
  basic: {
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    credential?: string;
    sole_proprietor?: string;
    gender?: string;
    enumeration_date?: string;
    last_updated?: string;
    status?: string;
    name?: string; // For organizations
  };
  taxonomies: Array<{
    code: string;
    desc: string;
    primary: boolean;
    state?: string;
    license?: string;
  }>;
  addresses: Array<{
    country_code: string;
    country_name: string;
    address_purpose: string;
    address_type: string;
    address_1: string;
    address_2?: string;
    city: string;
    state: string;
    postal_code: string;
    telephone_number?: string;
    fax_number?: string;
  }>;
  practiceLocations?: Array<{
    country_code: string;
    country_name: string;
    address_purpose: string;
    address_type: string;
    address_1: string;
    address_2?: string;
    city: string;
    state: string;
    postal_code: string;
    telephone_number?: string;
    fax_number?: string;
  }>;
  endpoints?: Array<{
    endpointType: string;
    endpointTypeDescription: string;
    endpoint: string;
    affiliation?: string;
  }>;
}

export interface NPIResponse {
  result_count: number;
  results: NPIProvider[];
}

class NPIClient {
  private baseURL = 'https://npiregistry.cms.hhs.gov/api';

  // Search for healthcare providers by location and specialty
  async searchProviders(params: {
    city?: string;
    state?: string;
    postal_code?: string;
    taxonomy_description?: string;
    organization_name?: string;
    first_name?: string;
    last_name?: string;
    limit?: number;
  }): Promise<NPIResponse> {
    try {
      const searchParams = new URLSearchParams();
      
      // Add search parameters
      if (params.city) searchParams.append('city', params.city);
      if (params.state) searchParams.append('state', params.state);
      if (params.postal_code) searchParams.append('postal_code', params.postal_code);
      if (params.taxonomy_description) searchParams.append('taxonomy_description', params.taxonomy_description);
      if (params.organization_name) searchParams.append('organization_name', params.organization_name);
      if (params.first_name) searchParams.append('first_name', params.first_name);
      if (params.last_name) searchParams.append('last_name', params.last_name);
      
      // Limit results (default 10, max 200)
      searchParams.append('limit', (params.limit || 20).toString());
      
      // Only individual providers (not organizations)
      searchParams.append('enumeration_type', 'ind');
      
      const url = `${this.baseURL}/?${searchParams.toString()}`;
      console.log('NPI API Request URL:', url);
      
      const response = await axios.get(url, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Healthcare-App/1.0'
        }
      });
      
      console.log('NPI API Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('NPI API error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to NPI registry - network issue');
      } else if (error.response?.status === 429) {
        throw new Error('NPI registry rate limit exceeded - try again later');
      } else if (error.response?.status >= 500) {
        throw new Error('NPI registry server error - try again later');
      } else {
        throw new Error(`NPI registry error: ${error.message}`);
      }
    }
  }

  // Search providers by hospital/organization affiliation
  async searchProvidersByHospital(hospitalName: string, city: string, state: string): Promise<NPIProvider[]> {
    try {
      console.log(`Searching for real doctors at ${hospitalName} in ${city}, ${state}`);
      
      // Try a simple location search first
      const locationSearch = await this.searchProviders({
        city: city,
        state: state,
        limit: 50
      });

      console.log(`NPI API returned ${locationSearch.results.length} providers for ${city}, ${state}`);

      // Filter providers who are in the hospital's location
      const locationProviders = locationSearch.results.filter(provider => {
        // Check if any address matches the hospital location
        const hasMatchingAddress = provider.addresses.some(addr => 
          addr.city.toUpperCase() === city.toUpperCase() && 
          addr.state.toUpperCase() === state.toUpperCase()
        );
        
        // Check if practice locations match
        const hasMatchingPractice = provider.practiceLocations?.some(loc => 
          loc.city.toUpperCase() === city.toUpperCase() && 
          loc.state.toUpperCase() === state.toUpperCase()
        );

        return hasMatchingAddress || hasMatchingPractice;
      });

      let allProviders = [...locationProviders];

      // If we don't have enough providers, try specialty searches
      if (allProviders.length < 8) {
        console.log(`Only found ${allProviders.length} providers, searching by specialty...`);
        
        const commonSpecialties = [
          'Internal Medicine',
          'Family Medicine', 
          'Emergency Medicine'
        ];

        for (const specialty of commonSpecialties) {
          try {
            const specialtyProviders = await this.searchProvidersBySpecialty(specialty, city, state);
            allProviders = [...allProviders, ...specialtyProviders];
            
            if (allProviders.length >= 10) break; // Stop when we have enough
          } catch (error) {
            console.warn(`Failed to search for ${specialty} providers:`, error);
          }
        }
      }

      // Remove duplicates based on NPI number
      const uniqueProviders = allProviders.filter((provider, index, self) => 
        index === self.findIndex(p => p.number === provider.number)
      );

      console.log(`Found ${uniqueProviders.length} unique real providers in ${city}, ${state}`);
      return uniqueProviders.slice(0, 12); // Limit to 12 doctors per hospital
      
    } catch (error) {
      console.error('Error searching providers by hospital:', error);
      
      // If NPI API fails completely, return empty array to trigger fallback
      return [];
    }
  }

  // Search providers by specialty in a location
  async searchProvidersBySpecialty(specialty: string, city: string, state: string): Promise<NPIProvider[]> {
    try {
      const response = await this.searchProviders({
        city: city,
        state: state,
        taxonomy_description: specialty,
        limit: 30
      });

      return response.results;
    } catch (error) {
      console.error('Error searching providers by specialty:', error);
      return [];
    }
  }

  // Convert NPI provider to FHIR Practitioner format
  convertToFHIRPractitioner(npiProvider: NPIProvider): any {
    const name = npiProvider.basic.first_name && npiProvider.basic.last_name ? {
      family: npiProvider.basic.last_name,
      given: [npiProvider.basic.first_name],
      prefix: npiProvider.basic.credential ? [npiProvider.basic.credential] : undefined
    } : undefined;

    const primaryAddress = npiProvider.addresses.find(addr => addr.address_purpose === 'LOCATION') || npiProvider.addresses[0];
    const practiceAddress = npiProvider.practiceLocations?.[0] || primaryAddress;

    return {
      resourceType: 'Practitioner',
      id: `npi-${npiProvider.number}`,
      identifier: [{
        system: 'http://hl7.org/fhir/sid/us-npi',
        value: npiProvider.number
      }],
      name: name ? [name] : undefined,
      telecom: primaryAddress?.telephone_number ? [{
        system: 'phone',
        value: primaryAddress.telephone_number
      }] : undefined,
      address: practiceAddress ? [{
        use: 'work',
        line: [practiceAddress.address_1, practiceAddress.address_2].filter(Boolean),
        city: practiceAddress.city,
        state: practiceAddress.state,
        postalCode: practiceAddress.postal_code
      }] : undefined,
      qualification: npiProvider.taxonomies.map(taxonomy => ({
        code: {
          coding: [{
            system: 'http://nucc.org/provider-taxonomy',
            code: taxonomy.code,
            display: taxonomy.desc
          }]
        }
      })),
      // Add NPI-specific data
      meta: {
        source: 'NPI Registry',
        lastUpdated: npiProvider.basic.last_updated
      }
    };
  }
}

export const npiClient = new NPIClient();
export default NPIClient;