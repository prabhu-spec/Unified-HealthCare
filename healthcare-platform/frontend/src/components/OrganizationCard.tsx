import { getOrganizationName, getContactInfo, getAddress } from '@/lib/utils';
import { Link } from 'react-router-dom';

// Define Organization type locally
interface Organization {
  resourceType: 'Organization';
  id?: string;
  name?: string;
  address?: Array<{
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
  }>;
  telecom?: Array<{
    system?: string;
    value?: string;
  }>;
  type?: Array<{
    coding?: Array<{
      display?: string;
    }>;
  }>;
  extension?: Array<{
    url?: string;
    valueDecimal?: number;
    valueString?: string;
    valueBoolean?: boolean;
  }>;
}

interface OrganizationCardProps {
  organization: Organization;
  onClick?: () => void;
}

export default function OrganizationCard({ organization, onClick }: OrganizationCardProps) {
  const name = getOrganizationName(organization);
  const { phone } = getContactInfo(organization.telecom || []);
  const address = getAddress(organization.address || []);
  const type = organization.type?.[0]?.coding?.[0]?.display;
  
  // Extract rating from extensions
  const ratingExtension = organization.extension?.find((ext: any) => 
    ext.url?.includes('organization-rating')
  );
  const rating = ratingExtension?.valueDecimal || ratingExtension?.valueString;
  
  // Extract emergency services from extensions
  const emergencyExtension = organization.extension?.find((ext: any) => 
    ext.url?.includes('emergency-services')
  );
  const hasEmergencyServices = emergencyExtension?.valueBoolean;

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
      onClick={onClick}
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{name}</h3>
        
        <div className="space-y-1 text-sm">
          <div className="flex items-center text-red-600">
            <span className="mr-2">📍</span>
            <span className="font-medium">Address:</span>
            <span className="ml-1">{address}</span>
          </div>
          
          {phone && (
            <div className="flex items-center text-red-600">
              <span className="mr-2">📞</span>
              <span className="font-medium">Phone:</span>
              <span className="ml-1">{phone}</span>
            </div>
          )}
          
          {type && (
            <div className="flex items-center text-blue-600">
              <span className="mr-2">🏥</span>
              <span className="font-medium">Type:</span>
              <span className="ml-1">{type}</span>
            </div>
          )}
          
          {rating && (
            <div className="flex items-center text-orange-600">
              <span className="mr-2">⭐</span>
              <span className="font-medium">Rating:</span>
              <span className="ml-1">
                {typeof rating === 'number' ? `${rating}/5` : rating}
              </span>
            </div>
          )}
        </div>
        
        {hasEmergencyServices && (
          <div className="mt-3">
            <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
              🚨 Emergency Services Available
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button className="flex-1 bg-red-500 text-white text-xs py-2 px-3 rounded hover:bg-red-600 transition-colors">
            📍 View on Map
          </button>
          <button className="flex-1 bg-blue-500 text-white text-xs py-2 px-3 rounded hover:bg-blue-600 transition-colors">
            🌐 Website
          </button>
        </div>
        
        <Link 
          to={`/hospital/${organization.id}`}
          className="w-full mt-2 bg-purple-600 text-white text-sm py-2 px-4 rounded hover:bg-purple-700 transition-colors font-medium block text-center"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          👨‍⚕️ View Details (Doctors, Insurance, Beds)
        </Link>
      </div>
    </div>
  );
}