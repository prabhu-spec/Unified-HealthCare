import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { normalizeRole } from '@/lib/auth';
import { canAccessTelemetryOverview, getPermissions } from '@/lib/permissions';
import {
  assignPatientDoctor,
  enterRoomVisit,
  exitRoomVisit,
  fetchTelemetryDoctors,
  fetchTelemetryOverview,
  fetchTelemetryRoom,
} from '@/lib/telemetryApi';
import { useTelemetrySocket } from '@/hooks/useTelemetrySocket';

const ROLE_HOSPITAL_ADMIN = 'hospital_admin';

function PresenceLight({ doctorInRoom, occupied }) {
  if (!occupied) {
    return (
      <span className="flex items-center gap-2 text-xs text-slate-500">
        <span className="h-3 w-3 rounded-full bg-slate-300 ring-2 ring-slate-100" title="Vacant" />
        Vacant
      </span>
    );
  }
  return (
    <span
      className={`flex items-center gap-2 text-xs font-semibold ${
        doctorInRoom ? 'text-emerald-700' : 'text-red-700'
      }`}
    >
      <span
        className={`h-3 w-3 rounded-full shadow-sm ring-2 ${
          doctorInRoom ? 'animate-pulse bg-emerald-500 ring-emerald-200' : 'bg-red-500 ring-red-200'
        }`}
        title={doctorInRoom ? 'Doctor in room' : 'No doctor in room'}
      />
      {doctorInRoom ? 'Doctor in room' : 'No doctor in room'}
    </span>
  );
}

function VitalsBlock({ vitals }) {
  if (!vitals) {
    return <p className="text-sm text-slate-500">No vitals recorded yet.</p>;
  }
  const items = [
    ['Heart rate', vitals.heartRate != null ? `${vitals.heartRate} bpm` : '—'],
    ['SpO₂', vitals.spo2 != null ? `${vitals.spo2}%` : '—'],
    ['Temperature', vitals.temperature != null ? `${vitals.temperature} °C` : '—'],
    ['Blood pressure', vitals.systolic != null ? `${vitals.systolic}/${vitals.diastolic}` : '—'],
    ['Respiration', vitals.respiration != null ? `${vitals.respiration} /min` : '—'],
    ['Battery', vitals.battery != null ? `${vitals.battery}%` : '—'],
  ];
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map(([label, value]) => (
        <div
          key={label}
          className={`rounded-lg px-3 py-2 text-sm ${
            vitals.alert ? 'bg-red-50 ring-1 ring-red-200' : 'bg-slate-50'
          }`}
        >
          <p className="text-[10px] font-semibold uppercase text-slate-500">{label}</p>
          <p className="font-semibold text-slate-900">{value}</p>
        </div>
      ))}
    </div>
  );
}

function RoomTile({ tile, onSelect }) {
  const { room, occupied, patient, doctorInRoom, assignedDoctor, presentDoctor } = tile;
  return (
    <button
      type="button"
      onClick={() => onSelect(room)}
      className={`telemetry-room-tile group focus:outline-none focus:ring-2 focus:ring-[#6BAB54] ${
        occupied
          ? doctorInRoom
            ? 'border-emerald-300 bg-gradient-to-br from-white to-emerald-50/60'
            : ''
          : 'border-dashed border-slate-300 bg-slate-50/90'
      } ${patient?.latestVitals?.alert ? 'telemetry-room-tile--alert' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Room</p>
          <p className="font-mono text-2xl font-bold text-slate-900">{room}</p>
        </div>
        <PresenceLight doctorInRoom={doctorInRoom} occupied={occupied} />
      </div>
      <div className="mt-4 min-h-[3rem]">
        {occupied && patient ? (
          <>
            <p className="text-sm font-semibold text-slate-900 line-clamp-2">{patient.fullName}</p>
            <p className="mt-0.5 font-mono text-xs text-slate-500">{patient.patientId}</p>
          </>
        ) : (
          <p className="text-sm text-slate-500">No patient admitted</p>
        )}
      </div>
      {occupied ? (
        <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-xs text-slate-600">
          <p>
            <span className="text-slate-400">Assigned · </span>
            {assignedDoctor?.displayName || assignedDoctor?.username || 'Unassigned'}
          </p>
          {presentDoctor ? (
            <p className="font-medium text-emerald-800">Present · {presentDoctor.username}</p>
          ) : null}
          {patient?.latestVitals?.alert ? (
            <span className="inline-block rounded bg-red-100 px-1.5 py-0.5 font-semibold text-red-800">
              Vitals alert
            </span>
          ) : null}
        </div>
      ) : null}
    </button>
  );
}

function RoomDetailModal({ room, user, perms, onClose, onUpdated }) {
  const [detail, setDetail] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [selDoctor, setSelDoctor] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setError('');
    setLoading(true);
    try {
      const d = await fetchTelemetryRoom(user, room);
      setDetail(d);
      setSelDoctor(d.assignedDoctor?.userId || '');
    } catch (e) {
      setError(e.message || 'Failed to load room');
    } finally {
      setLoading(false);
    }
  }, [user, room]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!perms.canAssignTelemetryDoctor) return undefined;
    fetchTelemetryDoctors(user)
      .then(setDoctors)
      .catch(() => setDoctors([]));
    return undefined;
  }, [user, perms.canAssignTelemetryDoctor]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  async function onEnter() {
    if (!detail?.patient) return;
    setBusy(true);
    setError('');
    try {
      await enterRoomVisit(user, { room, patientId: detail.patient.patientId });
      await load();
      onUpdated();
    } catch (e) {
      setError(e.message || 'Could not enter room');
    } finally {
      setBusy(false);
    }
  }

  async function onExit() {
    setBusy(true);
    setError('');
    try {
      await exitRoomVisit(user, { room });
      await load();
      onUpdated();
    } catch (e) {
      setError(e.message || 'Could not exit room');
    } finally {
      setBusy(false);
    }
  }

  async function onAssignDoctor() {
    if (!detail?.patient) return;
    setBusy(true);
    setError('');
    try {
      await assignPatientDoctor(user, detail.patient.patientId, selDoctor || null);
      await load();
      onUpdated();
    } catch (e) {
      setError(e.message || 'Assignment failed');
    } finally {
      setBusy(false);
    }
  }

  const myPresence =
    perms.canLogTelemetryRoomVisit &&
    detail?.presentDoctor?.userId === user?.id &&
    detail?.doctorInRoom;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/55 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-detail-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Room</p>
            <h3 id="room-detail-title" className="font-mono text-2xl font-bold text-slate-900">
              {room}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="space-y-6 px-6 py-5 text-slate-900">
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}

          {loading ? (
            <p className="py-8 text-center text-slate-500">Loading room details…</p>
          ) : detail ? (
            <>
              <div className="flex flex-wrap items-center gap-4">
                <PresenceLight doctorInRoom={detail.doctorInRoom} occupied={detail.occupied} />
                {detail.presentDoctor ? (
                  <span className="text-sm text-slate-600">
                    Present: <strong>{detail.presentDoctor.username}</strong>
                  </span>
                ) : null}
              </div>

              {detail.patient ? (
                <section>
                  <h4 className="text-sm font-semibold text-slate-900">Patient</h4>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{detail.patient.fullName}</p>
                  <p className="font-mono text-sm text-slate-600">ID · {detail.patient.patientId}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Room number · <span className="font-mono font-semibold">{room}</span>
                  </p>
                </section>
              ) : (
                <p className="text-sm text-slate-600">This room has no admitted patient.</p>
              )}

              {detail.patient ? (
                <>
                  <section>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900">Latest vitals</h4>
                    <VitalsBlock vitals={detail.patient.latestVitals} />
                  </section>

                  <section>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900">
                      Devices ({detail.devices?.length || 0})
                    </h4>
                    {detail.devices?.length ? (
                      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 text-sm">
                        {detail.devices.map((d) => (
                          <li key={d.deviceId} className="flex flex-wrap justify-between gap-2 px-3 py-2">
                            <span className="font-mono font-medium text-slate-900">{d.deviceId}</span>
                            <span className="text-slate-600">
                              {d.name} · {d.type}
                              <span
                                className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                  d.online ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {d.online ? 'Online' : 'Offline'}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">No devices assigned.</p>
                    )}
                  </section>

                  <section>
                    <h4 className="mb-2 text-sm font-semibold text-slate-900">Assigned doctor</h4>
                    <p className="text-sm text-slate-700">
                      {detail.assignedDoctor?.displayName ||
                        detail.assignedDoctor?.username ||
                        'None'}
                    </p>
                    {perms.canAssignTelemetryDoctor ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <select
                          value={selDoctor}
                          onChange={(e) => setSelDoctor(e.target.value)}
                          className="min-w-[12rem] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                        >
                          <option value="">Unassigned</option>
                          {doctors.map((d) => (
                            <option key={d.userId} value={d.userId}>
                              {d.displayName || d.username}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={onAssignDoctor}
                          className="rounded-lg bg-[#6BAB54] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                        >
                          Save assignment
                        </button>
                      </div>
                    ) : null}
                  </section>

                  {perms.canLogTelemetryRoomVisit ? (
                    <section className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                      <h4 className="text-sm font-semibold text-slate-900">Your visit</h4>
                      <p className="mt-1 text-xs text-slate-600">
                        Mark when you enter or leave this room. Administrators see presence on the ward map.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {!myPresence ? (
                          <button
                            type="button"
                            disabled={
                              busy ||
                              !detail.assignedDoctor ||
                              detail.assignedDoctor.userId !== user?.id
                            }
                            onClick={onEnter}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Enter room
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={onExit}
                            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                          >
                            Exit room
                          </button>
                        )}
                      </div>
                      {detail.assignedDoctor?.userId !== user?.id ? (
                        <p className="mt-2 text-xs text-amber-800">
                          You are not assigned to this patient. Ask your hospital admin for assignment.
                        </p>
                      ) : null}
                    </section>
                  ) : null}

                  {detail.visitLogs?.length ? (
                    <section>
                      <h4 className="mb-2 text-sm font-semibold text-slate-900">Doctor visit log</h4>
                      <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200">
                        <table className="min-w-full text-left text-xs text-slate-900">
                          <thead className="sticky top-0 border-b border-slate-200 bg-slate-50 text-slate-500">
                            <tr>
                              <th className="px-3 py-2 font-medium">Doctor</th>
                              <th className="px-3 py-2 font-medium">Entered</th>
                              <th className="px-3 py-2 font-medium">Exited</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {detail.visitLogs.map((log, i) => (
                              <tr key={log.id || i}>
                                <td className="px-3 py-2 font-medium">{log.doctorUsername}</td>
                                <td className="px-3 py-2 text-slate-600">
                                  {log.enteredAt ? new Date(log.enteredAt).toLocaleString() : '—'}
                                </td>
                                <td className="px-3 py-2 text-slate-600">
                                  {log.exitedAt ? new Date(log.exitedAt).toLocaleString() : '— in progress'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  ) : null}
                </>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function TelemetryOverview() {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const [overview, setOverview] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const refreshTimerRef = useRef(null);
  const perms = getPermissions(role);

  const load = useCallback(
    async (opts = { showSpinner: false }) => {
      if (!user) {
        setLoading(false);
        return;
      }
      setError('');
      if (opts.showSpinner) setLoading(true);
      try {
        const data = await fetchTelemetryOverview(user);
        setOverview(data);
      } catch (e) {
        setError(e.message || 'Failed to load overview');
        setOverview(null);
      } finally {
        if (opts.showSpinner) setLoading(false);
      }
    },
    [user]
  );

  useEffect(() => {
    if (!user) return undefined;
    load({ showSpinner: true });
    return undefined;
  }, [user, load]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      load({ showSpinner: false });
      refreshTimerRef.current = null;
    }, 800);
  }, [load]);

  useEffect(
    () => () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    },
    []
  );

  useTelemetrySocket(user, {
    enabled: canAccessTelemetryOverview(role) && (role !== 'patient' || !!user?.patientId),
    onMessage: (msg) => {
      const t = msg?.type;
      if (role === ROLE_HOSPITAL_ADMIN) {
        if (t === 'room_presence' || t === 'doctor_assignment' || t === 'vitals' || t === 'assignment') {
          scheduleRefresh();
        }
        return;
      }
      if (t === 'room_presence' || t === 'vitals' || t === 'doctor_assignment') {
        scheduleRefresh();
      }
    },
  });

  if (loading && !overview) {
    return (
      <div className="telemetry-surface telemetry-stable">
        <div className="telemetry-card p-8 text-center text-muted">Loading ward overview…</div>
      </div>
    );
  }

  const rooms = overview?.rooms || [];
  const occupied = rooms.filter((r) => r.occupied).length;
  const inRoom = rooms.filter((r) => r.doctorInRoom).length;
  const isAdmin = perms.canAssignTelemetryDoctor;

  return (
    <div className="telemetry-surface telemetry-stable space-y-6">
      <div className="telemetry-card p-6">
        <h1 className="text-2xl font-semibold text-heading">Patient overview</h1>
        <p className="mt-1 text-sm text-muted">
          Click a room tile to open full details. Green = doctor in room; red = patient without doctor.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
            {rooms.length} rooms · {occupied} with patients · {inRoom} doctor in room
          </span>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
      ) : null}

      {rooms.length === 0 ? (
        <div className="telemetry-card p-6 text-sm text-amber-900">
          {isAdmin
            ? 'No rooms configured for this hospital.'
            : 'No patients assigned to you in this ward view.'}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((tile) => (
            <RoomTile key={tile.room} tile={tile} onSelect={setSelectedRoom} />
          ))}
        </div>
      )}

      <div className="telemetry-card flex flex-wrap items-center gap-4 px-4 py-3 text-xs text-slate-600">
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Doctor in room
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Patient, no doctor
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> Vacant
        </span>
      </div>

      {selectedRoom ? (
        <RoomDetailModal
          room={selectedRoom}
          user={user}
          perms={perms}
          onClose={() => setSelectedRoom(null)}
          onUpdated={() => load({ showSpinner: false })}
        />
      ) : null}
    </div>
  );
}
