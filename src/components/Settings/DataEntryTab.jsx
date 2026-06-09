import { useState, useCallback, useEffect, useRef } from 'react';
import { useReports } from '../../hooks/useReports';
import { useAuth } from '../../hooks/useAuth';
import ReportPasteBox from '../Input/ReportPasteBox';
import ReportHistory from '../Dashboard/ReportHistory';
import { motion, AnimatePresence } from 'framer-motion';

function SuccessToast({ message, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.9 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="fixed top-4 right-4 z-[110] max-w-sm"
    >
      <div className="bg-white/95 backdrop-blur-xl border border-accent-teal/20 shadow-2xl shadow-accent-teal/10 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-accent-teal to-accent-teal/80 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-accent-teal/20">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text-primary">{message}</p>
        </div>
        <button onClick={onDismiss} className="text-text-muted hover:text-text-primary flex-shrink-0 ml-2 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

export default function DataEntryTab() {
  const { addReport, getReportByDateString, reports, loading, removeReport } = useReports();
  const { isSuperAdmin } = useAuth();
  const [existingReport, setExistingReport] = useState(null);
  const clearTrigger = useRef(null);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);



  const handlePreview = useCallback(async (parsed) => {
    setStep(1);
    if (parsed && parsed.dateString) {
      const existing = await getReportByDateString(parsed.dateString);
      setExistingReport(existing);
    } else {
      setExistingReport(null);
    }
  }, [getReportByDateString]);

  const handleSave = useCallback(async (parsed) => {
    setSaving(true);
    setStep(2);
    try {
      const result = await addReport(parsed, existingReport?.id || null);
      setSuccessMsg(
        result.isUpdate
          ? `${parsed.dateString} updated successfully!`
          : `${parsed.dateString} saved successfully!`
      );
      setTimeout(() => {
        setExistingReport(null);
        setStep(0);
        clearTrigger.current = Date.now();
      }, 100);
    } catch (err) {
      console.error('Save failed:', err);
      setStep(1);
      setSuccessMsg(null);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [addReport, existingReport]);

  const handleEdit = useCallback((report) => {
    setStep(0);
    setExistingReport(null);
    clearTrigger.current = Date.now();
    setTimeout(() => {
      clearTrigger.current = Date.now();
    }, 50);
  }, []);

  const handleDelete = useCallback(async (report) => {
    if (!report.id || !report.products || !report.dateString) return;
    await removeReport(report.id, report.products, report.dateString);
  }, [removeReport]);



  const hasEntryAccess = isSuperAdmin;

  return (
    <div className="space-y-4 max-w-4xl">
      <AnimatePresence>
        {successMsg && (
          <SuccessToast key="csv-success" message={successMsg} onDismiss={() => setSuccessMsg(null)} />
        )}
      </AnimatePresence>

      {hasEntryAccess && (
        <>
          {/* Paste Entry */}
          <ReportPasteBox
            onSave={handleSave}
            onPreview={handlePreview}
            existingReport={existingReport}
            saving={saving}
            clearTrigger={clearTrigger.current}
          />
        </>
      )}

      {/* Report History - visible to all */}
      <div className="pt-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center">
            <span className="text-[9px] text-accent-gold font-semibold">◈</span>
          </div>
          <p className="text-xs font-semibold text-text-primary">Report History</p>
          {!hasEntryAccess && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-bg-elevated text-text-muted border border-border/30">read-only</span>
          )}
        </div>
        <ReportHistory
          reports={reports || []}
          loading={loading}
          onEdit={hasEntryAccess ? handleEdit : undefined}
          onDelete={hasEntryAccess ? handleDelete : undefined}
        />
      </div>
    </div>
  );
}