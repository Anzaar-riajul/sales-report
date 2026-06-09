import { useState, useCallback, useEffect, useRef } from 'react';
import { useReports } from '../hooks/useReports';
import { useAuth } from '../hooks/useAuth';
import ReportPasteBox from '../components/Input/ReportPasteBox';
import { motion, AnimatePresence } from 'framer-motion';
import ReportHistory from '../components/Dashboard/ReportHistory';

function SuccessToast({ message, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="fixed top-4 right-4 z-50 max-w-sm"
    >
      <div className="bg-white border border-teal-200 shadow-lg rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">Report Saved</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{message}</p>
        </div>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

export default function DailyInput() {
  const { addReport, getReportByDateString, reports, loading } = useReports();
  const { isAdmin } = useAuth();
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [existingReport, setExistingReport] = useState(null);
  const [currentParsed, setCurrentParsed] = useState(null);
  const clearTrigger = useRef(null);

  const handlePreview = useCallback(async (parsed) => {
    setCurrentParsed(parsed);
    if (parsed && parsed.dateString) {
      const existing = await getReportByDateString(parsed.dateString);
      setExistingReport(existing);
    } else {
      setExistingReport(null);
    }
  }, [getReportByDateString]);

  const handleSave = useCallback(async (parsed) => {
    setSaving(true);
    try {
      const result = await addReport(parsed, existingReport?.id || null);
      setSuccessMsg(
        result.isUpdate
          ? `${parsed.dateString} updated`
          : `${parsed.dateString} saved`
      );
      setExistingReport(null);
      setCurrentParsed(null);
      clearTrigger.current = Date.now();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [addReport, existingReport]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] animate-fade-in">
        <div className="glass-card p-8 text-center max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-accent-rose/10 border border-accent-rose/20 flex items-center justify-center mx-auto mb-3">
            <span className="text-lg text-accent-rose">!</span>
          </div>
          <h3 className="font-semibold text-text-primary mb-1">View Only</h3>
          <p className="text-xs text-text-muted">You don't have permission to input or edit reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <AnimatePresence>
        {successMsg && (
          <SuccessToast message={successMsg} onDismiss={() => setSuccessMsg(null)} />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-xl sm:text-2xl text-text-primary">Daily Input</h2>
          <p className="text-text-muted text-sm mt-1">Paste the daily order report from your messaging app</p>
        </div>
        <span className="text-xs text-text-muted bg-bg-elevated px-2.5 py-1 rounded-full">
          {reports.length} reports
        </span>
      </div>

      <ReportPasteBox
        onSave={handleSave}
        onPreview={handlePreview}
        existingReport={existingReport}
        saving={saving}
        clearTrigger={clearTrigger.current}
      />

      <div className="pt-2">
        <ReportHistory reports={reports || []} loading={loading} />
      </div>
    </div>
  );
}
