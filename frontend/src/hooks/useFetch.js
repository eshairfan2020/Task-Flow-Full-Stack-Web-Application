// A small reusable custom hook — the standard way to share stateful logic
// (as opposed to copy-pasting the same useState/useEffect pair into every
// component that needs to fetch something).
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/client';

export function useFetch(path, { skip = false } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!skip);

  const load = useCallback(async () => {
    if (skip) return;
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetch(path);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [path, skip]);

  // Re-run whenever `path` changes (e.g. switching teams) — this is the
  // dependency array doing its job: effect + cleanup pattern.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (skip) return;
      setLoading(true);
      setError(null);
      try {
        const result = await apiFetch(path);
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true; // cleanup: ignore a stale response if path changes again fast
    };
  }, [path, skip]);

  return { data, error, loading, refetch: load };
}
