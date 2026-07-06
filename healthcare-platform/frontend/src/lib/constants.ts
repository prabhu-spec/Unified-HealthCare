/**
 * Doctor types for booking appointments (what the patient selects).
 * Same list used for doctor specialization in profile.
 */
export const DOCTOR_SPECIALIZATIONS = [
  { value: 'general', label: 'General Physician' },
  { value: 'ortho', label: 'Orthopedics' },
  { value: 'gynecology', label: 'Gynecology' },
  { value: 'ophthalmology', label: 'Ophthalmology' },
  { value: 'neurology', label: 'Neurology' },
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'tests', label: 'Tests / Lab' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'ent', label: 'ENT' }
] as const;

export type SpecializationValue = typeof DOCTOR_SPECIALIZATIONS[number]['value'];

/** Document types patients can apply for and collect */
export const MEDICAL_DOCUMENT_TYPES = [
  { value: 'blood_test', label: 'Blood Test' },
  { value: 'xray', label: 'X-Ray' },
  { value: 'ct_scan', label: 'CT Scan' },
  { value: 'mri', label: 'MRI' }
] as const;

/** Blood types for profiles and blood bank (donor/request matching) */
export const BLOOD_TYPES = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' }
] as const;

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
] as const;
