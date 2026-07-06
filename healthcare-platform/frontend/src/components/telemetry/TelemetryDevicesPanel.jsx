import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  deleteTelemetryDevice,
  fetchTelemetryDevices,
  registerTelemetryDevice,
} from '@/lib/telemetryApi';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';

export default function TelemetryDevicesPanel() {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const refreshTimerRef = useRef(null);

  const refresh = useCallback(
    async (showSpinner = true) => {
      if (showSpinner) setLoading(true);
      setError('');
      try {
        const d = await fetchTelemetryDevices(user);
        setDevices(d);
      } catch (e) {
        setError(e.message);
      } finally {
        if (showSpinner) setLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    refresh(true);
  }, [refresh]);

  useTelemetrySocket(user, {
    onMessage: (msg) => {
      if (msg?.type === 'vitals' || msg?.type === 'assignment') {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = setTimeout(() => refresh(false), 1000);
      }
    },
  });

  async function onRegister(e) {
    e.preventDefault();
    try {
      await registerTelemetryDevice(user, {
        deviceId: deviceId.trim(),
        name: name.trim(),
        type: type.trim(),
      });
      setDeviceId('');
      setName('');
      setType('');
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  async function onRemove(id) {
    if (!window.confirm(`Remove device ${id}?`)) return;
    try {
      await deleteTelemetryDevice(user, id);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="telemetry-surface telemetry-stable space-y-6">
      <div className="telemetry-card p-6">
        <h1 className="text-2xl font-semibold text-heading">Telemetry devices</h1>
        <p className="mt-1 text-sm text-muted">
          Register IoMT devices for your hospital. Device IDs must match the telemetry stream (e.g. device001).
        </p>
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div> : null}

      <form onSubmit={onRegister} className="telemetry-card grid gap-4 p-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Device ID</label>
          <input
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Display name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Type</label>
          <input
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            required
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded-lg bg-[#6BAB54] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Register device
          </button>
        </div>
      </form>

      <div className="telemetry-card overflow-x-auto">
        <table className="min-w-full text-sm text-heading">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-muted">
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : (
              devices.map((d) => (
                <tr key={d.deviceId} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-mono">
                    {d.deviceId}
                    <div className="text-xs text-slate-500">{d.name}</div>
                  </td>
                  <td className="px-4 py-3">{d.patientId || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        d.online ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {d.online ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {!d.patientId ? (
                      <button
                        type="button"
                        onClick={() => onRemove(d.deviceId)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Unassign first</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
