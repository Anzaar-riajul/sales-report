import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../UI/Card';
import Badge from '../UI/Badge';
import { formatDate, formatBDTShort, formatNumber, formatPercent } from '../../utils/formatters';

function ReportRow({ report, index, total }) {
  const navigate = useNavigate();
  const productCount = report.products?.length || 0;

  return (
    <tr className="border-b border-border/50 last:border-0 hover:bg-bg-elevated/40 transition-colors cursor-pointer"
      onClick={() => navigate('/input')}
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
  const visible = showAll ? sorted : sorted.slice(-15);

  if (loading) return null;
  if (sorted.length === 0) return null;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="section-title">Report History</h3>
          <p className="text-xs text-text-muted mt-0.5">{sorted.length} reports total</p>
        </div>
        {sorted.length > 15 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-accent-gold hover:underline font-medium"
          >
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
              <ReportRow key={r.dateString} report={r} index={i + (sorted.length - visible.length)} total={sorted.length} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
