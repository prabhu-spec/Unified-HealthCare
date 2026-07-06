import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, normalizeRole } from '@/lib/auth';
import { canAccessAppointments } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import { getPatientName } from '@/lib/utils';
import { DOCTOR_SPECIALIZATIONS } from '@/lib/constants';
import { apiFetch } from '@/lib/api';
import { coreFetch } from '@/lib/coreApi';
import DateInput from '@/components/ui/DateInput';

const VIDEO_STATUS_LABELS = {
  pending: 'Waiting',
  accepted: 'Upcoming',
  completed: 'Finished',
  cancelled: 'Cancelled',
};

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user ? normalizeRole(user.role) : null;
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedDoctorType, setSelectedDoctorType] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [booked, setBooked] = useState(false);
  const [bookError, setBookError] = useState('');

  const [hospitals, setHospitals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);

  const [vcDoctorType, setVcDoctorType] = useState('');
  const [vcHospital, setVcHospital] = useState('');
  const [vcDate, setVcDate] = useState('');
  const [vcTime, setVcTime] = useState('');
  const [vcBooked, setVcBooked] = useState(false);
  const [vcScheduling, setVcScheduling] = useState(false);
  const [vcError, setVcError] = useState('');
  const [videoAppointments, setVideoAppointments] = useState([]);
  const [videoActionLoading, setVideoActionLoading] = useState(null);

  const scopeToMyHospital = user && (role === 'hospital_admin' || role === 'doctor' || role === 'nurse') && user.hospitalId;

  const loadCoreData = useCallback(async () => {
    if (!user) return;
    try {
      const [hRes, pRes, aRes] = await Promise.all([
        coreFetch('/api/core/hospitals', user),
        coreFetch('/api/core/patients', user),
        coreFetch('/api/core/appointments', user),
      ]);
      setHospitals(hRes.data || []);
      setPatients(pRes.data || []);
      setMyAppointments(aRes.data || []);
    } catch {
      setHospitals([]);
      setPatients([]);
      setMyAppointments([]);
    }
  }, [user]);

  const fetchVideoAppointments = useCallback(async () => {
    if (!user) return;
    const r = normalizeRole(user.role);
    const headers = { 'x-role': r };
    if (r === 'patient') headers['x-patient-id'] = user.patientId || user.email || '';
    if (r === 'doctor' || r === 'hospital_admin' || r === 'nurse') headers['x-hospital-id'] = user.hospitalId || '';
    const q = r === 'patient'
      ? `?patientId=${encodeURIComponent(user.patientId || user.email || '')}`
      : `?hospitalId=${encodeURIComponent(user.hospitalId || '')}`;
    try {
      const data = await apiFetch(`/api/video/appointments${q}`, { headers });
      if (Array.isArray(data.data)) setVideoAppointments(data.data);
    } catch {
      setVideoAppointments([]);
    }
  }, [user]);

  useEffect(() => {
    if (user && canAccessAppointments(user.role)) {
      loadCoreData();
      fetchVideoAppointments();
    }
  }, [user, loadCoreData, fetchVideoAppointments]);

  if (!user) return null;
  if (!canAccessAppointments(user.role)) {
    return <AccessDenied message="Your role cannot book or view appointments." />;
  }

  const hospitalsForSelect = scopeToMyHospital
    ? hospitals.filter((org) => org.id === user.hospitalId)
    : hospitals;
  const patientsForSelect = patients;

  const handleBook = async (e) => {
    e.preventDefault();
    setBookError('');
    const patientId = role === 'patient' ? (user.patientId || 'patient-1') : selectedPatient;
    const patient = patients.find((p) => p.id === patientId);
    const hospitalId = selectedHospital || user.hospitalId || 'org-1';
    if (!hospitalId || !selectedDoctorType || !patientId || !date || !time) return;
    try {
      await coreFetch('/api/core/appointments', user, {
        method: 'POST',
        body: JSON.stringify({
          patientId,
          patientName: patient ? getPatientName(patient) : `${user.firstName} ${user.lastName}`,
          hospitalId,
          doctorId: user.id,
          doctorName: role === 'doctor' ? `Dr. ${user.lastName}` : 'Assigned doctor',
          date,
          time,
          type: DOCTOR_SPECIALIZATIONS.find((s) => s.value === selectedDoctorType)?.label || selectedDoctorType,
        }),
      });
      setBooked(true);
      loadCoreData();
    } catch (err) {
      setBookError(err.message || 'Booking failed.');
    }
  };

  const handleBookVideoCall = async (e) => {
    e.preventDefault();
    setVcError('');
    if (!vcDoctorType || !vcHospital || vcDate === '' || vcTime === '') return;
    const hospitalName = hospitals.find((o) => o.id === vcHospital)?.name || '';
    const patientName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Patient';
    const patientId = user?.patientId || user?.email || user?.id || '';
    setVcScheduling(true);
    try {
      await apiFetch('/api/video/appointments', {
        method: 'POST',
        body: JSON.stringify({
          doctorType: vcDoctorType,
          hospitalId: vcHospital,
          hospitalName,
          date: vcDate,
          time: vcTime,
          patientId,
          patientName,
        }),
      });
      setVcBooked(true);
      fetchVideoAppointments();
    } catch (err) {
      setVcError(err.message || 'Could not submit video request. Is the backend running?');
    } finally {
      setVcScheduling(false);
    }
  };

  const handleAcceptVideo = async (id) => {
    setVideoActionLoading(id);
    try {
      await apiFetch(`/api/video/appointments/${id}/accept`, { method: 'PATCH' });
      await fetchVideoAppointments();
    } catch (err) {
      setVcError(err.message);
    } finally {
      setVideoActionLoading(null);
    }
  };

  const handleRejectVideo = async (id) => {
    setVideoActionLoading(id);
    try {
      await apiFetch(`/api/video/appointments/${id}/reject`, { method: 'PATCH' });
      await fetchVideoAppointments();
    } catch (err) {
      setVcError(err.message);
    } finally {
      setVideoActionLoading(null);
    }
  };

  const getDoctorTypeLabel = (value) => DOCTOR_SPECIALIZATIONS.find((s) => s.value === value)?.label ?? value;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Book Appointment</h1>
      <p className="text-gray-600 mb-2">
        Schedule an in-person visit or a video call with a doctor. Data is stored on the server (in-memory until PostgreSQL).
      </p>
      <p className="text-sm text-gray-500 mb-6">
        Left: in-person appointment · Right: <strong>Video conferencing</strong> (schedule a video call and get a meeting link).
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
        <div className="min-w-0 bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="font-semibold text-gray-900 mb-4">Schedule new appointment</h2>
          <form onSubmit={handleBook} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type of doctor *</label>
              <select
                value={selectedDoctorType}
                onChange={(e) => setSelectedDoctorType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select type</option>
                {DOCTOR_SPECIALIZATIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            {role !== 'patient' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <select
                  value={selectedPatient}
                  onChange={(e) => setSelectedPatient(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select patient</option>
                  {patientsForSelect.map((p) => (
                    <option key={p.id} value={p.id}>{getPatientName(p)}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
              <select
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select hospital</option>
                {hospitalsForSelect.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
            <DateInput label="Date" value={date} onChange={(e) => setDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} className="mb-4" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </div>
            {bookError && <p className="text-sm text-red-600">{bookError}</p>}
            <button type="submit" className="w-full bg-sky-600 text-white py-2 rounded-lg hover:bg-sky-700 font-medium">
              Book appointment
            </button>
          </form>
          {booked && <p className="mt-4 text-green-600 text-sm">Appointment request submitted successfully.</p>}
        </div>

        <div id="video-conferencing-box" className="min-w-0 bg-blue-50/80 rounded-lg shadow-md p-6 border-2 border-blue-200 border-l-4 border-l-blue-600">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white text-sm font-bold" aria-hidden>VC</span>
            <h2 className="font-semibold text-gray-900">Video conferencing</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">Schedule a video call. The meeting link appears after the doctor accepts.</p>
          <form onSubmit={handleBookVideoCall} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type of doctor *</label>
              <select value={vcDoctorType} onChange={(e) => setVcDoctorType(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                <option value="">Select doctor type</option>
                {DOCTOR_SPECIALIZATIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
              <select value={vcHospital} onChange={(e) => setVcHospital(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                <option value="">Select hospital</option>
                {hospitalsForSelect.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
            <DateInput label="Date" value={vcDate} onChange={(e) => setVcDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} className="mb-4" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input type="time" value={vcTime} onChange={(e) => setVcTime(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
            </div>
            {vcError && <p className="text-sm text-red-600">{vcError}</p>}
            <button type="submit" disabled={vcScheduling} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
              {vcScheduling ? 'Submitting…' : 'Schedule video call'}
            </button>
          </form>
          {vcBooked && <p className="mt-4 text-green-600 text-sm">Request sent.</p>}
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-2">{role === 'patient' ? 'My video call appointments' : 'Video call requests'}</h2>
        {videoAppointments.length === 0 ? (
          <p className="text-sm text-gray-500">No video call appointments yet.</p>
        ) : (
          <ul className="space-y-3">
            {videoAppointments.map((apt) => (
              <li key={apt.id} className="border border-gray-200 rounded-lg p-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  {role !== 'patient' && <p className="font-medium text-gray-900">{apt.patientName}</p>}
                  <p className="text-sm text-gray-600">{getDoctorTypeLabel(apt.doctorType)} · {apt.hospitalName || apt.hospitalId} · {apt.date} at {apt.time}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">{VIDEO_STATUS_LABELS[apt.status] ?? apt.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  {role !== 'patient' && apt.status === 'pending' && (
                    <>
                      <button type="button" onClick={() => handleAcceptVideo(apt.id)} disabled={videoActionLoading === apt.id} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm">Accept</button>
                      <button type="button" onClick={() => handleRejectVideo(apt.id)} disabled={videoActionLoading === apt.id} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm">Reject</button>
                    </>
                  )}
                  {apt.status === 'accepted' && apt.roomName && (
                    <button type="button" onClick={() => navigate(`/video-meet?room=${encodeURIComponent(apt.roomName)}`)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">Join meeting</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="font-semibold text-gray-900 mb-4">{role === 'patient' ? 'My appointments' : 'Appointments'}</h2>
        {myAppointments.length === 0 ? (
          <p className="text-sm text-gray-500">No appointments yet.</p>
        ) : (
          <ul className="space-y-3">
            {myAppointments.map((apt) => (
              <li key={apt.id} className="border-b border-gray-100 pb-3 last:border-0">
                <p className="font-medium text-gray-900">{apt.patientName} · {apt.doctorName}</p>
                <p className="text-sm text-gray-600">{apt.type} · {apt.date} at {apt.time}</p>
                <p className="text-xs text-gray-500">{apt.hospitalId} · {apt.status}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
