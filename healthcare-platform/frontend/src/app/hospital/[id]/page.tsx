import { Suspense } from 'react';
import HospitalDetailsClient from '@/components/HospitalDetailsClient';
import LoadingSpinner from '@/components/LoadingSpinner';

// Generate static params for all hospital IDs
export async function generateStaticParams() {
  // Define all the hospital IDs that we want to pre-generate
  const hospitalIds = [
    'southeast-health',
    'mizell-memorial', 
    'crenshaw-community',
    'marshall-medical',
    'north-alabama'
  ];
  
  return hospitalIds.map((id) => ({
    id: id,
  }));
}

interface HospitalDetailsPageProps {
  params: {
    id: string;
  };
}

export default function HospitalDetailsPage({ params }: HospitalDetailsPageProps) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HospitalDetailsClient hospitalId={params?.id || undefined} />
    </Suspense>
  );
}