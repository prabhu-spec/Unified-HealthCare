// Epic FHIR Configuration
export const EPIC_CONFIG = {
  // Epic FHIR Base URLs
  SANDBOX_URL: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
  PRODUCTION_URL: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
  
  // Epic OAuth Configuration
  OAUTH_URL: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token',
  
  // Epic App Credentials (Replace with your actual Epic app credentials)
  CLIENT_ID: process.env.EPIC_CLIENT_ID || 'your-epic-client-id',
  CLIENT_SECRET: process.env.EPIC_CLIENT_SECRET || 'your-epic-client-secret',
  
  // Epic FHIR Scopes
  SCOPES: [
    'system/Patient.read',
    'system/Practitioner.read', 
    'system/Organization.read',
    'system/Observation.read',
    'system/Location.read'
  ].join(' '),
  
  // Epic-specific search parameters
  SEARCH_PARAMS: {
    // Common Epic FHIR search parameters
    COUNT: '50', // Maximum results per page
    INCLUDE_TOTAL: 'accurate',
    
    // Practitioner search parameters
    PRACTITIONER_ACTIVE: 'true',
    PRACTITIONER_INCLUDE: 'Practitioner:location,Practitioner:organization',
    
    // Organization search parameters  
    ORGANIZATION_ACTIVE: 'true',
    ORGANIZATION_TYPE: 'prov', // Healthcare Provider
  },
  
  // Epic FHIR Resource IDs for common hospitals
  HOSPITAL_IDS: {
    'southeast-health': 'eVzGRdEJf8b8yKqdo.awjOQB', // Example Epic Organization ID
    'marshall-medical': 'eVzGRdEJf8b8yKqdo.bwjOQC', // Example Epic Organization ID
    'north-alabama': 'eVzGRdEJf8b8yKqdo.cwjOQD', // Example Epic Organization ID
  }
};

// Epic FHIR Error Codes
export const EPIC_ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500
};

// Epic FHIR Response Status
export const EPIC_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  PARTIAL: 'partial'
};