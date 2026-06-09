import { useMemo } from 'react';
import { useReports } from '../hooks/useReports';
import { useProducts } from '../hooks/useProducts';
import { computeAlerts } from '../utils/analytics';
import Card from '../components/UI/Card';
import AlertComponent from '../components/UI/Alert';
import { CardSkeleton } from '../components/UI/Loader';
import { format } from 'date-fns';

export default function Alerts() {
  const { reports, loading: reportsLoading } = useReports();
  const { products, loading: productsLoading } = useProducts();

  const alerts = useMemo(() => computeAlerts(reports, products), [reports, products]);

  if (reportsLoading || productsLoading) {
    return (
      <div className="space-y-6">
        <h2 className="font-display text-2xl text-text-primary">Alerts</h2>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-text-primary">Smart Alerts</h2>
        <span className="text-xs text-text-muted">{alerts.length} active alerts</span>
      </div>

      <Card>
        <p className="text-xs text-text-muted mb-3">
          Auto-generated insights based on your report data.
          Last updated: {format(new Date(), 'MMM dd, yyyy h:mm a')}
        </p>

        {alerts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 bg-accent-teal/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-accent-teal text-xl">✓</span>
            </div>
            <p className="text-text-primary font-medium">All Clear</p>
            <p className="text-text-muted text-sm mt-1">No alerts to show at this time.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <AlertComponent
                key={index}
                message={alert.message}
                severity={alert.severity}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
