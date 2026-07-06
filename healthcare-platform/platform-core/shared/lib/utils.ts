import { format, parseISO } from 'date-fns';

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  try {
    return format(parseISO(dateString), 'MMM dd, yyyy');
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  try {
    return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
  } catch {
    return dateString;
  }
}

export function getPatientName(patient: any): string {
  if (!patient?.name?.[0]) return 'Unknown Patient';
  const name = patient.name[0];
  const given = name.given?.join(' ') || '';
  const family = name.family || '';
  return `${given} ${family}`.trim() || 'Unknown Patient';
}

export function getPractitionerName(practitioner: any): string {
  if (!practitioner?.name?.[0]) return 'Unknown Practitioner';
  const name = practitioner.name[0];
  const prefix = name.prefix?.join(' ') || '';
  const given = name.given?.join(' ') || '';
  const family = name.family || '';
  return `${prefix} ${given} ${family}`.trim() || 'Unknown Practitioner';
}

export function getOrganizationName(organization: any): string {
  return organization?.name || 'Unknown Organization';
}

export function getContactInfo(telecom: any[]): { phone?: string; email?: string } {
  if (!telecom) return {};
  
  const phone = telecom.find(t => t.system === 'phone')?.value;
  const email = telecom.find(t => t.system === 'email')?.value;
  
  return { phone, email };
}

export function getAddress(address: any[]): string {
  if (!address?.[0]) return 'No address';
  
  const addr = address[0];
  const parts = [
    ...(addr.line || []),
    addr.city,
    addr.state,
    addr.postalCode
  ].filter(Boolean);
  
  return parts.join(', ') || 'No address';
}

export function calculateAge(birthDate: string | undefined): number | null {
  if (!birthDate) return null;
  
  try {
    const birth = parseISO(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch {
    return null;
  }
}

export function getObservationValue(observation: any): string {
  if (observation.valueQuantity) {
    const { value, unit } = observation.valueQuantity;
    return `${value} ${unit || ''}`.trim();
  }
  
  if (observation.valueString) {
    return observation.valueString;
  }
  
  return 'No value';
}

export function getObservationCode(observation: any): string {
  if (observation.code?.text) {
    return observation.code.text;
  }
  
  if (observation.code?.coding?.[0]?.display) {
    return observation.code.coding[0].display;
  }
  
  return 'Unknown observation';
}