import { useState, useCallback, useEffect } from 'react';
import { useReports } from '../hooks/useReports';
import ReportPasteBox from '../components/Input/ReportPasteBox';
import Alert from '../components/UI/Alert';

export default function DailyInput() {
  const { addReport, getReportByDateString, reports } = useReports();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [existingReport, setExistingReport] = useState(null);
  const [currentParsed, setCurrentParsed] = useState(null); // eslint-disable-line no-unused-vars

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handlePreview = useCallback(async (parsed) => {
    setCurrentParsed(parsed);
    if (parsed && parsed.dateString) {
      const existing = await getReportByDateString(parsed.dateString);
      if (existing) {
        setExistingReport(existing);
      } else {
        setExistingReport(null);
      }
    }
  }, [getReportByDateString]);

  const handleSave = useCallback(async (parsed) => {
    setSaving(true);
    try {
      const result = await addReport(parsed);
      setSuccess(result.isUpdate
        ? `Report for ${parsed.dateString} updated successfully!`
        : `Report for ${parsed.dateString} saved successfully!`
      );
      setExistingReport(null);
      setCurrentParsed(null);
    } finally {
      setSaving(false);
    }
  }, [addReport]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-text-primary">Daily Input</h2>
          <p className="text-text-muted text-sm mt-1">Paste the daily order report from your messaging app</p>
        </div>
        <span className="text-xs text-text-muted">{reports.length} reports in DB</span>
      </div>

      {success && (
        <Alert message={success} severity="low" onDismiss={() => setSuccess(null)} />
      )}

      <ReportPasteBox
        onSave={handleSave}
        onPreview={handlePreview}
        existingReport={existingReport}
        saving={saving}
      />
    </div>
  );
}
