import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { subDays } from 'date-fns';
import { useReports } from '../hooks/useReports';
import { useProducts } from '../hooks/useProducts';
import { filterReportsByRange } from '../utils/dateUtils';
import { computeAlerts, computeDailyReport } from '../utils/analytics';
import DynamicKPIs from '../components/Dashboard/DynamicKPIs';
import RevenueChart from '../components/Dashboard/RevenueChart';
import OrderTypeChart from '../components/Dashboard/OrderTypeChart';
import TopProductsTable from '../components/Dashboard/TopProductsTable';
import WeekdayChart from '../components/Dashboard/WeekdayChart';
import CategoryChart from '../components/Dashboard/CategoryChart';
import ComparisonCards from '../components/Dashboard/ComparisonCards';
import RollingAvgChart from '../components/Dashboard/RollingAvgChart';
import DailyReport from '../components/Reports/DailyReport';
import WeeklyReport from '../components/Reports/WeeklyReport';
import MonthlyReport from '../components/Reports/MonthlyReport';
import ProductIntelligence from '../components/Dashboard/ProductIntelligence';
import DailySummaryReport from '../components/Dashboard/DailySummaryReport';
import Alert from '../components/UI/Alert';
import Card from '../components/UI/Card';
import { CardSkeleton } from '../components/UI/Loader';

const RANGES = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '60d', value: 60 },
  { label: '90d', value: 90 },
  { label: 'All', value: 'all' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { reports, loading: reportsLoading } = useReports();
  const { products } = useProducts();
  const [timeRange, setTimeRange] = useState(30);

  const sortedReports = useMemo(() => {
    if (!reports || reports.length === 0) return [];
    return [...reports].sort((a, b) => new Date(b.dateString) - new Date(a.dateString));
  }, [reports]);

  const filteredReports = useMemo(() => {
    if (timeRange === 'all') return sortedReports;
    const cutoff = subDays(new Date(), timeRange);
    return sortedReports.filter(r => new Date(r.dateString) >= cutoff);
  }, [sortedReports, timeRange]);

  const latestReport = sortedReports.length > 0 ? sortedReports[0] : null;
  const previousReport = sortedReports.length > 1 ? sortedReports[1] : null;

  const dailyReport = useMemo(() => computeDailyReport(latestReport, previousReport), [latestReport, previousReport]);
  const alerts = useMemo(() => computeAlerts(sortedReports, products), [sortedReports, products]);

  if (reportsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-text-primary">Dashboard</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!latestReport) {
    return (
      <div className="space-y-6">
        <h2 className="font-display text-2xl text-text-primary">Dashboard</h2>
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 bg-accent-gold/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-accent-gold">+</span>
          </div>
          <h3 className="font-display text-xl text-text-primary mb-2">No Reports Yet</h3>
          <p className="text-text-muted text-sm mb-6">Paste your first daily order report to start tracking.</p>
          <button onClick={() => navigate('/input')} className="btn-primary">
            Paste Your First Report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-text-primary">Dashboard</h2>
          <p className="text-xs text-text-muted mt-0.5">{filteredReports.length} reports · Last {timeRange === 'all' ? 'all time' : `${timeRange} days`}</p>
        </div>
        <div className="flex items-center gap-3">
          <DailySummaryReport latestReport={latestReport} reports={sortedReports} products={products} />
          <div className="flex gap-1.5 bg-bg-card/50 p-1 rounded-lg border border-border">
            {RANGES.map(r => (
              <button
                key={r.value}
                onClick={() => setTimeRange(r.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  timeRange === r.value
                    ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/20 shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {alerts.slice(0, 4).map((alert, i) => (
            <div key={i} className="flex-shrink-0 min-w-[240px]">
              <Alert message={alert.message} severity={alert.severity} />
            </div>
          ))}
          {alerts.length > 4 && (
            <button
              onClick={() => navigate('/alerts')}
              className="flex-shrink-0 px-4 py-2 text-xs text-accent-gold hover:underline bg-bg-card/50 rounded-lg border border-border"
            >
              +{alerts.length - 4} more
            </button>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <DynamicKPIs latestReport={latestReport} previousReport={previousReport} />

      {/* Row 1: Revenue + Order Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart reports={filteredReports} loading={reportsLoading} />
        </div>
        <OrderTypeChart report={latestReport} loading={reportsLoading} />
      </div>

      {/* Row 2: Daily + Weekly */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DailyReport reports={filteredReports} loading={reportsLoading} />
        <WeeklyReport reports={filteredReports} loading={reportsLoading} />
      </div>

      {/* Row 3: Monthly + Weekday */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonthlyReport reports={filteredReports} loading={reportsLoading} />
        <WeekdayChart reports={filteredReports} loading={reportsLoading} />
      </div>

      {/* Row 4: Category + Rolling/ProductsPerOrder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryChart products={products} loading={reportsLoading} />
        <RollingAvgChart reports={filteredReports} loading={reportsLoading} />
      </div>

      {/* Comparison Cards */}
      <ComparisonCards reports={sortedReports} loading={reportsLoading} />

      {/* Product Intelligence */}
      <div>
        <h3 className="font-display text-lg text-text-primary mb-4">🧠 Stock Intelligence</h3>
        <ProductIntelligence products={products} reports={sortedReports} />
      </div>

      {/* Top Products - full width */}
      <TopProductsTable products={latestReport?.products || []} loading={reportsLoading} />
    </div>
  );
}
