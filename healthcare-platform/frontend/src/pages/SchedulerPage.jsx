import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { coreFetch } from '@/lib/coreApi';

const TYPE_LABELS = {
  shift: 'Shift',
  appointment: 'Appointment',
  nursing_round: 'Nursing round',
  consultation: 'Consultation',
};

const STATUS_COLORS = {
  scheduled: 'bg-sky-100 text-sky-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

export default function SchedulerPage() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'consultation',
    date: new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '09:30',
    staffName: '',
    staffId: '',
    staffRole: '',
    patientName: '',
    patientId: '',
    notes: '',
  });

  const canManageAll = user?.role === 'super_admin' || user?.role === 'hospital_admin';

  async function load() {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      const q = filterDate ? `?date=${encodeURIComponent(filterDate)}` : '';
      const res = await coreFetch(`/api/schedules${q}`, user);
      setSchedules(res.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load schedules.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user, filterDate]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      setError('');
      await coreFetch('/api/schedules', user, {
        method: 'POST',
        body: JSON.stringify({
          hospitalId: user.hospitalId,
          staffId: form.staffId || user.id,
          staffName: form.staffName || `${user.firstName} ${user.lastName}`,
          staffRole: form.staffRole || user.role,
          patientId: form.patientId || undefined,
          patientName: form.patientName || undefined,
          title: form.title,
          type: form.type,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          notes: form.notes || undefined,
        }),
      });
      setShowForm(false);
      setForm((f) => ({ ...f, title: '', notes: '', patientId: '', patientName: '' }));
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create schedule.');
    }
  };

  const updateStatus = async (id, status) => {
    if (!user) return;
    try {
      await coreFetch(`/api/schedules/${id}`, user, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update schedule.');
    }
  };

  const removeSchedule = async (id) => {
    if (!user || !canManageAll) return;
    if (!window.confirm('Remove this schedule entry?')) return;
    try {
      await coreFetch(`/api/schedules/${id}`, user, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete schedule.');
    }
  };

  if (!user) return null;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Staff Scheduler</h1>
          <p className="text-gray-600">
            {canManageAll
              ? 'Plan shifts, consultations, and nursing rounds for your hospital.'
              : 'View and manage your assigned shifts and patient monitoring rounds.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700"
        >
          {showForm ? 'Cancel' : '+ New entry'}
        </button>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-lg border border-gray-200 p-6 mb-6 max-w-2xl space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">New schedule entry</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="e.g. Morning vitals check"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
              <input
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
              <input
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            {canManageAll && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff name</label>
                  <input
                    value={form.staffName}
                    onChange={(e) => setForm({ ...form, staffName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Dr. Sarah Johnson"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Staff ID</label>
                  <input
                    value={form.staffId}
                    onChange={(e) => setForm({ ...form, staffId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="u-doc"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient (optional)</label>
              <input
                value={form.patientName}
                onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Patient name"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
              />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700">
            Save schedule
          </button>
        </form>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by date</label>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      {loading && <p className="text-gray-600">Loading schedules...</p>}

      <div className="grid gap-3">
        {schedules.map((s) => (
          <div key={s.id} className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900">{s.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status] || STATUS_COLORS.scheduled}`}>
                  {s.status}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                  {TYPE_LABELS[s.type] || s.type}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {s.date} · {s.startTime}–{s.endTime}
                {s.staffName && ` · ${s.staffName}`}
                {s.patientName && ` · Patient: ${s.patientName}`}
              </p>
              {s.notes && <p className="text-sm text-gray-500 mt-1">{s.notes}</p>}
            </div>
            <div className="flex gap-2 items-start flex-wrap">
              {s.status === 'scheduled' && (
                <button
                  type="button"
                  onClick={() => updateStatus(s.id, 'completed')}
                  className="text-sm px-3 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100"
                >
                  Mark done
                </button>
              )}
              {canManageAll && (
                <button
                  type="button"
                  onClick={() => removeSchedule(s.id)}
                  className="text-sm px-3 py-1 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      {!loading && schedules.length === 0 && (
        <p className="text-gray-500 text-center py-8">No schedules for this date.</p>
      )}
    </div>
  );
}
