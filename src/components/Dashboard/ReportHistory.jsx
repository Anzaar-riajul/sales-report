import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import ReportPDF from './ReportPDF';
import { generateReportPDF } from '../../utils/pdfGenerator';
import { formatDate, formatBDTShort, formatBDT, formatNumber, formatPercent } from '../../utils/formatters';

function ReportDetailModal({ report, allReports, onClose }) {
  const [generating, setGenerating] = useState(false);
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

  const productCount = report.products?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl animate-slide-up">
        {/* Sticky header with PDF button */}
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
            <button
              onClick={handleDownload}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-accent-gold bg-accent-gold/5 hover:bg-accent-gold/10 border border-accent-gold/15 rounded-lg transition-all disabled:opacity-40"
            >
              {generating ? (
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {generating ? 'Generating...' : 'PDF'}
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

      {/* Hidden PDF render */}
      <div ref={pdfRef}>
        <ReportPDF report={report} allReports={allReports} />
      </div>
    </div>
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

export default function ReportHistory({ reports, loading }) {
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
        <ReportDetailModal report={selectedReport} allReports={reports} onClose={() => setSelectedReport(null)} />
      )}
    </>
  );
}
