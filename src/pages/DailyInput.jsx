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
          <p className="text-sm font-bold text-text-primary">✓ Report Saved</p>
          <p className="text-xs text-text-muted mt-0.5 truncate">{message}</p>
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

function StepIndicator({ step }) {
  const steps = [
    { label: 'Paste', icon: '📋' },
    { label: 'Preview', icon: '👁' },
    { label: 'Save', icon: '✓' },
  ];
  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
            i <= step
              ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20 shadow-sm shadow-accent-gold/10'
              : 'bg-bg-elevated/50 text-text-muted border border-border/30'
          }`}>
            <span className="text-[11px]">{s.icon}</span>
            <span className="hidden sm:inline">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-6 sm:w-10 h-0.5 rounded-full transition-all duration-300 ${
              i < step ? 'bg-accent-gold/40' : 'bg-border/30'
            }`} />
          )}
        </div>
      ))}
    </div>
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
  const [step, setStep] = useState(0);

  const handlePreview = useCallback(async (parsed) => {
    setCurrentParsed(parsed);
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
          ? `${parsed.dateString} updated successfully! ✨`
          : `${parsed.dateString} saved successfully! ✨`
      );
      
      // Reset everything immediately for super fast entry
      setTimeout(() => {
        setExistingReport(null);
        setCurrentParsed(null);
        setStep(0);
        clearTrigger.current = Date.now();
      }, 100); // Instant reset
    } catch (err) {
      console.error('Save failed:', err);
      setStep(1);
      setSuccessMsg(null);
      throw err;
    } finally {
      setSaving(false);
    }
  }, [addReport, existingReport]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] animate-fade-in">
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl border border-border/50 shadow-2xl rounded-3xl p-10 text-center max-w-sm w-full">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-accent-rose/10 to-transparent rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-tr from-accent-gold/10 to-transparent rounded-full" />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-rose/15 to-accent-rose/5 border border-accent-rose/20 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-accent-rose/10">
              <svg className="w-7 h-7 text-accent-rose" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-text-primary mb-1">View Only</h3>
            <p className="text-xs text-text-muted leading-relaxed">You don't have permission to input or edit reports. Contact admin for access.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl animate-fade-in">
      <AnimatePresence>
        {successMsg && (
          <SuccessToast key="success-toast" message={successMsg} onDismiss={() => setSuccessMsg(null)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl border border-border/50 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-accent-gold/8 to-transparent rounded-full" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-tr from-accent-teal/8 to-transparent rounded-full" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-bold text-xl sm:text-2xl text-text-primary tracking-tight">
              <span className="bg-gradient-to-r from-accent-gold to-accent-gold/70 bg-clip-text text-transparent">Entry</span>
            </h1>
            <p className="text-text-muted text-xs sm:text-sm mt-1">Paste the daily order report from your messaging app</p>
          </div>
          <div className="flex items-center gap-3">
            <StepIndicator step={step} />
            <span className="text-[10px] text-text-muted bg-bg-elevated/80 px-2.5 py-1 rounded-full border border-border/40 font-mono">
              {reports.length} reports
            </span>
          </div>
        </div>
      </div>

      {/* Paste Box */}
      <ReportPasteBox
        onSave={handleSave}
        onPreview={handlePreview}
        existingReport={existingReport}
        saving={saving}
        clearTrigger={clearTrigger.current}
      />

      {/* History */}
      <div className="pt-1">
        <ReportHistory reports={reports || []} loading={loading} />
      </div>
    </div>
  );
}
