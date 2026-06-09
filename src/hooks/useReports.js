import { useState, useEffect, useCallback } from 'react';
import { getReports, saveReport, getReportByDate } from '../firebase/reports';
import { setCache, getCache, isCacheStale } from '../utils/cache';

const CACHE_KEY = 'reports';
const CACHE_TTL = 30 * 60 * 1000;

export function useReports() {
  const [reports, setReports] = useState(() => {
    try { return getCache(CACHE_KEY) || []; } catch { return []; }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports(forceRefresh = false) {
    try {
      const cached = getCache(CACHE_KEY);
      const stale = isCacheStale(CACHE_KEY, CACHE_TTL);

      if (cached && cached.length > 0 && !stale && !forceRefresh) {
        setReports(cached);
        setLoading(false);
        return;
      }

      if (cached && cached.length > 0 && stale && !forceRefresh) {
        setReports(cached);
        setLoading(false);
        refreshInBackground();
        return;
      }

      setLoading(true);
      const data = await getReports();
      setReports(data);
      setCache(CACHE_KEY, data, CACHE_TTL);
      setError(null);
    } catch (err) {
      setError(err.message);
      const cached = getCache(CACHE_KEY);
      if (cached && cached.length > 0) setReports(cached);
    } finally {
      setLoading(false);
    }
  }

  async function refreshInBackground() {
    try {
      const data = await getReports();
      if (data && data.length > 0) {
        setReports(data);
        setCache(CACHE_KEY, data, CACHE_TTL);
      }
    } catch {}
  }

  const getReportByDateString = useCallback(async (dateString) => {
    return await getReportByDate(dateString);
  }, []);

  const addReport = useCallback(async (parsedData, existingId = null) => {
    const result = await saveReport(parsedData, existingId);
    setCache(CACHE_KEY, null, 0);
    await loadReports(true);
    return result;
  }, []);

  return { reports, loading, error, refetch: () => loadReports(true), addReport, getReportByDateString };
}
