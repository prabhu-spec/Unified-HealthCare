import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth, normalizeRole } from '@/lib/auth';
import { getPatientDetailLevel, canAccessPatientDetails, getPermissions, canUseAiAssist } from '@/lib/permissions';
import AccessDenied from '@/components/AccessDenied';
import { getPatientName, getContactInfo, getAddress, calculateAge } from '@/lib/utils';
import { coreFetch } from '@/lib/coreApi';
import ClinicalProfilePanel from '@/components/ClinicalProfilePanel';

export default function PatientDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [related, setRelated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [admitRoom, setAdmitRoom] = useState('');
  const [editForm, setEditForm] = useState({});
  const role = user ? normalizeRole(user.role) : null;
  const canManage = user && getPermissions(user.role).canManageHospitalPatients;

  async function load() {
    if (!user || !id) return;
    try {
      setLoading(true);
      setError('');
      const response = await coreFetch(`/api/core/patients/${encodeURIComponent(id)}`, user);
      const p = response.data?.patient || null;
      setPatient(p);
      setRelated(response.data || null);
      if (p) {
        const contact = getContactInfo(p.telecom || []);
        setEditForm({
          firstName: p.name?.[0]?.given?.[0] || '',
          lastName: p.name?.[0]?.family || '',
          gender: p.gender || 'unknown',
          birthDate: p.birthDate || '',
          phone: contact.phone || '',
          email: contact.email || '',
          room: p.room || '',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load patient.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id, user]);

  const runAction = async (path, body = {}) => {
    if (!user || !id) return;
    try {
      setError('');
      const res = await coreFetch(`/api/core/patients/${encodeURIComponent(id)}/${path}`, user, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setPatient(res.data);
      setActionNotes('');
      setAdmitRoom('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.');
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!user || !id) return;
    try {
      setError('');
      const res = await coreFetch(`/api/core/patients/${encodeURIComponent(id)}`, user, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
      });
      setPatient(res.data);
      setEditing(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update patient.');
    }
  };

  if (!user) return null;
  if (!canAccessPatientDetails(user.role)) {
    return <AccessDenied message="Your role cannot view patient details." />;
  }
  if (role === 'patient' && id !== user.patientId && user.patientId !== `Patient/${id}`) {
    return <AccessDenied message="You can only view your own patient details." />;
  }
  const level = getPatientDetailLevel(user.role);
  if (level !== 'full') {
    return <AccessDenied message="Full patient details are only available to authorized roles." />;
  }

  if (loading) return <p className="text-gray-600">Loading patient...</p>;
  if (error && !patient) return <p className="text-red-600">{error}</p>;
  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Patient not found.</p>
        <Link to="/patients" className="text-sky-600 hover:underline mt-2 inline-block">← Back to patients</Link>
      </div>
    );
  }

  const contact = getContactInfo(patient.telecom || []);
  const age = calculateAge(patient.birthDate);

  return (
    <div>
      <Link to="/patients" className="text-sky-600 hover:underline text-sm font-medium mb-4 inline-block">
        ← Back to patients
      </Link>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="bg-white rounded-lg shadow p-6 border border-gray-200 max-w-2xl mb-6">
        <div className="flex flex-wrap justify-between gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Patient Details</h1>
          <div className="flex flex-wrap items-center gap-3">
            {canUseAiAssist(user.role) && (
              <Link
                to={`/ai-assist?patientId=${encodeURIComponent(id)}`}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700"
              >
                AI Summary
              </Link>
            )}
            {canManage && (
              <button type="button" onClick={() => setEditing((v) => !v)} className="text-sm text-sky-600 hover:underline">
                {editing ? 'Cancel edit' : 'Edit details'}
              </button>
            )}
          </div>
        </div>

        {patient.visitStatus && (
          <p className="mb-4 text-sm">
            <span className="font-medium text-gray-700">Visit status:</span>{' '}
            <span className="capitalize">{patient.visitStatus}</span>
            {patient.room && ` · Room ${patient.room}`}
            {patient.admittedAt && ` · Admitted ${new Date(patient.admittedAt).toLocaleString()}`}
            {patient.dischargedAt && ` · Discharged ${new Date(patient.dischargedAt).toLocaleString()}`}
          </p>
        )}

        {editing ? (
          <form onSubmit={saveEdit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <input required value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="First name" />
              <input required value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Last name" />
              <input type="date" value={editForm.birthDate} onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" />
              <select value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="unknown">Unknown</option>
              </select>
              <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Phone" />
              <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg" placeholder="Email" />
              <input value={editForm.room} onChange={(e) => setEditForm({ ...editForm, room: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg sm:col-span-2" placeholder="Room" />
            </div>
            <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700">Save changes</button>
          </form>
        ) : (
          <dl className="grid gap-4">
            <div><dt className="text-sm font-medium text-gray-500">Full name</dt><dd className="text-gray-900">{getPatientName(patient)}</dd></div>
            <div><dt className="text-sm font-medium text-gray-500">Date of birth</dt><dd className="text-gray-900">{patient.birthDate || 'N/A'}</dd></div>
            <div><dt className="text-sm font-medium text-gray-500">Age</dt><dd className="text-gray-900">{age != null ? age : 'N/A'}</dd></div>
            <div><dt className="text-sm font-medium text-gray-500">Gender</dt><dd className="text-gray-900">{patient.gender || 'N/A'}</dd></div>
            <div><dt className="text-sm font-medium text-gray-500">Phone</dt><dd className="text-gray-900">{contact.phone || 'N/A'}</dd></div>
            <div><dt className="text-sm font-medium text-gray-500">Email</dt><dd className="text-gray-900">{contact.email || 'N/A'}</dd></div>
            <div><dt className="text-sm font-medium text-gray-500">Address</dt><dd className="text-gray-900">{getAddress(patient.address || [])}</dd></div>
            {patient.identifier?.[0] && (
              <div><dt className="text-sm font-medium text-gray-500">MRN</dt><dd className="text-gray-900">{patient.identifier[0].value}</dd></div>
            )}
            {patient.consultNotes && (
              <div><dt className="text-sm font-medium text-gray-500">Latest notes</dt><dd className="text-gray-900">{patient.consultNotes}</dd></div>
            )}
          </dl>
        )}

        {related?.records?.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Records</h2>
            <div className="space-y-2">
              {related.records.slice(0, 3).map((record) => (
                <p key={record.id} className="text-sm text-gray-700">
                  <span className="font-medium">{record.name}:</span> {record.value}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      <ClinicalProfilePanel patientId={id} user={user} canEdit={!!canManage} />

      {canManage && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 max-w-2xl space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Visit workflow</h2>
          <p className="text-sm text-gray-600">Update patient status when they arrive, complete a consultation, or leave the hospital.</p>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Clinical notes</label>
            <textarea
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={2}
              placeholder="Consultation summary or discharge notes"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex gap-2 items-center">
              <input
                value={admitRoom}
                onChange={(e) => setAdmitRoom(e.target.value)}
                placeholder="Room #"
                className="px-3 py-2 border border-gray-300 rounded-lg w-28"
              />
              <button
                type="button"
                disabled={!admitRoom.trim()}
                onClick={() => runAction('admit', { room: admitRoom, notes: actionNotes })}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                Admit patient
              </button>
            </div>
            <button
              type="button"
              onClick={() => runAction('complete-consultation', { notes: actionNotes, stayAdmitted: patient.visitStatus === 'admitted' })}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700"
            >
              Complete consultation
            </button>
            <button
              type="button"
              onClick={() => runAction('discharge', { notes: actionNotes })}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
            >
              Discharge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
