import TelemetryGuard from './TelemetryGuard';
import TelemetryLiveView from '@/components/telemetry/TelemetryLiveView';

export default function TelemetryLivePage() {
  return (
    <TelemetryGuard require="live">
      <TelemetryLiveView />
    </TelemetryGuard>
  );
}
