/**
 * Safe fetch that parses JSON and throws a clear error when the server returns HTML
 * (e.g. SPA index.html when the backend is unreachable or proxy is missing).
 */
const API_BASE = import.meta.env.VITE_API_URL ?? '';

export function getApiBase() {
  return API_BASE;
}

/** Bearer token from login (Phase 2). Safe to call outside React. */
export function getStoredAccessToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('healthcare_auth_token');
}

export async function apiFetch(url, options = {}) {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
  const token = getStoredAccessToken();
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
  let res;
  try {
    res = await fetch(fullUrl, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...authHeader, ...options.headers },
    });
  } catch (err) {
    const hint = API_BASE
      ? `Cannot reach API at ${API_BASE}. Check EC2 security group (port 5000) and that PM2 is running.`
      : 'Cannot reach API. Rebuild frontend with VITE_API_URL=http://34.235.222.220:5000 or use nginx on port 80 with empty VITE_API_URL.';
    throw new Error(err?.message === 'Failed to fetch' ? hint : err.message || 'Network error');
  }
  const text = await res.text();
  const contentType = res.headers.get('content-type') || '';
  if (
    text.trimStart().startsWith('<') ||
    contentType.includes('text/html')
  ) {
    throw new Error(
      'Backend returned a page instead of data. Make sure the backend is running (e.g. npm run dev in backend folder) and you are using the Vite dev server so /api requests are proxied to the backend.'
    );
  }
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error('Invalid JSON response from server.');
  }
  if (!res.ok) {
    throw new Error(data.error || data.message || res.statusText || 'Request failed');
  }
  return data;
}
