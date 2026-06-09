import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import ReportPDF from './ReportPDF';
import { generateReportPDF } from '../../utils/pdfGenerator';
import { formatDate, formatBDTShort, formatBDT, formatNumber, formatPercent } from '../../utils/formatters';

function DeleteConfirmModal({ report, onConfirm, onCancel, deleting }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in p-6">
        <div className="w-12 h-12 rounded-2xl bg-[#F43F5E]/10 border border-[#F43F5E]/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-[#F43F5E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <p className="text-center font-bold text-text-primary mb-1">Delete Report?</p>
        <p className="text-center text-sm text-text-muted mb-6">
          This will permanently delete the report for <span className="font-semibold text-text-primary">{formatDate(report.dateString)}</span> and update product stats.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} disabled={deleting}
            className="flex-1 py-2.5 text-sm font-medium text-text-primary bg-bg-elevated hover:bg-bg-elevated/80 border border-border/50 rounded-xl transition-all disabled:opacity-40">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-[#F43F5E] hover:bg-[#E11D48] rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-[#F43F5E]/20">
            {deleting ? (
              <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Deleting...</>
            ) : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportDetailModal({ report, allReports, onClose, onEdit, onDelete }) {
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const pdfRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleDownload = useCallback(async () => {
    setGenerating(true);
    try {
      await generateReportPDF(report, 'report-pdf-content', `Anzaar-Report-${report.dateString}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setGenerating(false);
    }
  }, [report]);

  const handleDeleteConfirm = useCallback(async () => {
    setDeleting(true);
    try {
      await onDelete(report);
      setShowDeleteConfirm(false);
      onClose();
    } catch {
      setDeleting(false);
    }
  }, [report, onDelete, onClose]);

  const productCount = report.products?.length || 0;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl animate-slide-up">
          <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-border/60 px-4 sm:px-5 py-3 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center">
                <span className="text-[10px] text-accent-gold font-semibold">◈</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">{formatDate(report.dateString)}</p>
                <p className="text-[10px] text-text-muted">{report.dayOfWeek || ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => onEdit(report)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-[#6366F1] bg-[#6366F1]/5 hover:bg-[#6366F1]/10 border border-[#6366F1]/15 rounded-lg transition-all">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-[#F43F5E] bg-[#F43F5E]/5 hover:bg-[#F43F5E]/10 border border-[#F43F5E]/15 rounded-lg transition-all">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
              <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-bg-elevated flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-bg-elevated/60 rounded-xl px-3 py-3">
                <p className="text-[9px] text-text-muted uppercase tracking-wider mb-1">Orders</p>
                <p className="text-lg font-mono font-bold text-text-primary">{formatNumber(report.totalOrder)}</p>
                <p className="text-[10px] text-text-muted">{formatNumber(report.regularOrder)} Reg · {formatNumber(report.customizeOrder)} Cust</p>
              </div>
              <div className="bg-bg-elevated/60 rounded-xl px-3 py-3">
                <p className="text-[9px] text-text-muted uppercase tracking-wider mb-1">Order Value</p>
                <p className="text-lg font-mono font-bold text-accent-gold">{formatBDTShort(report.totalOrderValue)}</p>
                <p className="text-[10px] text-text-muted">{formatBDT(report.totalOrderValue)}</p>
              </div>
              <div className="bg-bg-elevated/60 rounded-xl px-3 py-3">
                <p className="text-[9px] text-text-muted uppercase tracking-wider mb-1">Advance</p>
                <p className="text-lg font-mono font-bold text-accent-teal">{formatBDTShort(report.totalAdvance)}</p>
                <p className="text-[10px] text-text-muted">{formatPercent(report.advanceRate)} advance rate</p>
              </div>
              <div className="bg-bg-elevated/60 rounded-xl px-3 py-3">
                <p className="text-[9px] text-text-muted uppercase tracking-wider mb-1">Products</p>
                <p className="text-lg font-mono font-bold text-text-primary">{formatNumber(report.totalProduct)}</p>
                <p className="text-[10px] text-text-muted">{productCount} unique items</p>
              </div>
            </div>

            {report.products && report.products.length > 0 && (
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Products ({report.products.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {report.products.map(p => (
                    <span key={p.name} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-elevated rounded-lg text-xs text-text-primary border border-border/50">
                      {p.name}
                      <span className="text-accent-gold font-mono font-medium">×{p.quantity}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {report.rawText && (
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Raw Text</p>
                <pre className="text-xs text-text-muted bg-bg-elevated/80 rounded-xl p-3 overflow-x-auto max-h-48 leading-relaxed whitespace-pre-wrap font-mono border border-border/30">
                  {report.rawText}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div ref={pdfRef}>
          <ReportPDF report={report} allReports={allReports} />
        </div>
      </div>

      {showDeleteConfirm && (
        <DeleteConfirmModal
          report={report}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteConfirm(false)}
          deleting={deleting}
        />
      )}
    </>
  );
}

function ReportRow({ report, index, total, onSelect }) {
  const productCount = report.products?.length || 0;

  return (
    <tr className="border-b border-border/50 last:border-0 hover:bg-bg-elevated/40 transition-colors cursor-pointer"
      onClick={() => onSelect(report)}
    >
      <td className="py-2.5 pr-2">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-accent-gold/10 text-accent-gold text-[10px] font-mono flex items-center justify-center flex-shrink-0">
            {total - index}
          </span>
          <div>
            <p className="text-sm font-medium text-text-primary">{formatDate(report.dateString)}</p>
            <p className="text-[10px] text-text-muted">{report.dayOfWeek || ''}</p>
          </div>
        </div>
      </td>
      <td className="py-2.5 pr-2 text-right font-mono text-sm text-text-primary">{formatNumber(report.totalOrder)}</td>
      <td className="py-2.5 pr-2 text-right font-mono text-sm text-text-primary">{formatNumber(report.totalProduct)}</td>
      <td className="py-2.5 pr-2 text-right font-mono text-sm text-accent-gold">{formatBDTShort(report.totalOrderValue)}</td>
      <td className="py-2.5 pr-2 text-right font-mono text-sm text-accent-teal">{formatPercent(report.advanceRate)}</td>
      <td className="py-2.5 text-right">
        <Badge variant={productCount > 0 ? 'gold' : 'default'}>{productCount}</Badge>
      </td>
    </tr>
  );
}

export default function ReportHistory({ reports, loading, onEdit, onDelete }) {
  const sorted = useMemo(() => {
    if (!reports || reports.length === 0) return [];
    return [...reports].sort((a, b) => a.dateString.localeCompare(b.dateString));
  }, [reports]);

  const [showAll, setShowAll] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const visible = showAll ? sorted : sorted.slice(-15);

  if (loading) return null;
  if (sorted.length === 0) return null;

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="section-title">Report History</h3>
            <p className="text-xs text-text-muted mt-0.5">{sorted.length} reports total</p>
          </div>
          {sorted.length > 15 && (
            <button onClick={() => setShowAll(!showAll)}
              className="text-xs text-accent-gold hover:underline font-medium">
              {showAll ? 'Show less' : `Show all ${sorted.length}`}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted text-[10px] uppercase tracking-wider border-b border-border">
                <th className="text-left py-2 pr-2">Date</th>
                <th className="text-right py-2 pr-2">Orders</th>
                <th className="text-right py-2 pr-2">Products</th>
                <th className="text-right py-2 pr-2">Value</th>
                <th className="text-right py-2 pr-2">Adv%</th>
                <th className="text-right py-2">Items</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => (
                <ReportRow key={r.dateString} report={r} index={i + (sorted.length - visible.length)} total={sorted.length}
                  onSelect={setSelectedReport} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          allReports={reports}
          onClose={() => setSelectedReport(null)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
    </>
  );
}