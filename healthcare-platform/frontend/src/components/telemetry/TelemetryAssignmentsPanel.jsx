import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  assignTelemetryDevice,
  createTelemetryPatient,
  deleteTelemetryPatient,
  fetchTelemetryDevices,
  fetchTelemetryPatients,
  patchTelemetryPatient,
} from '@/lib/telemetryApi';

export default function TelemetryAssignmentsPanel() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [room, setRoom] = useState('');

  const refresh = useCallback(async () => {
    setError('');
    const [p, d] = await Promise.all([fetchTelemetryPatients(user), fetchTelemetryDevices(user)]);
    setPatients(p);
    setDevices(d);
  }, [user]);

  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, [refresh]);

  async function onAdd(e) {
    e.preventDefault();
    try {
      await createTelemetryPatient(user, { fullName: fullName.trim(), room: room.trim() });
      setFullName('');
      setRoom('');
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  async function onDeviceChange(patientId, nextDeviceId) {
    const current = devices.find((d) => d.patientId === patientId)?.deviceId;
    if (current === nextDeviceId) return;
    try {
      if (current) await assignTelemetryDevice(user, current, null);
      if (nextDeviceId) await assignTelemetryDevice(user, nextDeviceId, patientId);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  const unassigned = devices.filter((d) => !d.patientId);

  return (
    <div className="telemetry-surface telemetry-stable space-y-6">
      <div className="telemetry-card p-6">
        <h1 className="text-2xl font-semibold text-heading">Telemetry assignments</h1>
        <p className="mt-1 text-sm text-muted">Link RPM patients to rooms and monitoring devices.</p>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

      <form onSubmit={onAdd} className="telemetry-card flex flex-wrap gap-4 p-6">
        <input
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          required
        />
        <input
          placeholder="Room number"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          required
        />
        <button type="submit" className="rounded-lg bg-[#6BAB54] px-4 py-2 text-sm font-semibold text-white">
          Add RPM patient
        </button>
      </form>

      <div className="space-y-4">
        {patients.map((p) => (
          <div key={p.patientId} className="telemetry-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold text-heading">{p.fullName}</p>
                <p className="font-mono text-xs text-muted">
                  {p.patientId} · Room {p.room}
                </p>
              </div>
              <select
                className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                value={devices.find((d) => d.patientId === p.patientId)?.deviceId || ''}
                onChange={(e) => onDeviceChange(p.patientId, e.target.value)}
              >
                <option value="">No device</option>
                {unassigned.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.deviceId} — {d.name}
                  </option>
                ))}
                {devices
                  .filter((d) => d.patientId === p.patientId)
                  .map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.deviceId} (current)
                    </option>
                  ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
