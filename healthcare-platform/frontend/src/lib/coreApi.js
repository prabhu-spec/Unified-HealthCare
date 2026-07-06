import { apiFetch } from './api';

export function coreHeaders(user) {
  const headers = {};
  if (!user) return headers;
  headers['x-role'] = user.role;
  headers['x-user-email'] = user.email;
  if (user.id) headers['x-user-id'] = user.id;
  if (user.hospitalId) headers['x-hospital-id'] = user.hospitalId;
  if (user.patientId) headers['x-patient-id'] = user.patientId;
  return headers;
}

export async function coreFetch(path, user, options = {}) {
  return apiFetch(path, {
    ...options,
    headers: { ...coreHeaders(user), ...options.headers },
  });
}
