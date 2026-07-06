import { useParams } from 'react-router-dom';
import { useAuth, normalizeRole } from '@/lib/auth';
import AccessDenied from '@/components/AccessDenied';
import HospitalDetailsClient from '@/components/HospitalDetailsClient';

export default function HospitalDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const role = user ? normalizeRole(user.role) : null;
  const myHospitalId = user?.hospitalId;

  if ((role === 'hospital_admin' || role === 'doctor') && myHospitalId && id !== myHospitalId) {
    return <AccessDenied message="You can only view details of your own hospital." />;
  }

  return <HospitalDetailsClient hospitalId={id} />;
}
