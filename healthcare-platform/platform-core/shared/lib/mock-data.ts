// Mock data for development and testing
import { Patient, Practitioner, Organization, Observation, Bundle } from './fhir-client';

export const mockPatients: Patient[] = [
  {
    resourceType: 'Patient',
    id: 'patient-1',
    name: [{
      use: 'official',
      family: 'Smith',
      given: ['John', 'Michael']
    }],
    gender: 'male',
    birthDate: '1985-03-15',
    telecom: [{
      system: 'phone',
      value: '+1-555-0123',
      use: 'home'
    }, {
      system: 'email',
      value: 'john.smith@email.com',
      use: 'home'
    }],
    address: [{
      use: 'home',
      line: ['123 Main St'],
      city: 'Springfield',
      state: 'IL',
      postalCode: '62701',
      country: 'US'
    }],
    identifier: [{
      system: 'http://hospital.example.org/patients',
      value: 'MRN123456'
    }]
  },
  {
    resourceType: 'Patient',
    id: 'patient-2',
    name: [{
      use: 'official',
      family: 'Johnson',
      given: ['Sarah', 'Elizabeth']
    }],
    gender: 'female',
    birthDate: '1992-07-22',
    telecom: [{
      system: 'phone',
      value: '+1-555-0456',
      use: 'mobile'
    }, {
      system: 'email',
      value: 'sarah.johnson@email.com',
      use: 'home'
    }],
    address: [{
      use: 'home',
      line: ['456 Oak Ave'],
      city: 'Springfield',
      state: 'IL',
      postalCode: '62702',
      country: 'US'
    }],
    identifier: [{
      system: 'http://hospital.example.org/patients',
      value: 'MRN789012'
    }]
  },
  {
    resourceType: 'Patient',
    id: 'patient-3',
    name: [{
      use: 'official',
      family: 'Williams',
      given: ['Robert', 'James']
    }],
    gender: 'male',
    birthDate: '1978-11-08',
    telecom: [{
      system: 'phone',
      value: '+1-555-0789',
      use: 'work'
    }, {
      system: 'email',
      value: 'robert.williams@email.com',
      use: 'work'
    }],
    address: [{
      use: 'home',
      line: ['789 Pine St', 'Apt 2B'],
      city: 'Dothan',
      state: 'AL',
      postalCode: '36301',
      country: 'US'
    }],
    identifier: [{
      system: 'http://hospital.example.org/patients',
      value: 'MRN345678'
    }]
  },
  {
    resourceType: 'Patient',
    id: 'patient-4',
    name: [{
      use: 'official',
      family: 'Davis',
      given: ['Maria', 'Carmen']
    }],
    gender: 'female',
    birthDate: '1965-04-12',
    telecom: [{
      system: 'phone',
      value: '+1-555-0321',
      use: 'home'
    }, {
      system: 'email',
      value: 'maria.davis@email.com',
      use: 'home'
    }],
    address: [{
      use: 'home',
      line: ['321 Elm Dr'],
      city: 'Florence',
      state: 'AL',
      postalCode: '35630',
      country: 'US'
    }],
    identifier: [{
      system: 'http://hospital.example.org/patients',
      value: 'MRN901234'
    }]
  },
  {
    resourceType: 'Patient',
    id: 'patient-5',
    name: [{
      use: 'official',
      family: 'Brown',
      given: ['Michael', 'Anthony']
    }],
    gender: 'male',
    birthDate: '1990-09-25',
    telecom: [{
      system: 'phone',
      value: '+1-555-0654',
      use: 'mobile'
    }, {
      system: 'email',
      value: 'michael.brown@email.com',
      use: 'home'
    }],
    address: [{
      use: 'home',
      line: ['654 Maple Ave'],
      city: 'Boaz',
      state: 'AL',
      postalCode: '35957',
      country: 'US'
    }],
    identifier: [{
      system: 'http://hospital.example.org/patients',
      value: 'MRN567890'
    }]
  },
  {
    resourceType: 'Patient',
    id: 'patient-6',
    name: [{
      use: 'official',
      family: 'Wilson',
      given: ['Jennifer', 'Lynn']
    }],
    gender: 'female',
    birthDate: '1988-01-30',
    telecom: [{
      system: 'phone',
      value: '+1-555-0987',
      use: 'home'
    }, {
      system: 'email',
      value: 'jennifer.wilson@email.com',
      use: 'home'
    }],
    address: [{
      use: 'home',
      line: ['987 Cedar Ln'],
      city: 'Opp',
      state: 'AL',
      postalCode: '36467',
      country: 'US'
    }],
    identifier: [{
      system: 'http://hospital.example.org/patients',
      value: 'MRN234567'
    }]
  },
  {
    resourceType: 'Patient',
    id: 'patient-7',
    name: [{
      use: 'official',
      family: 'Anderson',
      given: ['David', 'Paul']
    }],
    gender: 'male',
    birthDate: '1972-06-18',
    telecom: [{
      system: 'phone',
      value: '+1-555-0147',
      use: 'work'
    }, {
      system: 'email',
      value: 'david.anderson@email.com',
      use: 'work'
    }],
    address: [{
      use: 'home',
      line: ['147 Birch St'],
      city: 'Luverne',
      state: 'AL',
      postalCode: '36049',
      country: 'US'
    }],
    identifier: [{
      system: 'http://hospital.example.org/patients',
      value: 'MRN678901'
    }]
  },
  {
    resourceType: 'Patient',
    id: 'patient-8',
    name: [{
      use: 'official',
      family: 'Taylor',
      given: ['Lisa', 'Marie']
    }],
    gender: 'female',
    birthDate: '1995-12-03',
    telecom: [{
      system: 'phone',
      value: '+1-555-0258',
      use: 'mobile'
    }, {
      system: 'email',
      value: 'lisa.taylor@email.com',
      use: 'home'
    }],
    address: [{
      use: 'home',
      line: ['258 Walnut Ave'],
      city: 'Dothan',
      state: 'AL',
      postalCode: '36303',
      country: 'US'
    }],
    identifier: [{
      system: 'http://hospital.example.org/patients',
      value: 'MRN789123'
    }]
  }
];

export const mockPractitioners: Practitioner[] = [
  {
    resourceType: 'Practitioner',
    id: 'practitioner-1',
    name: [{
      use: 'official',
      family: 'BAKER',
      given: ['MURRAY'],
      prefix: ['MD']
    }],
    telecom: [{
      system: 'phone',
      value: '334-793-5000',
      use: 'work'
    }],
    qualification: [{
      code: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0360',
          code: 'Emergency Medicine',
          display: 'Emergency Medicine'
        }]
      }
    }, {
      code: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0360',
          code: 'Family Medicine',
          display: 'Family Medicine'
        }]
      }
    }],
    identifier: [{
      system: 'http://hl7.org/fhir/sid/us-npi',
      value: '1679547848'
    }],
    address: [{
      use: 'work',
      city: 'DOTHAN',
      state: 'AL'
    }]
  },
  {
    resourceType: 'Practitioner',
    id: 'practitioner-2',
    name: [{
      use: 'official',
      family: 'BARRON',
      given: ['MERRILL'],
      prefix: ['MD']
    }],
    telecom: [{
      system: 'phone',
      value: '334-340-2600',
      use: 'work'
    }],
    qualification: [{
      code: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0360',
          code: 'Family Medicine',
          display: 'Family Medicine'
        }]
      }
    }],
    identifier: [{
      system: 'http://hl7.org/fhir/sid/us-npi',
      value: '1790742468'
    }],
    address: [{
      use: 'work',
      city: 'DOTHAN',
      state: 'AL'
    }]
  },
  {
    resourceType: 'Practitioner',
    id: 'practitioner-3',
    name: [{
      use: 'official',
      family: 'BODIFORD',
      given: ['BRANDY'],
      prefix: ['D.O.']
    }],
    telecom: [{
      system: 'phone',
      value: '334-793-9595',
      use: 'work'
    }],
    qualification: [{
      code: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0360',
          code: 'Family Medicine',
          display: 'Family Medicine'
        }]
      }
    }],
    identifier: [{
      system: 'http://hl7.org/fhir/sid/us-npi',
      value: '1942466073'
    }],
    address: [{
      use: 'work',
      city: 'DOTHAN',
      state: 'AL'
    }]
  },
  {
    resourceType: 'Practitioner',
    id: 'practitioner-4',
    name: [{
      use: 'official',
      family: 'BRITT',
      given: ['TIFFANY'],
      prefix: ['CRNP']
    }],
    telecom: [{
      system: 'phone',
      value: '334-796-3796',
      use: 'work'
    }],
    qualification: [{
      code: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0360',
          code: 'Family Medicine',
          display: 'Family Medicine'
        }]
      }
    }],
    identifier: [{
      system: 'http://hl7.org/fhir/sid/us-npi',
      value: '1649880014'
    }],
    address: [{
      use: 'work',
      city: 'DOTHAN',
      state: 'AL'
    }]
  },
  {
    resourceType: 'Practitioner',
    id: 'practitioner-5',
    name: [{
      use: 'official',
      family: 'CHAVERS',
      given: ['AMANDA'],
      prefix: ['M.D.']
    }],
    telecom: [{
      system: 'phone',
      value: '334-793-2120',
      use: 'work'
    }],
    qualification: [{
      code: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0360',
          code: 'Family Medicine',
          display: 'Family Medicine'
        }]
      }
    }],
    identifier: [{
      system: 'http://hl7.org/fhir/sid/us-npi',
      value: '1689725269'
    }],
    address: [{
      use: 'work',
      city: 'DOTHAN',
      state: 'AL'
    }]
  },
  {
    resourceType: 'Practitioner',
    id: 'practitioner-6',
    name: [{
      use: 'official',
      family: 'CLARK',
      given: ['CARLOS'],
      prefix: ['MD']
    }],
    telecom: [{
      system: 'phone',
      value: '334-793-5000',
      use: 'work'
    }],
    qualification: [{
      code: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0360',
          code: 'Family Medicine',
          display: 'Family Medicine'
        }]
      }
    }],
    identifier: [{
      system: 'http://hl7.org/fhir/sid/us-npi',
      value: '1063851277'
    }],
    address: [{
      use: 'work',
      city: 'DOTHAN',
      state: 'AL'
    }]
  }
];

export const mockOrganizations: Organization[] = [
  {
    resourceType: 'Organization',
    id: 'org-1',
    name: 'SOUTHEAST HEALTH MEDICAL CENTER',
    type: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/organization-type',
        code: 'prov',
        display: 'Acute Care Hospitals'
      }]
    }],
    telecom: [{
      system: 'phone',
      value: '(334) 793-8701',
      use: 'work'
    }],
    address: [{
      use: 'work',
      line: ['1108 ROSS CLARK CIRCLE'],
      city: 'DOTHAN',
      state: 'AL',
      postalCode: '36301',
      country: 'US'
    }],
    extension: [{
      url: 'http://hl7.org/fhir/StructureDefinition/organization-rating',
      valueDecimal: 4.0
    }, {
      url: 'http://hl7.org/fhir/StructureDefinition/organization-ownership',
      valueString: 'Government - Hospital District or Authority'
    }, {
      url: 'http://hl7.org/fhir/StructureDefinition/organization-emergency-services',
      valueBoolean: true
    }]
  },
  {
    resourceType: 'Organization',
    id: 'org-2',
    name: 'MIZELL MEMORIAL HOSPITAL',
    type: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/organization-type',
        code: 'prov',
        display: 'Acute Care Hospitals'
      }]
    }],
    telecom: [{
      system: 'phone',
      value: '(334) 493-3541',
      use: 'work'
    }],
    address: [{
      use: 'work',
      line: ['702 N MAIN ST, OPP'],
      city: 'AL',
      state: 'AL',
      postalCode: '36467',
      country: 'US'
    }],
    extension: [{
      url: 'http://hl7.org/fhir/StructureDefinition/organization-rating',
      valueDecimal: 1.0
    }, {
      url: 'http://hl7.org/fhir/StructureDefinition/organization-emergency-services',
      valueBoolean: true
    }]
  },
  {
    resourceType: 'Organization',
    id: 'org-3',
    name: 'CRENSHAW COMMUNITY HOSPITAL',
    type: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/organization-type',
        code: 'prov',
        display: 'Acute Care Hospitals'
      }]
    }],
    telecom: [{
      system: 'phone',
      value: '(334) 335-3374',
      use: 'work'
    }],
    address: [{
      use: 'work',
      line: ['101 HOSPITAL CIRCLE'],
      city: 'LUVERNE',
      state: 'AL',
      postalCode: '36049',
      country: 'US'
    }],
    extension: [{
      url: 'http://hl7.org/fhir/StructureDefinition/organization-rating',
      valueString: 'Not Available'
    }, {
      url: 'http://hl7.org/fhir/StructureDefinition/organization-emergency-services',
      valueBoolean: true
    }]
  },
  {
    resourceType: 'Organization',
    id: 'org-4',
    name: "ST. VINCENT'S EAST",
    type: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/organization-type',
        code: 'prov',
        display: 'Acute Care Hospitals'
      }]
    }],
    telecom: [{
      system: 'phone',
      value: '(205) 838-3122',
      use: 'work'
    }],
    address: [{
      use: 'work',
      line: ['50 MEDICAL PARK EAST DRIVE'],
      city: 'BIRMINGHAM',
      state: 'AL',
      postalCode: '35235',
      country: 'US'
    }],
    extension: [{
      url: 'http://hl7.org/fhir/StructureDefinition/organization-rating',
      valueDecimal: 2.0
    }, {
      url: 'http://hl7.org/fhir/StructureDefinition/organization-emergency-services',
      valueBoolean: true
    }]
  },
  {
    resourceType: 'Organization',
    id: 'org-5',
    name: 'DEKALB REGIONAL MEDICAL CENTER',
    type: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/organization-type',
        code: 'prov',
        display: 'Acute Care Hospitals'
      }]
    }],
    telecom: [{
      system: 'phone',
      value: '(256) 845-3150',
      use: 'work'
    }],
    address: [{
      use: 'work',
      line: ['200 MED CENTER DRIVE'],
      city: 'FORT PAYNE',
      state: 'AL',
      postalCode: '35968',
      country: 'US'
    }]
  },
  {
    resourceType: 'Organization',
    id: 'org-6',
    name: 'SHELBY BAPTIST MEDICAL CENTER',
    type: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/organization-type',
        code: 'prov',
        display: 'Acute Care Hospitals'
      }]
    }],
    telecom: [{
      system: 'phone',
      value: '(205) 620-8100',
      use: 'work'
    }],
    address: [{
      use: 'work',
      line: ['1000 FIRST STREET NORTH'],
      city: 'ALABASTER',
      state: 'AL',
      postalCode: '35007',
      country: 'US'
    }]
  },
  {
    resourceType: 'Organization',
    id: 'org-7',
    name: 'CALLAHAN EYE HOSPITAL',
    type: [{
      coding: [{
        system: 'http://terminology.hl7.org/CodeSystem/organization-type',
        code: 'prov',
        display: 'Acute Care Hospitals'
      }]
    }],
    telecom: [{
      system: 'phone',
      value: '(205) 325-8500',
      use: 'work'
    }],
    address: [{
      use: 'work',
      line: ['1720 UNIVERSITY BLVD STE 305'],
      city: 'BIRMINGHAM',
      state: 'AL',
      postalCode: '35233',
      country: 'US'
    }]
  }
];

export const mockObservations: Observation[] = [
  {
    resourceType: 'Observation',
    id: 'obs-1',
    status: 'final',
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '8480-6',
        display: 'Systolic blood pressure'
      }],
      text: 'Systolic blood pressure'
    },
    subject: {
      reference: 'Patient/patient-1',
      display: 'John Michael Smith'
    },
    effectiveDateTime: '2024-12-10T10:30:00Z',
    valueQuantity: {
      value: 120,
      unit: 'mmHg',
      system: 'http://unitsofmeasure.org',
      code: 'mm[Hg]'
    },
    performer: [{
      reference: 'Practitioner/practitioner-1',
      display: 'Dr. Robert James Williams'
    }]
  },
  {
    resourceType: 'Observation',
    id: 'obs-2',
    status: 'final',
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '8462-4',
        display: 'Diastolic blood pressure'
      }],
      text: 'Diastolic blood pressure'
    },
    subject: {
      reference: 'Patient/patient-1',
      display: 'John Michael Smith'
    },
    effectiveDateTime: '2024-12-10T10:30:00Z',
    valueQuantity: {
      value: 80,
      unit: 'mmHg',
      system: 'http://unitsofmeasure.org',
      code: 'mm[Hg]'
    },
    performer: [{
      reference: 'Practitioner/practitioner-1',
      display: 'Dr. Robert James Williams'
    }]
  },
  {
    resourceType: 'Observation',
    id: 'obs-3',
    status: 'final',
    code: {
      coding: [{
        system: 'http://loinc.org',
        code: '29463-7',
        display: 'Body Weight'
      }],
      text: 'Body Weight'
    },
    subject: {
      reference: 'Patient/patient-2',
      display: 'Sarah Elizabeth Johnson'
    },
    effectiveDateTime: '2024-12-09T14:15:00Z',
    valueQuantity: {
      value: 65,
      unit: 'kg',
      system: 'http://unitsofmeasure.org',
      code: 'kg'
    },
    performer: [{
      reference: 'Practitioner/practitioner-2',
      display: 'Dr. Emily Rose Davis'
    }]
  }
];

// Create mock bundles
export const createMockBundle = <T>(resources: T[], resourceType: string): Bundle => ({
  resourceType: 'Bundle',
  type: 'searchset',
  total: resources.length,
  entry: resources.map((resource, index) => ({
    fullUrl: `${resourceType}/${(resource as any).id}`,
    resource: resource as any
  }))
});

export const mockPatientsBundle = createMockBundle(mockPatients, 'Patient');
export const mockPractitionersBundle = createMockBundle(mockPractitioners, 'Practitioner');
export const mockOrganizationsBundle = createMockBundle(mockOrganizations, 'Organization');
export const mockObservationsBundle = createMockBundle(mockObservations, 'Observation');