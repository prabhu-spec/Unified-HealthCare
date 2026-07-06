import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { fetchTelemetryDevices, fetchTelemetryPatients } from '@/lib/telemetryApi';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';
import PatientVitalsCard from './PatientVitalsCard';

export default function TelemetryLiveView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [devices, setDevices] = useState([]);
  const [series, setSeries] = useState({});
  const [alerts, setAlerts] = useState({});
  const [criticalBanner, setCriticalBanner] = useState(null);
  const [highlightPatientId, setHighlightPatientId] = useState(null);
  const bannerTimerRef = useRef(null);

  const refresh = useCallback(async () => {
    const [p, d] = await Promise.all([fetchTelemetryPatients(user), fetchTelemetryDevices(user)]);
    setPatients(p);
    setDevices(d);
  }, [user]);

  useEffect(() => {
    refresh().catch(console.error);
    const id = setInterval(() => refresh().catch(console.error), 30_000);
    return () => clearInterval(id);
  }, [refresh]);

  const { connected, OFFLINE_AFTER_MS } = useTelemetrySocket(user, {
    onMessage: (msg) => {
      if (msg?.type === 'critical_alert') {
        setCriticalBanner({
          patientId: msg.patientId,
          room: msg.room,
          fullName: msg.fullName,
          vitals: msg.vitals,
        });
        if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
        bannerTimerRef.current = setTimeout(() => {
          setCriticalBanner(null);
          bannerTimerRef.current = null;
        }, 25_000);
        return;
      }
      if (msg?.type !== 'vitals') return;
      const pid = msg.patientId;
      const ts = Date.now();
      setAlerts((prev) => ({ ...prev, [pid]: !!msg.alert }));
      setSeries((prev) => {
        const cur = prev[pid] || [];
        const merged = [...cur, { t: ts, hr: msg.vitals.heartRate, spo2: msg.vitals.spo2 }].slice(-90);
        return { ...prev, [pid]: merged };
      });
      setPatients((prev) =>
        prev.map((row) =>
          row.patientId === pid
            ? { ...row, latestVitals: { ...msg.vitals, alert: msg.alert } }
            : row
        )
      );
      setDevices((prev) => {
        const idx = prev.findIndex((d) => d.deviceId === msg.deviceId);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], online: true, lastSeenAt: new Date().toISOString() };
        return next;
      });
    },
  });

  useEffect(() => {
    const tick = setInterval(() => {
      setDevices((prev) => {
        let changed = false;
        const next = prev.map((d) => {
          const seen = d.lastSeenAt ? new Date(d.lastSeenAt).getTime() : 0;
          const online = !!(seen && Date.now() - seen < OFFLINE_AFTER_MS);
          if (d.online !== online) changed = true;
          return { ...d, online };
        });
        return changed ? next : prev;
      });
    }, 5000);
    return () => clearInterval(tick);
  }, [OFFLINE_AFTER_MS]);

  useEffect(
    () => () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    },
    []
  );

  const deviceByPatient = useMemo(() => {
    const m = {};
    devices.forEach((d) => {
      if (d.patientId) m[d.patientId] = d;
    });
    return m;
  }, [devices]);

  const displayed = useMemo(
    () => patients.filter((p) => deviceByPatient[p.patientId]),
    [patients, deviceByPatient]
  );

  return (
    <div className="telemetry-surface telemetry-stable space-y-6">
      {criticalBanner ? (
        <div className="rounded-xl border border-red-300 bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-md">
          Critical alert · {criticalBanner.fullName || criticalBanner.patientId}
          {criticalBanner.room ? ` · Room ${criticalBanner.room}` : ''}
          {criticalBanner.vitals ? (
            <> · HR {criticalBanner.vitals.heartRate} · SpO₂ {criticalBanner.vitals.spo2}%</>
          ) : null}
          <button
            type="button"
            className="ml-3 underline decoration-white/80"
            onClick={() => setHighlightPatientId(criticalBanner.patientId)}
          >
            View telemetry
          </button>
        </div>
      ) : null}

      <div className="telemetry-card p-6">
        <h1 className="text-2xl font-semibold text-heading">Live telemetry</h1>
        <p className="mt-1 text-sm text-muted">
          Real-time vitals from assigned devices (heart rate, SpO₂, temperature).
        </p>
        <span
          className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            connected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
          }`}
        >
          Stream {connected ? 'live' : 'reconnecting…'}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {displayed.map((p) => {
          const dev = deviceByPatient[p.patientId];
          const online =
            dev?.online ||
            (dev?.lastSeenAt && Date.now() - new Date(dev.lastSeenAt).getTime() < OFFLINE_AFTER_MS);
          let chart = series[p.patientId] || [];
          if (!chart.length && p.latestVitals) {
            const t = p.latestVitals.timestamp ? new Date(p.latestVitals.timestamp).getTime() : Date.now();
            chart = [{ t, hr: p.latestVitals.heartRate, spo2: p.latestVitals.spo2 }];
          }
          return (
            <PatientVitalsCard
              key={p.patientId}
              patient={p}
              device={dev}
              online={!!online}
              alert={alerts[p.patientId] ?? p.latestVitals?.alert}
              chartData={chart}
              highlight={highlightPatientId === p.patientId}
            />
          );
        })}
      </div>

      {displayed.length === 0 ? (
        <div className="telemetry-card p-8 text-center text-muted">
          No patients with assigned devices.{' '}
          <button
            type="button"
            className="font-medium text-[#6BAB54] underline"
            onClick={() => navigate('/telemetry/assignments')}
          >
            Manage assignments
          </button>
        </div>
      ) : null}
    </div>
  );
}
