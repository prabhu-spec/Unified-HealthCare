import { getStoredAccessToken } from './api';

/**
 * Calls the separate LLM service via Vite proxy (/api/ai → :5001).
 */
export async function aiFetch(url, options = {}) {
  const token = getStoredAccessToken();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...authHeader, ...options.headers },
    });
  } catch (err) {
    throw new Error(
      err?.message === 'Failed to fetch'
        ? 'Cannot reach AI service. Start llm-service: cd healthcare-platform/llm-service && npm install && npm run dev'
        : err.message || 'Network error'
    );
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error('Invalid JSON from AI service.');
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || res.statusText || 'AI request failed');
  }
  return data;
}

export async function fetchAiStatus() {
  return aiFetch('/api/ai/status');
}

export async function summarizePatient(patientId) {
  return aiFetch(`/api/ai/summarize-patient/${encodeURIComponent(patientId)}`, { method: 'POST' });
}

export async function aiChat(message, patientId) {
  return aiFetch('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({
      message,
      ...(patientId ? { patientId } : {}),
    }),
  });
}

/** Phase LLM-5 — save reviewed AI text to patient consultNotes (main backend). */
export async function acceptAiDraft(patientId, { draft, source = 'summary', append = true }) {
  const token = getStoredAccessToken();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`/api/core/patients/${encodeURIComponent(patientId)}/accept-ai-draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader },
    body: JSON.stringify({ draft, source, append }),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error('Invalid JSON from server.');
  }
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Failed to save draft.');
  }
  return data;
}
