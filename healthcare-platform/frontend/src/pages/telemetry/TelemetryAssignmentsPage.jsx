import TelemetryGuard from './TelemetryGuard';
import TelemetryAssignmentsPanel from '@/components/telemetry/TelemetryAssignmentsPanel';

export default function TelemetryAssignmentsPage() {
  return (
    <TelemetryGuard require="assignments">
      <TelemetryAssignmentsPanel />
    </TelemetryGuard>
  );
}
