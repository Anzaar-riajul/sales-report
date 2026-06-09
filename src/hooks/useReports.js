import { useState, useEffect, useCallback } from 'react';
import { getReports, saveReport, getReportByDate } from '../firebase/reports';

export function useReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  function loadReports() {
    setLoading(true);
    getReports()
      .then(data => {
        setReports(data);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  const getReportByDateString = useCallback(async (dateString) => {
    return await getReportByDate(dateString);
  }, []);

  const addReport = useCallback(async (parsedData, existingId = null) => {
    const result = await saveReport(parsedData, existingId);
    loadReports();
    return result;
  }, []);

  return { reports, loading, error, refetch: loadReports, addReport, getReportByDateString };
}
