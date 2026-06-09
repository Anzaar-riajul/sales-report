import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { subDays } from 'date-fns';
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
import DailySummaryReport from '../components/Dashboard/DailySummaryReport';
import AdvancedTrends from '../components/Dashboard/AdvancedTrends';
import YearlyReport from '../components/Dashboard/YearlyReport';
import ProductRanking from '../components/Products/ProductRanking';
import DailyReport from '../components/Reports/DailyReport';
import WeeklyReport from '../components/Reports/WeeklyReport';
import MonthlyReport from '../components/Reports/MonthlyReport';
import Alert from '../components/UI/Alert';
import { CardSkeleton, ChartSkeleton } from '../components/UI/Loader';

const RANGES = [
  { label: 'Today', value: 'today' },
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '60d', value: 60 },
  { label: '90d', value: 90 },
  { label: 'All', value: 'all' },
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
  const [timeRange, setTimeRange] = useState('today');

  const sortedReports = useMemo(() => {
    if (!reports || reports.length === 0) return [];
    return [...reports].sort((a, b) => new Date(b.dateString) - new Date(a.dateString));
  }, [reports]);

  const filteredReports = useMemo(() => {
    if (timeRange === 'all') return sortedReports;
    if (timeRange === 'today') return sortedReports.slice(0, 1);
    const cutoff = subDays(new Date(), timeRange);
    return sortedReports.filter(r => new Date(r.dateString) >= cutoff);
  }, [sortedReports, timeRange]);

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
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-xl sm:text-2xl text-text-primary">Dashboard</h2>
          <p className="text-xs text-text-muted mt-0.5">
            {filteredReports.length} reports · {timeRange === 'today' ? 'Today' : timeRange === 'all' ? 'All time' : `Last ${timeRange} days`}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <DailySummaryReport latestReport={latestReport} reports={sortedReports} products={products} />
          <div className="flex gap-1 bg-bg-elevated/50 p-0.5 rounded-lg border border-border">
            {RANGES.map(r => (
              <button
                key={r.value}
                onClick={() => setTimeRange(r.value)}
                className={`px-2 sm:px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  timeRange === r.value
                    ? 'bg-white text-accent-gold border border-accent-gold/20 shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {r.label}
              </button>
            ))}
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
    </div>
  );
}
