import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { subDays, format } from 'date-fns';
import { useReports } from '../hooks/useReports';
import { useProducts } from '../hooks/useProducts';
import { computeAlerts } from '../utils/analytics';
import { generateReportPDF } from '../utils/pdfGenerator';
import { formatBDTShort } from '../utils/formatters';
import DynamicKPIs from '../components/Dashboard/DynamicKPIs';
import RevenueChart from '../components/Dashboard/RevenueChart';
import OrderTypeChart from '../components/Dashboard/OrderTypeChart';
import WeekdayChart from '../components/Dashboard/WeekdayChart';
import CategoryChart from '../components/Dashboard/CategoryChart';
import ComparisonCards from '../components/Dashboard/ComparisonCards';
import RollingAvgChart from '../components/Dashboard/RollingAvgChart';
import ProductIntelligence from '../components/Dashboard/ProductIntelligence';
import AdvancedTrends from '../components/Dashboard/AdvancedTrends';
import YearlyReport from '../components/Dashboard/YearlyReport';
import ProductsOverview from '../components/Dashboard/ProductsOverview';
import DailyReport from '../components/Reports/DailyReport';
import WeeklyReport from '../components/Reports/WeeklyReport';
import MonthlyReport from '../components/Reports/MonthlyReport';
import Alert from '../components/UI/Alert';
import DetailModal from '../components/UI/DetailModal';
import RangePDF from '../components/Dashboard/RangePDF';
import { CardSkeleton, ChartSkeleton } from '../components/UI/Loader';

const RANGES = [
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Today', value: 'today' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
];

const SECTION_THEMES = {
  'Revenue & Orders': { accent: '#C9A84C', icon: '💰' },
  'Period Analysis': { accent: '#0D9488', icon: '📊' },
  'Weekday & Category': { accent: '#3B82F6', icon: '📅' },
  'Stock Intelligence': { accent: '#E11D48', icon: '📦' },
  'Rolling Averages': { accent: '#A78BFA', icon: '📈' },
  'Advanced Trends': { accent: '#FB923C', icon: '🔥' },
  'Comparisons': { accent: '#C9A84C', icon: '⚖' },
  'Products': { accent: '#0D9488', icon: '🛍' },
};

function Section({ title, subtitle, count, defaultOpen = true, children, onExpand }) {
  return (
    <details open={defaultOpen} className="group relative">
      <div className="absolute top-0 left-0 right-0 h-[2px] rounded-full bg-gradient-to-r from-accent-gold/40 via-accent-teal/30 to-transparent opacity-60 group-open:opacity-100 transition-opacity pointer-events-none" />

      <summary className="flex items-center justify-between cursor-pointer mb-3 list-none select-none py-2 px-3 rounded-xl hover:bg-bg-elevated/30 transition-colors -mx-1">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent-gold/15 to-accent-gold/5 border border-accent-gold/20 flex items-center justify-center flex-shrink-0 group-open:bg-accent-gold/25 transition-colors shadow-sm">
            <span className="text-[9px] text-accent-gold transition-transform group-open:rotate-90 block duration-200">▶</span>
          </span>
          <div className="min-w-0">
            <h3 className="font-semibold text-text-primary text-sm sm:text-[15px] tracking-tight">{title}</h3>
            {subtitle && <p className="text-[10px] sm:text-[11px] text-text-muted/70 truncate mt-0.5">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {count !== undefined && (
            <span className="text-[9px] font-mono text-text-muted/60 bg-bg-elevated/80 px-2 py-0.5 rounded-full border border-border/40">
              {count}
            </span>
          )}
          {onExpand && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onExpand(); }}
              className="w-6 h-6 rounded-lg bg-bg-elevated/60 hover:bg-accent-gold/10 flex items-center justify-center text-text-muted hover:text-accent-gold transition-all"
              title="Expand full view"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            </button>
          )}
        </div>
      </summary>

      <div className="pb-1">
        {children}
      </div>
    </details>
  );
}

function Greeting() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const hour = new Date().getHours();
  let greet, icon;
  if (hour < 12) { greet = 'Good Morning'; icon = '☀️'; }
  else if (hour < 17) { greet = 'Good Afternoon'; icon = '🌤'; }
  else if (hour < 21) { greet = 'Good Evening'; icon = '🌅'; }
  else { greet = 'Good Night'; icon = '🌙'; }

  if (!mounted) return <div className="h-6" />;
  return (
    <span className="animate-fade-in inline-flex items-center gap-1.5">
      <span className="text-sm">{icon}</span>
      <span>{greet}</span>
    </span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { reports, loading: reportsLoading } = useReports();
  const { products } = useProducts();
  const [range, setRange] = useState({ type: '7d' });
  const [showCustom, setShowCustom] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [expandedSection, setExpandedSection] = useState(null);
  const [exportingPDF, setExportingPDF] = useState(false);

  const sortedReports = useMemo(() => {
    if (!reports || reports.length === 0) return [];
    return [...reports].sort((a, b) => new Date(b.dateString) - new Date(a.dateString));
  }, [reports]);

  const filteredReports = useMemo(() => {
    if (range.type === 'custom') {
      if (!range.start || !range.end) return [];
      return sortedReports.filter(r => r.dateString >= range.start && r.dateString <= range.end);
    }
    if (range.type === 'today') return sortedReports.slice(0, 1);
    if (range.type === 'yesterday') {
      const yd = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      return sortedReports.filter(r => r.dateString === yd);
    }
    if (range.type === '7d') return sortedReports.slice(0, 7);
    if (range.type === '30d') return sortedReports.slice(0, 30);
    return sortedReports;
  }, [sortedReports, range]);

  const latestReport = sortedReports.length > 0 ? sortedReports[0] : null;
  const previousReport = sortedReports.length > 1 ? sortedReports[1] : null;

  const alerts = useMemo(() => computeAlerts(sortedReports, products), [sortedReports, products]);

  const ragStatus = useMemo(() => {
    if (!latestReport || !previousReport) return null;
    const valChange = latestReport.totalOrderValue - previousReport.totalOrderValue;
    const ordChange = latestReport.totalOrder - previousReport.totalOrder;
    return {
      trend: valChange > 0 ? 'up' : valChange < 0 ? 'down' : 'flat',
      valChange,
      ordChange,
    };
  }, [latestReport, previousReport]);

  const rangeLabel = useMemo(() => {
    if (range.type === 'today') return 'Today';
    if (range.type === 'yesterday') return 'Yesterday';
    if (range.type === '7d') return 'Last 7 Days';
    if (range.type === '30d') return 'Last 30 Days';
    if (range.type === 'custom' && range.start && range.end) return `${range.start} → ${range.end}`;
    return 'All Reports';
  }, [range]);

  const rangeStartDate = useMemo(() => {
    if (filteredReports.length === 0) return null;
    const sorted = [...filteredReports].sort((a, b) => a.dateString.localeCompare(b.dateString));
    return sorted[0]?.dateString;
  }, [filteredReports]);

  const rangeEndDate = useMemo(() => {
    if (filteredReports.length === 0) return null;
    const sorted = [...filteredReports].sort((a, b) => b.dateString.localeCompare(a.dateString));
    return sorted[0]?.dateString;
  }, [filteredReports]);

  const handleExportPDF = useCallback(async () => {
    if (filteredReports.length === 0) return;
    setExportingPDF(true);
    try {
      const filename = `Anzaar-${rangeLabel.replace(/\s+/g, '-')}-${rangeStartDate || 'all'}.pdf`;
      await generateReportPDF({ dateString: rangeStartDate }, 'range-pdf-content', filename);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setExportingPDF(false);
    }
  }, [filteredReports, rangeLabel, rangeStartDate]);

  if (reportsLoading) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 sm:gap-2">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3">
          {Array.from({ length: 4 }).map((_, i) => <ChartSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!latestReport) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="glass-card p-8 sm:p-12 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-gold/20 to-accent-gold/5 border border-accent-gold/20 flex items-center justify-center mx-auto mb-5">
            <span className="text-2xl text-accent-gold">+</span>
          </div>
          <h3 className="font-semibold text-xl text-text-primary mb-2">No Reports Yet</h3>
          <p className="text-text-muted text-sm mb-6">Paste your first daily order report to start tracking sales.</p>
          <button onClick={() => navigate('/input')} className="btn-primary text-sm">
            Paste Your First Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-3 sm:space-y-4 animate-fade-in">

      {/* ─── FILTER BAR — merged with layout header ─── */}
      <div className="-mt-4 sm:-mt-6 -mx-2 sm:-mx-3 px-2 sm:px-3 py-2.5 bg-white/95 backdrop-blur-sm border-b border-border/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex w-6 h-6 rounded-lg bg-gradient-to-br from-accent-gold/15 to-accent-gold/5 border border-accent-gold/20 items-center justify-center flex-shrink-0">
              <span className="text-[10px] text-accent-gold font-semibold">◈</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-text-primary leading-tight"><Greeting /></p>
              <p className="text-[9px] sm:text-[10px] text-text-muted leading-tight mt-px">
                {format(new Date(), 'EEEE, MMM dd · ')}
                {range.type === 'yesterday' ? 'Showing yesterday' :
                 range.type === 'today' ? 'Latest report' :
                 range.type === 'custom' ? `${range.start} → ${range.end}` :
                 `Last ${range.type} · ${filteredReports.length} reports`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Export PDF Button */}
          {filteredReports.length > 0 && (
            <button
              onClick={handleExportPDF}
              disabled={exportingPDF}
              className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 text-[10px] sm:text-[11px] font-medium text-accent-gold bg-accent-gold/5 hover:bg-accent-gold/10 border border-accent-gold/15 rounded-md transition-all disabled:opacity-40 mr-1"
            >
              {exportingPDF ? (
                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              <span className="hidden sm:inline">{exportingPDF ? '...' : 'Export'}</span>
            </button>
          )}

          <div className="flex gap-0.5 bg-bg-elevated/80 p-0.5 rounded-lg border border-border/60 shadow-sm">
            {RANGES.map(r => (
              <button key={r.value} onClick={() => { setRange({ type: r.value }); setShowCustom(false); }}
                className={`px-2 py-1 sm:px-2.5 sm:py-1.5 text-[10px] sm:text-[11px] font-medium rounded-md transition-all whitespace-nowrap ${
                  range.type === r.value
                    ? 'bg-white text-accent-gold shadow-sm border border-accent-gold/15'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/50'
                }`}>
                {r.label}
              </button>
            ))}
            <button onClick={() => setShowCustom(!showCustom)}
              className={`px-1.5 py-1 sm:px-2 sm:py-1.5 text-[10px] sm:text-[11px] font-medium rounded-md transition-all ${
                range.type === 'custom'
                  ? 'bg-white text-accent-gold shadow-sm border border-accent-gold/15'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/50'
              }`} title="Custom range">
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>
            </button>
          </div>
          {showCustom && (
            <div className="flex items-center gap-1 absolute top-full right-2 sm:right-3 mt-1.5 bg-white border border-border rounded-xl p-1.5 shadow-lg z-40 animate-scale-in">
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                className="text-[10px] sm:text-[11px] px-1.5 py-1 border border-border/60 rounded-md w-22 sm:w-24 focus:outline-none focus:border-accent-gold/50 ring-0" />
              <span className="text-text-muted text-[10px] font-medium">to</span>
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                className="text-[10px] sm:text-[11px] px-1.5 py-1 border border-border/60 rounded-md w-22 sm:w-24 focus:outline-none focus:border-accent-gold/50 ring-0" />
              <button onClick={() => { if (customStart && customEnd) { setRange({ type: 'custom', start: customStart, end: customEnd }); setShowCustom(false); } }}
                className="btn-primary text-[10px] sm:text-[11px] py-1 px-2 rounded-md" disabled={!customStart || !customEnd}>
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── RAG STATUS BAR ─── */}
      {ragStatus && (
        <div className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-2 animate-fade-in ${
          ragStatus.trend === 'up'
            ? 'bg-accent-teal/5 border-accent-teal/15 text-accent-teal'
            : ragStatus.trend === 'down'
            ? 'bg-accent-rose/5 border-accent-rose/15 text-accent-rose'
            : 'bg-text-muted/5 border-text-muted/15 text-text-muted'
        }`}>
          <span className="text-sm">
            {ragStatus.trend === 'up' ? '▲' : ragStatus.trend === 'down' ? '▼' : '–'}
          </span>
          <span>
            {ragStatus.trend === 'up'
              ? `Value up ${formatBDTShort(ragStatus.valChange)} vs previous`
              : ragStatus.trend === 'down'
              ? `Value down ${formatBDTShort(Math.abs(ragStatus.valChange))} vs previous`
              : 'Value unchanged vs previous'}
          </span>
        </div>
      )}

      {/* ─── ALERTS ─── */}
      {(() => {
        const visibleAlerts = [];
        const remaining = [];
        for (let i = 0; i < alerts.length; i++) {
          if (dismissedAlerts.has(i)) continue;
          if (visibleAlerts.length < 4) visibleAlerts.push({ alert: alerts[i], idx: i });
          else remaining.push(alerts[i]);
        }
        if (visibleAlerts.length === 0) return null;
        return (
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none -mx-0.5 px-0.5 animate-fade-in">
            {visibleAlerts.map(({ alert, idx }) => (
              <div key={idx} className="flex-shrink-0 min-w-[160px] sm:min-w-[220px] max-w-[220px] sm:max-w-none">
                <Alert message={alert.message} severity={alert.severity}
                  onDismiss={() => setDismissedAlerts(prev => new Set(prev).add(idx))} />
              </div>
            ))}
            {remaining.length > 0 && (
              <button onClick={() => navigate('/alerts')}
                className="flex-shrink-0 px-2 sm:px-3 py-2 text-xs text-accent-gold hover:underline bg-white rounded-xl border border-border/60 shadow-sm hover:shadow-md transition-all">
                +{remaining.length}
              </button>
            )}
          </div>
        );
      })()}

      {/* ─── KPI CARDS ─── */}
      <DynamicKPIs reports={filteredReports} allReports={sortedReports} />

      {/* ─── PRODUCTS OVERVIEW ─── */}
      <Section title="Products" subtitle="New, trending, dead stock" count={products?.length} onExpand={() => setExpandedSection('Products')}>
        <ProductsOverview products={products} reports={sortedReports} latestReport={latestReport} />
      </Section>

      {/* ─── REVENUE & ORDERS ─── */}
      <Section title="Revenue & Orders" subtitle="Daily revenue, order types, and breakdown" onExpand={() => setExpandedSection('Revenue & Orders')}>
        <div className="bg-gradient-to-br from-white via-white to-bg-elevated/20 rounded-2xl border border-border/30 p-2.5 sm:p-3 cursor-pointer hover:shadow-md hover:border-accent-gold/15 transition-all duration-300 group/card" onClick={() => setExpandedSection('Revenue & Orders')}>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            <div className="lg:col-span-2">
              <RevenueChart reports={filteredReports} loading={reportsLoading} />
            </div>
            <OrderTypeChart report={latestReport} loading={reportsLoading} />
          </div>
          <div className="mt-3 sm:mt-4">
            <DailyReport reports={filteredReports} loading={reportsLoading} />
          </div>
          <div className="text-center mt-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <span className="text-[9px] text-accent-gold/60">tap to expand</span>
          </div>
        </div>
      </Section>

      {/* ─── PERIOD ANALYSIS ─── */}
      <Section title="Period Analysis" subtitle="Weekly, monthly, and yearly summaries" onExpand={() => setExpandedSection('Period Analysis')}>
        <div className="bg-gradient-to-br from-white via-white to-bg-elevated/20 rounded-2xl border border-border/30 p-2.5 sm:p-3 cursor-pointer hover:shadow-md hover:border-accent-teal/15 transition-all duration-300 group/card" onClick={() => setExpandedSection('Period Analysis')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            <WeeklyReport reports={filteredReports} loading={reportsLoading} />
            <MonthlyReport reports={filteredReports} loading={reportsLoading} />
            <YearlyReport reports={sortedReports} loading={reportsLoading} />
          </div>
          <div className="text-center mt-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <span className="text-[9px] text-accent-teal/60">tap to expand</span>
          </div>
        </div>
      </Section>

      {/* ─── WEEKDAY & CATEGORY ─── */}
      <Section title="Weekday & Category" subtitle="Order patterns by day and product category" onExpand={() => setExpandedSection('Weekday & Category')}>
        <div className="bg-gradient-to-br from-white via-white to-bg-elevated/20 rounded-2xl border border-border/30 p-2.5 sm:p-3 cursor-pointer hover:shadow-md hover:border-blue-500/15 transition-all duration-300 group/card" onClick={() => setExpandedSection('Weekday & Category')}>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 sm:gap-3">
            <WeekdayChart reports={filteredReports} loading={reportsLoading} />
            <CategoryChart products={products} loading={reportsLoading} />
          </div>
          <div className="text-center mt-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <span className="text-[9px] text-blue-500/60">tap to expand</span>
          </div>
        </div>
      </Section>

      {/* ─── STOCK INTELLIGENCE ─── */}
      <Section title="Stock Intelligence" subtitle="Restock recommendations and product health" count={products?.length} onExpand={() => setExpandedSection('Stock Intelligence')}>
        <div className="bg-gradient-to-br from-white via-white to-bg-elevated/20 rounded-2xl border border-border/30 p-2.5 sm:p-3 cursor-pointer hover:shadow-md hover:border-accent-rose/15 transition-all duration-300 group/card" onClick={() => setExpandedSection('Stock Intelligence')}>
          <ProductIntelligence products={products} reports={sortedReports} />
          <div className="text-center mt-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <span className="text-[9px] text-accent-rose/60">tap to expand</span>
          </div>
        </div>
      </Section>

      {/* ─── ROLLING & TRENDS ─── */}
      <Section title="Rolling Averages" subtitle="7/14/30-day moving trends" onExpand={() => setExpandedSection('Rolling Averages')}>
        <div className="bg-gradient-to-br from-white via-white to-bg-elevated/20 rounded-2xl border border-border/30 p-2.5 sm:p-3 cursor-pointer hover:shadow-md hover:border-purple-400/15 transition-all duration-300 group/card" onClick={() => setExpandedSection('Rolling Averages')}>
          <RollingAvgChart reports={filteredReports} loading={reportsLoading} />
          <div className="text-center mt-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <span className="text-[9px] text-purple-400/60">tap to expand</span>
          </div>
        </div>
      </Section>

      {/* ─── ADVANCED TRENDS ─── */}
      <Section title="Advanced Trends" subtitle="Revenue, AOV, and product velocity over time" onExpand={() => setExpandedSection('Advanced Trends')}>
        <div className="bg-gradient-to-br from-white via-white to-bg-elevated/20 rounded-2xl border border-border/30 p-2.5 sm:p-3 cursor-pointer hover:shadow-md hover:border-orange-400/15 transition-all duration-300 group/card" onClick={() => setExpandedSection('Advanced Trends')}>
          <AdvancedTrends reports={filteredReports} />
          <div className="text-center mt-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <span className="text-[9px] text-orange-400/60">tap to expand</span>
          </div>
        </div>
      </Section>

      {/* ─── COMPARISONS ─── */}
      <Section title="Comparisons" subtitle="Week-over-week, month-over-month, same-day" onExpand={() => setExpandedSection('Comparisons')}>
        <div className="bg-gradient-to-br from-white via-white to-bg-elevated/20 rounded-2xl border border-border/30 p-2.5 sm:p-3 cursor-pointer hover:shadow-md hover:border-accent-gold/15 transition-all duration-300 group/card" onClick={() => setExpandedSection('Comparisons')}>
          <ComparisonCards reports={sortedReports} loading={reportsLoading} />
          <div className="text-center mt-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
            <span className="text-[9px] text-accent-gold/60">tap to expand</span>
          </div>
        </div>
      </Section>

    </div>

    {/* ─── EXPAND MODALS ─── */}
    {expandedSection && (
      <DetailModal
        open={!!expandedSection}
        onClose={() => setExpandedSection(null)}
        title={expandedSection}
        subtitle={SECTION_THEMES[expandedSection]?.subtitle || ''}
        color={SECTION_THEMES[expandedSection]?.accent || '#C9A84C'}
        icon={<span className="text-lg">{SECTION_THEMES[expandedSection]?.icon || '📊'}</span>}
      >
        <div className="space-y-4">
          {expandedSection === 'Revenue & Orders' && (
            <>
              <RevenueChart reports={filteredReports} loading={reportsLoading} />
              <OrderTypeChart report={latestReport} loading={reportsLoading} />
              <DailyReport reports={filteredReports} loading={reportsLoading} />
            </>
          )}
          {expandedSection === 'Period Analysis' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <WeeklyReport reports={filteredReports} loading={reportsLoading} />
              <MonthlyReport reports={filteredReports} loading={reportsLoading} />
              <YearlyReport reports={sortedReports} loading={reportsLoading} />
            </div>
          )}
          {expandedSection === 'Weekday & Category' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <WeekdayChart reports={filteredReports} loading={reportsLoading} />
              <CategoryChart products={products} loading={reportsLoading} />
            </div>
          )}
          {expandedSection === 'Stock Intelligence' && (
            <ProductIntelligence products={products} reports={sortedReports} />
          )}
          {expandedSection === 'Rolling Averages' && (
            <RollingAvgChart reports={filteredReports} loading={reportsLoading} />
          )}
          {expandedSection === 'Advanced Trends' && (
            <AdvancedTrends reports={filteredReports} />
          )}
          {expandedSection === 'Comparisons' && (
            <ComparisonCards reports={sortedReports} loading={reportsLoading} />
          )}
          {expandedSection === 'Products' && (
            <ProductsOverview products={products} reports={sortedReports} latestReport={latestReport} />
          )}
        </div>
      </DetailModal>
    )}

    {/* Hidden Range PDF render */}
    {filteredReports.length > 0 && (
      <RangePDF
        reports={filteredReports}
        rangeLabel={rangeLabel}
        startDate={rangeStartDate}
        endDate={rangeEndDate}
      />
    )}
    </>
  );
}


