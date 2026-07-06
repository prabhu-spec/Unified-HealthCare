import { apiFetch, getApiBase } from './api.js';

export function getSocketUrl() {
  const base = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || '';
  if (base) return base.replace(/\/$/, '');
  return window.location.origin;
}

export function telemetryHeaders(user) {
  if (!user) return {};
  const h = {
    'x-role': user.role,
    'x-user-email': user.email,
  };
  if (user.id) h['x-user-id'] = user.id;
  if (user.hospitalId) h['x-hospital-id'] = user.hospitalId;
  if (user.patientId) h['x-patient-id'] = user.patientId;
  return h;
}

function opts(user, init = {}) {
  return {
    ...init,
    headers: { ...telemetryHeaders(user), ...init.headers },
  };
}

export async function fetchTelemetryOverview(user, hospitalId) {
  const q = hospitalId && user.role === 'super_admin' ? `?hospitalId=${encodeURIComponent(hospitalId)}` : '';
  return apiFetch(`/api/telemetry/overview${q}`, opts(user));
}

export async function fetchTelemetryRoom(user, room) {
  return apiFetch(`/api/telemetry/overview/rooms/${encodeURIComponent(room)}`, opts(user));
}

export async function enterRoomVisit(user, body) {
  return apiFetch('/api/telemetry/overview/visit/enter', opts(user, { method: 'POST', body: JSON.stringify(body) }));
}

export async function exitRoomVisit(user, body) {
  return apiFetch('/api/telemetry/overview/visit/exit', opts(user, { method: 'POST', body: JSON.stringify(body) }));
}

export async function fetchTelemetryPatients(user) {
  return apiFetch('/api/telemetry/patients', opts(user));
}

export async function fetchTelemetryDevices(user, hospitalId) {
  const q = hospitalId && user.role === 'super_admin' ? `?hospitalId=${encodeURIComponent(hospitalId)}` : '';
  return apiFetch(`/api/telemetry/devices${q}`, opts(user));
}

export async function registerTelemetryDevice(user, body, hospitalId) {
  const q = hospitalId ? `?hospitalId=${encodeURIComponent(hospitalId)}` : '';
  return apiFetch(`/api/telemetry/devices/register${q}`, opts(user, { method: 'POST', body: JSON.stringify(body) }));
}

export async function assignTelemetryDevice(user, deviceId, patientId) {
  return apiFetch(`/api/telemetry/devices/${encodeURIComponent(deviceId)}/assign`, opts(user, {
    method: 'POST',
    body: JSON.stringify({ patientId: patientId || null }),
  }));
}

export async function deleteTelemetryDevice(user, deviceId) {
  return apiFetch(`/api/telemetry/devices/${encodeURIComponent(deviceId)}`, opts(user, { method: 'DELETE' }));
}

export async function createTelemetryPatient(user, body) {
  return apiFetch('/api/telemetry/patients', opts(user, { method: 'POST', body: JSON.stringify(body) }));
}

export async function patchTelemetryPatient(user, patientId, body) {
  return apiFetch(`/api/telemetry/patients/${encodeURIComponent(patientId)}`, opts(user, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }));
}

export async function deleteTelemetryPatient(user, patientId) {
  return apiFetch(`/api/telemetry/patients/${encodeURIComponent(patientId)}`, opts(user, { method: 'DELETE' }));
}

export async function assignPatientDoctor(user, patientId, doctorUserId) {
  return apiFetch(`/api/telemetry/patients/${encodeURIComponent(patientId)}/assigned-doctor`, opts(user, {
    method: 'PUT',
    body: JSON.stringify({ doctorUserId: doctorUserId || null }),
  }));
}

export async function fetchTelemetryDoctors(user) {
  return apiFetch('/api/telemetry/users/doctors', opts(user));
}

export { getApiBase };
