import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { subDays, format } from 'date-fns';
import { useReports } from '../hooks/useReports';
import { useProducts } from '../hooks/useProducts';
import { computeAlerts, computeDailyReport } from '../utils/analytics';
import DynamicKPIs from '../components/Dashboard/DynamicKPIs';
import RevenueChart from '../components/Dashboard/RevenueChart';
import OrderTypeChart from '../components/Dashboard/OrderTypeChart';
import TopProductsTable from '../components/Dashboard/TopProductsTable';
import WeekdayChart from '../components/Dashboard/WeekdayChart';
import CategoryChart from '../components/Dashboard/CategoryChart';
import ComparisonCards from '../components/Dashboard/ComparisonCards';
import RollingAvgChart from '../components/Dashboard/RollingAvgChart';
import ProductIntelligence from '../components/Dashboard/ProductIntelligence';
import AdvancedTrends from '../components/Dashboard/AdvancedTrends';
import YearlyReport from '../components/Dashboard/YearlyReport';
import ProductRanking from '../components/Products/ProductRanking';
import ReportHistory from '../components/Dashboard/ReportHistory';
import DailyReport from '../components/Reports/DailyReport';
import WeeklyReport from '../components/Reports/WeeklyReport';
import MonthlyReport from '../components/Reports/MonthlyReport';
import Alert from '../components/UI/Alert';
import { CardSkeleton, ChartSkeleton } from '../components/UI/Loader';

const RANGES = [
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Today', value: 'today' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
];

function CollapsibleSection({ title, count, defaultOpen = true, children }) {
  return (
    <details open={defaultOpen} className="group">
      <summary className="flex items-center gap-2 cursor-pointer mb-3 list-none">
        <span className="text-[10px] text-text-muted transition-transform group-open:rotate-90">▶</span>
        <h3 className="font-semibold text-text-primary text-base sm:text-lg">{title}</h3>
        {count !== undefined && (
          <span className="text-xs text-text-muted bg-bg-elevated px-2 py-0.5 rounded-full">{count}</span>
        )}
      </summary>
      {children}
    </details>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { reports, loading: reportsLoading } = useReports();
  const { products } = useProducts();
  const [range, setRange] = useState({ type: '7d' });
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

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

  const dailyReport = useMemo(() => computeDailyReport(latestReport, previousReport), [latestReport, previousReport]);
  const alerts = useMemo(() => computeAlerts(sortedReports, products), [sortedReports, products]);

  if (reportsLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-xl sm:text-2xl text-text-primary">Dashboard</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <ChartSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!latestReport) {
    return (
      <div className="space-y-6">
        <h2 className="font-semibold text-xl sm:text-2xl text-text-primary">Dashboard</h2>
        <div className="glass-card p-8 sm:p-12 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-accent-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-xl sm:text-2xl text-accent-gold">+</span>
          </div>
          <h3 className="font-semibold text-lg sm:text-xl text-text-primary mb-2">No Reports Yet</h3>
          <p className="text-text-muted text-sm mb-6">Paste your first daily order report to start tracking.</p>
          <button onClick={() => navigate('/input')} className="btn-primary text-sm sm:text-base">
            Paste Your First Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ═══ HEADER ═══ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-bg-elevated/60 border border-border p-5 sm:p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-gold/[0.03] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-teal/[0.03] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-accent-gold/10 border border-accent-gold/20 items-center justify-center flex-shrink-0">
              <span className="text-lg text-accent-gold font-semibold">◈</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-xl sm:text-2xl text-text-primary tracking-tight">Dashboard</h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bg-elevated text-[10px] font-medium text-text-muted border border-border">
                  {filteredReports.length} reports
                </span>
              </div>
              <p className="text-xs sm:text-sm text-text-muted mt-0.5">
                <span className="inline-flex items-center gap-1.5">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  {
                    range.type === 'yesterday' ? 'Showing yesterday\'s report' :
                    range.type === 'today' ? 'Showing latest report' :
                    range.type === 'custom' ? `${range.start} → ${range.end}` :
                    `Last ${range.type} reports`
                  }
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex gap-0.5 bg-bg-elevated/80 p-0.5 rounded-xl border border-border shadow-sm">
              {RANGES.map(r => (
                <button
                  key={r.value}
                  onClick={() => { setRange({ type: r.value }); setShowCustom(false); }}
                  className={`relative px-3 sm:px-4 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                    range.type === r.value
                      ? 'bg-white text-accent-gold shadow-sm border border-accent-gold/20'
                      : 'text-text-muted hover:text-text-primary hover:bg-white/50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
              <button
                onClick={() => setShowCustom(!showCustom)}
                className={`relative px-2.5 py-2 text-xs font-medium rounded-lg transition-all ${
                  range.type === 'custom'
                    ? 'bg-white text-accent-gold shadow-sm border border-accent-gold/20'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/50'
                }`}
                title="Custom range"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/></svg>
              </button>
            </div>

            {showCustom && (
              <div className="flex items-center gap-1.5 bg-white border border-border rounded-xl p-1.5 shadow-lg">
                <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-border rounded-lg w-28 focus:outline-none focus:border-accent-gold/50 focus:ring-1 focus:ring-accent-gold/20" />
                <span className="text-text-muted text-xs font-medium">to</span>
                <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
                  className="text-xs px-2.5 py-1.5 border border-border rounded-lg w-28 focus:outline-none focus:border-accent-gold/50 focus:ring-1 focus:ring-accent-gold/20" />
                <button
                  onClick={() => { if (customStart && customEnd) { setRange({ type: 'custom', start: customStart, end: customEnd }); setShowCustom(false); } }}
                  className="btn-primary text-xs py-1.5 px-3 rounded-lg"
                  disabled={!customStart || !customEnd}
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ ALERTS ═══ */}
      {alerts.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {alerts.slice(0, 4).map((alert, i) => (
            <div key={i} className="flex-shrink-0 min-w-[200px] sm:min-w-[240px]">
              <Alert message={alert.message} severity={alert.severity} />
            </div>
          ))}
          {alerts.length > 4 && (
            <button
              onClick={() => navigate('/alerts')}
              className="flex-shrink-0 px-3 sm:px-4 py-2 text-xs text-accent-gold hover:underline bg-white rounded-lg border border-border shadow-sm"
            >
              +{alerts.length - 4}
            </button>
          )}
        </div>
      )}

      {/* ═══ KPI CARDS ═══ */}
      <DynamicKPIs latestReport={latestReport} previousReport={previousReport} />

      {/* ═══ REVENUE & ORDERS ═══ */}
      <CollapsibleSection title="Revenue & Orders">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RevenueChart reports={filteredReports} loading={reportsLoading} />
          </div>
          <OrderTypeChart report={latestReport} loading={reportsLoading} />
        </div>
        <div className="mt-4">
          <DailyReport reports={filteredReports} loading={reportsLoading} />
        </div>
      </CollapsibleSection>

      {/* ═══ PERIOD ANALYSIS ═══ */}
      <CollapsibleSection title="Period Analysis">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <WeeklyReport reports={filteredReports} loading={reportsLoading} />
          <MonthlyReport reports={filteredReports} loading={reportsLoading} />
          <YearlyReport reports={sortedReports} loading={reportsLoading} />
        </div>
      </CollapsibleSection>

      {/* ═══ WEEKDAY & CATEGORY ═══ */}
      <CollapsibleSection title="Weekday & Category">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <WeekdayChart reports={filteredReports} loading={reportsLoading} />
          <CategoryChart products={products} loading={reportsLoading} />
        </div>
      </CollapsibleSection>

      {/* ═══ PRODUCT INTELLIGENCE ═══ */}
      <CollapsibleSection title="Stock Intelligence" count={products?.length}>
        <ProductIntelligence products={products} reports={sortedReports} />
      </CollapsibleSection>

      {/* ═══ TRENDS & ROLLING ═══ */}
      <CollapsibleSection title="Rolling & Products/Order">
        <RollingAvgChart reports={filteredReports} loading={reportsLoading} />
      </CollapsibleSection>

      {/* ═══ ADVANCED TRENDS ═══ */}
      <AdvancedTrends reports={filteredReports} />

      {/* ═══ COMPARISONS ═══ */}
      <CollapsibleSection title="Comparisons">
        <ComparisonCards reports={sortedReports} loading={reportsLoading} />
      </CollapsibleSection>

      {/* ═══ PRODUCT RANKING ═══ */}
      <CollapsibleSection title="Product Ranking" count={products?.length}>
        <ProductRanking products={products} loading={reportsLoading} />
      </CollapsibleSection>

      {/* ═══ TODAY'S PRODUCTS ═══ */}
      <CollapsibleSection title="Today's Products">
        <TopProductsTable products={latestReport?.products || []} loading={reportsLoading} />
      </CollapsibleSection>

      {/* ═══ REPORT HISTORY ═══ */}
      <CollapsibleSection title="Report History" count={sortedReports.length} defaultOpen={false}>
        <ReportHistory reports={sortedReports} loading={reportsLoading} />
      </CollapsibleSection>
    </div>
  );
}
