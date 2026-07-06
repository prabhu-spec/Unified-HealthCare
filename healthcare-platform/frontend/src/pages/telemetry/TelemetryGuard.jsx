import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { canAccessTelemetryOverview, getPermissions } from '@/lib/permissions';

export default function TelemetryGuard({ children, require }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const perms = getPermissions(user.role);
  const ok =
    require === 'overview'
      ? canAccessTelemetryOverview(user.role)
      : require === 'live'
        ? perms.canViewLiveTelemetry
        : require === 'devices'
          ? perms.canManageTelemetryDevices
          : require === 'assignments'
            ? perms.canManageTelemetryAssignments
            : false;
  if (!ok) return <Navigate to="/" replace />;
  return children;
}
