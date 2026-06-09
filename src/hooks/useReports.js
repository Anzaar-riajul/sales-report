import { useState, useEffect, useCallback } from 'react';
import { getReports, saveReport, getReportByDate } from '../firebase/reports';

function loadReports(setReports, setLoading, setError) {
  setLoading(true);
  getReports()
    .then(data => {
      setReports(data);
      setError(null);
    })
    .catch(err => {
      setError(err.message);
    })
    .finally(() => {
      setLoading(false);
    });
}

export function useReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReports(setReports, setLoading, setError);
  }, []);

  const getReportByDateString = useCallback(async (dateString) => {
    return await getReportByDate(dateString);
  }, []);

  const addReport = useCallback(async (parsedData) => {
    const result = await saveReport(parsedData);
    loadReports(setReports, setLoading, setError);
    return result;
  }, []);

  return {
    reports,
    loading,
    error,
    refetch: () => loadReports(setReports, setLoading, setError),
    addReport,
    getReportByDateString,
  };
}
