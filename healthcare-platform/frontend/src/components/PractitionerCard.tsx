import { Practitioner } from '@/lib/fhir-client';
import { getPractitionerName, getContactInfo } from '@/lib/utils';

interface PractitionerCardProps {
  practitioner: Practitioner;
  onClick?: () => void;
}

export default function PractitionerCard({ practitioner, onClick }: PractitionerCardProps) {
  const name = getPractitionerName(practitioner);
  const { phone } = getContactInfo(practitioner.telecom || []);
  const npi = practitioner.identifier?.find((id: any) => id.system?.includes('npi'))?.value;
  const qualifications = practitioner.qualification?.map((q: any) => q.code?.coding?.[0]?.display).filter(Boolean) || [];
  const location = practitioner.address?.[0];
  const locationStr = location ? `${location.city}, ${location.state}` : '';

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
      onClick={onClick}
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">{name}</h3>
        <p className="text-sm text-gray-600 mb-2">NPI: {npi || 'N/A'}</p>
        
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700 mb-1">Specialties:</p>
          <div className="flex flex-wrap gap-1">
            {qualifications.map((qualification: any, index: number) => (
              <span 
                key={index}
                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
              >
                {qualification}
              </span>
            ))}
          </div>
        </div>
        
        <div className="space-y-1 text-sm">
          {locationStr && (
            <div className="flex items-center text-red-600">
              <span className="mr-2">📍</span>
              <span>{locationStr}</span>
            </div>
          )}
          
          {phone && (
            <div className="flex items-center text-red-600">
              <span className="mr-2">📞</span>
              <span>{phone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}