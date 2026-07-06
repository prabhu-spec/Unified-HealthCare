import { memo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function Metric({ label, value, emphasize }) {
  return (
    <div className={`telemetry-metric ${emphasize ? 'telemetry-metric--alert' : ''}`}>
      <p className="telemetry-metric-label">{label}</p>
      <p className="telemetry-metric-value">{value}</p>
    </div>
  );
}

function PatientVitalsCardInner({ patient, device, online, alert, chartData, highlight }) {
  const v = patient.latestVitals;

  return (
    <article
      className={`telemetry-card flex flex-col ${highlight ? 'ring-2 ring-red-400' : ''} ${alert ? 'border-red-300' : ''}`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#4a7c3f]">Patient</p>
          <h3 className="text-lg font-semibold text-heading">{patient.fullName}</h3>
          <p className="mt-0.5 font-mono text-sm text-muted">
            {patient.patientId}
            {patient.room ? ` · Room ${patient.room}` : ''}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {alert ? (
            <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">Alert</span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              Stable
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              online ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            Device {online ? 'online' : 'offline'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 py-4">
        <Metric label="Heart rate" value={v?.heartRate != null ? `${v.heartRate} bpm` : '—'} emphasize={v?.heartRate > 130} />
        <Metric label="SpO₂" value={v?.spo2 != null ? `${v.spo2}%` : '—'} emphasize={v?.spo2 < 90} />
        <Metric
          label="Temperature"
          value={v?.temperature != null ? `${v.temperature} °C` : '—'}
          emphasize={v?.temperature > 39}
        />
        <Metric label="BP" value={v ? `${v.systolic}/${v.diastolic}` : '—'} />
      </div>

      <div className="border-t border-slate-200 px-5 py-4">
        <p className="mb-2 text-xs font-medium uppercase text-muted">Heart rate & SpO₂</p>
        <div className="h-40 w-full min-h-[160px]">
          {chartData?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="t" tickFormatter={formatTime} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis yAxisId="hr" tick={{ fontSize: 10, fill: '#64748b' }} domain={['auto', 'auto']} />
                <YAxis yAxisId="spo2" orientation="right" domain={[85, 100]} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  labelFormatter={formatTime}
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    color: '#0f172a',
                  }}
                />
                <Line yAxisId="hr" type="monotone" dataKey="hr" stroke="#6BAB54" dot={false} strokeWidth={2} isAnimationActive={false} />
                <Line yAxisId="spo2" type="monotone" dataKey="spo2" stroke="#0ea5e9" dot={false} strokeWidth={2} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted">Waiting for live samples…</p>
          )}
        </div>
        {device ? (
          <p className="mt-2 font-mono text-xs text-muted">
            {device.name} ({device.deviceId})
          </p>
        ) : null}
      </div>
    </article>
  );
}

export default memo(PatientVitalsCardInner);
