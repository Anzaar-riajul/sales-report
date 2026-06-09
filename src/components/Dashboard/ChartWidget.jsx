import Card from '../UI/Card';
import { ChartSkeleton } from '../UI/Loader';

export default function ChartWidget({ title, subtitle, loading, isEmpty, emptyMessage, children, action, className = '' }) {
  if (loading) return <ChartSkeleton />;

  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="section-title">{title}</h3>
          {subtitle && <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
      {isEmpty ? (
        <div className="h-64 flex items-center justify-center text-text-muted text-sm">
          {emptyMessage || 'No data available'}
        </div>
      ) : (
        children
      )}
    </Card>
  );
}
