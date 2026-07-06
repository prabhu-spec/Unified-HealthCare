import { useCallback, useEffect, useState } from 'react';
import { coreFetch } from './coreApi';

/**
 * Load `{ data: T[] }` from a platform API path (Phase 0: in-memory backend).
 */
export function useApiData(path, user, { enabled = true } = {}) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled && user));
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!user || !enabled) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const res = await coreFetch(path, user);
      setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [path, user, enabled]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { rows, loading, error, reload, setRows };
}
