import { useMemo } from 'react';
import { subDays } from 'date-fns';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import { TableSkeleton } from '../UI/Loader';
import { formatDate } from '../../utils/formatters';

export default function DeadStockAlert({ products, reports, loading }) {
  const deadStock = useMemo(() => {
    if (!products || products.length === 0 || !reports || reports.length === 0) return [];

    const sorted = [...reports].sort((a, b) => new Date(b.dateString) - new Date(a.dateString));
    const latest = sorted[0];
    if (!latest) return [];

    const cutoff = subDays(new Date(latest.dateString), 7);

    return products
      .filter(p => {
        if (!p.lastSeenDate) return true;
        const lastSeen = p.lastSeenDate.toDate ? p.lastSeenDate.toDate() : new Date(p.lastSeenDate);
        return lastSeen < cutoff;
      })
      .sort((a, b) => (a.totalQuantitySold || 0) - (b.totalQuantitySold || 0));
  }, [products, reports]);

  if (loading) return <Card><h3 className="section-title mb-4">Dead Stock Alert</h3><TableSkeleton rows={4} /></Card>;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title">Dead Stock Alert</h3>
        <Badge variant="rose">{deadStock.length} items</Badge>
      </div>
      {deadStock.length === 0 ? (
        <div className="py-6 text-center text-accent-teal text-sm">✓ No dead stock — all products ordered recently</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-muted text-xs uppercase tracking-wider border-b border-border">
                <th className="text-left py-2 pr-2">Product</th>
                <th className="text-left py-2 pr-2">Category</th>
                <th className="text-right py-2 pr-2">Total Sold</th>
                <th className="text-right py-2">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {deadStock.map((product) => (
                <tr key={product.name} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 pr-2 text-text-primary font-medium">{product.name}</td>
                  <td className="py-2.5 pr-2">
                    <Badge variant="rose">{product.category || 'Other'}</Badge>
                  </td>
                  <td className="py-2.5 pr-2 text-right font-mono">{product.totalQuantitySold || 0}</td>
                  <td className="py-2.5 text-right font-mono text-text-muted text-xs">
                    {product.lastSeenDate?.toDate ? formatDate(product.lastSeenDate.toDate().toISOString().slice(0, 10)) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
