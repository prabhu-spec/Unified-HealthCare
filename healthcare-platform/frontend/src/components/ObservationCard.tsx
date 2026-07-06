import { Observation } from '@/lib/fhir-client';
import { getObservationCode, getObservationValue, formatDateTime } from '@/lib/utils';

interface ObservationCardProps {
  observation: Observation;
  onClick?: () => void;
}

export default function ObservationCard({ observation, onClick }: ObservationCardProps) {
  const code = getObservationCode(observation);
  const value = getObservationValue(observation);
  const patientName = observation.subject?.display || 'Unknown Patient';
  const performerName = observation.performer?.[0]?.display || 'Unknown Performer';
  const effectiveDate = formatDateTime(observation.effectiveDateTime);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'final': return 'bg-green-100 text-green-800';
      case 'preliminary': return 'bg-yellow-100 text-yellow-800';
      case 'amended': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
      onClick={onClick}
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{code}</h3>
        
        <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
          <div className="text-2xl font-bold text-green-700 mb-1">{value}</div>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(observation.status)}`}>
            {observation.status}
          </span>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <span className="font-medium mr-2">👤 Patient:</span>
            <span>{patientName}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium mr-2">👨‍⚕️ Performed by:</span>
            <span>{performerName}</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium mr-2">📅 Date:</span>
            <span>{effectiveDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
}