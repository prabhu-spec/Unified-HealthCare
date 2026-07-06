import TelemetryGuard from './TelemetryGuard';
import TelemetryOverview from '@/components/telemetry/TelemetryOverview';

export default function TelemetryOverviewPage() {
  return (
    <TelemetryGuard require="overview">
      <TelemetryOverview />
    </TelemetryGuard>
  );
}
