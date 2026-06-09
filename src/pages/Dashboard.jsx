import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReports } from '../hooks/useReports';
import { useProducts } from '../hooks/useProducts';
import { computeAlerts, computeDailyReport } from '../utils/analytics';
import SummaryCards from '../components/Dashboard/SummaryCards';
import RevenueChart from '../components/Dashboard/RevenueChart';
import OrderTypeChart from '../components/Dashboard/OrderTypeChart';
import TopProductsTable from '../components/Dashboard/TopProductsTable';
import DailyReport from '../components/Reports/DailyReport';
import Alert from '../components/UI/Alert';
import { CardSkeleton, ChartSkeleton } from '../components/UI/Loader';

export default function Dashboard() {
  const navigate = useNavigate();
  const { reports, loading: reportsLoading } = useReports();
  const { products } = useProducts();

  const sortedReports = useMemo(() => {
    if (!reports || reports.length === 0) return [];
    return [...reports].sort((a, b) => new Date(b.dateString) - new Date(a.dateString));
  }, [reports]);

  const latestReport = sortedReports.length > 0 ? sortedReports[0] : null;
  const previousReport = sortedReports.length > 1 ? sortedReports[1] : null;

  const dailyReport = useMemo(() => computeDailyReport(latestReport, previousReport), [latestReport, previousReport]);

  const alerts = useMemo(() => computeAlerts(reports, products), [reports, products]);

  if (reportsLoading) {
    return (
      <div className="space-y-6">
        <h2 className="font-display text-2xl text-text-primary">Dashboard</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartSkeleton />
          <ChartSkeleton />
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-text-primary">Dashboard</h2>
        <span className="text-xs text-text-muted">{reports.length} reports loaded</span>
      </div>

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 3).map((alert, i) => (
            <Alert key={i} message={alert.message} severity={alert.severity} />
          ))}
          {alerts.length > 3 && (
            <button onClick={() => navigate('/alerts')} className="text-accent-gold text-sm hover:underline">
              +{alerts.length - 3} more alerts
            </button>
          )}
        </div>
      )}

      <SummaryCards report={dailyReport} previousReport={previousReport} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueChart reports={reports} loading={reportsLoading} />
        <OrderTypeChart report={latestReport} loading={reportsLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TopProductsTable products={latestReport?.products || []} loading={reportsLoading} />
        <DailyReport reports={reports} loading={reportsLoading} />
      </div>
    </div>
  );
}
