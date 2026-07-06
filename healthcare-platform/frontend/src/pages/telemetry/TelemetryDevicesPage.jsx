import TelemetryGuard from './TelemetryGuard';
import TelemetryDevicesPanel from '@/components/telemetry/TelemetryDevicesPanel';

export default function TelemetryDevicesPage() {
  return (
    <TelemetryGuard require="devices">
      <TelemetryDevicesPanel />
    </TelemetryGuard>
  );
}
