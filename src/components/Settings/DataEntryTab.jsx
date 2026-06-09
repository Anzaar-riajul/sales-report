import { useState, useCallback, useEffect, useRef } from 'react';
import { useReports } from '../../hooks/useReports';
import { useAuth } from '../../hooks/useAuth';
import ReportPasteBox from '../Input/ReportPasteBox';
import ReportHistory from '../Dashboard/ReportHistory';
import { parseCSV, downloadCSVTemplate } from '../../utils/csvParser';
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

  const [csvStatus, setCsvStatus] = useState(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResults, setCsvResults] = useState(null);

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

  const handleCSVUpload = useCallback(async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    setCsvStatus('parsing');
    setCsvResults(null);
    setCsvImporting(false);

    try {
      const text = await file.text();
      const { reports: parsedReports, errors } = parseCSV(text);

      if (parsedReports.length === 0) {
        setCsvStatus('error');
        setCsvResults({ errors: errors.length > 0 ? errors : ['No valid reports found in CSV'] });
        return;
      }

      setCsvResults({ reports: parsedReports, errors, total: parsedReports.length, imported: 0, failed: 0 });
      setCsvStatus('preview');
    } catch (err) {
      setCsvStatus('error');
      setCsvResults({ errors: [err.message] });
    }

    e.target.value = '';
  }, []);

  const handleCSVImport = useCallback(async () => {
    if (!csvResults?.reports?.length) return;
    setCsvImporting(true);
    let imported = 0;
    let failed = 0;

    for (const report of csvResults.reports) {
      try {
        const existing = await getReportByDateString(report.dateString);
        await addReport(report, existing?.id || null);
        imported++;
      } catch {
        failed++;
      }
      setCsvResults(prev => ({ ...prev, imported, failed }));
    }

    setCsvStatus('done');
    setCsvImporting(false);
    setSuccessMsg(`${imported} reports imported from CSV!`);
  }, [csvResults, addReport, getReportByDateString]);

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
          {/* CSV Upload */}
          <div className="bg-white/80 border border-border/30 rounded-2xl p-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6366F1]/15 to-[#6366F1]/5 border border-[#6366F1]/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-[#6366F1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><polyline points="9 15 12 18 15 15" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-text-primary">CSV Import</p>
                <p className="text-[9px] text-text-muted">Bulk import historical reports from a CSV file</p>
              </div>
              <button onClick={downloadCSVTemplate}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium text-[#6366F1] bg-[#6366F1]/5 hover:bg-[#6366F1]/10 border border-[#6366F1]/15 rounded-lg transition-all">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Template
              </button>
            </div>

            <label className="flex items-center justify-center gap-2 w-full py-6 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-[#6366F1]/30 hover:bg-[#6366F1]/5 transition-all group">
              <svg className="w-5 h-5 text-text-muted group-hover:text-[#6366F1] transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
              </svg>
              <span className="text-xs text-text-muted group-hover:text-[#6366F1] transition-colors">
                {csvStatus === 'parsing' ? 'Parsing...' : 'Click to upload CSV'}
              </span>
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" disabled={csvImporting} />
            </label>

            {csvStatus === 'preview' && csvResults && (
              <div className="mt-3 bg-bg-elevated/40 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-text-primary">
                    {csvResults.total} reports found
                    {csvResults.errors.length > 0 && ` (${csvResults.errors.length} errors)`}
                  </p>
                  <button onClick={handleCSVImport} disabled={csvImporting}
                    className="px-4 py-2 bg-gradient-to-r from-[#6366F1] to-indigo-500 text-white text-[11px] font-bold rounded-lg shadow-lg shadow-[#6366F1]/25 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-40 flex items-center gap-1.5">
                    {csvImporting ? (
                      <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Importing... {csvResults.imported}/{csvResults.total}</>
                    ) : `Import All ${csvResults.total}`}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-text-muted">
                  {csvResults.imported > 0 && <span className="text-accent-teal font-medium">✓ {csvResults.imported} imported</span>}
                  {csvResults.failed > 0 && <span className="text-accent-rose font-medium">✕ {csvResults.failed} failed</span>}
                </div>
                {csvResults.errors.length > 0 && (
                  <div className="mt-2 max-h-24 overflow-y-auto space-y-0.5">
                    {csvResults.errors.map((err, i) => (
                      <p key={i} className="text-[9px] text-accent-rose font-mono">{err}</p>
                    ))}
                  </div>
                )}
                {csvImporting && (
                  <div className="mt-2 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#6366F1] to-indigo-400 rounded-full transition-all duration-300"
                      style={{ width: `${csvResults.total > 0 ? (csvResults.imported / csvResults.total) * 100 : 0}%` }} />
                  </div>
                )}
              </div>
            )}

            {csvStatus === 'done' && (
              <div className="mt-3 bg-accent-teal/5 border border-accent-teal/15 rounded-xl p-3 text-center">
                <p className="text-xs font-semibold text-accent-teal">✓ Import complete! {csvResults?.imported || 0} reports added.</p>
              </div>
            )}

            {csvStatus === 'error' && csvResults && (
              <div className="mt-3 bg-accent-rose/5 border border-accent-rose/15 rounded-xl p-3">
                <p className="text-xs font-semibold text-accent-rose mb-1">Import Error</p>
                {csvResults.errors.map((err, i) => (
                  <p key={i} className="text-[10px] text-accent-rose font-mono">{err}</p>
                ))}
              </div>
            )}
          </div>

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