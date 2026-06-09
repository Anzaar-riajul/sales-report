import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { subDays, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { useReports } from '../hooks/useReports';
import { generateReportPDF } from '../utils/pdfGenerator';
import { formatBDT, formatNumber, formatDateShort } from '../utils/formatters';
import RangePDF from '../components/Dashboard/RangePDF';

const PRESETS = [
  { label: 'Today', getRange: () => ({ start: format(new Date(), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'Yesterday', getRange: () => { const d = subDays(new Date(), 1); return { start: format(d, 'yyyy-MM-dd'), end: format(d, 'yyyy-MM-dd') }; } },
  { label: 'This Week', getRange: () => ({ start: format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd'), end: format(endOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd') }) },
  { label: 'Last 7 Days', getRange: () => ({ start: format(subDays(new Date(), 6), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'This Month', getRange: () => ({ start: format(startOfMonth(new Date()), 'yyyy-MM-dd'), end: format(endOfMonth(new Date()), 'yyyy-MM-dd') }) },
  { label: 'Last 30 Days', getRange: () => ({ start: format(subDays(new Date(), 29), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'All Time', getRange: () => ({ start: '', end: '' }) },
];

export default function PDFExport() {
  const navigate = useNavigate();
  const { reports, loading } = useReports();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePreset, setActivePreset] = useState(null);
  const [generating, setGenerating] = useState(false);

  const handlePreset = (preset, index) => {
    const range = preset.getRange();
    setStartDate(range.start);
    setEndDate(range.end);
    setActivePreset(index);
  };

  const filteredReports = useMemo(() => {
    if (!reports || reports.length === 0) return [];
    const sorted = [...reports].sort((a, b) => a.dateString.localeCompare(b.dateString));
    if (!startDate || !endDate) return sorted;
    return sorted.filter(r => r.dateString >= startDate && r.dateString <= endDate);
  }, [reports, startDate, endDate]);

  const stats = useMemo(() => {
    if (filteredReports.length === 0) return null;
    return filteredReports.reduce((acc, r) => ({
      totalOrder: acc.totalOrder + (r.totalOrder || 0),
      totalProduct: acc.totalProduct + (r.totalProduct || 0),
      totalOrderValue: acc.totalOrderValue + (r.totalOrderValue || 0),
      totalAdvance: acc.totalAdvance + (r.totalAdvance || 0),
    }), { totalOrder: 0, totalProduct: 0, totalOrderValue: 0, totalAdvance: 0 });
  }, [filteredReports]);

  const rangeLabel = useMemo(() => {
    if (activePreset !== null) return PRESETS[activePreset].label;
    if (startDate && endDate) return `${formatDateShort(startDate)} – ${formatDateShort(endDate)}`;
    return 'All Reports';
  }, [activePreset, startDate, endDate]);

  const handleExport = useCallback(async () => {
    if (filteredReports.length === 0) return;
    setGenerating(true);
    try {
      const filename = `Anzaar-${rangeLabel.replace(/\s+/g, '-')}-${startDate || 'all'}.pdf`;
      await generateReportPDF({ dateString: startDate }, 'range-pdf-content', filename);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setGenerating(false);
    }
  }, [filteredReports, rangeLabel, startDate]);

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-20 bg-bg-elevated/50 rounded-2xl animate-pulse" />
        <div className="h-40 bg-bg-elevated/50 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-4xl animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl border border-border/50 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-accent-gold/8 to-transparent rounded-full" />
        <div className="relative">
          <h1 className="font-bold text-xl sm:text-2xl text-text-primary tracking-tight">
            <span className="bg-gradient-to-r from-accent-gold to-accent-gold/70 bg-clip-text text-transparent">Export PDF</span>
          </h1>
          <p className="text-text-muted text-xs sm:text-sm mt-1">Select a date range and download your sales report</p>
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="bg-white/80 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-sm">
        <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium mb-3">Quick Select</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset, i) => (
            <button
              key={i}
              onClick={() => handlePreset(preset, i)}
              className={`px-3 py-2 text-xs font-medium rounded-xl transition-all ${
                activePreset === i
                  ? 'bg-accent-gold text-white shadow-md shadow-accent-gold/20'
                  : 'bg-bg-elevated/60 text-text-muted hover:bg-bg-elevated hover:text-text-primary border border-border/40'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range */}
      <div className="bg-white/80 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-sm">
        <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium mb-3">Custom Range</p>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setActivePreset(null); }}
              className="text-xs px-3 py-2 border border-border/60 rounded-xl focus:outline-none focus:border-accent-gold/50 bg-white"
            />
          </div>
          <span className="text-text-muted text-xs">→</span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-text-muted">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setActivePreset(null); }}
              className="text-xs px-3 py-2 border border-border/60 rounded-xl focus:outline-none focus:border-accent-gold/50 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Preview Stats */}
      {stats && (
        <div className="bg-white/80 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium">Preview · {rangeLabel}</p>
            <span className="text-[10px] text-text-muted font-mono">{filteredReports.length} reports</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-bg-elevated/40 rounded-xl p-3 text-center">
              <p className="text-[9px] text-text-muted uppercase">Orders</p>
              <p className="text-sm font-bold font-mono text-text-primary">{formatNumber(stats.totalOrder)}</p>
            </div>
            <div className="bg-bg-elevated/40 rounded-xl p-3 text-center">
              <p className="text-[9px] text-text-muted uppercase">Products</p>
              <p className="text-sm font-bold font-mono text-text-primary">{formatNumber(stats.totalProduct)}</p>
            </div>
            <div className="bg-bg-elevated/40 rounded-xl p-3 text-center">
              <p className="text-[9px] text-text-muted uppercase">Advance</p>
              <p className="text-sm font-bold font-mono text-accent-teal">{formatBDT(stats.totalAdvance)}</p>
            </div>
            <div className="bg-bg-elevated/40 rounded-xl p-3 text-center">
              <p className="text-[9px] text-text-muted uppercase">Value</p>
              <p className="text-sm font-bold font-mono text-accent-gold">{formatBDT(stats.totalOrderValue)}</p>
            </div>
          </div>

          <button
            onClick={handleExport}
            disabled={generating || filteredReports.length === 0}
            className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-accent-gold to-accent-gold/90 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-lg shadow-accent-gold/20 hover:shadow-xl hover:shadow-accent-gold/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
          >
            {generating ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating PDF...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF Report
              </>
            )}
          </button>
        </div>
      )}

      {/* No data */}
      {filteredReports.length === 0 && !loading && (
        <div className="bg-white/80 backdrop-blur-xl border border-border/50 rounded-2xl p-8 text-center shadow-sm">
          <p className="text-sm text-text-muted">No reports found for this date range.</p>
        </div>
      )}

      {/* Hidden Range PDF render */}
      {filteredReports.length > 0 && (
        <RangePDF
          reports={filteredReports}
          rangeLabel={rangeLabel}
          startDate={startDate || filteredReports[0]?.dateString}
          endDate={endDate || filteredReports[filteredReports.length - 1]?.dateString}
        />
      )}
    </div>
  );
}
