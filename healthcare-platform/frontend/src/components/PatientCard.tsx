import { Patient } from '@/lib/fhir-client';
import { getPatientName, getContactInfo, getAddress, calculateAge, formatDate } from '@/lib/utils';

interface PatientCardProps {
  patient: Patient;
  onClick?: () => void;
}

export default function PatientCard({ patient, onClick }: PatientCardProps) {
  const name = getPatientName(patient);
  const { phone, email } = getContactInfo(patient.telecom || []);
  const address = getAddress(patient.address || []);
  const age = calculateAge(patient.birthDate);
  const mrn = patient.identifier?.find((id: any) => id.system?.includes('patients'))?.value;

  return (
    <div 
      className="hospital-card hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-primary">{name}</h3>
          <p className="text-sm text-secondary">MRN: {mrn || 'N/A'}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-secondary">
            {patient.gender && (
              <span className="capitalize">{patient.gender}</span>
            )}
            {age !== null && (
              <span className="ml-2">Age: {age}</span>
            )}
          </p>
          <p className="text-xs text-secondary">
            DOB: {formatDate(patient.birthDate)}
          </p>
        </div>
      </div>
      
      <div className="space-y-2">
        {phone && (
          <div className="flex items-center text-sm text-secondary">
            <span className="font-medium mr-2 text-primary">Phone:</span>
            <span>{phone}</span>
          </div>
        )}
        {email && (
          <div className="flex items-center text-sm text-secondary">
            <span className="font-medium mr-2 text-primary">Email:</span>
            <span>{email}</span>
          </div>
        )}
        <div className="flex items-start text-sm text-secondary">
          <span className="font-medium mr-2 text-primary">Address:</span>
          <span>{address}</span>
        </div>
      </div>
    </div>
  );
}